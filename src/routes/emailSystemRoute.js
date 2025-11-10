import { getAllEmails, getDetailEmailSystemById, deleteEmailSystemById } from '../controllers/emailSystemController.js';

import { Router } from 'express';
const router = Router();

// GET /emailsSystem - Danh sách tất cả email system
router.get('/', getAllEmails);

router.get('/:id', getDetailEmailSystemById);

router.delete('/:emailId', deleteEmailSystemById);

export default router;