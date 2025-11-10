# Migration Complete - Multi-Label Email Classification

## ✅ Cập nhật hoàn tất - Database Schema mới

### 📋 Tổng quan thay đổi

Hệ thống đã được migrate hoàn toàn từ **single-label** sang **multi-label** classification:
- **Trước:** Mỗi email chỉ có 1 label (tblLabelId trong tblEmail)
- **Sau:** Mỗi email có thể có nhiều labels (quan hệ many-to-many qua tblEmailLabel)

---

## 🗄️ Database Changes

### Cấu trúc Database mới (10 tables)

#### 1️⃣ Module: User & Email Management (3 tables)
- `tblUser` - Quản lý người dùng
- `tblEmailSample` - Emails (đổi tên từ tblEmail, xóa field tblLabelId)
- `tblLabel` - Danh mục phân loại

#### 2️⃣ Module: Ground Truth (1 table)
- `tblEmailLabel` - **Junction table** cho Email ↔ Label (many-to-many)

#### 3️⃣ Module: Training Infrastructure (4 tables)
- `tblDataset` - Bộ dữ liệu training
- `tblDatasetEmail` - Liên kết dataset với emails
- `tblModel` - ML models (thêm metrics: hammingLoss, f1Macro, f1Micro)
- `tblTrainingJob` - Lịch sử training

#### 4️⃣ Module: Prediction Tracking (2 tables)
- `tblPrediction` - Kết quả dự đoán từ AI
- `tblPredictionLabel` - Chi tiết confidence score cho từng label

### Database Setup File
📁 `database/setup_complete.sql` - File tích hợp đầy đủ:
- DROP DATABASE email_classification
- CREATE DATABASE email_classification
- Tạo 10 tables
- Seed data: 4 users, 7 labels, 70 emails, 3 datasets, 5 models

---

## 📝 Source Code Updates

### ✅ Models (src/models/)

| File | Status | Changes |
|------|--------|---------|
| `email.model.js` | ✅ Updated | Đổi tên thành EmailSample, xóa tblLabelId, dùng tableName: 'tblEmailSample' |
| `emailLabel.model.js` | ✅ Created | Junction table mới, composite PK (tblEmailSampleId, tblLabelId) |
| `prediction.model.js` | ✅ Created | Tracking AI predictions |
| `predictionLabel.model.js` | ✅ Created | Chi tiết prediction với confidence scores |
| `datasetEmail.model.js` | ✅ Updated | Đổi tblEmailId → tblEmailSampleId |
| `emailUser.model.js` | ⚠️ Removed | Không còn trong schema mới |
| `index.js` | ✅ Updated | Cấu hình relationships many-to-many |

### ✅ DAOs (src/dao/)

| File | Status | Changes |
|------|--------|---------|
| `emailDao.js` | ✅ Refactored | Hoàn toàn viết lại cho multi-label:<br>- `create(data)`: nhận `labelIds` array<br>- `updateLabels()`: thay thế tất cả labels<br>- `addLabels()`: thêm labels<br>- `removeLabels()`: xóa labels<br>- `savePrediction()`: lưu AI predictions |
| `predictionDao.js` | ✅ Created | CRUD cho predictions:<br>- `create()`: tạo prediction + labels<br>- `findByEmailId()`: tìm predictions theo email<br>- `getLatestByEmailId()`: lấy prediction mới nhất |
| `datasetDao.js` | ✅ Updated | Đổi Email → EmailSample, include 'labels' (plural) |

### ✅ Services (src/services/)

| File | Status | Changes |
|------|--------|---------|
| `mlApiClient.js` | ✅ Updated | `predict()` trả về `{labels: [{label, confidence}]}` thay vì single label |
| `classificationService.js` | ✅ Refactored | Methods mới:<br>- `classifyEmail()`: trả về multiple labels + avgConfidence<br>- `classifyAndUpdate()`: classify + update email labels<br>- `classifyAndSavePrediction()`: lưu prediction không update email<br>- `batchClassify()`: xử lý nhiều emails |
| `retrainService.js` | ✅ Updated | `prepareTrainingData()`: trả về labelIds array |
| `modelRetrainService.js` | ✅ Updated | Dataset links dùng tblEmailSampleId |

### ✅ Controllers (src/controllers/)

| File | Status | Changes |
|------|--------|---------|
| `emailController.js` | ✅ Complete | Tất cả methods updated:<br>- `index()`: list emails with multi-labels<br>- `getByLabel()`: filter by label với many-to-many<br>- `show()`: hiển thị email detail với all labels<br>- `deleteEmail()`: xóa đơn giản hơn (cascade auto)<br>- Xóa: markAsRead, toggleImportant (không có trong schema) |
| `emailSystemController.js` | ✅ Updated | Email → EmailSample, include 'labels', xóa EmailRecipient logic |
| `apiController.js` | ✅ Updated | `receiveEmail()`: nhận multi-label classification result |
| `dashboardController.js` | ✅ Updated | Count emails với raw SQL query cho many-to-many |
| `testClassificationController.js` | ✅ Updated | Hiển thị multi-label results |

### ✅ Views (src/views/)

