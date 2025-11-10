import mlApiClient from "./mlApiClient.js";
import labelDao from "../dao/labelDao.js";
import emailDao from "../dao/emailDao.js";
import predictionDao from "../dao/predictionDao.js";
import modelDao from "../dao/modelDao.js";

class ClassificationService {
  /**
   * Classify email and return multi-label predictions
   * @param {Object} emailData 
   * @param {string} emailData.title 
   * @param {string} emailData.content 
   * @returns {Promise<Object>}
   */
  async classifyEmail(emailData) {
    try {
      if (!emailData.title || !emailData.content) {
        throw new Error("Title and content are required");
      }
      
      // Get prediction from ML API (multi-label)
      const prediction = await mlApiClient.predict({
        title: emailData.title,
        content: emailData.content,
      });

      // Map label names to database label IDs
      const labelsWithIds = await Promise.all(
        prediction.labels.map(async (pred) => {
          const label = await labelDao.findByName(pred.label);
          return {
            labelId: label ? label.id : null,
            labelName: pred.label,
            confidence: pred.confidence,
            found: !!label
          };
        })
      );

      // Filter out labels not found in database
      const validLabels = labelsWithIds.filter(l => l.found);
      const notFoundLabels = labelsWithIds.filter(l => !l.found);

      if (notFoundLabels.length > 0) {
        console.warn(
          `Labels not found in database: ${notFoundLabels.map(l => l.labelName).join(', ')}`
        );
      }

      return {
        success: true,
        labels: validLabels.map(l => ({
          labelId: l.labelId,
          labelName: l.labelName,
          confidence: l.confidence
        })),
        avgConfidence: validLabels.length > 0
          ? validLabels.reduce((sum, l) => sum + l.confidence, 0) / validLabels.length
          : 0
      };
    } catch (error) {
      console.error("Classification error:", error);
      return {
        success: false,
        error: error.message,
        labels: [],
        avgConfidence: 0
      };
    }
  }

  /**
   * Classify email and update database with predictions
   * @param {number} emailId 
   * @param {boolean} savePrediction - Whether to save prediction to tblPrediction
   * @returns {Promise<Object>}
   */
  async classifyAndUpdate(emailId, savePrediction = true) {
    try {
      const email = await emailDao.findById(emailId);

      if (!email) {
        throw new Error("Email not found");
      }

      // Classify email
      const result = await this.classifyEmail({
        title: email.title,
        content: email.content,
      });

      if (!result.success) {
        return result;
      }

      // Update email labels (replace all existing labels)
      if (result.labels.length > 0) {
        const labelIds = result.labels.map(l => l.labelId);
        await emailDao.updateLabels(emailId, labelIds);
      }

      // Save prediction to tblPrediction (optional)
      if (savePrediction && result.labels.length > 0) {
        const activeModel = await modelDao.getActiveModel();
        if (activeModel) {
          const predictions = result.labels.map(l => ({
            labelId: l.labelId,
            confidence: l.confidence
          }));
          
          await emailDao.savePrediction(emailId, activeModel.id, predictions);
        }
      }

      return result;
    } catch (error) {
      console.error("Classify and update error:", error);
      return {
        success: false,
        error: error.message,
        labels: []
      };
    }
  }

  /**
   * Classify email and ONLY save to tblPrediction (don't update email labels)
   * @param {number} emailId 
   * @returns {Promise<Object>}
   */
  async classifyAndSavePrediction(emailId) {
    try {
      const email = await emailDao.findById(emailId);

      if (!email) {
        throw new Error("Email not found");
      }

      const result = await this.classifyEmail({
        title: email.title,
        content: email.content,
      });

      if (!result.success || result.labels.length === 0) {
        return result;
      }

      // Save prediction only
      const activeModel = await modelDao.getActiveModel();
      if (activeModel) {
        const predictions = result.labels.map(l => ({
          labelId: l.labelId,
          confidence: l.confidence
        }));
        
        const savedPrediction = await emailDao.savePrediction(
          emailId, 
          activeModel.id, 
          predictions
        );

        return {
          ...result,
          predictionId: savedPrediction.id
        };
      }

      return result;
    } catch (error) {
      console.error("Classify and save prediction error:", error);
      return {
        success: false,
        error: error.message,
        labels: []
      };
    }
  }

  /**
   * Batch classify multiple emails
   * @param {Array<number>} emailIds 
   * @returns {Promise<Array>}
   */
  async batchClassify(emailIds) {
    const results = [];
    
    for (const emailId of emailIds) {
      const result = await this.classifyAndUpdate(emailId);
      results.push({
        emailId,
        ...result
      });
    }

    return results;
  }
}

export default new ClassificationService();
