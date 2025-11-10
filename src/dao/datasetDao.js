import db from '../models/index.js';

const { Dataset, EmailSample, DatasetEmail, Label } = db;

class DatasetDao {
  /**
   * @param {Object} datasetData 
   * @param {string} datasetData.name 
   * @param {string} datasetData.path 
   * @param {string} datasetData.description 
   * @param {Array<number>} emailIds 
   * @returns {Promise<Object>} 
   */
  async saveDataset(datasetData, emailIds) {
    const transaction = await db.sequelize.transaction();
    try {
      const dataset = await Dataset.create({
        name: datasetData.name,
        path: datasetData.path,
        description: datasetData.description,
        quantity: emailIds ? emailIds.length : 0,
        created_at: new Date()
      }, { transaction });
      if (emailIds && emailIds.length > 0) {
        const datasetEmailLinks = emailIds.map(emailId => ({
          tblDatasetId: dataset.id,
          tblEmailSampleId: emailId
        }));
        
        await DatasetEmail.bulkCreate(datasetEmailLinks, { transaction });
      }
      await transaction.commit();
      return await this.findById(dataset.id);
    } catch (error) {
      await transaction.rollback();
      console.error('Error saving dataset:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<Object|null>} 
   */
  async findById(id) {
    try {
      const dataset = await Dataset.findByPk(id, {
        include: [
          {
            model: EmailSample,
            as: 'emails',
            through: { attributes: [] },
            include: [
              { model: Label, as: 'labels', through: { attributes: [] } }
            ]
          }
        ]
      });
      return dataset;
    } catch (error) {
      console.error('Error finding dataset by ID:', error);
      throw error;
    }
  }

  /**
   * @returns {Promise<Array>}
   */
  async findAll() {
    try {
      const datasets = await Dataset.findAll({
        include: [
          {
            model: EmailSample,
            as: 'emails',
            through: { attributes: [] },
            include: [
              { model: Label, as: 'labels', through: { attributes: [] } }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });
      return datasets;
    } catch (error) {
      console.error('Error finding all datasets:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @param {Object} updateData 
   * @param {string} updateData.name 
   * @param {string} updateData.path 
   * @param {string} updateData.description 
   * @param {number} updateData.quantity 
   * @returns {Promise<Object|null>} 
   */
  async update(id, updateData) {
    try {
      const dataset = await Dataset.findByPk(id);
      if (!dataset) return null;
      
      await dataset.update(updateData);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating dataset:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<boolean>} 
   */
  async delete(id) {
    try {
      const dataset = await Dataset.findByPk(id);
      if (!dataset) return false;
      
      await dataset.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting dataset:', error);
      throw error;
    }
  }

  /**
   * @param {number} datasetId
   * @returns {Promise<Array>} 
   */
  async getDatasetEmails(datasetId) {
    try {
      const dataset = await Dataset.findByPk(datasetId, {
        include: [
          {
            model: EmailSample,
            as: 'emails',
            through: { attributes: [] },
            include: [
              { model: Label, as: 'labels', through: { attributes: [] } }
            ]
          }
        ]
      });
      
      return dataset ? dataset.emails : [];
    } catch (error) {
      console.error('Error getting dataset emails:', error);
      throw error;
    }
  }
}

export default new DatasetDao();
