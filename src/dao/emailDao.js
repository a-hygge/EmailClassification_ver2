import db from '../models/index.js';

const { EmailSample, Label, EmailLabel, Prediction, PredictionLabel } = db;

class EmailDao {
  /**
   * Find email by ID with all labels (multi-label)
   * @param {number} id 
   * @returns {Promise<Object|null>} 
   */
  async findById(id) {
    try {
      const email = await EmailSample.findByPk(id, {
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: [] } // Hide junction table attributes
          }
        ]
      });
      return email;
    } catch (error) {
      console.error('Error finding email by ID:', error);
      throw error;
    }
  }

  /**
   * Find all emails with labels
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
            through: { attributes: [] }
          }
        ],
        ...options
      };
      const emails = await EmailSample.findAll(defaultOptions);
      return emails;
    } catch (error) {
      console.error('Error finding all emails:', error);
      throw error;
    }
  }

  /**
   * Find and count emails with pagination
   * @param {Object} options 
   * @returns {Promise<Object>} 
   */
  async findAndCountAll(options = {}) {
    try {
      const defaultOptions = {
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: [] }
          }
        ],
        ...options,
        distinct: true // Important for correct count with many-to-many
      };
      const result = await EmailSample.findAndCountAll(defaultOptions);
      return result;
    } catch (error) {
      console.error('Error finding and counting emails:', error);
      throw error;
    }
  }

  /**
   * Create email with multiple labels
   * @param {Object} emailData 
   * @param {string} emailData.title 
   * @param {string} emailData.content
   * @param {string} emailData.sender
   * @param {string} emailData.receiver
   * @param {Array<number>} emailData.labelIds - Array of label IDs
   * @returns {Promise<Object>} 
   */
  async create(emailData) {
    const transaction = await db.sequelize.transaction();
    try {
      const { labelIds, ...emailFields } = emailData;
      
      // Create email
      const email = await EmailSample.create(emailFields, { transaction });
      
      // Add labels if provided
      if (labelIds && Array.isArray(labelIds) && labelIds.length > 0) {
        await email.setLabels(labelIds, { transaction });
      }
      
      await transaction.commit();
      
      // Reload with labels
      return await this.findById(email.id);
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating email:', error);
      throw error;
    }
  }

  /**
   * Update email (basic info only)
   * @param {number} id 
   * @param {Object} updateData 
   * @returns {Promise<Object|null>} 
   */
  async update(id, updateData) {
    try {
      const email = await EmailSample.findByPk(id);
      if (!email) {
        return null;
      }
      
      const { labelIds, ...emailFields } = updateData;
      await email.update(emailFields);
      
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  /**
   * Update email labels (replace all labels)
   * @param {number} id 
   * @param {Array<number>} labelIds 
   * @returns {Promise<Object|null>} 
   */
  async updateLabels(id, labelIds) {
    const transaction = await db.sequelize.transaction();
    try {
      const email = await EmailSample.findByPk(id);
      if (!email) {
        return null;
      }
      
      await email.setLabels(labelIds, { transaction });
      await transaction.commit();
      
      return await this.findById(id);
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating email labels:', error);
      throw error;
    }
  }

  /**
   * Add labels to email (keep existing labels)
   * @param {number} id 
   * @param {Array<number>} labelIds 
   * @returns {Promise<Object|null>} 
   */
  async addLabels(id, labelIds) {
    const transaction = await db.sequelize.transaction();
    try {
      const email = await EmailSample.findByPk(id);
      if (!email) {
        return null;
      }
      
      await email.addLabels(labelIds, { transaction });
      await transaction.commit();
      
      return await this.findById(id);
    } catch (error) {
      await transaction.rollback();
      console.error('Error adding email labels:', error);
      throw error;
    }
  }

  /**
   * Remove labels from email
   * @param {number} id 
   * @param {Array<number>} labelIds 
   * @returns {Promise<Object|null>} 
   */
  async removeLabels(id, labelIds) {
    const transaction = await db.sequelize.transaction();
    try {
      const email = await EmailSample.findByPk(id);
      if (!email) {
        return null;
      }
      
      await email.removeLabels(labelIds, { transaction });
      await transaction.commit();
      
      return await this.findById(id);
    } catch (error) {
      await transaction.rollback();
      console.error('Error removing email labels:', error);
      throw error;
    }
  }

  /**
   * Delete email
   * @param {number} id 
   * @returns {Promise<boolean>} 
   */
  async delete(id) {
    try {
      const email = await EmailSample.findByPk(id);
      if (!email) {
        return false;
      }
      await email.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting email:', error);
      throw error;
    }
  }

  /**
   * Count emails
   * @param {Object} where 
   * @returns {Promise<number>} 
   */
  async count(where = {}) {
    try {
      const count = await EmailSample.count({ where });
      return count;
    } catch (error) {
      console.error('Error counting emails:', error);
      throw error;
    }
  }

  /**
   * Find one email
   * @param {Object} options 
   * @returns {Promise<Object|null>} 
   */
  async findOne(options = {}) {
    try {
      const defaultOptions = {
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: [] }
          }
        ],
        ...options
      };
      const email = await EmailSample.findOne(defaultOptions);
      return email;
    } catch (error) {
      console.error('Error finding one email:', error);
      throw error;
    }
  }

  /**
   * Get all sample emails (emails that have labels)
   * @returns {Promise<Array>} 
   */
  async getSampleList() {
    try {
      const samples = await EmailSample.findAll({
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: [] },
            required: true // Only emails with at least 1 label
          }
        ],
        order: [['id', 'DESC']]
      });
      return samples;
    } catch (error) {
      console.error('Error getting sample list:', error);
      throw error;
    }
  }

  /**
   * Find emails by IDs
   * @param {Array<number>} emailIds 
   * @returns {Promise<Array>} 
   */
  async findByIds(emailIds) {
    try {
      const emails = await EmailSample.findAll({
        where: {
          id: emailIds
        },
        include: [
          { 
            model: Label, 
            as: 'labels',
            through: { attributes: [] }
          }
        ]
      });
      return emails;
    } catch (error) {
      console.error('Error finding emails by IDs:', error);
      throw error;
    }
  }

  /**
   * Find emails by label ID
   * @param {number} labelId 
   * @returns {Promise<Array>} 
   */
  async findByLabelId(labelId) {
    try {
      const emails = await EmailSample.findAll({
        include: [
          { 
            model: Label, 
            as: 'labels',
            where: { id: labelId },
            through: { attributes: [] }
          }
        ]
      });
      return emails;
    } catch (error) {
      console.error('Error finding emails by label ID:', error);
      throw error;
    }
  }

  /**
   * Save prediction result for an email (multi-label)
   * @param {number} emailId 
   * @param {number} modelId 
   * @param {Array<Object>} predictions - [{labelId, confidence}, ...]
   * @returns {Promise<Object>} 
   */
  async savePrediction(emailId, modelId, predictions) {
    const transaction = await db.sequelize.transaction();
    try {
      // Calculate average confidence
      const avgConfidence = predictions.reduce((sum, p) => sum + parseFloat(p.confidence), 0) / predictions.length;
      
      // Create prediction record
      const prediction = await Prediction.create({
        tblEmailSampleId: emailId,
        tblModelId: modelId,
        avgConfidence: avgConfidence.toFixed(3)
      }, { transaction });
      
      // Create prediction labels
      const predictionLabels = predictions.map(p => ({
        tblPredictionId: prediction.id,
        tblLabelId: p.labelId,
        confidence: parseFloat(p.confidence).toFixed(3)
      }));
      
      await PredictionLabel.bulkCreate(predictionLabels, { transaction });
      
      await transaction.commit();
      
      // Reload with associations
      return await Prediction.findByPk(prediction.id, {
        include: [
          { model: Label, as: 'labels', through: { attributes: ['confidence'] } },
          { model: EmailSample, as: 'email' }
        ]
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error saving prediction:', error);
      throw error;
    }
  }
}

export default new EmailDao();


