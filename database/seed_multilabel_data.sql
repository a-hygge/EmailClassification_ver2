-- =============================================
-- SEED DATA CHO MULTI-LABEL EMAIL CLASSIFICATION
-- =============================================
-- File này chứa dữ liệu mẫu để test hệ thống multi-label

-- Xóa dữ liệu cũ (nếu có)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tblEmailLabel;
TRUNCATE TABLE tblDatasetEmail;
TRUNCATE TABLE tblTrainingJob;
TRUNCATE TABLE tblModel;
TRUNCATE TABLE tblEmailSample;
TRUNCATE TABLE tblLabel;
TRUNCATE TABLE tblDataset;
TRUNCATE TABLE tblUser;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. SEED USERS
-- =============================================
INSERT INTO tblUser (username, password, email) VALUES
('admin', '$2b$10$abc123...', 'admin@example.com'),
('user1', '$2b$10$def456...', 'user1@example.com'),
('datascientist', '$2b$10$ghi789...', 'ds@example.com');

-- =============================================
-- 2. SEED LABELS (Các nhãn phân loại)
-- =============================================
INSERT INTO tblLabel (name, description) VALUES
('Công việc', 'Email liên quan đến công việc, dự án, nhiệm vụ'),
('Cá nhân', 'Email cá nhân, không liên quan công việc'),
('Quan trọng', 'Email có độ ưu tiên cao, cần xử lý gấp'),
('Spam', 'Email rác, quảng cáo không mong muốn'),
('Khuyến mãi', 'Email về chương trình khuyến mãi, giảm giá'),
('Học tập', 'Email về khóa học, bài giảng, tài liệu học tập'),
('Thông báo', 'Email thông báo hệ thống, tin tức'),
('Giao dịch', 'Email xác nhận giao dịch, đơn hàng'),
('Bảo mật', 'Email liên quan đến bảo mật tài khoản'),
('Tiếng Anh', 'Email viết bằng tiếng Anh'),
('Tiếng Việt', 'Email viết bằng tiếng Việt');

-- =============================================
-- 3. SEED EMAIL SAMPLES (Mẫu email)
-- =============================================
INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
-- Email 1: Công việc + Quan trọng + Tiếng Việt
('Báo cáo tháng 11 - Deadline 15/11', 
 'Anh/chị vui lòng hoàn thành báo cáo tháng 11 và gửi trước ngày 15/11. Đây là công việc quan trọng và cần ưu tiên.',
 'manager@company.com', 'employee@company.com'),

-- Email 2: Spam + Khuyến mãi + Tiếng Việt
(' FLASH SALE 50% - Mua ngay hôm nay!',
 'Chương trình khuyến mãi lớn nhất năm! Giảm giá 50% tất cả sản phẩm. Click ngay để mua hàng!',
 'marketing@shop.com', 'customer@gmail.com'),

-- Email 3: Học tập + Thông báo + Tiếng Việt
('Thông báo lịch thi giữa kỳ',
 'Kính gửi sinh viên, Lịch thi giữa kỳ môn Machine Learning được tổ chức vào ngày 20/11. Vui lòng chuẩn bị đầy đủ.',
 'university@edu.vn', 'student@edu.vn'),

-- Email 4: Spam + Tiếng Anh
('You won $1 million! Claim now!',
 'Congratulations! You have been selected as the winner of our lottery. Click here to claim your prize now!',
 'scam@fake.com', 'victim@gmail.com'),

-- Email 5: Giao dịch + Bảo mật + Tiếng Việt
('Xác nhận đơn hàng #12345',
 'Cảm ơn bạn đã đặt hàng! Mã đơn hàng: 12345. Tổng tiền: 500,000 VNĐ. Đơn hàng sẽ được giao trong 3-5 ngày.',
 'orders@ecommerce.vn', 'buyer@gmail.com'),

-- Email 6: Công việc + Học tập + Tiếng Anh
('Project Meeting - Machine Learning Assignment',
 'Dear team, We will have a meeting tomorrow at 10 AM to discuss the machine learning project. Please prepare your progress report.',
 'team.lead@company.com', 'team@company.com'),

