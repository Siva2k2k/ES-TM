import { BillingRate, IBillingRate, EntityType } from '@/models/BillingRate';
import { User } from '@/models/User';
import { Project } from '@/models/Project';
import Client from '@/models/Client';
import { ValidationError } from '@/utils/errors';
import mongoose from 'mongoose';

export interface RateCalculation {
  effective_rate: number;
  base_rate: number;
  multiplier: number;
  multiplier_type?: 'overtime' | 'holiday' | 'weekend';
  calculated_amount: number;
  adjusted_hours: number;
  rate_source: {
    entity_type: EntityType;
    entity_id?: string;
    rate_id: string;
  };
}

export interface RateSearchCriteria {
  user_id?: mongoose.Types.ObjectId;
  project_id?: mongoose.Types.ObjectId;
  client_id?: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  day_of_week: number; // 0-6, 0 = Sunday
  is_holiday?: boolean;
}

export class BillingRateService {
  
  /**
   * Get effective billing rate for a specific scenario
   * Implements rate hierarchy: Project > Client > User > Role > Global
   */
  static async getEffectiveRate(criteria: RateSearchCriteria): Promise<RateCalculation> {
    const { user_id, project_id, client_id, date, hours, day_of_week, is_holiday } = criteria;
    
    // Try to find rates in priority order
    let rate: IBillingRate | null = null;
    let entity_type: EntityType = 'global';
    let entity_id: string | undefined;

    // 1. Project-specific rate (highest priority)
    if (project_id) {
      rate = await this.findActiveRate('project', project_id, date);
      if (rate) {
        entity_type = 'project';
        entity_id = project_id.toString();
      }
    }

    // 2. Client-specific rate
    if (!rate && client_id) {
      rate = await this.findActiveRate('client', client_id, date);
      if (rate) {
        entity_type = 'client';
        entity_id = client_id.toString();
      }
    }

    // 3. User-specific rate
    if (!rate && user_id) {
      rate = await this.findActiveRate('user', user_id, date);
      if (rate) {
        entity_type = 'user';
        entity_id = user_id.toString();
      }
    }

    // 4. Role-based rate
    if (!rate && user_id) {
      const user = await (User as any).findById(user_id);
      if (user?.role) {
        rate = await this.findActiveRateByRole(user.role, date);
        if (rate) {
          entity_type = 'role';
          entity_id = user.role;
        }
      }
    }

    // 5. Global default rate (fallback)
    if (!rate) {
      rate = await this.findActiveRate('global', undefined, date);
      if (!rate) {
        throw new ValidationError('No billing rate configured for the specified criteria');
      }
    }

    // Calculate effective rate with multipliers
    const calculation = this.calculateRateWithMultipliers(rate, {
      hours,
      day_of_week,
      is_holiday: is_holiday || false
    });

    return {
      ...calculation,
      rate_source: {
        entity_type,
        entity_id,
        rate_id: rate._id.toString()
      }
    };
  }

  /**
   * Find active rate for specific entity and date
   */
  private static async findActiveRate(
    entityType: EntityType, 
    entityId: mongoose.Types.ObjectId | undefined, 
    date: Date
  ): Promise<IBillingRate | null> {
    const query: any = {
      entity_type: entityType,
      is_active: true,
      effective_from: { $lte: date },
      $or: [
        { effective_to: null },
        { effective_to: { $gte: date } }
      ],
      deleted_at: null
    };

    if (entityType !== 'global') {
      query.entity_id = entityId;
    }

    return await BillingRate.findOne(query).sort({ effective_from: -1 });
  }

  /**
   * Find active rate by user role
   */
  private static async findActiveRateByRole(role: string, date: Date): Promise<IBillingRate | null> {
    // For role-based rates, we store the role name as a string in entity_id field
    // This is a design choice - could also create a separate role_name field
    const query = {
      entity_type: 'role',
      is_active: true,
      effective_from: { $lte: date },
      $or: [
        { effective_to: null },
        { effective_to: { $gte: date } }
      ],
      deleted_at: null,
      // Store role as string in description or create a role_name field
      description: { $regex: new RegExp(role, 'i') }
    };

    return await BillingRate.findOne(query).sort({ effective_from: -1 });
  }

