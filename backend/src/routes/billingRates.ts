import { Router } from 'express';
import {
  BillingRateController,
  createBillingRateValidation,
  updateBillingRateValidation,
  calculateEffectiveRateValidation
} from '@/controllers/BillingRateController';
import { requireAuth, requireManagement } from '@/middleware/auth';

const router = Router();

// Apply authentication to all billing rate routes
router.use(requireAuth);

// All billing rate operations require Management+ role
router.use(requireManagement);

/**
 * @route POST /api/v1/billing/rates
 * @desc Create a new billing rate
 * @access Private (Management+)
 */
router.post('/', createBillingRateValidation, BillingRateController.createBillingRate);

/**
 * @route PUT /api/v1/billing/rates/:rateId
 * @desc Update a billing rate (creates new version)
 * @access Private (Management+)
 */
router.put('/:rateId', updateBillingRateValidation, BillingRateController.updateBillingRate);

/**
 * @route GET /api/v1/billing/rates
 * @desc Get billing rates for an entity
 * @access Private (Management+)
 */
router.get('/', (req, res) => {
  // Temporary mock response for testing
  res.json({
    success: true,
    rates: [
      {
        id: 'rate-1',
        entity_type: 'client',
        entity_id: 'client-1',
        entity_name: 'Acme Corp',
        hourly_rate: 125,
        overtime_multiplier: 1.5,
        effective_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'rate-2',
        entity_type: 'project',
        entity_id: 'project-1',
        entity_name: 'Project Alpha',
        hourly_rate: 150,
        overtime_multiplier: 1.5,
        effective_date: '2024-01-15',
        created_at: '2024-01-15T00:00:00Z'
      }
    ]
  });
});

/**
 * @route POST /api/v1/billing/rates/calculate
 * @desc Calculate effective rate for given criteria
 * @access Private (Management+)
 */
router.post('/calculate', calculateEffectiveRateValidation, BillingRateController.calculateEffectiveRate);

/**
 * @route POST /api/v1/billing/rates/preview
 * @desc Preview rate calculation without saving
 * @access Private (Management+)
 */
router.post('/preview', calculateEffectiveRateValidation, BillingRateController.previewRateCalculation);

export default router;