-- Email 7: Bảo mật + Quan trọng + Tiếng Anh
('Security Alert: Unusual login detected',
 'We detected a login to your account from a new device in London. If this was not you, please change your password immediately.',
 'security@service.com', 'user@gmail.com'),

-- Email 8: Khuyến mãi + Giao dịch + Tiếng Việt
('Mã giảm giá 100K cho đơn hàng đầu tiên',
 'Chào mừng khách hàng mới! Nhập mã WELCOME100 để được giảm 100,000đ cho đơn hàng đầu tiên từ 500,000đ.',
 'promo@shop.vn', 'newcustomer@gmail.com'),

-- Email 9: Cá nhân + Tiếng Việt
('Lịch hẹn gặp bạn cuối tuần',
 'Hi bạn, Cuối tuần này mình có hẹn gặp nhau uống cà phê không? Lâu rồi không gặp.',
 'friend@gmail.com', 'me@gmail.com'),

-- Email 10: Thông báo + Học tập + Tiếng Anh
('New Course Available: Deep Learning Fundamentals',
 'A new course on Deep Learning is now available. Enroll now to get 20% early bird discount. Limited seats!',
 'courses@platform.com', 'learner@gmail.com'),

-- Email 11: Công việc + Quan trọng + Giao dịch + Tiếng Việt
('Hợp đồng cần ký gấp - Deadline hôm nay',
 'Kính gửi anh/chị, Hợp đồng với khách hàng ABC cần được ký và gửi lại trước 5PM hôm nay. Đây là vấn đề khẩn cấp.',
 'legal@company.vn', 'manager@company.vn'),

-- Email 12: Spam + Khuyến mãi + Tiếng Anh
('Get Rich Quick! Make $5000/day from home',
 'Amazing opportunity! Work from home and earn $5000 per day. No experience needed. Click here to start now!',
 'spam@scam.com', 'target@gmail.com');

-- =============================================
-- 4. SEED EMAIL-LABEL RELATIONSHIPS (Multi-label)
-- =============================================
-- Email 1: Công việc + Quan trọng + Tiếng Việt
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(1, 1),  -- Công việc
(1, 3),  -- Quan trọng
(1, 11); -- Tiếng Việt

-- Email 2: Spam + Khuyến mãi + Tiếng Việt
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(2, 4),  -- Spam
(2, 5),  -- Khuyến mãi
(2, 11); -- Tiếng Việt

-- Email 3: Học tập + Thông báo + Tiếng Việt
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(3, 6),  -- Học tập
(3, 7),  -- Thông báo
(3, 11); -- Tiếng Việt

-- Email 4: Spam + Tiếng Anh
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(4, 4),  -- Spam
(4, 10); -- Tiếng Anh

-- Email 5: Giao dịch + Bảo mật + Tiếng Việt
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(5, 8),  -- Giao dịch
(5, 9),  -- Bảo mật
(5, 11); -- Tiếng Việt

-- Email 6: Công việc + Học tập + Tiếng Anh
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(6, 1),  -- Công việc
(6, 6),  -- Học tập
(6, 10); -- Tiếng Anh

-- Email 7: Bảo mật + Quan trọng + Tiếng Anh
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(7, 9),  -- Bảo mật
(7, 3),  -- Quan trọng
(7, 10); -- Tiếng Anh

-- Email 8: Khuyến mãi + Giao dịch + Tiếng Việt
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(8, 5),  -- Khuyến mãi
(8, 8),  -- Giao dịch
(8, 11); -- Tiếng Việt

-- Email 9: Cá nhân + Tiếng Việt
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(9, 2),  -- Cá nhân
(9, 11); -- Tiếng Việt

-- Email 10: Thông báo + Học tập + Tiếng Anh
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(10, 7),  -- Thông báo
(10, 6),  -- Học tập
(10, 10); -- Tiếng Anh

-- Email 11: Công việc + Quan trọng + Giao dịch + Tiếng Việt (4 labels!)
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(11, 1),  -- Công việc
(11, 3),  -- Quan trọng
(11, 8),  -- Giao dịch
(11, 11); -- Tiếng Việt

-- Email 12: Spam + Khuyến mãi + Tiếng Anh
INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(12, 4),  -- Spam
(12, 5),  -- Khuyến mãi
(12, 10); -- Tiếng Anh

