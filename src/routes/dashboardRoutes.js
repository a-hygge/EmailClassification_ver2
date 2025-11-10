import { Router } from 'express';
import { index } from '../controllers/dashboardController.js';

const router = Router();

// GET /dashboard
router.get('/', index);

export default router;