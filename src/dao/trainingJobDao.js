import db from '../models/index.js';

const { TrainingJob, User } = db;

class TrainingJobDao {
  /**
   * @param {Object} data 
   * @param {number} data.tblUserId 
   * @param {string} data.modelType 
   * @param {string} data.modelPath 
   * @param {string} data.status 
   * @param {string} data.hyperparameters 
   * @param {string} data.result 
   * @returns {Promise<Object>} 
   */
  async create(data) {
    try {
      const job = await TrainingJob.create(data);
      return job;
    } catch (error) {
      console.error('Error creating training job:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<Object|null>} 
   */
  async findById(id) {
    try {
      const job = await TrainingJob.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'email'] }
        ]
      });
      return job;
    } catch (error) {
      console.error('Error finding training job:', error);
      throw error;
    }
  }

  /**
   * @param {number} jobId 
   * @param {Object} data 
   * @param {string} data.status 
   * @param {string} data.modelPath 
   * @param {string} data.result 
   * @returns {Promise<Object|null>}
   */
  async update(jobId, data) {
    try {
      const job = await TrainingJob.findByPk(jobId);
      if (!job) return null;
      
      await job.update(data);
      return job;
    } catch (error) {
      console.error('Error updating training job:', error);
      throw error;
    }
  }

  /**
   * @param {number} userId
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, options = {}) {
    try {
      const jobs = await TrainingJob.findAll({
        where: { tblUserId: userId },
        order: [['id', 'DESC']],
        ...options
      });
      return jobs;
    } catch (error) {
      console.error('Error finding training jobs by user:', error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<boolean>} 
   */
  async delete(id) {
    try {
      const job = await TrainingJob.findByPk(id);
      if (!job) return false;
      await job.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting training job:', error);
      throw error;
    }
  }
}

export default new TrainingJobDao();


