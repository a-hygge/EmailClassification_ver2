import { Router } from 'express';
const router = Router();
import { index, getByLabel, show, deleteEmail, getImportantEmails } from '../controllers/emailController.js';

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