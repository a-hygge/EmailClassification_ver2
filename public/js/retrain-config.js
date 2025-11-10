let currentJobId = null;
let pollingInterval = null;
let isRetrain = false;
let selectedModelId = null;
let allDatasets = [];
let allModels = [];

function backToSamples() {
  window.location.href = '/retrain';
}

function validateConfiguration() {
  const learningRate = parseFloat(document.getElementById('learningRate').value);
  const epochs = parseInt(document.getElementById('epochs').value);
  const batchSize = parseInt(document.getElementById('batchSize').value);
  const randomState = parseInt(document.getElementById('randomState').value);
  
  if (isNaN(learningRate) || learningRate <= 0 || learningRate > 1) {
    alert('Learning rate phải nằm trong khoảng 0 đến 1');
    return false;
  }
  
  if (isNaN(epochs) || epochs < 1 || epochs > 100) {
    alert('Epochs phải nằm trong khoảng 1 đến 100');
    return false;
  }
  
  if (isNaN(batchSize) || batchSize < 1 || batchSize > 256) {
    alert('Batch size phải nằm trong khoảng 1 đến 256');
    return false;
  }
  
  if (isNaN(randomState) || randomState < 0) {
    alert('Random state phải là số không âm');
    return false;
  }
  
  return true;
}

function getConfiguration() {
  const selectedSamples = JSON.parse(sessionStorage.getItem('selectedSamples') || '[]');

  let modelId;

  if (isRetrain) {
    modelId = selectedModelId;
  } else {
    const modelSelect = document.getElementById('modelType');
    modelId = parseInt(modelSelect.value);
  }

  console.log('✅ Getting configuration:', {
    isRetrain,
    modelId,
    selectedSamplesCount: selectedSamples.length
  });

  return {
    modelId: modelId,
    sampleIds: selectedSamples,
    hyperparameters: {
      learning_rate: parseFloat(document.getElementById('learningRate').value),
      epochs: parseInt(document.getElementById('epochs').value),
      batch_size: parseInt(document.getElementById('batchSize').value),
      random_state: parseInt(document.getElementById('randomState').value)
    }
  };
}