-- =============================================
-- 5. SEED DATASETS
-- =============================================
INSERT INTO tblDataset (name, path, description, quantity) VALUES
('Training Dataset v1', 'data/training_v1.json', 'Dataset chính để train model', 10),
('Test Dataset v1', 'data/test_v1.json', 'Dataset để test model', 2);

-- =============================================
-- 6. SEED DATASET-EMAIL RELATIONSHIPS
-- =============================================
-- Training dataset chứa 10 emails đầu tiên
INSERT INTO tblDatasetEmail (tblDatasetId, tblEmailSampleId) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10);

-- Test dataset chứa 2 emails cuối
INSERT INTO tblDatasetEmail (tblDatasetId, tblEmailSampleId) VALUES
(2, 11), (2, 12);

-- =============================================
-- 7. SEED MODELS
-- =============================================
INSERT INTO tblModel (path, version, accuracy, `precision`, recall, F1Score, isActive, tblDatasetId) VALUES
('ml_models/email_cnn_model.h5', 'v1.0', 0.8500, 0.8200, 0.8100, 0.8150, 1, 1),
('ml_models/email_lstm_model.h5', 'v1.0', 0.8700, 0.8500, 0.8400, 0.8450, 0, 1),
('ml_models/email_bilstm_model.h5', 'v1.1', 0.9000, 0.8800, 0.8700, 0.8750, 0, 1);

-- =============================================
-- 8. SEED TRAINING JOBS
-- =============================================
INSERT INTO tblTrainingJob (modelType, modelPath, status, hyperparameters, result, tblUserId, tblModelId) VALUES
('CNN', 'ml_models/email_cnn_model.h5', 'Completed', 
 '{"epochs": 25, "batch_size": 32, "learning_rate": 0.0001}',
 '{"testLoss": 0.35, "testAccuracy": 0.85, "f1Macro": 0.82}',
 1, 1),

('LSTM', 'ml_models/email_lstm_model.h5', 'Completed',
 '{"epochs": 30, "batch_size": 32, "learning_rate": 0.0001}',
 '{"testLoss": 0.30, "testAccuracy": 0.87, "f1Macro": 0.85}',
 1, 2),

('BiLSTM', 'ml_models/email_bilstm_model.h5', 'Running',
 '{"epochs": 35, "batch_size": 32, "learning_rate": 0.00005}',
 NULL,
 3, 3);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Kiểm tra số lượng data đã seed
SELECT 
    'Users' as TableName, COUNT(*) as Count FROM tblUser
UNION ALL
SELECT 'Labels', COUNT(*) FROM tblLabel
UNION ALL
SELECT 'EmailSamples', COUNT(*) FROM tblEmailSample
UNION ALL
SELECT 'EmailLabels', COUNT(*) FROM tblEmailLabel
UNION ALL
SELECT 'Datasets', COUNT(*) FROM tblDataset
UNION ALL
SELECT 'DatasetEmails', COUNT(*) FROM tblDatasetEmail
UNION ALL
SELECT 'Models', COUNT(*) FROM tblModel
UNION ALL
SELECT 'TrainingJobs', COUNT(*) FROM tblTrainingJob;

-- Kiểm tra emails với nhiều labels
SELECT 
    es.id,
    es.title,
    GROUP_CONCAT(l.name ORDER BY l.name SEPARATOR ', ') as labels,
    COUNT(el.tblLabelId) as label_count
FROM tblEmailSample es
LEFT JOIN tblEmailLabel el ON es.id = el.tblEmailSampleId
LEFT JOIN tblLabel l ON el.tblLabelId = l.id
GROUP BY es.id, es.title
ORDER BY label_count DESC;

-- Kiểm tra distribution của labels
SELECT 
    l.name as Label,
    COUNT(el.tblEmailSampleId) as EmailCount,
    ROUND(COUNT(el.tblEmailSampleId) * 100.0 / (SELECT COUNT(*) FROM tblEmailSample), 2) as Percentage
FROM tblLabel l
LEFT JOIN tblEmailLabel el ON l.id = el.tblLabelId
GROUP BY l.id, l.name
ORDER BY EmailCount DESC;
