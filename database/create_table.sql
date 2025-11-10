-- =============================================
-- DATABASE SCHEMA - EMAIL CLASSIFICATION SYSTEM
-- =============================================
-- Thiết kế 4 modules: User & Email | Ground Truth | Training | Prediction
-- =============================================

-- =============================================
-- MODULE 1: QUẢN LÝ USER & EMAIL (3 bảng)
-- =============================================

-- 1. BẢNG NGƯỜI DÙNG
CREATE TABLE IF NOT EXISTS tblUser (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG EMAIL SAMPLES
-- Chứa TẤT CẢ emails (cả training samples và emails cần phân loại)
CREATE TABLE IF NOT EXISTS tblEmailSample (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(5000) NOT NULL,
    sender VARCHAR(255),
    receiver VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG NHÃN PHÂN LOẠI
CREATE TABLE IF NOT EXISTS tblLabel (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- MODULE 2: GROUND TRUTH - NHÃN THỰC (1 bảng)
-- =============================================

-- 4. BẢNG NHÃN THỰC (Ground Truth Labels)
-- Nhãn được gán bởi con người cho mục đích training

CREATE TABLE IF NOT EXISTS tblEmailLabel (
    tblEmailSampleId INT(10) NOT NULL,
    tblLabelId INT(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tblEmailSampleId, tblLabelId),
    FOREIGN KEY (tblEmailSampleId) REFERENCES tblEmailSample(id) ON DELETE CASCADE,
    FOREIGN KEY (tblLabelId) REFERENCES tblLabel(id) ON DELETE CASCADE
);

-- =============================================
-- MODULE 3: TRAINING (4 bảng)
-- =============================================

-- 5. BẢNG DATASETS
CREATE TABLE IF NOT EXISTS tblDataset (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(255),
    description VARCHAR(500),
    quantity INT(10) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BẢNG LIÊN KẾT DATASET - EMAIL
CREATE TABLE IF NOT EXISTS tblDatasetEmail (
    tblDatasetId INT(10) NOT NULL,
    tblEmailSampleId INT(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tblDatasetId, tblEmailSampleId),
    FOREIGN KEY (tblDatasetId) REFERENCES tblDataset(id) ON DELETE CASCADE,
    FOREIGN KEY (tblEmailSampleId) REFERENCES tblEmailSample(id) ON DELETE CASCADE
);

-- 7. BẢNG MODELS
CREATE TABLE IF NOT EXISTS tblModel (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5,4),
    `precision` DECIMAL(5,4),
    recall DECIMAL(5,4),
    F1Score DECIMAL(5,4),
    hammingLoss DECIMAL(5,4),
    f1Macro DECIMAL(5,4),
    f1Micro DECIMAL(5,4),
    isActive BIT DEFAULT 0,
    tblDatasetId INT(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tblDatasetId) REFERENCES tblDataset(id) ON DELETE SET NULL
);

-- 8. BẢNG TRAINING JOBS
CREATE TABLE IF NOT EXISTS tblTrainingJob (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    modelType VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    hyperparameters TEXT,
    result TEXT,
    tblUserId INT(10) NOT NULL,
    tblModelId INT(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tblUserId) REFERENCES tblUser(id) ON DELETE CASCADE,
    FOREIGN KEY (tblModelId) REFERENCES tblModel(id) ON DELETE SET NULL
);

-- =============================================
-- MODULE 4: PREDICTION - AI TỰ ĐỘNG PHÂN LOẠI (2 bảng)
-- =============================================

-- 9. BẢNG PREDICTION (Lịch sử phân loại)
-- Mỗi lần gọi API classify tạo 1 record
CREATE TABLE IF NOT EXISTS tblPrediction (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    tblEmailSampleId INT(10) NOT NULL,
    tblModelId INT(10) NOT NULL,
    avgConfidence DECIMAL(4,3),  -- Độ tin cậy trung bình của tất cả labels
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tblEmailSampleId) REFERENCES tblEmailSample(id) ON DELETE CASCADE,
    FOREIGN KEY (tblModelId) REFERENCES tblModel(id) ON DELETE SET NULL
);

-- 10. BẢNG KẾT QUẢ PHÂN LOẠI CHI TIẾT
-- Lưu từng nhãn được AI predict + confidence
CREATE TABLE IF NOT EXISTS tblPredictionLabel (
    tblPredictionId INT(10) NOT NULL,
    tblLabelId INT(10) NOT NULL,
    confidence DECIMAL(4,3) NOT NULL,  -- Độ tin cậy của nhãn này (0-1)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tblPredictionId, tblLabelId),
    FOREIGN KEY (tblPredictionId) REFERENCES tblPrediction(id) ON DELETE CASCADE,
    FOREIGN KEY (tblLabelId) REFERENCES tblLabel(id) ON DELETE CASCADE
);

-- =============================================
-- INDEXES ĐỂ TỐI ƯU PERFORMANCE
-- =============================================

CREATE INDEX idx_email_sample_title ON tblEmailSample(title);
CREATE INDEX idx_label_name ON tblLabel(name);
CREATE INDEX idx_dataset_name ON tblDataset(name);
CREATE INDEX idx_model_active ON tblModel(isActive);
CREATE INDEX idx_model_dataset ON tblModel(tblDatasetId);
CREATE INDEX idx_training_job_status ON tblTrainingJob(status);
CREATE INDEX idx_training_job_user ON tblTrainingJob(tblUserId);
CREATE INDEX idx_prediction_email ON tblPrediction(tblEmailSampleId);
CREATE INDEX idx_prediction_model ON tblPrediction(tblModelId);
CREATE INDEX idx_prediction_label_confidence ON tblPredictionLabel(confidence);
