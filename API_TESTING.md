# Email Receive API - Testing with cURL

## Endpoint

```
POST http://localhost:3000/api/emails/receive
```

## Request Format

### Headers

```
Content-Type: application/json
```

### Required Fields

- `from` - Sender email address (must be valid email format)
- `to` - Receiver email address (must be valid email format)
- `subject` - Email subject (cannot be empty)
- `body` - Email body content (cannot be empty)

---

## cURL Examples

### 1. Valid Email - Security/Bảo mật

```bash
curl -X POST http://localhost:3000/api/emails/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "security@example.com",
    "to": "nguyenthituanh135@gmail.com",
    "subject": "Cảnh báo đăng nhập từ thiết bị mới",
    "body": "Chúng tôi phát hiện đăng nhập từ thiết bị mới vào tài khoản của bạn. Nếu không phải bạn, vui lòng thay đổi mật khẩu ngay."
  }'
```

### 2. Valid Email - Work/Công việc

```bash
curl -X POST http://localhost:3000/api/emails/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "manager@company.com",
    "to": "nguyenthituanh135@gmail.com",
    "subject": "Họp team vào thứ 2",
    "body": "Chúng ta sẽ có cuộc họp team vào 9h sáng thứ 2 tuần sau để thảo luận về dự án mới. Mọi người chuẩn bị báo cáo tiến độ nhé."
  }'
```

### 3. Valid Email - Spam

```bash
curl -X POST http://localhost:3000/api/emails/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "promo@spam.com",
    "to": "nguyenthituanh135@gmail.com",
    "subject": "Bạn đã trúng giải 500 triệu",
    "body": "Chúc mừng! Bạn đã trúng giải đặc biệt 500 triệu đồng. Nhấp vào đây để nhận thưởng ngay. Nhanh tay kẻo lỡ!"
  }'
```

### 4. Valid Email - Transaction/Giao dịch

```bash
curl -X POST http://localhost:3000/api/emails/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "bank@example.com",
    "to": "nguyenthituanh135@gmail.com",
    "subject": "Xác nhận giao dịch chuyển khoản",
    "body": "Giao dịch chuyển khoản 5.000.000đ đến tài khoản 123456789 đã thành công vào lúc 10:00 AM ngày 27/10/2025."
  }'
```

---

## Success Response (201 Created)

```json
{
  "success": true,
  "message": "Email received and classified successfully",
  "data": {
    "emailId": 123,
    "from": "security@example.com",
    "to": "nguyenthituanh135@gmail.com",
    "subject": "Cảnh báo đăng nhập từ thiết bị mới",
    "classification": {
      "labels": [
        {
          "labelId": 1,
          "name": "Bảo mật",
          "confidence": 0.95
        }
      ],
      "avgConfidence": 0.95
    }
  }
}
```

---

## Error Examples

### Missing Required Field

```bash
curl -X POST http://localhost:3000/api/emails/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "receiver@example.com",
    "subject": "Test email"
  }'
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Missing required fields: from, to, subject, body"
}
```

### Invalid Email Format

```bash
curl -X POST http://localhost:3000/api/emails/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "invalid-email",
    "to": "receiver@example.com",
    "subject": "Test email",
    "body": "This is a test email body"
  }'
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid email format for \"from\" field"
}
```

### Empty Subject

```bash
curl -X POST http://localhost:3000/api/emails/receive \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "receiver@example.com",
    "subject": "   ",
    "body": "This is a test email body"
  }'
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Subject cannot be empty"
}
```

---

## Notes

- The API automatically classifies emails using ML service
- Emails are stored in the database with their classification labels
- The endpoint returns the email ID and classification results
- Make sure the server is running on port 3000 before testing

---

## Postman

You can import the provided Postman collection to run the same requests from the cURL examples.

- File: `postman_collection.json` (in the repository root)

Import steps (Postman app):

1. Open Postman.
2. Click "Import" (top-left) → "File" and select `postman_collection.json` from this repository.
3. The collection "Email Receive API" will appear in your Collections panel. Expand it and run any request.
4. Ensure your local server is running at `http://localhost:3000` before sending requests.

Notes:

- The requests include the header `Content-Type: application/json` and example JSON bodies matching the cURL samples.
- You can edit request bodies or add environment variables if you run the server on a different host/port.
