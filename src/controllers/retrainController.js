import retrainService from "../services/retrainService.js";
import modelRetrainService from "../services/modelRetrainService.js";
import emailDao from "../dao/emailDao.js";
import labelDao from "../dao/labelDao.js";
import modelDao from "../dao/modelDao.js";

class RetrainController {
  async showRetrainPage(req, res) {
    try {
      const stats = req.session.stats || {};
      const labelsWithCount = req.session.labelsWithCount || [];

      res.render("pages/retrain/samples", {
        title: "Select Training Samples - Email Classification System",
        layout: "layouts/main",
        currentPage: "retrain",
        stats,
        labels: labelsWithCount,
        selectedLabel: null,
      });
    } catch (error) {
      console.error("Error showing retrain page:", error);
      res.status(500).send("Server Error");
    }
  }
  async showConfigPage(req, res) {
    try {
      const stats = req.session.stats || {};
      const labelsWithCount = req.session.labelsWithCount || [];

      res.render("pages/retrain/config", {
        title: "Configure Training - Email Classification System",
        layout: "layouts/main",
        currentPage: "retrain",
        stats,
        labels: labelsWithCount,
        selectedLabel: null,
      });
    } catch (error) {
      console.error("Error showing config page:", error);
      res.status(500).send("Server Error");
    }
  }
  async showResultsPage(req, res) {
    try {
      const stats = req.session.stats || {};
      const labelsWithCount = req.session.labelsWithCount || [];
      const jobId = req.query.jobId || null;

      res.render("pages/retrain/results", {
        title: "Training Results - Email Classification System",
        layout: "layouts/main",
        currentPage: "retrain",
        stats,
        labels: labelsWithCount,
        jobId,
        selectedLabel: null,
      });
    } catch (error) {
      console.error("Error showing results page:", error);
      res.status(500).send("Server Error");
    }
  }
  async getSamples(req, res) {
    try {
      const samples = await emailDao.getSampleList();
      const labels = await labelDao.findAll();

      const formattedSamples = samples.map((email) => ({
        id: email.id,
        title: email.title,
        content: email.content.substring(0, 100) + "...", 
        tblLabelId: email.tblLabelId,
        labelName: email.label?.name || "Unknown",
      }));

      res.json({
        success: true,
        samples: formattedSamples,
        labels: labels.map((l) => ({ 
          id: l.id, 
          name: l.name,
          description: l.description 
        })),
      });
    } catch (error) {
      console.error("Error getting samples:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  async getModels(req, res) {
    try {
      const models = await modelDao.getModelList();

      res.json({
        success: true,
        models: models.map((m) => {
          const pathParts = m.path.split('/').pop(); 
          const modelName = pathParts
            .replace('email_', '')
            .replace('_model.h5', '')
            .replace('_', '+')
            .toUpperCase(); 

          return {
            id: m.id,
            name: modelName,
            version: m.version,
            path: m.path,
            accuracy: m.accuracy,
            precision: m.precision,
            recall: m.recall,
            f1Score: m.f1Score,
            isActive: m.isActive,
            created_at: m.created_at,
          };
        }),
      });
    } catch (error) {
      console.error("Error getting models:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  async startRetraining(req, res) {
    try {
      if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized. Please login again.",
        });
      }
      const userId = req.session.user.id;
      const config = req.body;
      const result = await retrainService.startTraining(userId, config);
      res.json(result);
    } catch (error) {
      console.error("Error starting training:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  async getTrainingStatus(req, res) {
    try {
      const { jobId } = req.params;
      const result = await retrainService.getTrainingStatus(parseInt(jobId));
      res.json(result);
    } catch (error) {
      console.error("Error getting training status:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  async getTrainingResults(req, res) {
    try {
      const { jobId } = req.params;
      const result = await retrainService.getTrainingResults(parseInt(jobId));
      res.json(result);
    } catch (error) {
      console.error("Error getting training results:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  async saveModel(req, res) {
    try {
      const { jobId } = req.params;
      const { modelName, datasetName, datasetDescription } = req.body;

      const result = await retrainService.saveModel(
        parseInt(jobId),
        {
          modelName: modelName || `model_${Date.now()}`,
          datasetName: datasetName || `dataset_${Date.now()}`,
          datasetDescription: datasetDescription || 'Training dataset'
        }
      );

      res.json(result);
    } catch (error) {
      console.error("Error saving model:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
  async getTrainingHistory(req, res) {
    try {
      if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized. Please login again.",
        });
      }

      const userId = req.session.user.id;
      const jobs = await retrainService.getUserTrainingHistory(userId);

      res.json({
        success: true,
        jobs: jobs,
      });
    } catch (error) {
      console.error("Error getting training history:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ============ RETRAIN MODEL CŨ ============

  /**
   * Lấy thông tin model và datasets của nó
   * GET /retrain/model/:id/info
   */
  async getModelInfo(req, res) {
    try {
      const { id } = req.params;
      const result = await modelRetrainService.getModelWithDatasets(parseInt(id));
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error("Error getting model info:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Bắt đầu retrain model cũ
   * POST /retrain/model/start
   */
  async startModelRetraining(req, res) {
    try {
      if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized. Please login again.",
        });
      }

      const userId = req.session.user.id;
      const config = req.body;

      const result = await modelRetrainService.startRetraining(userId, config);
      res.json(result);
    } catch (error) {
      console.error("Error starting model retraining:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Ghi đè model cũ sau khi retrain xong
   * PUT /retrain/model/save/:jobId
   */
  async overwriteModel(req, res) {
    try {
      const { jobId } = req.params;
      const { modelId, sampleIds } = req.body;

      if (!modelId || !sampleIds || !Array.isArray(sampleIds)) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: modelId, sampleIds"
        });
      }

      const result = await modelRetrainService.overwriteModel(
        parseInt(jobId),
        parseInt(modelId),
        sampleIds
      );

      res.json(result);
    } catch (error) {
      console.error("Error overwriting model:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

const retrainController = new RetrainController();

export const {
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
} = retrainController;

export default retrainController;
