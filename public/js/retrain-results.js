let lossChart = null;
let accuracyChart = null;

async function loadTrainingResults(jobId) {
  try {
    console.log(' Loading training results for job:', jobId);

    const response = await fetch(`/retrain/results/${jobId}`, {
      credentials: 'include'
    });
    const result = await response.json();

    console.log(' Results received:', result);

    if (result.success) {
      const loading = document.getElementById('trainingLoading');
      const content = document.getElementById('resultsContent');

      if (loading) loading.style.display = 'none';
      if (content) content.style.display = 'block';

      console.log(' Metrics:', result.metrics);
      console.log(' History:', result.history);

      displayMetrics(result.metrics);

      renderCharts(result.history);
    } else {
      console.error(' Failed to load results:', result.error);
      alert('Lỗi khi tải kết quả: ' + result.error);
    }
  } catch (error) {
    console.error(' Error loading results:', error);
    alert('Lỗi khi tải kết quả: ' + error.message);
  }
}
function displayMetrics(metrics) {
  if (!metrics) {
    console.error('Metrics is undefined');
    return;
  }

  const accuracyEl = document.getElementById('metricAccuracy');
  const precisionEl = document.getElementById('metricPrecision');
  const recallEl = document.getElementById('metricRecall');
  const f1El = document.getElementById('metricF1');

  if (accuracyEl) accuracyEl.textContent = ((metrics.accuracy || 0) * 100).toFixed(2) + '%';
  if (precisionEl) precisionEl.textContent = ((metrics.precision || 0) * 100).toFixed(2) + '%';
  if (recallEl) recallEl.textContent = ((metrics.recall || 0) * 100).toFixed(2) + '%';
  if (f1El) f1El.textContent = ((metrics.f1 || 0) * 100).toFixed(2) + '%';
}

function renderCharts(history) {
  if (!history) {
    console.error('History is undefined');
    return;
  }

  renderLossChart(history.train_loss || [], history.val_loss || []);
  renderAccuracyChart(history.train_acc || [], history.val_acc || []);
}

function renderLossChart(trainLoss, valLoss) {
  const ctx = document.getElementById('lossChart');
  if (!ctx) return;
  if (!trainLoss || !Array.isArray(trainLoss) || trainLoss.length === 0) {
    console.error('Invalid trainLoss data');
    return;
  }
  if (lossChart) {
    lossChart.destroy();
  }

  const epochs = trainLoss.map((_, i) => `Epoch ${i + 1}`);
  
  lossChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: epochs,
      datasets: [
        {
          label: 'Train Loss',
          data: trainLoss,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4
        },
        {
          label: 'Validation Loss',
          data: valLoss,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Loss'
          }
        }
      }
    }
  });
}

function renderAccuracyChart(trainAcc, valAcc) {
  const ctx = document.getElementById('accuracyChart');
  if (!ctx) return;

  if (!trainAcc || !Array.isArray(trainAcc) || trainAcc.length === 0) {
    console.error('Invalid trainAcc data');
    return;
  }

  if (accuracyChart) {
    accuracyChart.destroy();
  }

  const epochs = trainAcc.map((_, i) => `Epoch ${i + 1}`);
  
  accuracyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: epochs,
      datasets: [
        {
          label: 'Train Accuracy',
          data: trainAcc,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4
        },
        {
          label: 'Validation Accuracy',
          data: valAcc,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          title: {
            display: true,
            text: 'Accuracy'
          },
          ticks: {
            callback: function(value) {
              return (value * 100).toFixed(0) + '%';
            }
          }
        }
      }
    }
  });
}

