-- ============================================
-- Seed Data for Datasets
-- ============================================
-- This script populates tblDataset table
-- Phù hợp với schema mới (4 modules)
-- ============================================

-- Clear existing data (optional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tblDatasetEmail;
TRUNCATE TABLE tblDataset;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- INSERT DATASETS
-- ============================================

INSERT INTO tblDataset (name, path, description, quantity) VALUES
('Multi-label Dataset v1.0', 'data/data_multilabel.json', 'Dataset đa nhãn chính cho training', 70),
('Multi-label Test Set', 'data/test_multilabel.json', 'Dataset test để đánh giá model', 20),
('Production Dataset', 'data/production.json', 'Dataset từ emails thực tế đã được phân loại', 0);

-- ============================================
-- VERIFY DATA
-- ============================================

SELECT 
    id,
    name,
    quantity,
    description,
    created_at
FROM tblDataset
ORDER BY id;

SELECT 
    'Total Datasets' AS 'Metric',
    COUNT(*) AS 'Count'
FROM tblDataset;