  /**
   * Calculate rate with overtime, weekend, and holiday multipliers
   */
  private static calculateRateWithMultipliers(
    rate: IBillingRate,
    context: { hours: number; day_of_week: number; is_holiday: boolean }
  ): Omit<RateCalculation, 'rate_source'> {
    let effective_rate = rate.standard_rate;
    let multiplier = 1.0;
    let multiplier_type: 'overtime' | 'holiday' | 'weekend' | undefined;

    // Apply multipliers in priority order: Holiday > Weekend > Overtime
    
    // 1. Holiday rate (highest priority)
    if (context.is_holiday && rate.holiday_rate) {
      effective_rate = rate.holiday_rate;
      multiplier = rate.holiday_rate / rate.standard_rate;
      multiplier_type = 'holiday';
    }
    // 2. Weekend rate
    else if ((context.day_of_week === 0 || context.day_of_week === 6) && rate.weekend_rate) {
      effective_rate = rate.weekend_rate;
      multiplier = rate.weekend_rate / rate.standard_rate;
      multiplier_type = 'weekend';
    }
    // 3. Overtime rate (for hours > 8 per day or context-specific logic)
    else if (context.hours > 8 && rate.overtime_rate) {
      const regular_hours = Math.min(context.hours, 8);
      const overtime_hours = context.hours - 8;
      const regular_amount = regular_hours * rate.standard_rate;
      const overtime_amount = overtime_hours * rate.overtime_rate;
      
      return {
        effective_rate: (regular_amount + overtime_amount) / context.hours,
        base_rate: rate.standard_rate,
        multiplier: 1.0, // Mixed rate, so multiplier doesn't apply cleanly
        multiplier_type: 'overtime',
        calculated_amount: regular_amount + overtime_amount,
        adjusted_hours: this.applyMinimumIncrement(context.hours, rate.minimum_increment, rate.rounding_rule)
      };
    }

    // Apply minimum increment rounding
    const adjusted_hours = this.applyMinimumIncrement(context.hours, rate.minimum_increment, rate.rounding_rule);
    const calculated_amount = adjusted_hours * effective_rate;

    return {
      effective_rate,
      base_rate: rate.standard_rate,
      multiplier,
      multiplier_type,
      calculated_amount,
      adjusted_hours
    };
  }

  /**
   * Apply minimum billing increment (15min, 30min, 1hr) with rounding
   */
  private static applyMinimumIncrement(
    hours: number, 
    incrementMinutes: number, 
    roundingRule: 'up' | 'down' | 'nearest'
  ): number {
    const incrementHours = incrementMinutes / 60;
    const segments = hours / incrementHours;

    let roundedSegments: number;
    switch (roundingRule) {
      case 'up':
        roundedSegments = Math.ceil(segments);
        break;
      case 'down':
        roundedSegments = Math.floor(segments);
        break;
      case 'nearest':
      default:
        roundedSegments = Math.round(segments);
        break;
    }

    return roundedSegments * incrementHours;
  }

  /**
   * Create a new billing rate
   */
  static async createBillingRate(rateData: Partial<IBillingRate>): Promise<IBillingRate> {
    // Validate required fields
    if (!rateData.entity_type || !rateData.standard_rate || !rateData.effective_from) {
      throw new ValidationError('entity_type, standard_rate, and effective_from are required');
    }

    // Validate entity exists (except for global rates)
    if (rateData.entity_type !== 'global' && rateData.entity_id) {
      await this.validateEntity(rateData.entity_type, rateData.entity_id);
    }

    const rate = new BillingRate(rateData);
    await rate.save();
    return rate;
  }

  /**
   * Update billing rate (creates new version, deactivates old)
   */
  static async updateBillingRate(
    rateId: mongoose.Types.ObjectId, 
    updateData: Partial<IBillingRate>
  ): Promise<IBillingRate> {
    const existingRate = await BillingRate.findById(rateId);
    if (!existingRate) {
      throw new ValidationError('Billing rate not found');
    }

    // Deactivate existing rate
    existingRate.is_active = false;
    existingRate.effective_to = new Date();
    await existingRate.save();

    // Create new rate version
    const newRateData = {
      ...existingRate.toObject(),
      ...updateData,
      _id: new mongoose.Types.ObjectId(),
      effective_from: updateData.effective_from || new Date(),
      effective_to: undefined,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const newRate = new BillingRate(newRateData);
    await newRate.save();
    return newRate;
  }

  /**
   * Get billing rates for entity with history
   */
  static async getBillingRatesForEntity(
    entityType: EntityType, 
    entityId?: mongoose.Types.ObjectId
  ): Promise<IBillingRate[]> {
    const query: any = {
      entity_type: entityType,
      deleted_at: null
    };

    if (entityType !== 'global') {
      query.entity_id = entityId;
    }

    return await BillingRate.find(query).sort({ effective_from: -1 });
  }

  /**
   * Validate that referenced entity exists
   */
  private static async validateEntity(entityType: EntityType, entityId: mongoose.Types.ObjectId): Promise<void> {
    switch (entityType) {
      case 'user': {
        const user = await (User as any).findById(entityId);
        if (!user || user.deleted_at) {
          throw new ValidationError('Referenced user not found or inactive');
        }
        break;
      }
      case 'project': {
        const project = await (Project as any).findById(entityId);
        if (!project || project.deleted_at) {
          throw new ValidationError('Referenced project not found or inactive');
        }
        break;
      }
      case 'client': {
  const client = await (Client as any).findById(entityId);
        if (!client || client.deleted_at) {
          throw new ValidationError('Referenced client not found or inactive');
        }
        break;
      }
      // 'role' and 'global' don't need validation
    }
  }

  /**
   * Get rate calculation preview without saving
   */
  static async previewRateCalculation(
    criteria: RateSearchCriteria
  ): Promise<{
    calculation: RateCalculation;
    breakdown: Array<{ hours: number; rate: number; amount: number; description: string }>;
  }> {
    const calculation = await this.getEffectiveRate(criteria);
    
    const breakdown = [{
      hours: calculation.adjusted_hours,
      rate: calculation.effective_rate,
      amount: calculation.calculated_amount,
      description: calculation.multiplier_type 
        ? `${calculation.multiplier_type} rate (${calculation.multiplier}x)` 
        : 'Standard rate'
    }];

    return { calculation, breakdown };
  }
}
