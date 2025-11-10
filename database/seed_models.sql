-- ============================================
-- Seed Data for ML Models
-- ============================================
-- This script populates tblModel table with multi-label models
-- Phù hợp với schema mới (4 modules)
-- ============================================

-- Clear existing data (optional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tblTrainingJob;
TRUNCATE TABLE tblModel;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- INSERT MODELS (Multi-label metrics)
-- ============================================

INSERT INTO tblModel (path, version, accuracy, `precision`, recall, F1Score, hammingLoss, f1Macro, f1Micro, isActive, tblDatasetId) VALUES
('ml_models/email_cnn_model.h5', 'v1.0.0', 0.8700, 0.8500, 0.8400, 0.8450, 0.1200, 0.8300, 0.8500, 1, 1),
('ml_models/email_rnn_model.h5', 'v1.0.0', 0.8200, 0.8000, 0.7900, 0.7950, 0.1500, 0.7800, 0.8000, 0, 1),
('ml_models/email_lstm_model.h5', 'v1.0.0', 0.8900, 0.8700, 0.8600, 0.8650, 0.1000, 0.8500, 0.8700, 0, 1),
('ml_models/email_bilstm_model.h5', 'v1.1.0', 0.9100, 0.8900, 0.8800, 0.8850, 0.0850, 0.8700, 0.8900, 0, 1),
('ml_models/email_bilstm_cnn_model.h5', 'v1.2.0', 0.9300, 0.9100, 0.9000, 0.9050, 0.0700, 0.8900, 0.9100, 0, 1);

-- ============================================
-- VERIFY DATA
-- ============================================

SELECT 
    id,
    path,
    version,
    accuracy,
    `precision`,
    recall,
    F1Score,
    hammingLoss,
    f1Macro,
    f1Micro,
    isActive,
    tblDatasetId,
    created_at
FROM tblModel
ORDER BY id;

SELECT 
    'Total Models' AS 'Metric',
    COUNT(*) AS 'Count'
FROM tblModel
UNION ALL
SELECT 
    'Active Models' AS 'Metric',
    COUNT(*) AS 'Count'
FROM tblModel
WHERE isActive = 1;