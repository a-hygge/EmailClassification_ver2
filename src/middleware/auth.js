/**
 * Authentication Middleware
 * Kiểm tra user đã login chưa
 */

export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    console.log('Authentication required - redirecting to login');
    return res.redirect('/auth/login');
  }
  next();
};

/**
 * Check if user is already logged in
 * Redirect to dashboard if already authenticated
 */
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    console.log('User already authenticated - redirecting to dashboard');
    return res.redirect('/dashboard');
  }
  next();
};

export default {
  requireAuth,
  redirectIfAuthenticated
};