| File | Status | Changes |
|------|--------|---------|
| `pages/emails/emails.ejs` | ✅ Updated | Loop qua `email.labels` array, hiển thị multiple badges |
| `pages/emails/emailDetail.ejs` | ✅ Updated | Hiển thị tất cả labels của email |
| `pages/emails/emailsSystem.ejs` | ✅ Updated | Multi-label display |
| `pages/dashboard/dashboard.ejs` | ✅ Updated | Recent emails với multiple labels |

---

## 🔑 Key Changes Summary

### 1. Email Model
```javascript
// BEFORE
Email {
  id, title, content, sender, receiver, 
  tblLabelId  // ❌ Single label FK
}

// AFTER
EmailSample {
  id, title, content, sender, receiver
  // ✅ No direct label field
  // ✅ Labels via junction table tblEmailLabel
}
```

### 2. Relationships
```javascript
// BEFORE
Email.belongsTo(Label) // One-to-One

// AFTER
EmailSample.belongsToMany(Label, { through: EmailLabel }) // Many-to-Many
```

### 3. Creating Email with Labels
```javascript
// BEFORE
await emailDao.create({
  title: 'Test',
  tblLabelId: 1  // Single label
});

// AFTER
await emailDao.create({
  title: 'Test',
  labelIds: [1, 3, 5]  // Multiple labels
});
```

### 4. Querying with Labels
```javascript
// BEFORE
const email = await Email.findByPk(id, {
  include: [{ model: Label, as: 'label' }]  // Singular
});
console.log(email.label.name); // Single value

// AFTER
const email = await EmailSample.findByPk(id, {
  include: [{ model: Label, as: 'labels', through: { attributes: [] } }]
});
email.labels.forEach(label => console.log(label.name)); // Multiple values
```

### 5. Classification Results
```javascript
// BEFORE
{
  labelId: 2,
  labelName: "Spam",
  confidence: 0.95
}

// AFTER
{
  labels: [
    { labelId: 2, labelName: "Spam", confidence: 0.95 },
    { labelId: 5, labelName: "Promotion", confidence: 0.87 }
  ],
  avgConfidence: 0.91
}
```

### 6. Counting Emails by Label
```javascript
// BEFORE
await Email.count({ where: { tblLabelId: labelId } });

// AFTER
await db.sequelize.query(
  `SELECT COUNT(DISTINCT es.id) 
   FROM tblEmailSample es 
   INNER JOIN tblEmailLabel el ON es.id = el.tblEmailSampleId 
   WHERE el.tblLabelId = :labelId`,
  { replacements: { labelId } }
);
```

---

## 🚀 Next Steps

### 1. Setup Database
```bash
# Import database
mysql -u root -p < database/setup_complete.sql
```

### 2. Update Config
Kiểm tra `src/config/database.js` có đúng connection settings

### 3. Test Application
```bash
npm start
```

### 4. Test Features
- ✅ Email listing với multiple labels
- ✅ Filter emails by label
- ✅ Email detail hiển thị all labels
- ✅ API receive email + auto classify
- ✅ Dashboard statistics
- ✅ Classification với multi-label results

---

## 📚 API Changes

### POST /api/emails/receive
**Response thay đổi:**
```json
{
  "success": true,
  "message": "Email received and classified successfully",
  "data": {
    "emailId": 123,
    "classification": {
      "labels": [
        { "labelId": 2, "labelName": "Spam", "confidence": 0.95 },
        { "labelId": 5, "labelName": "Promotion", "confidence": 0.87 }
      ],
      "avgConfidence": 0.91
    }
  }
}
```

---

## ⚠️ Breaking Changes

### Removed Features
- ❌ `EmailRecipient` table - không còn trong schema
- ❌ `EmailUser` table - không còn trong schema
- ❌ `markAsRead()` và `toggleImportant()` methods - không có trong requirements mới

### Field Renames
- `tblEmail` → `tblEmailSample`
- `email.label` → `email.labels` (singular → plural)

### Method Signature Changes
- `emailDao.create()`: now accepts `labelIds` array instead of `tblLabelId`
- `classificationService.classifyEmail()`: returns `{labels: [...]}` instead of single label

---

## 🎯 Migration Checklist

- [x] Database schema redesigned (10 tables)
- [x] All models updated/created
- [x] All DAOs updated/created
- [x] All services updated
- [x] All controllers updated
- [x] All views updated for multi-label display
- [x] Relationships configured correctly
- [x] Junction tables implemented
- [x] Prediction tracking implemented
- [x] Multi-label metrics added to Model table

---

## 💡 Tips

### Working with Multi-Label Emails

1. **Always include labels association:**
   ```javascript
   include: [{ model: Label, as: 'labels', through: { attributes: [] } }]
   ```

2. **Update labels:**
   ```javascript
   await emailDao.updateLabels(emailId, [1, 3, 5]); // Replace all
   await emailDao.addLabels(emailId, [7]);          // Add more
   await emailDao.removeLabels(emailId, [3]);       // Remove specific
   ```

3. **Display in views:**
   ```ejs
   <% email.labels.forEach(label => { %>
     <span class="badge"><%= label.name %></span>
   <% }); %>
   ```

---

**Migration Date:** 2025-11-10  
**Status:** ✅ COMPLETE  
**Tested:** Pending production testing
