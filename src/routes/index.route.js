import { Router } from "express";
const router = Router();
import authRoutes from "./authRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import emailRoutes from "./emailRoutes.js";
import testRoutes from "./testRoutes.js";
import retrainRoutes from "./retrainRoutes.js";
import apiRoutes from "./apiRoutes.js";

router.use("/auth", authRoutes);

router.use("/api", apiRoutes);

router.use("/dashboard", dashboardRoutes);
router.use("/emails", emailRoutes);
router.use("/test", testRoutes);
router.use("/retrain", retrainRoutes);

router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.redirect("/auth/login");
});
export default router;