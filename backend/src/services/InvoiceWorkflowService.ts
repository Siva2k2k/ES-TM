import { Invoice, IInvoice } from '@/models/Invoice';
import { BillingSnapshot } from '@/models/BillingSnapshot';
import Client from '@/models/Client';
import { User } from '@/models/User';
import { ValidationError, AuthorizationError } from '@/utils/errors';
import { AuthUser } from '@/utils/auth';
import mongoose from 'mongoose';

export interface InvoiceDraft {
  client_id: mongoose.Types.ObjectId;
  billing_period: {
    start_date: Date;
    end_date: Date;
    period_type: 'weekly' | 'monthly' | 'project_milestone' | 'custom';
  };
  timesheet_snapshots: mongoose.Types.ObjectId[];
  subtotal: number;
  total_amount: number;
  status: 'draft';
}

export interface InvoiceLineItemSummary {
  project_id: mongoose.Types.ObjectId;
  project_name: string;
  user_id: mongoose.Types.ObjectId;
  user_name: string;
  hours: number;
  rate: number;
  amount: number;
  billing_period: string;
}

export interface InvoiceApprovalThresholds {
  manager_limit: number;      // $10,000
  management_limit: number;   // $25,000
  board_approval: number;     // $100,000
}

export class InvoiceWorkflowService {
  
  /**
   * Generate invoice draft from frozen timesheets for a billing period
   */
  static async generateInvoiceFromTimesheets(
    clientId: mongoose.Types.ObjectId,
    billingPeriod: { start: Date; end: Date },
    createdBy: AuthUser
  ): Promise<InvoiceDraft> {
    
    // 1. Validate client exists and is active
  const client = await (Client as any).findById(clientId);
    if (!client || client.deleted_at) {
      throw new ValidationError('Client not found or inactive');
    }

    // 2. Find frozen billing snapshots for the period
    const snapshots = await BillingSnapshot.find({
      week_start_date: {
        $gte: billingPeriod.start.toISOString().split('T')[0],
        $lte: billingPeriod.end.toISOString().split('T')[0]
      },
      deleted_at: null
    }).populate([
      {
        path: 'timesheet_id',
        populate: {
          path: 'time_entries',
          populate: {
            path: 'project_id',
            select: 'name client_id'
          }
        }
      },
      {
        path: 'user_id',
        select: 'full_name'
      }
    ]) as any[];

    // 3. Filter snapshots for this client's projects
    const clientSnapshots = snapshots.filter(snapshot => {
      return snapshot.timesheet_id?.time_entries?.some((entry: any) => 
        entry.project_id?.client_id?.toString() === clientId.toString()
      );
    });

    if (clientSnapshots.length === 0) {
      throw new ValidationError('No billable hours found for client in the specified period');
    }

    // 4. Calculate totals
    const subtotal = clientSnapshots.reduce((sum, snapshot) => sum + snapshot.billable_amount, 0);

    // 5. Create invoice draft
    const invoiceDraft: InvoiceDraft = {
      client_id: clientId,
      billing_period: {
        start_date: billingPeriod.start,
        end_date: billingPeriod.end,
        period_type: this.determinePeriodType(billingPeriod.start, billingPeriod.end)
      },
      timesheet_snapshots: clientSnapshots.map(s => s._id),
      subtotal,
      total_amount: subtotal, // Will be updated with taxes/discounts later
      status: 'draft'
    };

    return invoiceDraft;
  }

  /**
   * Create invoice from draft data
   */
  static async createInvoice(
    invoiceDraft: Partial<IInvoice>,
    createdBy: AuthUser
  ): Promise<IInvoice> {
    
    // Validate permissions
    if (!['super_admin', 'management', 'manager'].includes(createdBy.role)) {
      throw new AuthorizationError('Insufficient permissions to create invoices');
    }

    // Generate invoice number
    const invoiceNumber = await (Invoice as any).generateInvoiceNumber();

    // Calculate due date based on payment terms
    const paymentTermsDays = invoiceDraft.payment_terms_days || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);

