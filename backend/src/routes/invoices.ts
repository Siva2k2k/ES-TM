import { Router } from 'express';
import {
  InvoiceController,
  generateInvoiceDraftValidation,
  createInvoiceValidation,
  invoiceIdValidation,
  processApprovalValidation
} from '@/controllers/InvoiceController';
import { requireAuth, requireManager } from '@/middleware/auth';

const router = Router();

// Apply authentication to all invoice routes
router.use(requireAuth);

// All invoice operations require Manager+ role
router.use(requireManager);

/**
 * @route POST /api/v1/billing/invoices/generate-draft
 * @desc Generate invoice draft from timesheets
 * @access Private (Manager+)
 */
router.post('/generate-draft', generateInvoiceDraftValidation, InvoiceController.generateInvoiceDraft);

/**
 * @route POST /api/v1/billing/invoices
 * @desc Create invoice from draft
 * @access Private (Manager+)
 */
router.post('/', createInvoiceValidation, InvoiceController.createInvoice);

/**
 * @route POST /api/v1/billing/invoices/:invoiceId/submit
 * @desc Submit invoice for approval
 * @access Private (Manager+)
 */
router.post('/:invoiceId/submit', invoiceIdValidation, InvoiceController.submitForApproval);

/**
 * @route POST /api/v1/billing/invoices/:invoiceId/approve
 * @desc Approve or reject invoice
 * @access Private (Manager+)
 */
router.post('/:invoiceId/approve', processApprovalValidation, InvoiceController.processApproval);

/**
 * @route GET /api/v1/billing/invoices/:invoiceId/line-items
 * @desc Get invoice line items
 * @access Private (Manager+)
 */
router.get('/:invoiceId/line-items', invoiceIdValidation, InvoiceController.getInvoiceLineItems);

/**
 * @route GET /api/v1/billing/invoices
 * @desc Get all invoices with filtering
 * @access Private (Manager+)
 */
router.get('/', (req, res) => {
  // Temporary mock response for testing
  res.json({
    success: true,
    invoices: [
      {
        id: '1',
        invoice_number: 'INV-2024-001',
        client_name: 'Sample Client',
        status: 'pending_approval',
        issue_date: '2024-10-01',
        due_date: '2024-10-31',
        subtotal: 5000,
        tax_amount: 500,
        total_amount: 5500,
        line_items: [
          {
            id: 'li1',
            type: 'timesheet',
            description: 'Development work - Week 1',
            quantity: 40,
            rate: 125,
            total: 5000
          }
        ],
        created_at: '2024-10-01T08:00:00Z',
        updated_at: '2024-10-01T08:00:00Z'
      }
    ]
  });
});

/**
 * @route GET /api/v1/billing/invoices/dashboard-stats
 * @desc Get invoice dashboard statistics
 * @access Private (Manager+)
 */
router.get('/dashboard-stats', (req, res) => {
  // Temporary mock response for testing
  res.json({
    success: true,
    stats: {
      total_invoices: 5,
      draft_invoices: 2,
      pending_approval: 1,
      approved_invoices: 2,
      total_outstanding: 15000,
      overdue_invoices: 0,
      total_revenue_month: 25000
    }
  });
});

/**
 * @route POST /api/v1/billing/invoices/generate
 * @desc Generate invoice from timesheet data
 * @access Private (Manager+)
 */
router.post('/generate', (req, res) => {
  // Temporary mock response for testing
  const { client_id, week_start_date } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Invoice generated successfully',
    invoice: {
      id: 'new-invoice-' + Date.now(),
      invoice_number: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
      client_id: client_id,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 4000,
      tax_amount: 400,
      total_amount: 4400,
      created_at: new Date().toISOString()
    }
  });
});

/**
 * @route POST /api/v1/billing/invoices/:invoiceId/approve
 * @desc Approve an invoice
 * @access Private (Manager+)
 */
router.post('/:invoiceId/approve', (req, res) => {
  const { invoiceId } = req.params;
  
  res.json({
    success: true,
    message: 'Invoice approved successfully',
    invoice: {
      id: invoiceId,
      status: 'approved',
      approved_by: 'Current User',
      approved_at: new Date().toISOString()
    }
  });
});

/**
 * @route POST /api/v1/billing/invoices/:invoiceId/reject
 * @desc Reject an invoice
 * @access Private (Manager+)
 */
router.post('/:invoiceId/reject', (req, res) => {
  const { invoiceId } = req.params;
  const { reason } = req.body;
  
  res.json({
    success: true,
    message: 'Invoice rejected successfully',
    invoice: {
      id: invoiceId,
      status: 'draft',
      rejection_reason: reason,
      rejected_by: 'Current User',
      rejected_at: new Date().toISOString()
    }
  });
});

export default router;