async function startRetraining() {
  try {
    if (!validateConfiguration()) {
      return;
    }
    
    const config = getConfiguration();
    
    if (!config.modelId || isNaN(config.modelId)) {
      alert('Vui lòng chọn mô hình để huấn luyện');
      return;
    }
    if (!config.sampleIds || config.sampleIds.length < 10) {
      alert('Vui lòng chọn ít nhất 10 mẫu trước khi bắt đầu huấn luyện');
      backToSamples();
      return;
    }

    console.log(' Starting training with config:', config);
    
    const retrainBtn = document.getElementById('retrainBtn');
    if (retrainBtn) {
      retrainBtn.disabled = true;
      retrainBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang khởi tạo...';
    }
    
    // Chọn endpoint phù hợp
    const endpoint = isRetrain ? '/retrain/model/start' : '/retrain/start';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(config)
    });

    const result = await response.json();

    if (result.success) {
      currentJobId = result.jobId;

      // Lưu modelId nếu là retrain để dùng khi save
      if (isRetrain && result.modelId) {
        sessionStorage.setItem('retrainModelId', result.modelId);
      }

      window.location.href = `/retrain/results?jobId=${currentJobId}`;
    } else {
      alert('Lỗi khi bắt đầu huấn luyện: ' + result.error);
      
      if (retrainBtn) {
        retrainBtn.disabled = false;
        retrainBtn.innerHTML = '<i class="fas fa-play me-2"></i>Bắt đầu huấn luyện';
      }
    }
  } catch (error) {
    console.error('Error starting training:', error);
    alert('Lỗi khi bắt đầu huấn luyện: ' + error.message);

    const retrainBtn = document.getElementById('retrainBtn');
    if (retrainBtn) {
      retrainBtn.disabled = false;
      retrainBtn.innerHTML = '<i class="fas fa-play me-2"></i>Bắt đầu huấn luyện';
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {

  if (window.location.pathname.includes('/retrain/config')) {
    const selectedSamples = JSON.parse(sessionStorage.getItem('selectedSamples') || '[]');
    const countElement = document.getElementById('selectedSamplesCount');
    if (countElement) {
      countElement.textContent = selectedSamples.length;
    }

    // Kiểm tra xem có phải retrain không
    isRetrain = sessionStorage.getItem('isRetrain') === 'true';
    selectedModelId = sessionStorage.getItem('selectedModelId');

    if (isRetrain && selectedModelId) {
      // Hiển thị thông tin model đã chọn
      loadRetrainModelInfo(selectedModelId);
    } else {
      // Load danh sách models để chọn
      loadModelsForConfig();
    }
  }
});

async function loadRetrainModelInfo(modelId) {
  try {
    const response = await fetch(`/retrain/model/${modelId}/info`, {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.success && data.model) {
      const model = data.model;

      // Ẩn phần chọn model mới, hiển thị thông tin model retrain
      document.getElementById('newModelSelect').style.display = 'none';
      document.getElementById('retrainModelInfo').style.display = 'block';

      // Điền thông tin
      document.getElementById('retrainModelVersion').textContent = model.version || 'N/A';
      document.getElementById('retrainModelType').textContent = model.version || 'N/A';
      document.getElementById('retrainModelAccuracy').textContent = model.accuracy ? (model.accuracy * 100).toFixed(2) : 'N/A';
    }
  } catch (error) {
    console.error('Error loading retrain model info:', error);
  }
}

async function loadModelsForConfig() {
  try {
    const response = await fetch('/retrain/models', {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.success && data.models) {
      allModels = data.models;
      populateModelSelect(data.models);
      
      // Load datasets
      await loadDatasets();
    }
  } catch (error) {
    console.error('Error loading models:', error);
  }
}

async function loadDatasets() {
  try {
    const response = await fetch('/retrain/datasets', {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.success && data.datasets) {
      allDatasets = data.datasets;
      console.log('Loaded datasets:', allDatasets);
    }
  } catch (error) {
    console.error('Error loading datasets:', error);
  }
}

function populateModelSelect(models) {
  const modelSelect = document.getElementById('modelType');
  if (!modelSelect) return;
  modelSelect.innerHTML = '<option value="">Chọn mô hình...</option>';

  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    
    // Lưu dataset ID vào data attribute
    if (model.dataset && model.dataset.id) {
      option.setAttribute('data-dataset-id', model.dataset.id);
    }
    
    option.textContent = model.name;

    if (model.accuracy) {
      option.textContent += ` (Accuracy: ${(model.accuracy * 100).toFixed(2)}%)`;
    }

    modelSelect.appendChild(option);
  });
  
  // Thêm event listener để tự động chọn dataset khi chọn model
  modelSelect.addEventListener('change', onModelSelectChanged);
}

function onModelSelectChanged(e) {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const datasetId = selectedOption.getAttribute('data-dataset-id');
  
  if (datasetId) {
    console.log('Model has dataset:', datasetId);
    // Hiển thị thông tin dataset được chọn
    displaySelectedDataset(parseInt(datasetId));
  }
}

function displaySelectedDataset(datasetId) {
  const dataset = allDatasets.find(d => d.id === datasetId);
  
  if (dataset) {
    console.log('Selected dataset:', dataset);
    
    // Hiển thị thông tin dataset (có thể thêm UI element để hiển thị)
    const datasetInfoDiv = document.getElementById('datasetInfo');
    if (datasetInfoDiv) {
      datasetInfoDiv.innerHTML = `
        <div class="alert alert-success">
          <h6 class="alert-heading"><i class="fas fa-database me-2"></i>Dataset đã chọn tự động</h6>
          <p class="mb-1"><strong>Tên:</strong> ${dataset.name}</p>
          <p class="mb-1"><strong>Mô tả:</strong> ${dataset.description || 'N/A'}</p>
          <p class="mb-0"><strong>Số lượng emails:</strong> ${dataset.quantity}</p>
        </div>
      `;
      datasetInfoDiv.style.display = 'block';
    }
  }
}

