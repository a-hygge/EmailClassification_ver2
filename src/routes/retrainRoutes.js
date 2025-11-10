import { Router } from "express";
const router = Router();

import {
  showRetrainPage,
  showConfigPage,
  showResultsPage,
  getSamples,
  getModels,
  startRetraining,
  getTrainingStatus,
  getTrainingResults,
  saveModel,
  getTrainingHistory,
  // Retrain model cũ
  getModelInfo,
  startModelRetraining,
  overwriteModel,
} from "../controllers/retrainController.js";

// Pages
router.get("/", showRetrainPage);
router.get("/config", showConfigPage);
router.get("/results", showResultsPage);

// API endpoints - Train mới
router.get("/samples", getSamples);
router.get("/models", getModels);
router.post("/start", startRetraining);
router.get("/status/:jobId", getTrainingStatus);
router.get("/results/:jobId", getTrainingResults);
router.post("/save/:jobId", saveModel);
router.get("/history", getTrainingHistory);

router.get("/model/:id/info", getModelInfo);
router.post("/model/start", startModelRetraining);
router.put("/model/save/:jobId", overwriteModel);

export default router;
