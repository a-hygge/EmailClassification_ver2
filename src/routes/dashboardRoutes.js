import { Router } from 'express';
import { index } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Áp dụng middleware authentication cho tất cả routes
router.use(requireAuth);

// GET /dashboard
router.get('/', index);

export default router;