async function saveTrainedModel() {
  if (!currentJobId) {
    alert('Không tìm thấy job ID');
    return;
  }

  // Kiểm tra xem có phải retrain không
  const isRetrain = sessionStorage.getItem('isRetrain') === 'true';
  const retrainModelId = sessionStorage.getItem('retrainModelId');
  const selectedSamples = JSON.parse(sessionStorage.getItem('selectedSamples') || '[]');
  
  try {
    const saveBtn = document.getElementById('saveModelBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang lưu...';
    }

    let response, result;

    if (isRetrain && retrainModelId) {
      // Ghi đè model cũ
      response = await fetch(`/retrain/model/save/${currentJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          modelId: parseInt(retrainModelId),
          sampleIds: selectedSamples
        })
      });

      result = await response.json();

      if (result.success) {
        alert(
          '✅ Ghi đè model thành công!\n\n' +
          '📦 Model: ' + result.model.version + '\n' +
          '   - Path: ' + result.model.path + '\n' +
          '   - Accuracy: ' + (result.model.accuracy * 100).toFixed(2) + '%'
        );
      }
    } else {
      // Tạo model mới
      const modelName = prompt('Nhập tên version cho model (ví dụ: 2.0.0):', `v${Date.now()}`);
      if (!modelName) {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Lưu mô hình';
        }
        return;
      }

      const datasetName = prompt('Nhập tên cho dataset:', `dataset_${new Date().toISOString().split('T')[0]}`);
      if (!datasetName) {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Lưu mô hình';
        }
        return;
      }

      const datasetDescription = prompt('Nhập mô tả cho dataset (optional):', 'Training dataset for email classification');

      response = await fetch(`/retrain/save/${currentJobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          modelName,
          datasetName,
          datasetDescription: datasetDescription || 'Training dataset'
        })
      });

      result = await response.json();

      if (result.success) {
        alert(
          '✅ Lưu thành công!\n\n' +
          '📦 Model: ' + result.model.version + '\n' +
          '   - Path: ' + result.model.path + '\n' +
          '   - Accuracy: ' + (result.model.accuracy * 100).toFixed(2) + '%\n\n' +
          '📊 Dataset: ' + result.dataset.name + '\n' +
          '   - Samples: ' + result.dataset.quantity + ' emails\n' +
          '   - Description: ' + result.dataset.description
        );
      }
    }

    if (result.success) {
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-check me-2"></i>Đã lưu thành công';
        saveBtn.classList.remove('btn-success');
        saveBtn.classList.add('btn-secondary');
      }

      // Clear session storage
      sessionStorage.removeItem('selectedSamples');
      sessionStorage.removeItem('selectedModelId');
      sessionStorage.removeItem('isRetrain');
      sessionStorage.removeItem('retrainModelId');

      setTimeout(() => {
        if (confirm('Bạn có muốn quay lại Dashboard?')) {
          window.location.href = '/dashboard';
        }
      }, 1000);
    } else {
      alert(' Lỗi khi lưu: ' + result.error);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Lưu mô hình';
      }
    }
  } catch (error) {
    console.error('Error saving model:', error);
    alert(' Lỗi khi lưu: ' + error.message);

    const saveBtn = document.getElementById('saveModelBtn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Lưu mô hình';
    }
  }
}

function trainAgain() {
  // Clear all session storage
  sessionStorage.removeItem('selectedSamples');
  sessionStorage.removeItem('selectedModelId');
  sessionStorage.removeItem('isRetrain');
  sessionStorage.removeItem('retrainModelId');
  window.location.href = '/retrain';
}

let pollingInterval = null;

function startPollingStatus(jobId) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  pollingInterval = setInterval(async () => {
    await checkTrainingStatus(jobId);
  }, 2000);
  checkTrainingStatus(jobId);
}

let epochHistory = [];
let currentEpochRow = null;