    // Create invoice
    const invoice = new Invoice({
      ...invoiceDraft,
      invoice_number: invoiceNumber,
      due_date: dueDate,
      created_by: createdBy.id,
      status: 'draft',
      payments_received: 0,
      balance_due: invoiceDraft.total_amount || 0
    });

    await invoice.save();
    return invoice;
  }

  /**
   * Submit invoice for approval
   */
  static async submitForApproval(
    invoiceId: mongoose.Types.ObjectId,
    submitterId: mongoose.Types.ObjectId
  ): Promise<IInvoice> {
    
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new ValidationError('Invoice not found');
    }

    if (invoice.status !== 'draft') {
      throw new ValidationError('Only draft invoices can be submitted for approval');
    }

    // Check if auto-approval applies based on amount thresholds
    const thresholds = await this.getApprovalThresholds(invoice.client_id);
    
    if (invoice.total_amount <= thresholds.manager_limit) {
      // Auto-approve for smaller amounts if submitter is manager+
      const submitter = await (User as any).findById(submitterId);
      if (['manager', 'management', 'super_admin'].includes(submitter?.role)) {
        invoice.status = 'approved';
        invoice.approved_by = submitterId;
        invoice.approved_at = new Date();
      } else {
        invoice.status = 'pending_approval';
      }
    } else {
      invoice.status = 'pending_approval';
    }

    await invoice.save();
    
    // Send notifications to approvers
    await this.notifyApprovers(invoice);
    
    return invoice;
  }

  /**
   * Approve or reject invoice
   */
  static async processApproval(
    invoiceId: mongoose.Types.ObjectId,
    approverId: mongoose.Types.ObjectId,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<IInvoice> {
    
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new ValidationError('Invoice not found');
    }

    if (invoice.status !== 'pending_approval') {
      throw new ValidationError('Invoice is not pending approval');
    }

    // Validate approver permissions and amount thresholds
    const approver = await (User as any).findById(approverId);
    if (!approver) {
      throw new ValidationError('Approver not found');
    }

    await this.validateApprovalPermissions(approver, invoice.total_amount);

    if (action === 'approve') {
      invoice.status = 'approved';
      invoice.approved_by = approverId;
      invoice.approved_at = new Date();
      
      // Auto-send if configured (future enhancement)
      // await this.sendInvoiceToClient(invoice);
      
    } else {
      invoice.status = 'draft'; // Back to draft for revision
      // Store rejection reason in notes for now (could add rejection_reason field)
      invoice.notes = (invoice.notes || '') + `\nRejected: ${reason || 'No reason provided'}`;
    }

    await invoice.save();
    return invoice;
  }

  /**
   * Get invoice line item summary for display
   */
  static async getInvoiceLineItems(invoiceId: mongoose.Types.ObjectId): Promise<InvoiceLineItemSummary[]> {
    
    const invoice = await Invoice.findById(invoiceId).populate('timesheet_snapshots');
    if (!invoice) {
      throw new ValidationError('Invoice not found');
    }

    const lineItems: InvoiceLineItemSummary[] = [];

    // Process timesheet snapshots
    for (const snapshotId of invoice.timesheet_snapshots) {
      const snapshot = await BillingSnapshot.findById(snapshotId).populate([
        {
          path: 'timesheet_id',
          populate: {
            path: 'time_entries',
            populate: {
              path: 'project_id',
              select: 'name client_id'
            }
          }
        },
        {
          path: 'user_id',
          select: 'full_name'
        }
      ]) as any;

      if (snapshot) {
        // Group by project
        const projectGroups = new Map<string, any>();
        
        for (const entry of snapshot.timesheet_id.time_entries) {
          if (entry.project_id) {
            const projectId = entry.project_id._id.toString();
            if (!projectGroups.has(projectId)) {
              projectGroups.set(projectId, {
                project_id: entry.project_id._id,
                project_name: entry.project_id.name,
                user_id: snapshot.user_id._id,
                user_name: snapshot.user_id.full_name,
                hours: 0,
                rate: snapshot.hourly_rate,
                amount: 0,
                billing_period: `${snapshot.week_start_date} - ${snapshot.week_end_date}`
              });
            }
            
            const group = projectGroups.get(projectId);
            group.hours += entry.hours;
            group.amount = group.hours * group.rate;
          }
        }

        lineItems.push(...Array.from(projectGroups.values()));
      }
    }

    return lineItems;
  }

  /**
   * Get approval thresholds for client (future: could be client-specific)
   */
  private static async getApprovalThresholds(clientId: mongoose.Types.ObjectId): Promise<InvoiceApprovalThresholds> {
    // For now, return default thresholds
    // Future: Could be stored in client configuration
    return {
      manager_limit: 10000,
      management_limit: 25000,
      board_approval: 100000
    };
  }

  /**
   * Validate approver has sufficient permissions for invoice amount
   */
  private static async validateApprovalPermissions(approver: any, amount: number): Promise<void> {
    const thresholds = {
      manager_limit: 10000,
      management_limit: 25000
    };

    switch (approver.role) {
      case 'manager':
        if (amount > thresholds.manager_limit) {
          throw new AuthorizationError(`Manager approval limited to $${thresholds.manager_limit}. This invoice requires management approval.`);
        }
        break;
      case 'management':
        if (amount > thresholds.management_limit) {
          throw new AuthorizationError(`Management approval limited to $${thresholds.management_limit}. This invoice requires board approval.`);
        }
        break;
      case 'super_admin':
        // Super admin can approve any amount
        break;
      default:
        throw new AuthorizationError('Insufficient permissions to approve invoices');
    }
  }

  /**
   * Send notifications to appropriate approvers
   */
  private static async notifyApprovers(invoice: IInvoice): Promise<void> {
    // Implementation would depend on notification system
    // For now, just log the notification requirement
    
    // Future implementation:
    // - Find users with approval permissions for the amount
    // - Send email/Slack notifications
    // - Create internal notification records
  }

  /**
   * Determine billing period type based on date range
   */
  private static determinePeriodType(startDate: Date, endDate: Date): 'weekly' | 'monthly' | 'custom' {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) {
      return 'weekly';
    } else if (daysDiff <= 31) {
      return 'monthly';
    } else {
      return 'custom';
    }
  }

  /**
   * Get invoice dashboard statistics
   */
  static async getInvoiceDashboardStats(): Promise<{
    total_invoices: number;
    draft_invoices: number;
    pending_approval: number;
    approved_invoices: number;
    total_outstanding: number;
    overdue_invoices: number;
    total_revenue_month: number;
  }> {
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [
      totalInvoices,
      draftInvoices,
      pendingApproval,
      approvedInvoices,
      overdueInvoices,
      monthlyRevenue
    ] = await Promise.all([
      Invoice.countDocuments({ deleted_at: null }),
      Invoice.countDocuments({ status: 'draft', deleted_at: null }),
      Invoice.countDocuments({ status: 'pending_approval', deleted_at: null }),
      Invoice.countDocuments({ status: 'approved', deleted_at: null }),
      Invoice.countDocuments({ 
        status: { $in: ['sent', 'approved'] }, 
        due_date: { $lt: now },
        balance_due: { $gt: 0 },
        deleted_at: null 
      }),
      Invoice.aggregate([
        {
          $match: {
            status: { $in: ['approved', 'sent', 'paid'] },
            created_at: { $gte: startOfMonth },
            deleted_at: null
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total_amount' }
          }
        }
      ])
    ]);

    const outstanding = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['sent', 'approved'] },
          balance_due: { $gt: 0 },
          deleted_at: null
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$balance_due' }
        }
      }
    ]);

    return {
      total_invoices: totalInvoices,
      draft_invoices: draftInvoices,
      pending_approval: pendingApproval,
      approved_invoices: approvedInvoices,
      total_outstanding: outstanding[0]?.total || 0,
      overdue_invoices: overdueInvoices,
      total_revenue_month: monthlyRevenue[0]?.total || 0
    };
  }

  /**
   * Get invoices with client details
   */
  static async getInvoicesWithDetails(filter: any = {}) {
    return await Invoice.aggregate([
      { $match: { deleted_at: null, ...filter } },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $addFields: {
          client_name: '$client.name'
        }
      },
      {
        $project: {
          client: 0 // Remove full client object to avoid clutter
        }
      },
      { $sort: { created_at: -1 } }
    ]);
  }
}
