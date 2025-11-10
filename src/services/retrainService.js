import trainingJobDao from '../dao/trainingJobDao.js';
import emailDao from '../dao/emailDao.js';
import labelDao from '../dao/labelDao.js';
import modelDao from '../dao/modelDao.js';
import mlApiClient from './mlApiClient.js';
import db from '../models/index.js';

class RetrainService {
  validateTrainingConfig(config) {
    const { modelId, sampleIds, hyperparameters } = config;
    console.log(' Validating config:', { modelId, sampleIds: sampleIds?.length, hyperparameters });
    if (!modelId || isNaN(modelId)) {
      console.error(' Invalid model ID:', modelId, 'Type:', typeof modelId);
      throw new Error('Invalid model ID');
    }
    if (!Array.isArray(sampleIds) || sampleIds.length < 10) {
      throw new Error('At least 10 training samples are required');
    }
    const { learning_rate, epochs, batch_size, random_state } = hyperparameters;
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
        // For multi-label, join all label names or use primary label
        label: email.labels && email.labels.length > 0 
          ? email.labels.map(l => l.name).join(', ') 
          : 'Unknown',
        labelIds: email.labels ? email.labels.map(l => l.id) : []
      }));
    } catch (error) {
      console.error('Error preparing training data:', error);
      throw error;
    }
  }
  async createTrainingJob(userId, config) {
    try {
      const model = await modelDao.findById(config.modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      const jobData = {
        tblUserId: userId,
        modelType: model.version, 
        status: 'pending',
        hyperparameters: JSON.stringify(config.hyperparameters), 
        result: null
      };

      const job = await trainingJobDao.create(jobData);
      return job;
    } catch (error) {
      console.error('Error creating training job:', error);
      throw error;
    }
  }

  async startTraining(userId, config) {
    try {
      this.validateTrainingConfig(config);
      const samples = await this.prepareTrainingData(config.sampleIds);
      const job = await this.createTrainingJob(userId, config);
      const model = await modelDao.findById(config.modelId);
      const pathParts = model.path.split('/').pop();
      const modelType = pathParts
        .replace('email_', '')
        .replace('_model.h5', '')
        .replace('_', '+')
        .toUpperCase();

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
        message: 'Training started successfully'
      };
    } catch (error) {
      console.error('Error starting training:', error);
      throw error;
    }
  }

  async getTrainingStatus(jobId) {
    try {
      const job = await trainingJobDao.findById(jobId);
      if (!job) {
        throw new Error('Training job not found');
      }
      const status = await mlApiClient.getRetrainingStatus(jobId.toString());
      if (status.status !== job.status) {
        await trainingJobDao.update(jobId, { status: status.status });
      }

      return {
        success: true,
        jobId: job.id,
        status: status.status,
        progress: status.progress || null,
        logs: status.logs || []
      };
    } catch (error) {
      console.error('Error getting training status:', error);
      throw error;
    }
  }

  async getTrainingResults(jobId) {
    try {
      const job = await trainingJobDao.findById(jobId);
      if (!job) {
        throw new Error('Training job not found');
      }

      if (job.status !== 'completed') {
        throw new Error('Training not completed yet');
      }
      const results = await mlApiClient.getRetrainingResults(jobId.toString());
      await trainingJobDao.update(jobId, { result: JSON.stringify(results) });

      const transformedMetrics = {
        accuracy: results.metrics?.testAccuracy || 0,
        precision: this.calculateWeightedAverage(results.metrics?.classificationReport, 'precision'),
        recall: this.calculateWeightedAverage(results.metrics?.classificationReport, 'recall'),
        f1: this.calculateWeightedAverage(results.metrics?.classificationReport, 'f1-score')
      };
      const transformedHistory = {
        train_loss: results.history?.loss || [],
        val_loss: results.history?.val_loss || [],
        train_acc: results.history?.accuracy || [],
        val_acc: results.history?.val_accuracy || []
      };

      return {
        success: true,
        jobId: job.id,
        metrics: transformedMetrics,
        history: transformedHistory,
        rawMetrics: results.metrics, 
        rawHistory: results.history
      };
    } catch (error) {
      console.error('Error getting training results:', error);
      throw error;
    }
  }

  calculateWeightedAverage(classificationReport, metric) {
    if (!classificationReport || !classificationReport['weighted avg']) {
      return 0;
    }
    return classificationReport['weighted avg'][metric] || 0;
  }

  async saveModel(jobId, { modelName, datasetName, datasetDescription }) {
    try {
      const job = await trainingJobDao.findById(jobId);
      if (!job) {
        throw new Error('Training job not found');
      }

      if (job.status !== 'completed') {
        throw new Error('Cannot save incomplete training');
      }
      const result = await mlApiClient.saveRetrainedModel(jobId.toString(), modelName);

      await trainingJobDao.update(jobId, { modelPath: result.modelPath });

      const trainingResults = await mlApiClient.getRetrainingResults(jobId.toString());

      return {
        success: true,
        modelPath: result.modelPath,
        message: 'Model saved successfully',
        model: {
          version: modelName,
          path: result.modelPath,
          accuracy: trainingResults.metrics?.testAccuracy || 0
        },
        dataset: {
          name: datasetName,
          description: datasetDescription
        }
      };
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  async getUserTrainingHistory(userId, limit = 10) {
    try {
      const jobs = await trainingJobDao.findByUserId(userId, { limit });
      return jobs;
    } catch (error) {
      console.error('Error getting training history:', error);
      throw error;
    }
  }
}

export default new RetrainService();

