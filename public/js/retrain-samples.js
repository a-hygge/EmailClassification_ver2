let allSamples = [];
let selectedSampleIds = new Set();
let allLabels = [];
let allModels = [];
let selectedModel = null;
let existingDatasetEmailIds = [];

let pagination = {
  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 0
};

// ============ MODEL SELECTION ============

async function loadModels() {
  try {
    const response = await fetch('/retrain/models', {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.success) {
      allModels = data.models;
      populateModelSelect(data.models);
    } else {
      showError('Failed to load models');
    }
  } catch (error) {
    console.error('Error loading models:', error);
    showError('Error loading models: ' + error.message);
  }
}

function populateModelSelect(models) {
  const select = document.getElementById('modelSelect');
  if (!select) return;

  // Clear existing options except first one
  select.innerHTML = '<option value="">-- Chọn model --</option>';

  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = `${model.name} - v${model.version} (Accuracy: ${(model.accuracy * 100).toFixed(2)}%)`;
    select.appendChild(option);
  });
}

async function onModelSelected() {
  const select = document.getElementById('modelSelect');
  const modelId = select.value;

  if (!modelId) {
    selectedModel = null;
    document.getElementById('modelInfo').style.display = 'none';
    selectedSampleIds.clear();
    renderCurrentPage();
    updateSelectedCount();
    return;
  }

  try {
    const response = await fetch(`/retrain/model/${modelId}/info`, {
      credentials: 'include'
    });
    const data = await response.json();

    console.log('Model info response:', data); 

    if (data.success) {
      selectedModel = data.model;
      existingDatasetEmailIds = data.existingEmailIds || [];

      console.log('Selected model:', selectedModel); // Debug log
      console.log('Existing email IDs:', existingDatasetEmailIds); // Debug log

      // Hiển thị thông tin model
      displayModelInfo(data.model, data.datasets);

      // Tự động chọn các emails từ dataset cũ
      selectedSampleIds.clear();
      existingDatasetEmailIds.forEach(id => {
        console.log('Adding email ID to selection:', id); // Debug log
        selectedSampleIds.add(id);
      });

      console.log('Selected sample IDs:', Array.from(selectedSampleIds)); // Debug log

      // Reset về trang đầu tiên để hiển thị các emails đã chọn
      pagination.currentPage = 1;
      
      // Render lại table với các emails đã được chọn
      renderCurrentPage();
      updatePaginationControls();
      updateSelectedCount();
      
      // Hiển thị thông báo cho user
      if (existingDatasetEmailIds.length > 0) {
        showSuccess(`Đã tự động chọn ${existingDatasetEmailIds.length} email từ dataset của model này`);
      }
    } else {
      showError('Failed to load model info');
    }
  } catch (error) {
    console.error('Error loading model info:', error);
    showError('Error loading model info: ' + error.message);
  }
}

function displayModelInfo(model, datasets) {
  const modelInfo = document.getElementById('modelInfo');
  if (!modelInfo) return;

  document.getElementById('modelVersion').textContent = model.version || 'N/A';
  document.getElementById('modelAccuracy').textContent = model.accuracy ? (model.accuracy * 100).toFixed(2) : 'N/A';
  document.getElementById('modelPrecision').textContent = model.precision ? (model.precision * 100).toFixed(2) : 'N/A';
  document.getElementById('modelRecall').textContent = model.recall ? (model.recall * 100).toFixed(2) : 'N/A';
  document.getElementById('modelF1Score').textContent = model.f1Score ? (model.f1Score * 100).toFixed(2) : 'N/A';
  document.getElementById('modelCreated').textContent = model.createdAt ? new Date(model.createdAt).toLocaleString('vi-VN') : 'N/A';

  // Dataset info
  let datasetInfo = 'Chưa có dataset';
  if (datasets && datasets.length > 0) {
    const dataset = datasets[0];
    datasetInfo = `${dataset.name} (${dataset.quantity} emails)`;
  }
  document.getElementById('currentDatasetInfo').textContent = datasetInfo;

  modelInfo.style.display = 'block';
}

