import db from '../models/index.js';

const { Prediction, PredictionLabel, EmailSample, Label, Model } = db;

class PredictionDao {
  /**
   * Find prediction by ID
   * @param {number} id 
   * @returns {Promise<Object|null>} 
   */
  async findById(id) {
    try {
      const prediction = await Prediction.findByPk(id, {
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: ['confidence'] }
          },
          { model: EmailSample, as: 'email' },
          { model: Model, as: 'model' }
        ]
      });
      return prediction;
    } catch (error) {
      console.error('Error finding prediction by ID:', error);
      throw error;
    }
  }

  /**
   * Find all predictions for an email
   * @param {number} emailId 
   * @returns {Promise<Array>} 
   */
  async findByEmailId(emailId) {
    try {
      const predictions = await Prediction.findAll({
        where: { tblEmailSampleId: emailId },
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: ['confidence'] }
          },
          { model: Model, as: 'model' }
        ],
        order: [['created_at', 'DESC']]
      });
      return predictions;
    } catch (error) {
      console.error('Error finding predictions by email ID:', error);
      throw error;
    }
  }

  /**
   * Get latest prediction for an email
   * @param {number} emailId 
   * @returns {Promise<Object|null>} 
   */
  async getLatestByEmailId(emailId) {
    try {
      const prediction = await Prediction.findOne({
        where: { tblEmailSampleId: emailId },
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: ['confidence'] }
          },
          { model: Model, as: 'model' }
        ],
        order: [['created_at', 'DESC']]
      });
      return prediction;
    } catch (error) {
      console.error('Error getting latest prediction:', error);
      throw error;
    }
  }

  /**
   * Create prediction with labels
   * @param {Object} predictionData 
   * @param {number} predictionData.emailId 
   * @param {number} predictionData.modelId 
   * @param {Array<Object>} predictionData.labels - [{labelId, confidence}, ...]
   * @returns {Promise<Object>} 
   */
  async create(predictionData) {
    const transaction = await db.sequelize.transaction();
    try {
      const { emailId, modelId, labels } = predictionData;
      
      // Calculate average confidence
      const avgConfidence = labels.reduce((sum, l) => sum + parseFloat(l.confidence), 0) / labels.length;
      
      // Create prediction
      const prediction = await Prediction.create({
        tblEmailSampleId: emailId,
        tblModelId: modelId,
        avgConfidence: avgConfidence.toFixed(3)
      }, { transaction });
      
      // Create prediction labels
      const predictionLabels = labels.map(l => ({
        tblPredictionId: prediction.id,
        tblLabelId: l.labelId,
        confidence: parseFloat(l.confidence).toFixed(3)
      }));
      
      await PredictionLabel.bulkCreate(predictionLabels, { transaction });
      
      await transaction.commit();
      
      return await this.findById(prediction.id);
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating prediction:', error);
      throw error;
    }
  }

  /**
   * Find all predictions
   * @param {Object} options 
   * @returns {Promise<Array>} 
   */
  async findAll(options = {}) {
    try {
      const defaultOptions = {
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: ['confidence'] }
          },
          { model: EmailSample, as: 'email' },
          { model: Model, as: 'model' }
        ],
        order: [['created_at', 'DESC']],
        ...options
      };
      const predictions = await Prediction.findAll(defaultOptions);
      return predictions;
    } catch (error) {
      console.error('Error finding all predictions:', error);
      throw error;
    }
  }

  /**
   * Delete prediction
   * @param {number} id 
   * @returns {Promise<boolean>} 
   */
  async delete(id) {
    try {
      const prediction = await Prediction.findByPk(id);
      if (!prediction) {
        return false;
      }
      await prediction.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting prediction:', error);
      throw error;
    }
  }
}

export default new PredictionDao();
