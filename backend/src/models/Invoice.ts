import mongoose, { Document, Schema } from 'mongoose';

export type InvoiceStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PeriodType = 'weekly' | 'monthly' | 'project_milestone' | 'custom';

export interface IExpenseLineItem {
  description: string;
  amount: number;
  category: string;
  is_billable: boolean;
  markup_percentage: number;
}

export interface IFixedFeeLineItem {
  description: string;
  amount: number;
  milestone_name?: string;
  project_id?: mongoose.Types.ObjectId;
}

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId;
  invoice_number: string;      // Auto-generated: INV-2024-001
  client_id: mongoose.Types.ObjectId;
  
  // Billing Period
  billing_period: {
    start_date: Date;
    end_date: Date;
    period_type: PeriodType;
  };
  
  // Invoice Status Workflow
  status: InvoiceStatus;
  
  // Line Items from Multiple Sources
  timesheet_snapshots: mongoose.Types.ObjectId[];  // Link to billing snapshots
  expense_entries: IExpenseLineItem[];              // Travel, materials, etc.
  fixed_fees: IFixedFeeLineItem[];                 // Retainers, milestones
  
  // Financial Calculations
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  
  // Terms & Conditions
  payment_terms_days: number;    // NET 30, NET 15
  due_date: Date;
  late_fee_percentage: number;
  
  // Approval Workflow
  created_by: mongoose.Types.ObjectId;
  approved_by?: mongoose.Types.ObjectId;
  approved_at?: Date;
  sent_at?: Date;
  
  // Client Communication
  notes?: string;
  client_po_number?: string;
  
  // Payment Tracking (for future use)
  payments_received: number;
  balance_due: number;
  
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

const ExpenseLineItemSchema = new Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  is_billable: { type: Boolean, default: true },
  markup_percentage: { type: Number, default: 0, min: 0 }
}, { _id: false });

const FixedFeeLineItemSchema = new Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  milestone_name: { type: String, required: false },
  project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: false }
}, { _id: false });

const InvoiceSchema: Schema = new Schema({
  invoice_number: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  client_id: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  
  // Billing Period
  billing_period: {
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    period_type: {
      type: String,
      enum: ['weekly', 'monthly', 'project_milestone', 'custom'],
      default: 'monthly'
    }
  },
  
  // Invoice Status
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // Line Items
  timesheet_snapshots: [{
    type: Schema.Types.ObjectId,
    ref: 'BillingSnapshot'
  }],
  expense_entries: [ExpenseLineItemSchema],
  fixed_fees: [FixedFeeLineItemSchema],
  
  // Financial Calculations
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tax_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    maxlength: 3
  },
  
  // Terms & Conditions
  payment_terms_days: {
    type: Number,
    default: 30,
    min: 0
  },
  due_date: {
    type: Date,
    required: true,
    index: true
  },
  late_fee_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Approval Workflow
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approved_at: {
    type: Date,
    required: false
  },
  sent_at: {
    type: Date,
    required: false
  },
  
  // Client Communication
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  client_po_number: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Payment Tracking
  payments_received: {
    type: Number,
    default: 0,
    min: 0
  },
  balance_due: {
    type: Number,
    default: 0,
    min: 0
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
InvoiceSchema.index({ client_id: 1, status: 1 });
InvoiceSchema.index({ 'billing_period.start_date': 1, 'billing_period.end_date': 1 });
InvoiceSchema.index({ due_date: 1, status: 1 });
InvoiceSchema.index({ created_by: 1, created_at: -1 });

// Virtual for ID as string
InvoiceSchema.virtual('id').get(function() {
  return (this._id as any).toHexString();
});

InvoiceSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware to calculate balance_due
InvoiceSchema.pre('save', function(next) {
  const invoice = this as IInvoice;
  invoice.balance_due = invoice.total_amount - invoice.payments_received;
  next();
});

// Method to generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Find the latest invoice for this year
  const latestInvoice = await this.findOne({
    invoice_number: { $regex: `^${prefix}` }
  }).sort({ invoice_number: -1 });
  
  let nextNumber = 1;
  if (latestInvoice) {
    const lastNumber = parseInt(latestInvoice.invoice_number.substring(prefix.length));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
};

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export default Invoice;