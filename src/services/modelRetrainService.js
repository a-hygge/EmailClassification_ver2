import trainingJobDao from '../dao/trainingJobDao.js';
import emailDao from '../dao/emailDao.js';
import modelDao from '../dao/modelDao.js';
import datasetDao from '../dao/datasetDao.js';
import mlApiClient from './mlApiClient.js';
import db from '../models/index.js';

class ModelRetrainService {
  /**
   * @param {number} modelId
   * @returns {Promise<Object>} 
   */
  async getModelWithDatasets(modelId) {
    try {
      const model = await modelDao.findById(modelId);
      if (!model) {
        throw new Error('Model not found');
      }
      let datasets = [];
      let existingEmailIds = [];
      
      if (model.tblDatasetId) {
        const dataset = await datasetDao.findById(model.tblDatasetId);
        if (dataset) {
          const emails = dataset.emails || [];
          
          datasets.push({
            id: dataset.id,
            name: dataset.name,
            description: dataset.description,
            quantity: dataset.quantity,
            emails: emails
          });
          existingEmailIds = emails.map(e => e.id);
          console.log('Existing email IDs for model', modelId, ':', existingEmailIds);
        }
      }

      return {
        model: {
          id: model.id,
          path: model.path,
          version: model.version,
          accuracy: model.accuracy,
          precision: model.precision,
          recall: model.recall,
          f1Score: model.f1Score,
          isActive: model.isActive,
          created_at: model.created_at
        },
        datasets,
        existingEmailIds
      };
    } catch (error) {
      console.error('Error getting model with datasets:', error);
      throw error;
    }
  }

  /**
   * @param {Object} config
   */
  validateRetrainConfig(config) {
    const { modelId, sampleIds, hyperparameters } = config;
    
    if (!modelId || isNaN(modelId)) {
      throw new Error('Invalid model ID');
    }
    
    if (!Array.isArray(sampleIds) || sampleIds.length < 10) {
      throw new Error('At least 10 training samples are required');
    }
    
    const { learning_rate, epochs, batch_size } = hyperparameters;
    
    if (learning_rate <= 0 || learning_rate > 1) {
      throw new Error('Learning rate must be between 0 and 1');
    }
    
    if (epochs < 1 || epochs > 100) {
      throw new Error('Epochs must be between 1 and 100');
    }
    
    if (batch_size < 1 || batch_size > 256) {
      throw new Error('Batch size must be between 1 and 256');
    }
    
    return true;
  }

  /**
   * @param {Array<number>} sampleIds 
   * @returns {Promise<Array>} 
   */
  async prepareTrainingData(sampleIds) {
    try {
      const samples = await emailDao.findAll({
        where: { id: sampleIds },
        include: [{ model: db.Label, as: 'labels' }]
      });

      return samples.map(email => ({
        id: email.id,
        title: email.title,
        content: email.content,
        // For multi-label, return array of label names as expected by Python API
        labels: email.labels && email.labels.length > 0 
          ? email.labels.map(l => l.name) 
          : ['Unknown']
      }));
    } catch (error) {
      console.error('Error preparing training data:', error);
      throw error;
    }
  }

