import { Router } from 'express';
import { redirectIfAuthenticated } from '../middleware/auth.js';
import {
  showLoginPage,
  login,
  showRegisterPage,
  register,
  logout,
  showForgotPasswordPage
} from '../controllers/authController.js';

const router = Router();

// GET /auth/login - Hiển thị form login
router.get('/login', redirectIfAuthenticated, showLoginPage);

// POST /auth/login - Xử lý login
router.post('/login', login);

// GET /auth/register - Hiển thị form register
router.get('/register', redirectIfAuthenticated, showRegisterPage);

// POST /auth/register - Xử lý register
router.post('/register', register);

// GET /auth/logout - Đăng xuất
router.get('/logout', logout);

// GET /auth/forgot-password - Quên mật khẩu
router.get('/forgot-password', showForgotPasswordPage);

export default router;