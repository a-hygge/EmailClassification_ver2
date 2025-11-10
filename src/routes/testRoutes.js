import { Router } from 'express';
import { showTestPage, testClassify } from '../controllers/testClassificationController.js';

const router = Router();

router.get('/classify', showTestPage);

router.post('/classify', testClassify);

export default router;

