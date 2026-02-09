import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router: Router = Router();

// All transaction routes require authentication
router.use(authMiddleware);

// Summary must be registered before the :id param route to avoid conflicts
router.get('/summary', transactionController.getSummary.bind(transactionController));

router.post('/', transactionController.create.bind(transactionController));
router.get('/', transactionController.findAll.bind(transactionController));
router.get('/:id', transactionController.findById.bind(transactionController));
router.put('/:id', transactionController.update.bind(transactionController));
router.delete('/:id', transactionController.delete.bind(transactionController));

export default router;
