-- =============================================
-- COMPLETE DATABASE SETUP - EMAIL CLASSIFICATION SYSTEM
-- =============================================
-- File này chứa TẤT CẢ:
-- 1. Drop database cũ (nếu có)
-- 2. Tạo database mới
-- 3. Tạo toàn bộ schema (10 bảng, 4 modules)
-- 4. Seed tất cả data mẫu
-- =============================================
-- Usage: mysql -u root -p < setup_complete.sql
-- =============================================

-- =============================================
-- STEP 1: DROP OLD DATABASE & CREATE NEW
-- =============================================

DROP DATABASE IF EXISTS email_classification;
CREATE DATABASE email_classification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE email_classification;

-- =============================================
-- STEP 2: CREATE SCHEMA (10 TABLES, 4 MODULES)
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
    tblModelId INT(10),
    avgConfidence DECIMAL(4,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tblEmailSampleId) REFERENCES tblEmailSample(id) ON DELETE CASCADE,
    FOREIGN KEY (tblModelId) REFERENCES tblModel(id) ON DELETE SET NULL
);

-- 10. BẢNG KẾT QUẢ PHÂN LOẠI CHI TIẾT
-- Lưu từng nhãn được AI predict + confidence
CREATE TABLE IF NOT EXISTS tblPredictionLabel (
    tblPredictionId INT(10) NOT NULL,
    tblLabelId INT(10) NOT NULL,
    confidence DECIMAL(4,3) NOT NULL,
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

-- =============================================
-- STEP 3: SEED DATA - USERS
-- =============================================

INSERT INTO tblUser (username, password, email) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@example.com'),
('user1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user1@example.com'),
('datascientist', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'datascientist@example.com'),
('testuser', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'nguyenthituanh135@gmail.com');

-- =============================================
-- STEP 4: SEED DATA - LABELS
-- =============================================

INSERT INTO tblLabel (name, description) VALUES
('Bảo mật', 'Email liên quan đến bảo mật tài khoản, mật khẩu, xác thực'),
('Công việc', 'Email công việc, họp hành, deadline, dự án'),
('Gia đình', 'Email gia đình, họp mặt, sinh nhật, sự kiện gia đình'),
('Giao dịch', 'Email giao dịch ngân hàng, thanh toán, hóa đơn'),
('Học tập', 'Email học tập, lịch thi, bài tập, thông báo trường học'),
('Quảng cáo', 'Email quảng cáo sản phẩm, dịch vụ, khuyến mãi'),
('Spam', 'Email spam, lừa đảo, quảng cáo rác');

-- =============================================
-- STEP 5: SEED DATA - EMAIL SAMPLES
-- =============================================

-- Set default receiver
SET @default_receiver = 'user@example.com';

-- Get label IDs
SET @label_bao_mat = (SELECT id FROM tblLabel WHERE name = 'Bảo mật' LIMIT 1);
SET @label_cong_viec = (SELECT id FROM tblLabel WHERE name = 'Công việc' LIMIT 1);
SET @label_gia_dinh = (SELECT id FROM tblLabel WHERE name = 'Gia đình' LIMIT 1);
SET @label_hoc_tap = (SELECT id FROM tblLabel WHERE name = 'Học tập' LIMIT 1);
SET @label_quang_cao = (SELECT id FROM tblLabel WHERE name = 'Quảng cáo' LIMIT 1);
SET @label_spam = (SELECT id FROM tblLabel WHERE name = 'Spam' LIMIT 1);
SET @label_giao_dich = (SELECT id FROM tblLabel WHERE name = 'Giao dịch' LIMIT 1);

-- ============================================
-- BẢO MẬT (Security) - 10 emails
-- ============================================

INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
('Cảnh báo đăng nhập từ thiết bị mới', 'Chúng tôi phát hiện đăng nhập từ thiết bị mới vào tài khoản của bạn. Nếu không phải bạn, vui lòng thay đổi mật khẩu ngay.', 'security@example.com', @default_receiver),
('Yêu cầu xác thực hai yếu tố', 'Để bảo vệ tài khoản của bạn, chúng tôi khuyến nghị bật xác thực hai yếu tố. Nhấp vào đây để thiết lập.', 'security@example.com', @default_receiver),
('Thông báo thay đổi mật khẩu', 'Mật khẩu của bạn đã được thay đổi thành công vào lúc 10:30 AM ngày 27/10/2025. Nếu không phải bạn, liên hệ ngay.', 'noreply@example.com', @default_receiver),
('Phát hiện hoạt động bất thường', 'Hệ thống phát hiện hoạt động đăng nhập bất thường từ địa chỉ IP 192.168.1.100. Vui lòng xác nhận đây có phải là bạn.', 'security@example.com', @default_receiver),
('Cập nhật chính sách bảo mật', 'Chúng tôi đã cập nhật chính sách bảo mật và quyền riêng tư. Vui lòng xem lại các thay đổi quan trọng.', 'legal@example.com', @default_receiver),
('Mã xác thực đăng nhập', 'Mã xác thực của bạn là: 847392. Mã này có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.', 'noreply@example.com', @default_receiver),
('Cảnh báo vi phạm bảo mật', 'Chúng tôi phát hiện có người cố gắng truy cập tài khoản của bạn 3 lần với mật khẩu sai. Tài khoản đã bị khóa tạm thời.', 'security@example.com', @default_receiver),
('Xác nhận thiết bị đáng tin cậy', 'Bạn đã thêm thiết bị iPhone 13 vào danh sách thiết bị đáng tin cậy. Nếu không phải bạn, hãy xóa ngay.', 'security@example.com', @default_receiver),
('Khôi phục mật khẩu', 'Bạn đã yêu cầu khôi phục mật khẩu. Nhấp vào liên kết sau để đặt lại mật khẩu. Liên kết có hiệu lực trong 1 giờ.', 'noreply@example.com', @default_receiver),
('Thông báo phiên đăng nhập hết hạn', 'Phiên đăng nhập của bạn đã hết hạn vì lý do bảo mật. Vui lòng đăng nhập lại để tiếp tục sử dụng dịch vụ.', 'security@example.com', @default_receiver);

SET @sec_start = LAST_INSERT_ID();

INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(@sec_start, @label_bao_mat),
(@sec_start + 1, @label_bao_mat),
(@sec_start + 2, @label_bao_mat),
(@sec_start + 3, @label_bao_mat),
(@sec_start + 4, @label_bao_mat),
(@sec_start + 5, @label_bao_mat),
(@sec_start + 6, @label_bao_mat),
(@sec_start + 7, @label_bao_mat),
(@sec_start + 8, @label_bao_mat),
(@sec_start + 9, @label_bao_mat);

-- ============================================
-- CÔNG VIỆC (Work) - 10 emails
-- ============================================

INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
('Họp team buổi sáng 9h', 'Nhắc nhở: Họp team hàng tuần vào 9h sáng mai tại phòng họp A. Chủ đề: Review sprint và lên kế hoạch tuần mới.', 'manager@company.com', @default_receiver),
('Deadline dự án ABC', 'Dự án ABC cần hoàn thành trước 5h chiều thứ Sáu. Vui lòng cập nhật tiến độ công việc vào hệ thống quản lý dự án.', 'pm@company.com', @default_receiver),
('Yêu cầu nghỉ phép đã được duyệt', 'Đơn xin nghỉ phép của bạn từ ngày 1/11 đến 3/11 đã được quản lý phê duyệt. Chúc bạn có kỳ nghỉ vui vẻ.', 'hr@company.com', @default_receiver),
('Thông báo đào tạo nhân viên mới', 'Buổi đào tạo cho nhân viên mới sẽ diễn ra vào thứ Hai tuần sau. Vui lòng chuẩn bị tài liệu và slide thuyết trình.', 'training@company.com', @default_receiver),
('Báo cáo tháng 10 cần nộp', 'Nhắc nhở nộp báo cáo công việc tháng 10 trước ngày 31/10. Mẫu báo cáo đính kèm trong email này.', 'admin@company.com', @default_receiver),
('Thay đổi lịch họp khách hàng', 'Cuộc họp với khách hàng XYZ đã được dời từ 2h chiều sang 4h chiều cùng ngày. Vui lòng cập nhật lịch.', 'sales@company.com', @default_receiver),
('Chúc mừng hoàn thành KPI quý 3', 'Chúc mừng bạn đã hoàn thành xuất sắc KPI quý 3 với 120% chỉ tiêu. Phần thưởng sẽ được trao vào cuối tháng.', 'ceo@company.com', @default_receiver),
('Thông báo bảo trì hệ thống', 'Hệ thống sẽ bảo trì từ 11h đêm đến 2h sáng ngày mai. Vui lòng lưu công việc và đăng xuất trước thời gian này.', 'it@company.com', @default_receiver),
('Mời tham gia dự án mới', 'Bạn được mời tham gia dự án phát triển ứng dụng mobile mới. Cuộc họp kick-off sẽ diễn ra vào thứ Tư tuần sau.', 'pm@company.com', @default_receiver),
('Phiếu lương tháng 10', 'Phiếu lương tháng 10 của bạn đã sẵn sàng. Vui lòng đăng nhập vào hệ thống HR để xem chi tiết và tải về.', 'hr@company.com', @default_receiver);

SET @work_start = LAST_INSERT_ID();

INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(@work_start, @label_cong_viec),
(@work_start + 1, @label_cong_viec),
(@work_start + 2, @label_cong_viec),
(@work_start + 3, @label_cong_viec),
(@work_start + 4, @label_cong_viec),
(@work_start + 5, @label_cong_viec),
(@work_start + 6, @label_cong_viec),
(@work_start + 7, @label_cong_viec),
(@work_start + 8, @label_cong_viec),
(@work_start + 9, @label_cong_viec);

-- ============================================
-- GIA ĐÌNH (Family) - 10 emails
-- ============================================

INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
('Họp mặt gia đình cuối tuần', 'Chào cả nhà, cuối tuần này mình tổ chức họp mặt gia đình tại nhà bà ngoại. Mọi người sắp xếp thời gian tham gia nhé!', 'anh@family.com', @default_receiver),
('Sinh nhật bé Minh', 'Nhắc nhở: Sinh nhật bé Minh vào Chủ nhật tuần sau. Mọi người nhớ chuẩn bị quà và đến đúng giờ nhé.', 'chi@family.com', @default_receiver),
('Ảnh du lịch Đà Lạt', 'Gửi cả nhà album ảnh chuyến du lịch Đà Lạt tuần trước. Mọi người xem và tải về làm kỷ niệm nhé!', 'em@family.com', @default_receiver),
('Lịch khám sức khỏe định kỳ', 'Mẹ nhắc con nhớ đi khám sức khỏe định kỳ vào thứ Năm tuần này. Mẹ đã đặt lịch sẵn rồi.', 'me@family.com', @default_receiver),
('Công thức món ăn mới', 'Con gái gửi mẹ công thức làm bánh flan caramen. Mẹ thử làm xem có ngon không nhé!', 'con@family.com', @default_receiver),
('Kế hoạch nghỉ lễ 2/9', 'Cả nhà bàn bạc kế hoạch đi du lịch nghỉ lễ 2/9. Anh đề xuất đi Phú Quốc, mọi người ý kiến thế nào?', 'anh@family.com', @default_receiver),
('Chúc mừng sinh nhật bố', 'Con chúc bố sinh nhật vui vẻ, sức khỏe dồi dào. Con sẽ về nhà vào cuối tuần để mừng sinh nhật bố.', 'con@family.com', @default_receiver),
('Nhờ đón bé đi học', 'Chị nhờ em đón bé đi học hộ chiều nay vì chị có việc đột xuất. Em giúp chị nhé, cảm ơn em!', 'chi@family.com', @default_receiver),
('Kết quả học tập của con', 'Thầy gửi phụ huynh kết quả học tập học kỳ 1 của em. Em học khá tốt, cần cố gắng thêm môn Toán.', 'teacher@school.com', @default_receiver),
('Mời dự đám cưới', 'Mời cả gia đình tham dự đám cưới của anh Tuấn vào ngày 15/11. Địa điểm: Nhà hàng Riverside, 6h tối.', 'tuan@family.com', @default_receiver);

SET @fam_start = LAST_INSERT_ID();

INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(@fam_start, @label_gia_dinh),
(@fam_start + 1, @label_gia_dinh),
(@fam_start + 2, @label_gia_dinh),
(@fam_start + 3, @label_gia_dinh),
(@fam_start + 4, @label_gia_dinh),
(@fam_start + 5, @label_gia_dinh),
(@fam_start + 6, @label_gia_dinh),
(@fam_start + 7, @label_gia_dinh),
(@fam_start + 8, @label_gia_dinh),
(@fam_start + 9, @label_gia_dinh);

-- ============================================
-- HỌC TẬP (Study) - 10 emails
-- ============================================

INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
('Thông báo lịch thi cuối kỳ', 'Lịch thi cuối kỳ học kỳ 1 năm học 2025-2026 đã được công bố. Sinh viên vui lòng kiểm tra và chuẩn bị ôn tập.', 'office@university.edu.vn', @default_receiver),
('Nộp bài tập lớn môn Lập trình', 'Nhắc nhở: Bài tập lớn môn Lập trình Web cần nộp trước 11h59 tối Chủ nhật. Nộp qua hệ thống e-learning.', 'teacher@university.edu.vn', @default_receiver),
('Kết quả thi giữa kỳ', 'Kết quả thi giữa kỳ môn Cơ sở dữ liệu đã được công bố. Sinh viên đăng nhập vào hệ thống để xem điểm.', 'office@university.edu.vn', @default_receiver),
('Thông báo nghỉ học bù', 'Lớp Trí tuệ nhân tạo buổi thứ Tư tuần này nghỉ học do giảng viên bận công tác. Sẽ học bù vào thứ Bảy.', 'teacher@university.edu.vn', @default_receiver),
('Tài liệu bài giảng tuần 8', 'Giảng viên đã upload tài liệu bài giảng tuần 8 môn Học máy. Sinh viên tải về và đọc trước khi đến lớp.', 'teacher@university.edu.vn', @default_receiver),
('Mời tham gia seminar AI', 'Khoa CNTT tổ chức seminar về Trí tuệ nhân tạo vào thứ Sáu tuần sau. Sinh viên quan tâm đăng ký tham gia.', 'dept@university.edu.vn', @default_receiver),
('Thông báo đăng ký học phần', 'Thời gian đăng ký học phần học kỳ 2 từ ngày 1/11 đến 10/11. Sinh viên lưu ý đăng ký đúng hạn.', 'office@university.edu.vn', @default_receiver),
('Kết quả đề tài nghiên cứu', 'Đề tài nghiên cứu khoa học của nhóm bạn đã được hội đồng phê duyệt. Chúc mừng và tiếp tục thực hiện tốt.', 'research@university.edu.vn', @default_receiver),
('Thông báo học bổng', 'Bạn đã được xét duyệt học bổng khuyến khích học tập học kỳ 1. Học bổng sẽ được chuyển vào tài khoản.', 'finance@university.edu.vn', @default_receiver),
('Lịch bảo vệ đồ án tốt nghiệp', 'Lịch bảo vệ đồ án tốt nghiệp đợt 1 đã được công bố. Sinh viên kiểm tra lịch và chuẩn bị slide thuyết trình.', 'office@university.edu.vn', @default_receiver);

SET @study_start = LAST_INSERT_ID();

INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(@study_start, @label_hoc_tap),
(@study_start + 1, @label_hoc_tap),
(@study_start + 2, @label_hoc_tap),
(@study_start + 3, @label_hoc_tap),
(@study_start + 4, @label_hoc_tap),
(@study_start + 5, @label_hoc_tap),
(@study_start + 6, @label_hoc_tap),
(@study_start + 7, @label_hoc_tap),
(@study_start + 8, @label_hoc_tap),
(@study_start + 9, @label_hoc_tap);

-- ============================================
-- QUẢNG CÁO (Advertisement) - 10 emails
-- ============================================

INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
('Giảm giá 50% Black Friday', 'Chương trình Black Friday siêu khủng! Giảm giá lên đến 50% cho tất cả sản phẩm. Chỉ trong 3 ngày duy nhất!', 'marketing@shop.com', @default_receiver),
('Khóa học lập trình miễn phí', 'Đăng ký ngay khóa học lập trình Python miễn phí. Học online, cấp chứng chỉ. Số lượng có hạn, đăng ký ngay!', 'edu@courses.com', @default_receiver),
('Ưu đãi thẻ tín dụng mới', 'Mở thẻ tín dụng ngay hôm nay, nhận ngay 500.000đ và miễn phí năm đầu tiên. Ưu đãi có hạn!', 'card@bank.com', @default_receiver),
('Mua 1 tặng 1 pizza', 'Chương trình mua 1 tặng 1 pizza size L. Áp dụng từ thứ 2 đến thứ 5 hàng tuần. Đặt hàng ngay!', 'promo@pizza.com', @default_receiver),
('Khuyến mãi du lịch Phú Quốc', 'Tour du lịch Phú Quốc 3N2Đ chỉ từ 3.999.000đ. Bao gồm vé máy bay, khách sạn 4 sao. Đặt ngay!', 'travel@tour.com', @default_receiver),
('Giảm giá iPhone 15 Pro', 'iPhone 15 Pro giảm giá sốc 5 triệu đồng. Trả góp 0% lãi suất. Số lượng có hạn, mua ngay kẻo lỡ!', 'sale@mobile.com', @default_receiver),
('Khóa học tiếng Anh online', 'Học tiếng Anh giao tiếp online với giáo viên bản ngữ. Giảm 30% học phí khi đăng ký trong tháng này.', 'english@courses.com', @default_receiver),
('Ưu đãi gói gym 12 tháng', 'Đăng ký gói tập gym 12 tháng, tặng 2 tháng và 10 buổi PT miễn phí. Ưu đãi chỉ trong tuần này!', 'member@gym.com', @default_receiver),
('Flash sale laptop gaming', 'Flash sale laptop gaming giảm đến 40%. Cấu hình khủng, giá cực tốt. Sale kết thúc sau 24h!', 'tech@shop.com', @default_receiver),
('Bảo hiểm sức khỏe ưu đãi', 'Mua bảo hiểm sức khỏe ngay hôm nay, giảm 20% phí bảo hiểm năm đầu. Bảo vệ sức khỏe gia đình bạn!', 'insurance@company.com', @default_receiver);

SET @ads_start = LAST_INSERT_ID();

INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(@ads_start, @label_quang_cao),
(@ads_start + 1, @label_quang_cao),
(@ads_start + 2, @label_quang_cao),
(@ads_start + 3, @label_quang_cao),
(@ads_start + 4, @label_quang_cao),
(@ads_start + 5, @label_quang_cao),
(@ads_start + 6, @label_quang_cao),
(@ads_start + 7, @label_quang_cao),
(@ads_start + 8, @label_quang_cao),
(@ads_start + 9, @label_quang_cao);

-- ============================================
-- SPAM - 10 emails
-- ============================================

INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
('Bạn đã trúng giải 500 triệu', 'Chúc mừng! Bạn đã trúng giải đặc biệt 500 triệu đồng. Nhấp vào đây để nhận thưởng ngay. Nhanh tay kẻo lỡ!', 'scam@fake.com', @default_receiver),
('Kiếm tiền online tại nhà', 'Kiếm 10-20 triệu/tháng chỉ với 2h làm việc mỗi ngày. Không cần kinh nghiệm. Đăng ký ngay để nhận hướng dẫn!', 'spam@fake.com', @default_receiver),
('Tài khoản của bạn bị khóa', 'CẢNH BÁO: Tài khoản ngân hàng của bạn đã bị khóa. Nhấp vào đây để xác thực lại thông tin ngay!', 'phishing@fake.com', @default_receiver),
('Thuốc giảm cân thần thánh', 'Giảm 10kg chỉ trong 1 tuần với viên uống giảm cân thần thánh. An toàn, hiệu quả. Đặt hàng ngay!', 'pill@scam.com', @default_receiver),
('Bạn có 1 tin nhắn mới', 'Bạn có 1 tin nhắn mới từ người lạ. Nhấp vào đây để đọc tin nhắn. Có thể là người yêu cũ của bạn!', 'msg@spam.com', @default_receiver),
('Cơ hội đầu tư sinh lời 300%', 'Đầu tư 10 triệu, nhận về 30 triệu sau 1 tháng. Cơ hội có 1-0-2. Liên hệ ngay để được tư vấn!', 'invest@scam.com', @default_receiver),
('Xác nhận đơn hàng #12345', 'Đơn hàng #12345 của bạn đang chờ xác nhận. Nhấp vào đây để xác nhận và thanh toán 5.000.000đ.', 'order@fake.com', @default_receiver),
('Bạn được tặng iPhone 15', 'Chúc mừng! Bạn được chọn ngẫu nhiên để nhận iPhone 15 miễn phí. Điền thông tin để nhận quà ngay!', 'gift@scam.com', @default_receiver),
('Cảnh báo virus máy tính', 'Máy tính của bạn đã bị nhiễm 5 virus nguy hiểm. Tải phần mềm diệt virus ngay để bảo vệ dữ liệu!', 'virus@fake.com', @default_receiver),
('Làm giàu không cần vốn', 'Bí quyết làm giàu không cần vốn. Chỉ cần 30 phút mỗi ngày. Nhấp vào đây để nhận ebook miễn phí!', 'rich@scam.com', @default_receiver);

SET @spam_start = LAST_INSERT_ID();

INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(@spam_start, @label_spam),
(@spam_start + 1, @label_spam),
(@spam_start + 2, @label_spam),
(@spam_start + 3, @label_spam),
(@spam_start + 4, @label_spam),
(@spam_start + 5, @label_spam),
(@spam_start + 6, @label_spam),
(@spam_start + 7, @label_spam),
(@spam_start + 8, @label_spam),
(@spam_start + 9, @label_spam);

-- ============================================
-- GIAO DỊCH (Transaction) - 10 emails
-- ============================================

INSERT INTO tblEmailSample (title, content, sender, receiver) VALUES
('Xác nhận giao dịch chuyển khoản', 'Giao dịch chuyển khoản 5.000.000đ đến tài khoản 123456789 đã thành công vào lúc 10:00 AM ngày 27/10/2025.', 'notify@bank.com', @default_receiver),
('Thông báo nạp tiền vào ví điện tử', 'Bạn đã nạp thành công 1.000.000đ vào ví điện tử của mình vào ngày 26/10/2025. Số dư hiện tại là 2.500.000đ.', 'ewallet@service.com', @default_receiver),
('Hóa đơn thanh toán dịch vụ internet', 'Hóa đơn thanh toán dịch vụ internet tháng 10/2025 với số tiền 300.000đ đã được ghi nhận. Vui lòng kiểm tra chi tiết.', 'billing@isp.com', @default_receiver),
('Xác nhận mua hàng trực tuyến', 'Đơn hàng #56789 của bạn với tổng giá trị 2.000.000đ đã được xác nhận và sẽ được giao trong vòng 3-5 ngày làm việc.', 'order@shop.com', @default_receiver),
('Thông báo rút tiền từ tài khoản ngân hàng', 'Yêu cầu rút tiền 1.500.000đ từ tài khoản ngân hàng của bạn đã được xử lý thành công vào ngày 25/10/2025.', 'notify@bank.com', @default_receiver),
('Báo cáo sao kê tài khoản tháng 10', 'Báo cáo sao kê tài khoản ngân hàng của bạn cho tháng 10/2025 đã sẵn sàng. Vui lòng đăng nhập để xem chi tiết giao dịch.', 'statement@bank.com', @default_receiver),
('Xác nhận thanh toán hóa đơn điện nước', 'Thanh toán hóa đơn điện nước tháng 10/2025 với số tiền 450.000đ đã được ghi nhận vào ngày 24/10/2025.', 'billing@utility.com', @default_receiver),
('Thông báo hoàn tiền giao dịch', 'Giao dịch mua hàng #67890 đã được hoàn tiền 500.000đ vào tài khoản của bạn do lỗi kỹ thuật. Vui lòng kiểm tra số dư.', 'refund@shop.com', @default_receiver),
('Cảnh báo giao dịch bất thường', 'Chúng tôi phát hiện giao dịch chuyển khoản 10.000.000đ từ tài khoản của bạn vào ngày 23/10/2025 có dấu hiệu bất thường. Vui lòng liên hệ ngay.', 'security@bank.com', @default_receiver),
('Xác nhận đăng ký dịch vụ mới', 'Bạn đã đăng ký thành công dịch vụ bảo hiểm sức khỏe với phí hàng tháng là 200.000đ bắt đầu từ ngày 01/11/2025.', 'service@insurance.com', @default_receiver);

SET @trans_start = LAST_INSERT_ID();

INSERT INTO tblEmailLabel (tblEmailSampleId, tblLabelId) VALUES
(@trans_start, @label_giao_dich),
(@trans_start + 1, @label_giao_dich),
(@trans_start + 2, @label_giao_dich),
(@trans_start + 3, @label_giao_dich),
(@trans_start + 4, @label_giao_dich),
(@trans_start + 5, @label_giao_dich),
(@trans_start + 6, @label_giao_dich),
(@trans_start + 7, @label_giao_dich),
(@trans_start + 8, @label_giao_dich),
(@trans_start + 9, @label_giao_dich);

-- =============================================
-- STEP 6: SEED DATA - DATASETS
-- =============================================

INSERT INTO tblDataset (name, path, description, quantity) VALUES
('Multi-label Dataset v1.0', 'data/data_multilabel.json', 'Dataset đa nhãn chính cho training', 70),
('Multi-label Test Set', 'data/test_multilabel.json', 'Dataset test để đánh giá model', 20),
('Production Dataset', 'data/production.json', 'Dataset từ emails thực tế đã được phân loại', 0);

-- Link all 70 emails to training dataset
INSERT INTO tblDatasetEmail (tblDatasetId, tblEmailSampleId)
SELECT 1, id FROM tblEmailSample LIMIT 70;

-- =============================================
-- STEP 7: SEED DATA - MODELS
-- =============================================

INSERT INTO tblModel (path, version, accuracy, `precision`, recall, F1Score, hammingLoss, f1Macro, f1Micro, isActive, tblDatasetId) VALUES
('ml_models/email_cnn_model.h5', 'v1.0.0', 0.8700, 0.8500, 0.8400, 0.8450, 0.1200, 0.8300, 0.8500, 1, 1),
('ml_models/email_rnn_model.h5', 'v1.0.0', 0.8200, 0.8000, 0.7900, 0.7950, 0.1500, 0.7800, 0.8000, 0, 1),
('ml_models/email_lstm_model.h5', 'v1.0.0', 0.8900, 0.8700, 0.8600, 0.8650, 0.1000, 0.8500, 0.8700, 0, 1),
('ml_models/email_bilstm_model.h5', 'v1.1.0', 0.9100, 0.8900, 0.8800, 0.8850, 0.0850, 0.8700, 0.8900, 0, 1),
('ml_models/email_bilstm_cnn_model.h5', 'v1.2.0', 0.9300, 0.9100, 0.9000, 0.9050, 0.0700, 0.8900, 0.9100, 0, 1);

-- =============================================
-- VERIFICATION & SUMMARY
-- =============================================

SELECT '========================================' AS '';
SELECT '  DATABASE SETUP COMPLETE!' AS '';
SELECT '  Database: email_classification' AS '';
SELECT '  Multi-label Email Classification' AS '';
SELECT '========================================' AS '';

SELECT 
    'Users' as 'Table', COUNT(*) as 'Records' FROM tblUser
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
SELECT 'TrainingJobs', COUNT(*) FROM tblTrainingJob
UNION ALL
SELECT 'Predictions', COUNT(*) FROM tblPrediction
UNION ALL
SELECT 'PredictionLabels', COUNT(*) FROM tblPredictionLabel;

-- Show label distribution
SELECT '========================================' AS '';
SELECT '  LABEL DISTRIBUTION' AS '';
SELECT '========================================' AS '';

SELECT 
    l.name as 'Label',
    COUNT(el.tblEmailSampleId) as 'Emails'
FROM tblLabel l
LEFT JOIN tblEmailLabel el ON l.id = el.tblLabelId
GROUP BY l.id, l.name
ORDER BY COUNT(el.tblEmailSampleId) DESC;

-- Show active model
SELECT '========================================' AS '';
SELECT '  ACTIVE MODEL' AS '';
SELECT '========================================' AS '';

SELECT 
    path as 'Model Path',
    version as 'Version',
    accuracy as 'Accuracy',
    F1Score as 'F1 Score',
    hammingLoss as 'Hamming Loss'
FROM tblModel
WHERE isActive = 1;

SELECT '========================================' AS '';
SELECT '  ✅ SETUP SUCCESSFUL!' AS '';
SELECT '  Ready to use multi-label classification' AS '';
SELECT '========================================' AS '';
