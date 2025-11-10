import config from '../config/config.js';

class MLApiClient {
  /**
   * Predict email labels (MULTI-LABEL)
   * @param {Object} emailData 
   * @param {string} emailData.title 
   * @param {string} emailData.content 
   * @returns {Promise<Object>} - {labels: [{labelId, labelName, confidence}, ...]}
   */
  async predict(emailData) {
    try {
      const response = await fetch(`${config.pythonML.url}/api/v1/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.pythonML.apiKey
        },
        body: JSON.stringify({
          title: emailData.title,
          content: emailData.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `ML API request failed: ${response.status} - ${errorData.detail || 'Unknown error'}`
        );
      }

      const data = await response.json();
      
      // Multi-label response format
      // data.labels = [{label: "Công việc", confidence: 0.95}, ...]
      return {
        labels: data.labels || []
      };
      
    } catch (error) {
      console.error('ML API error:', error);
      
      return {
        labels: []
      };
    }
  }

  /**
   * @returns {Promise<boolean>} 
   */
  async healthCheck() {
    try {
      const response = await fetch(`${config.pythonML.url}/health`);
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.status === 'healthy' && data.model_loaded === true;
      
    } catch (error) {
      console.error('ML service health check failed:', error);
      return false;
    }
  }

  /**
   * @returns {Promise<Object>}
   */
  async getModelInfo() {
    try {
      const response = await fetch(`${config.pythonML.url}/api/v1/model/info`);

      if (!response.ok) {
        throw new Error('Failed to get model info');
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to get model info:', error);
      return null;
    }
  }

  /**
   * @param {Object} trainingRequest 
   * @returns {Promise<Object>} 
   */
  async startRetraining(trainingRequest) {
    try {
      console.log(' Starting retraining with config:', trainingRequest);

      const response = await fetch(`${config.pythonML.url}/api/v1/retrain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.pythonML.apiKey
        },
        body: JSON.stringify(trainingRequest)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        console.error('❌ ML API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(' Retraining started:', result);
      return result;
    } catch (error) {
      console.error('ML API startRetraining error:', error);
      if (error.cause) {
        throw new Error(`Cannot connect to ML service at ${config.pythonML.url}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * @param {string} jobId
   * @returns {Promise<Object>}
   */
  async getRetrainingStatus(jobId) {
    try {
      console.log(` Getting status for job: ${jobId}`);

      const response = await fetch(`${config.pythonML.url}/api/v1/retrain/status/${jobId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': config.pythonML.apiKey
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get training status');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ML API getRetrainingStatus error:', error);
      throw error;
    }
  }

  /**
   * @param {string} jobId 
   * @returns {Promise<Object>} 
   */
  async getRetrainingResults(jobId) {
    try {
      console.log(`Getting results for job: ${jobId}`);

      const response = await fetch(`${config.pythonML.url}/api/v1/retrain/results/${jobId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': config.pythonML.apiKey
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get training results');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ML API getRetrainingResults error:', error);
      throw error;
    }
  }

  /**
   * @param {string} jobId 
   * @param {string} modelName 
   * @returns {Promise<Object>}
   */
  async saveRetrainedModel(jobId, modelName) {
    try {
      console.log(`💾 Saving model for job: ${jobId} as ${modelName}`);

      const response = await fetch(`${config.pythonML.url}/api/v1/retrain/save/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.pythonML.apiKey
        },
        body: JSON.stringify({ modelName })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch (parseError) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        console.error('❌ ML API save error:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Model saved:', result);
      return result;
    } catch (error) {
      console.error('ML API saveRetrainedModel error:', error);
      throw error;
    }
  }
}

export default new MLApiClient();

