import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";

const { User } = db;

class AuthController {
  showLoginPage(req, res) {
    try {
      res.render("pages/auth/login", {
        title: "Login - Email Classification System",
        layout: "layouts/auth",
        error: null,
        oldInput: {},
      });
    } catch (error) {
      console.error("Error showing login page:", error);
      res.status(500).send("Server Error");
    }
  }
  async login(req, res) {
    try {
      const { username, password, remember } = req.body;
      const user = await User.findOne({
        where: { username: username },
      });
      if (!user) {
        return res.render("pages/auth/login", {
          title: "Login - Email Classification System",
          layout: "layouts/auth",
          error: "Username hoặc mật khẩu không chính xác",
          oldInput: { username },
        });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.render("pages/auth/login", {
          title: "Login - Email Classification System",
          layout: "layouts/auth",
          error: "Username hoặc mật khẩu không chính xác",
          oldInput: { username },
        });
      }
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
      if (remember) {
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === "production",
        });
      }

      req.session.success = "Đăng nhập thành công!";

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      res.render("pages/auth/login", {
        title: "Login - Email Classification System",
        layout: "layouts/auth",
        error: "Có lỗi xảy ra, vui lòng thử lại",
        oldInput: { username: req.body.username },
      });
    }
  }

  showRegisterPage(req, res) {
    try {
      res.render("pages/auth/register", {
        title: "Register - Email Classification System",
        layout: "layouts/auth",
        error: null,
        errors: {},
        oldInput: {},
      });
    } catch (error) {
      console.error("Error showing register page:", error);
      res.status(500).send("Server Error");
    }
  }
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      const existingEmail = await User.findOne({
        where: { email },
      });

      if (existingEmail) {
        return res.render("pages/auth/register", {
          title: "Register - Email Classification System",
          layout: "layouts/auth",
          error: "Email này đã được sử dụng",
          errors: {},
          oldInput: { username, email },
        });
      }

      const existingUsername = await User.findOne({
        where: { username },
      });

      if (existingUsername) {
        return res.render("pages/auth/register", {
          title: "Register - Email Classification System",
          layout: "layouts/auth",
          error: "Username này đã được sử dụng",
          errors: {},
          oldInput: { username, email },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      req.session.success = "Đăng ký thành công! Vui lòng đăng nhập.";

      res.redirect("/auth/login");
    } catch (error) {
      console.error("Register error:", error);
      res.render("pages/auth/register", {
        title: "Register - Email Classification System",
        layout: "layouts/auth",
        error: "Có lỗi xảy ra, vui lòng thử lại",
        errors: {},
        oldInput: req.body,
      });
    }
  }

  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
        res.clearCookie("token");
        res.clearCookie("connect.sid");
        res.redirect("/auth/login");
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.redirect("/auth/login");
    }
  }

  showForgotPasswordPage(req, res) {
    try {
      res.render("pages/auth/forgot-password", {
        title: "Forgot Password - Email Classification System",
        layout: "layouts/auth",
        error: null,
        success: null,
        oldInput: {},
      });
    } catch (error) {
      console.error("Error showing forgot password page:", error);
      res.status(500).send("Server Error");
    }
  }
}

const authController = new AuthController();

export const {
  showLoginPage,
  login,
  showRegisterPage,
  register,
  logout,
  showForgotPasswordPage,
} = authController;

export default authController;