async function checkTrainingStatus(jobId) {
  try {
    const response = await fetch(`/retrain/status/${jobId}`, {
      credentials: 'include'
    });
    const status = await response.json();

    console.log('📊 Status received:', status);

    if (status.success) {
      console.log('📈 Progress data:', status.progress);
      updateProgressTable(status.progress);
      
      if (status.status === 'completed') {
        clearInterval(pollingInterval);
        pollingInterval = null;
        updateStatusMessage('Training completed successfully!', 'success');
        await loadTrainingResults(jobId);
      } else if (status.status === 'failed') {
        clearInterval(pollingInterval);
        pollingInterval = null;
        updateStatusMessage('Training failed!', 'danger');
        alert('Huấn luyện thất bại. Vui lòng thử lại.');
        window.location.href = '/retrain';
      } else {
        const currentEpoch = status.progress?.currentEpoch || 0;
        const totalEpochs = status.progress?.totalEpochs || 0;
        const currentBatch = status.progress?.currentBatch || 0;
        const totalBatches = status.progress?.totalBatches || 0;
        
        if (currentBatch > 0 && totalBatches > 0) {
          updateStatusMessage(
            `Training in progress - Epoch ${currentEpoch}/${totalEpochs} (Batch ${currentBatch}/${totalBatches})`,
            'info'
          );
        } else {
          updateStatusMessage(
            `Training in progress - Epoch ${currentEpoch}/${totalEpochs}`,
            'info'
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking training status:', error);
  }
}

function updateProgressTable(progress) {
  console.log('🔄 updateProgressTable called with:', progress);
  
  if (!progress) {
    console.warn('⚠️ No progress data');
    return;
  }
  
  const tableBody = document.getElementById('trainingProgressTable');
  if (!tableBody) {
    console.error('❌ Table body not found');
    return;
  }
  
  const currentEpoch = progress.currentEpoch;
  const totalEpochs = progress.totalEpochs;
  
  console.log(`📝 Epoch: ${currentEpoch}/${totalEpochs}`);
  
  if (!currentEpoch || !totalEpochs) {
    console.warn('⚠️ Missing epoch data');
    return;
  }
  
  const hasValMetrics = progress.valLoss !== undefined && progress.valLoss !== null && progress.valLoss > 0;
  
  console.log(`✓ Has validation metrics: ${hasValMetrics}`, {
    valLoss: progress.valLoss,
    valAccuracy: progress.valAccuracy
  });
  
  if (hasValMetrics) {
    // Tìm row hiện tại của epoch này
    let rowToUpdate = tableBody.querySelector(`tr[data-epoch="${currentEpoch}"]`);
    
    const trainAccPercent = ((progress.currentAccuracy || 0) * 100).toFixed(2);
    const valAccPercent = ((progress.valAccuracy || 0) * 100).toFixed(2);
    
    if (rowToUpdate) {
      // Cập nhật row đã tồn tại với validation metrics
      console.log(`🔄 Updating existing row for Epoch ${currentEpoch} with validation data`);
      
      rowToUpdate.className = 'epoch-completed';
      rowToUpdate.innerHTML = `
        <td><strong>${currentEpoch} / ${totalEpochs}</strong></td>
        <td class="${getMetricClass(progress.currentLoss, 'loss')}">${(progress.currentLoss || 0).toFixed(4)}</td>
        <td class="${getMetricClass(progress.valLoss, 'loss')}">${(progress.valLoss || 0).toFixed(4)}</td>
        <td class="${getMetricClass(progress.currentAccuracy, 'acc')}">${trainAccPercent}%</td>
        <td class="${getMetricClass(progress.valAccuracy, 'acc')}">${valAccPercent}%</td>
      `;
      
      console.log(`✅ Epoch ${currentEpoch} updated with Val Loss: ${progress.valLoss}, Val Acc: ${valAccPercent}%`);
    } else {
      // Tạo row mới nếu chưa tồn tại (trường hợp đặc biệt)
      console.log(`➕ Creating new completed row for Epoch ${currentEpoch}`);
      
      const row = document.createElement('tr');
      row.className = 'epoch-completed';
      row.dataset.epoch = currentEpoch;
      
      row.innerHTML = `
        <td><strong>${currentEpoch} / ${totalEpochs}</strong></td>
        <td class="${getMetricClass(progress.currentLoss, 'loss')}">${(progress.currentLoss || 0).toFixed(4)}</td>
        <td class="${getMetricClass(progress.valLoss, 'loss')}">${(progress.valLoss || 0).toFixed(4)}</td>
        <td class="${getMetricClass(progress.currentAccuracy, 'acc')}">${trainAccPercent}%</td>
        <td class="${getMetricClass(progress.valAccuracy, 'acc')}">${valAccPercent}%</td>
      `;
      
      tableBody.appendChild(row);
      
      const table = tableBody.closest('.table-responsive');
      if (table) {
        setTimeout(() => {
          table.scrollTop = table.scrollHeight;
        }, 100);
      }
    }
    
    // Lưu vào history nếu chưa có
    const existingEpoch = epochHistory.find(e => e.epoch === currentEpoch);
    if (!existingEpoch) {
      epochHistory.push({
        epoch: currentEpoch,
        trainLoss: progress.currentLoss,
        valLoss: progress.valLoss,
        trainAcc: progress.currentAccuracy,
        valAcc: progress.valAccuracy
      });
    }
  } else {
    let rowToUpdate = tableBody.querySelector(`tr[data-epoch="${currentEpoch}"]`);
    
    if (!rowToUpdate) {
      const firstLoad = tableBody.querySelector('td[colspan="5"]');
      if (firstLoad) {
        tableBody.innerHTML = '';
      }
      
      rowToUpdate = document.createElement('tr');
      rowToUpdate.dataset.epoch = currentEpoch;
      rowToUpdate.className = 'training-in-progress';
      tableBody.appendChild(rowToUpdate);
    }
    
    const trainAccPercent = ((progress.currentAccuracy || 0) * 100).toFixed(2);
    
    rowToUpdate.innerHTML = `
      <td><strong>${currentEpoch} / ${totalEpochs}</strong></td>
      <td class="${getMetricClass(progress.currentLoss, 'loss')}">${(progress.currentLoss || 0).toFixed(4)}</td>
      <td class="text-muted"><i class="fas fa-spinner fa-spin"></i></td>
      <td class="${getMetricClass(progress.currentAccuracy, 'acc')}">${trainAccPercent}%</td>
      <td class="text-muted"><i class="fas fa-spinner fa-spin"></i></td>
    `;
  }
}

function getMetricClass(value, type) {
  if (value === undefined || value === null) return '';
  
  if (type === 'loss') {
    if (value < 0.3) return 'metric-good';
    if (value < 1.0) return 'metric-warning';
    return 'metric-danger';
  } else if (type === 'acc') {
    if (value > 0.85) return 'metric-good';
    if (value > 0.70) return 'metric-warning';
    return 'metric-danger';
  }
  
  return '';
}

function updateStatusMessage(message, type) {
  const alert = document.getElementById('trainingStatusAlert');
  const messageSpan = document.getElementById('statusMessage');
  
  if (alert && messageSpan) {
    alert.className = `alert alert-${type} d-flex align-items-center mb-4`;
    messageSpan.textContent = message;
  }
}

function updateProgressBar(progress, currentEpoch, totalEpochs) {
  const progressBar = document.getElementById('trainingProgress');
  const progressText = document.getElementById('progressText');
  const epochText = document.getElementById('epochText');

  if (progressBar) {
    progressBar.style.width = progress + '%';
  }

  if (progressText) {
    progressText.textContent = Math.round(progress) + '%';
  }

  if (epochText) {
    epochText.textContent = `Epoch ${currentEpoch}/${totalEpochs}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('/retrain/results')) {
    if (window.currentJobId) {
      currentJobId = window.currentJobId;
      const loading = document.getElementById('trainingLoading');
      const content = document.getElementById('resultsContent');
      if (loading) loading.style.display = 'block';
      if (content) content.style.display = 'none';
      startPollingStatus(currentJobId);
    } else {
      alert('Không tìm thấy job ID. Vui lòng bắt đầu lại.');
      window.location.href = '/retrain';
    }
  }
});

