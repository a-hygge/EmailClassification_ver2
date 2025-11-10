-- ============================================
-- Seed Data for Labels and Sample Emails (MULTI-LABEL)
-- ============================================
-- This script populates:
-- 1. 7 Labels (Bảo mật, Công việc, Gia đình, Giao dịch, Học tập, Quảng cáo, Spam)
-- 2. 10 Sample emails for each label (70 total emails)
-- ============================================
-- Phù hợp với cấu trúc create_table.sql MỚI (multi-label):
--   - tblLabel (id, name, description)
--   - tblEmailSample (id, title, content, sender, receiver)
--   - tblEmailLabel (tblEmailSampleId, tblLabelId) - Many-to-many
-- ============================================

-- Clear existing data (optional - comment out if you want to keep existing data)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tblEmailLabel;
TRUNCATE TABLE tblDatasetEmail;
TRUNCATE TABLE tblEmailSample;
TRUNCATE TABLE tblLabel;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- INSERT LABELS
-- ============================================

INSERT INTO tblLabel (name, description) VALUES
('Bảo mật', 'Email liên quan đến bảo mật tài khoản, mật khẩu, xác thực'),
('Công việc', 'Email công việc, họp hành, deadline, dự án'),
('Gia đình', 'Email gia đình, họp mặt, sinh nhật, sự kiện gia đình'),
('Giao dịch', 'Email giao dịch ngân hàng, thanh toán, hóa đơn'),
('Học tập', 'Email học tập, lịch thi, bài tập, thông báo trường học'),
('Quảng cáo', 'Email quảng cáo sản phẩm, dịch vụ, khuyến mãi'),
('Spam', 'Email spam, lừa đảo, quảng cáo rác');

-- ============================================
-- INSERT SAMPLE EMAILS
-- ============================================

-- Get label IDs
SET @label_bao_mat = (SELECT id FROM tblLabel WHERE name = 'Bảo mật' LIMIT 1);
SET @label_cong_viec = (SELECT id FROM tblLabel WHERE name = 'Công việc' LIMIT 1);
SET @label_gia_dinh = (SELECT id FROM tblLabel WHERE name = 'Gia đình' LIMIT 1);
SET @label_hoc_tap = (SELECT id FROM tblLabel WHERE name = 'Học tập' LIMIT 1);
SET @label_quang_cao = (SELECT id FROM tblLabel WHERE name = 'Quảng cáo' LIMIT 1);
SET @label_spam = (SELECT id FROM tblLabel WHERE name = 'Spam' LIMIT 1);
SET @label_giao_dich = (SELECT id FROM tblLabel WHERE name = 'Giao dịch' LIMIT 1);

-- Default receiver
SET @default_receiver = 'user@example.com';

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

-- ============================================
-- VERIFY DATA
-- ============================================

-- Count emails by label
SELECT 
    l.name AS 'Label',
    COUNT(el.tblEmailSampleId) AS 'Email Count'
FROM tblLabel l
LEFT JOIN tblEmailLabel el ON l.id = el.tblLabelId
GROUP BY l.id, l.name
ORDER BY l.name;

-- Display summary
SELECT 
    'Total Labels' AS 'Metric',
    COUNT(*) AS 'Count'
FROM tblLabel
UNION ALL
SELECT 
    'Total Emails' AS 'Metric',
    COUNT(*) AS 'Count'
FROM tblEmailSample
UNION ALL
SELECT 
    'Total Email-Label Relationships' AS 'Metric',
    COUNT(*) AS 'Count'
FROM tblEmailLabel;


