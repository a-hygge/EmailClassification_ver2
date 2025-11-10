import db from '../models/index.js';

const { Model, Dataset } = db;

class ModelDao {
  /**
   * @param {Object} modelData 
   * @param {string} modelData.path 
   * @param {string} modelData.version 
   * @param {number} modelData.accuracy 
   * @param {number} modelData.precision 
   * @param {number} modelData.recall 
   * @param {number} modelData.f1Score 
   * @param {number} modelData.tblDatasetId 
   * @returns {Promise<Object>} Created model
   */
  async saveRetrainModel(modelData) {
    const transaction = await db.sequelize.transaction();
    try {
      await Model.update(
        { isActive: false },
        { 
          where: { isActive: true },
          transaction 
        }
      );
      const model = await Model.create({
        ...modelData,
        isActive: true,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });

      await transaction.commit();
      return model;
    } catch (error) {
      await transaction.rollback();
      console.error('Error saving retrain model:', error);
      throw error;
    }
  }

  /**
   * @returns {Promise<Array>} 
   */
  async getModelList() {
    try {
      const models = await Model.findAll({
        include: [
          { model: Dataset, as: 'dataset' }
        ],
        order: [['created_at', 'DESC']]
      });
      return models;
    } catch (error) {
      console.error('Error getting model list:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<Object|null>} 
   */
  async findById(id) {
    try {
      const model = await Model.findByPk(id, {
        include: [
          { model: Dataset, as: 'dataset' }
        ]
      });
      return model;
    } catch (error) {
      console.error('Error finding model by ID:', error);
      throw error;
    }
  }

  /**
   * @returns {Promise<Array>} 
   */
  async findAll() {
    try {
      const models = await Model.findAll({
        include: [
          { model: Dataset, as: 'dataset' }
        ],
        order: [['created_at', 'DESC']]
      });
      return models;
    } catch (error) {
      console.error('Error finding all models:', error);
      throw error;
    }
  }

  /**
   * @param {Object} modelData 
   * @param {string} modelData.path
   * @param {string} modelData.version
   * @param {number} modelData.accuracy 
   * @param {number} modelData.precision
   * @param {number} modelData.recall
   * @param {number} modelData.f1Score
   * @param {boolean} modelData.isActive
   * @param {number} modelData.tblDatasetId
   * @returns {Promise<Object>}
   */
  async create(modelData) {
    try {
      const model = await Model.create(modelData);
      return model;
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @param {Object} updateData
   * @param {string} updateData.path
   * @param {string} updateData.version
   * @param {number} updateData.accuracy
   * @param {number} updateData.precision
   * @param {number} updateData.recall
   * @param {number} updateData.f1Score
   * @param {boolean} updateData.isActive
   * @param {number} updateData.tblDatasetId
   * @returns {Promise<Object|null>} 
   */
  async update(id, updateData) {
    try {
      const model = await Model.findByPk(id);
      if (!model) return null;
      await model.update(updateData);
      return model;
    } catch (error) {
      console.error('Error updating model:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<boolean>} 
   */
  async delete(id) {
    try {
      const model = await Model.findByPk(id);
      if (!model) return false;
      await model.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  /**
   * @returns {Promise<Object|null>} 
   */
  async getActiveModel() {
    try {
      const model = await Model.findOne({
        where: { isActive: true },
        include: [
          { model: Dataset, as: 'dataset' }
        ]
      });
      return model;
    } catch (error) {
      console.error('Error getting active model:', error);
      throw error;
    }
  }
}

export default new ModelDao();


