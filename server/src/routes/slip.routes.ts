import { Router } from 'express';
import { slipController } from '../controllers/slip.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router: Router = Router();

// OCR Callback (Public/Internal) - Must be before authMiddleware
router.post('/callback', slipController.handleOcrCallback.bind(slipController));

// All slip routes require authentication
router.use(authMiddleware);

// Upload a slip image
router.post(
  '/upload',
  upload.single('slip'),
  slipController.upload.bind(slipController),
);

// List all slips for the authenticated user
router.get('/', slipController.list.bind(slipController));

// Get a specific slip status
router.get('/:id', slipController.getStatus.bind(slipController));

// Get OCR result for a specific slip
router.get('/:id/result', slipController.getResult.bind(slipController));

// Re-queue a pending/failed slip for OCR processing
router.post('/:id/requeue', slipController.requeue.bind(slipController));

export default router;