// ============ SAMPLES SELECTION ============

async function loadSamples() {
  try {
    showSamplesLoading();
    const response = await fetch('/retrain/samples', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      allSamples = data.samples;
      allLabels = data.labels;
      pagination.totalItems = allSamples.length;
      renderCurrentPage();
      populateLabelFilter(data.labels);
      updatePaginationControls();
    } else {
      showError('Failed to load samples');
    }
  } catch (error) {
    console.error('Error loading samples:', error);
    showError('Error loading samples: ' + error.message);
  } finally {
    hideSamplesLoading();
  }
}

function showSamplesLoading() {
  const loading = document.getElementById('samplesLoading');
  const table = document.getElementById('samplesTable');
  if (loading) loading.style.display = 'block';
  if (table) table.style.display = 'none';
}
function hideSamplesLoading() {
  const loading = document.getElementById('samplesLoading');
  const table = document.getElementById('samplesTable');
  if (loading) loading.style.display = 'none';
  if (table) table.style.display = 'table';
}
function renderSamples(samples) {
  const tbody = document.getElementById('samplesTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (samples.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">
          <i class="fas fa-inbox fs-1 mb-2"></i>
          <p>Không tìm thấy mẫu nào</p>
        </td>
      </tr>
    `;
    return;
  }
  
  samples.forEach(sample => {
    const row = document.createElement('tr');
    const isChecked = selectedSampleIds.has(sample.id);
    
    row.innerHTML = `
      <td>
        <input type="checkbox" class="form-check-input sample-checkbox" 
               value="${sample.id}" 
               ${isChecked ? 'checked' : ''}>
      </td>
      <td>${sample.id}</td>
      <td>
        <strong>${escapeHtml(sample.title)}</strong><br>
        <small class="text-muted">${escapeHtml(sample.content)}</small>
      </td>
      <td>
        <span class="badge bg-primary">${escapeHtml(sample.labelName)}</span>
      </td>
    `;
    tbody.appendChild(row);
  });
  document.querySelectorAll('.sample-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });
  updateSelectAllCheckboxState();
  
  updateSelectedCount();
}
function handleCheckboxChange(event) {
  const sampleId = parseInt(event.target.value);
  if (event.target.checked) {
    selectedSampleIds.add(sampleId);
  } else {
    selectedSampleIds.delete(sampleId);
  }
  updateSelectedCount();
  updateSelectAllCheckboxState();
}
function selectAllSamples() {
  allSamples.forEach(sample => {
    selectedSampleIds.add(sample.id);
  });
  const checkboxes = document.querySelectorAll('.sample-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  
  updateSelectedCount();
  updateSelectAllCheckboxState();
}
function deselectAllSamples() {
  selectedSampleIds.clear();
  document.querySelectorAll('.sample-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  updateSelectedCount();
  updateSelectAllCheckboxState();
}
function updateSelectedCount() {
  const count = selectedSampleIds.size;
  const countElement = document.getElementById('selectedCount');
  if (countElement) {
    countElement.textContent = count;
  }
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.disabled = count < 10;
  }
}
function updateSelectAllCheckboxState() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (!selectAllCheckbox) return;
  const allSelected = selectedSampleIds.size === allSamples.length;
  selectAllCheckbox.checked = allSelected;
  selectAllCheckbox.indeterminate = selectedSampleIds.size > 0 && selectedSampleIds.size < allSamples.length;
}
function populateLabelFilter(labels) {
  const filterSelect = document.getElementById('labelFilter');
  if (!filterSelect) return;
  filterSelect.innerHTML = '<option value="all">Tất cả nhãn</option>';
  
  labels.forEach(label => {
    const option = document.createElement('option');
    option.value = label.id;
    option.textContent = label.name;
    filterSelect.appendChild(option);
  });
  filterSelect.addEventListener('change', (e) => {
    filterByLabel(e.target.value);
  });
}
function filterByLabel(labelId) {
  if (labelId === 'all') {
    renderSamples(allSamples);
  } else {
    const filtered = allSamples.filter(s => s.tblLabelId === parseInt(labelId));
    renderSamples(filtered);
  }
}

function searchSamples(query) {
  const lowerQuery = query.toLowerCase();
  const filtered = allSamples.filter(s => 
    s.title.toLowerCase().includes(lowerQuery) ||
    s.content.toLowerCase().includes(lowerQuery)
  );
  renderSamples(filtered);
}

function renderCurrentPage() {
  const startIdx = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIdx = startIdx + pagination.itemsPerPage;
  const currentSamples = allSamples.slice(startIdx, endIdx);
  
  renderSamples(currentSamples);
  updatePageInfo();
}

function updatePageInfo() {
  const pageInfo = document.getElementById('pageInfo');
  if (!pageInfo) return;
  
  const startIdx = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  const endIdx = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
  
  pageInfo.textContent = `Hiển thị ${startIdx} - ${endIdx} trên ${pagination.totalItems} mẫu`;
}

function updatePaginationControls() {
  const paginationControls = document.getElementById('paginationControls');
  if (!paginationControls) return;
  
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  paginationControls.innerHTML = '';
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Trước</a>`;
  paginationControls.appendChild(prevLi);
  const maxVisiblePages = 5;
  let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  if (startPage > 1) {
    const firstLi = document.createElement('li');
    firstLi.className = 'page-item';
    firstLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
    paginationControls.appendChild(firstLi);
    
    if (startPage > 2) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      ellipsisLi.innerHTML = `<a class="page-link" href="#">...</a>`;
      paginationControls.appendChild(ellipsisLi);
    }
  }
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item ${i === pagination.currentPage ? 'active' : ''}`;
    pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
    paginationControls.appendChild(pageLi);
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      ellipsisLi.innerHTML = `<a class="page-link" href="#">...</a>`;
      paginationControls.appendChild(ellipsisLi);
    }
    
    const lastLi = document.createElement('li');
    lastLi.className = 'page-item';
    lastLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
    paginationControls.appendChild(lastLi);
  }
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${pagination.currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Sau</a>`;
  paginationControls.appendChild(nextLi);
  paginationControls.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (page && page !== pagination.currentPage) {
        goToPage(page);
      }
    });
  });
}
function goToPage(page) {
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  if (page < 1 || page > totalPages) return;
  
  pagination.currentPage = page;
  renderCurrentPage();
  updatePaginationControls();
  document.getElementById('samplesTable')?.scrollIntoView({ behavior: 'smooth' });
}

