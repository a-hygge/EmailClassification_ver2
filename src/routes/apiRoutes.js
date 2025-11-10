import { Router } from 'express';
const router = Router();
import { receiveEmail } from '../controllers/apiController.js';

router.post('/emails/receive', receiveEmail);

export default router;