  /**
   * @param {number} userId 
   * @param {Object} config 
   * @returns {Promise<Object>} 
   */
  async createRetrainJob(userId, config) {
    try {
      const model = await modelDao.findById(config.modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      const jobData = {
        tblUserId: userId,
        tblModelId: config.modelId, // Add the required tblModelId field
        modelType: model.version,
        status: 'pending',
        hyperparameters: JSON.stringify(config.hyperparameters),
        result: null
      };

      const job = await trainingJobDao.create(jobData);
      return job;
    } catch (error) {
      console.error('Error creating retrain job:', error);
      throw error;
    }
  }

  /**
   * @param {number} userId - User ID
   * @param {Object} config - Training configuration
   * @returns {Promise<Object>} Training result
   */
  async startRetraining(userId, config) {
    try {
      this.validateRetrainConfig(config);

      const samples = await this.prepareTrainingData(config.sampleIds);
      const job = await this.createRetrainJob(userId, config);
      const model = await modelDao.findById(config.modelId);

      // Lấy model type từ database hoặc parse từ path
      let modelType = model.model_type;
      
      if (!modelType) {
        // Fallback: Parse từ path nếu không có model_type
        const filename = model.path.split('/').pop();
        
        // Extract từ filename pattern: email_xxx_model.h5
        if (filename.includes('bilstm_cnn')) {
          modelType = 'BiLSTM+CNN';
        } else if (filename.includes('bilstm')) {
          modelType = 'BiLSTM';
        } else if (filename.includes('lstm')) {
          modelType = 'LSTM';
        } else if (filename.includes('rnn')) {
          modelType = 'RNN';
        } else if (filename.includes('cnn')) {
          modelType = 'CNN';
        } else {
          throw new Error(`Cannot determine model type from path: ${model.path}`);
        }
      }

      console.log('✅ Using model type:', modelType);

      const trainingRequest = {
        jobId: job.id.toString(),
        modelType: modelType,
        modelPath: model.path, 
        samples: samples,
        hyperparameters: {
          ...config.hyperparameters,
          max_words: config.hyperparameters.max_words || 50000,
          max_len: config.hyperparameters.max_len || 256
        }
      };

      const result = await mlApiClient.startRetraining(trainingRequest);
      await trainingJobDao.update(job.id, { status: 'running' });

      return {
        success: true,
        jobId: job.id,
        modelId: config.modelId, 
        message: 'Retraining started successfully'
      };
    } catch (error) {
      console.error('Error starting retraining:', error);
      throw error;
    }
  }

  /**
   * Ghi đè model cũ và dataset cũ sau khi retrain xong
   * @param {number} jobId - Training job ID
   * @param {number} modelId - Model ID cần ghi đè
   * @param {Array<number>} sampleIds - Sample IDs đã dùng để train
   * @returns {Promise<Object>} Save result
   */
  async overwriteModel(jobId, modelId, sampleIds) {
    const transaction = await db.sequelize.transaction();

    try {
      const job = await trainingJobDao.findById(jobId);
      if (!job) {
        throw new Error('Training job not found');
      }

      if (job.status !== 'completed') {
        throw new Error('Cannot save incomplete training');
      }

      const model = await modelDao.findById(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Lưu model file với tên cũ (ghi đè)
      const modelName = model.path.split('/').pop().replace('.h5', '');
      const result = await mlApiClient.saveRetrainedModel(jobId.toString(), modelName);

      // Lấy training results
      const trainingResults = await mlApiClient.getRetrainingResults(jobId.toString());

      // Cập nhật hoặc tạo mới dataset
      let datasetId = model.tblDatasetId;

      if (datasetId) {
        // Ghi đè dataset cũ
        const dataset = await datasetDao.findById(datasetId);
        if (dataset) {
          // Xóa các liên kết cũ trong DatasetEmail
          await db.DatasetEmail.destroy({
            where: { tblDatasetId: datasetId },
            transaction
          });

          // Cập nhật dataset
          await datasetDao.update(datasetId, {
            quantity: sampleIds.length,
            description: `Retrained dataset - Updated at ${new Date().toISOString()}`
          });

          // Tạo liên kết mới với tblEmailSampleId
          const datasetEmailLinks = sampleIds.map(emailId => ({
            tblDatasetId: datasetId,
            tblEmailSampleId: emailId
          }));
          await db.DatasetEmail.bulkCreate(datasetEmailLinks, { transaction });
        }
      } else {
        // Tạo dataset mới nếu chưa có
        const newDataset = await datasetDao.saveDataset({
          name: `Dataset for ${model.version}`,
          path: `datasets/${model.version}_dataset.json`,
          description: `Dataset for retrained model ${model.version}`
        }, sampleIds);
        datasetId = newDataset.id;
      }

      // Cập nhật model với metrics mới
      await modelDao.update(modelId, {
        path: result.modelPath,
        accuracy: trainingResults.metrics?.testAccuracy || model.accuracy,
        precision: this.calculateWeightedAverage(trainingResults.metrics?.classificationReport, 'precision') || model.precision,
        recall: this.calculateWeightedAverage(trainingResults.metrics?.classificationReport, 'recall') || model.recall,
        f1Score: this.calculateWeightedAverage(trainingResults.metrics?.classificationReport, 'f1-score') || model.f1Score,
        updated_at: new Date(),
        tblDatasetId: datasetId
      });

      // Cập nhật training job
      await trainingJobDao.update(jobId, { modelPath: result.modelPath });

      await transaction.commit();

      return {
        success: true,
        modelPath: result.modelPath,
        message: 'Model and dataset overwritten successfully',
        model: {
          id: modelId,
          version: model.version,
          path: result.modelPath,
          accuracy: trainingResults.metrics?.testAccuracy || 0
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error overwriting model:', error);
      throw error;
    }
  }

  /**
   * Calculate weighted average từ classification report
   * @param {Object} classificationReport - Classification report
   * @param {string} metric - Metric name (precision, recall, f1-score)
   * @returns {number} Weighted average value
   */
  calculateWeightedAverage(classificationReport, metric) {
    if (!classificationReport || !classificationReport['weighted avg']) {
      return 0;
    }
    return classificationReport['weighted avg'][metric] || 0;
  }
}

export default new ModelRetrainService();