function continueToConfig() {
  if (!selectedModel) {
    alert('Vui lòng chọn model để retrain');
    return;
  }

  if (selectedSampleIds.size < 10) {
    alert('Vui lòng chọn ít nhất 10 mẫu để tiếp tục');
    return;
  }

  // Lưu thông tin vào sessionStorage
  sessionStorage.setItem('selectedSamples', JSON.stringify([...selectedSampleIds]));
  sessionStorage.setItem('selectedModelId', selectedModel.id);
  sessionStorage.setItem('isRetrain', 'true'); // Flag để biết đây là retrain

  window.location.href = '/retrain/config';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  alert(message);
}

function showSuccess(message) {
  // Tạo toast notification hoặc alert
  const toastContainer = document.getElementById('toastContainer');
  if (toastContainer) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 show';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-check-circle me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  } else {
    // Fallback to alert if no toast container
    alert(message);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('/retrain')) {
    // Load models và samples
    loadModels();
    loadSamples();

    const searchInput = document.getElementById('searchSamples');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchSamples(e.target.value);
      });
    }
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectAllSamples();
        } else {
          deselectAllSamples();
        }
      });
    }
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
      itemsPerPageSelect.addEventListener('change', (e) => {
        pagination.itemsPerPage = parseInt(e.target.value);
        pagination.currentPage = 1; 
        renderCurrentPage();
        updatePaginationControls();
      });
    }
  }
});

