import { Router } from 'express';
import { ClientController } from '@/controllers/ClientController';
import { requireAuth } from '@/middleware/auth';

const router = Router();

// Apply authentication middleware to all client routes
router.use(requireAuth);

// Client management routes
router.post('/', ClientController.createClient);
router.get('/', ClientController.getAllClients);
router.get('/stats', ClientController.getClientStats);
router.get('/:clientId', ClientController.getClientById);
router.put('/:clientId', ClientController.updateClient);
router.patch('/:clientId/deactivate', ClientController.deactivateClient);
router.patch('/:clientId/reactivate', ClientController.reactivateClient);
router.delete('/:clientId', ClientController.deleteClient);

export default router;