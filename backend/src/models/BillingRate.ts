import mongoose, { Document, Schema } from 'mongoose';

export type RateType = 'hourly' | 'fixed' | 'milestone';
export type EntityType = 'global' | 'client' | 'project' | 'user' | 'role';
export type RoundingRule = 'up' | 'down' | 'nearest';

export interface IBillingRate extends Document {
  _id: mongoose.Types.ObjectId;
  entity_type: EntityType;
  entity_id?: mongoose.Types.ObjectId;
  rate_type: RateType;
  
  // Rate Configuration
  standard_rate: number;
  overtime_rate?: number;      // 1.5x after 40 hours/week
  holiday_rate?: number;       // 2x on holidays
  weekend_rate?: number;       // 1.2x on weekends
  
  // Validity Period
  effective_from: Date;
  effective_to?: Date;
  
  // Billing Rules
  minimum_increment: number;   // 15min, 30min, 1hr (in minutes)
  rounding_rule: RoundingRule;
  
  // Metadata
  description?: string;
  is_active: boolean;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

const BillingRateSchema: Schema = new Schema({
  entity_type: {
    type: String,
    enum: ['global', 'client', 'project', 'user', 'role'],
    required: true,
    index: true
  },
  entity_id: {
    type: Schema.Types.ObjectId,
    required: false,
    index: true
  },
  rate_type: {
    type: String,
    enum: ['hourly', 'fixed', 'milestone'],
    default: 'hourly'
  },
  
  // Rate Configuration
  standard_rate: {
    type: Number,
    required: true,
    min: 0
  },
  overtime_rate: {
    type: Number,
    min: 0,
    required: false
  },
  holiday_rate: {
    type: Number,
    min: 0,
    required: false
  },
  weekend_rate: {
    type: Number,
    min: 0,
    required: false
  },
  
  // Validity Period
  effective_from: {
    type: Date,
    required: true,
    index: true
  },
  effective_to: {
    type: Date,
    required: false,
    index: true
  },
  
  // Billing Rules
  minimum_increment: {
    type: Number,
    default: 15, // 15 minutes
    min: 1
  },
  rounding_rule: {
    type: String,
    enum: ['up', 'down', 'nearest'],
    default: 'nearest'
  },
  
  // Metadata
  description: {
    type: String,
    trim: true,
    required: false
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deleted_at: {
    type: Date,
    required: false,
    index: { sparse: true }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes
BillingRateSchema.index({ entity_type: 1, entity_id: 1, effective_from: -1 });
BillingRateSchema.index({ is_active: 1, effective_from: 1, effective_to: 1 });
BillingRateSchema.index({ created_by: 1, created_at: -1 });

// Virtual for ID as string
BillingRateSchema.virtual('id').get(function() {
  return (this._id as any).toHexString();
});

BillingRateSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Validation: Ensure entity_id is provided for non-global rates
BillingRateSchema.pre('save', function(next) {
  if (this.entity_type !== 'global' && !this.entity_id) {
    next(new Error(`entity_id is required for ${this.entity_type} rate type`));
  } else {
    next();
  }
});

export const BillingRate = mongoose.model<IBillingRate>('BillingRate', BillingRateSchema);
export default BillingRate;