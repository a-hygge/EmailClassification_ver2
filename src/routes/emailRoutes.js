import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
import { index, getByLabel, show, deleteEmail, getImportantEmails } from '../controllers/emailController.js';

// Áp dụng middleware authentication cho tất cả routes
router.use(requireAuth);

// GET /emails - Danh sách tất cả email
router.get('/', index);

// GET /emails/label/:labelId - Lọc email theo label
router.get('/label/:labelId', getByLabel);

router.get('/important', getImportantEmails);

// GET /emails/:id - Chi tiết email
router.get('/:id', show);

// DELETE /emails/:emailId - Xóa email
router.delete('/:emailId', deleteEmail);

export default router;