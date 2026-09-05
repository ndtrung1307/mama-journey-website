# Privacy Policy — Shared Source

Nguồn nội dung chính thức cho Chính sách quyền riêng tư MamaJourney.

## Canonical file

```
shared/legal/privacy-policy/privacy-policy.json
```

File này là **single source of truth** cho:

- Website tĩnh (`privacy-policy/index.html` được generate từ file này)
- Ứng dụng iOS (bundle cùng file JSON hoặc bản copy được đồng bộ tự động)

## Cấu trúc JSON

```json
{
  "id": "mamajourney-privacy-policy",
  "version": "1.0",
  "language": "vi",
  "title": "Chính sách quyền riêng tư",
  "subtitle": "MamaJourney",
  "effectiveDate": "2026-08-28",
  "contact": { "email": "ndtrung1307@gmail.com" },
  "introduction": "Markdown...",
  "sections": [
    {
      "id": "privacy-principles",
      "tocTitle": "Nguyên tắc quyền riêng tư",
      "title": "...",
      "content": "Markdown...",
      "table": { "columns": [], "rows": [] },
      "contentAfter": "Markdown..."
    }
  ]
}
```

### Trường section

| Trường         | Bắt buộc | Mô tả                             |
| -------------- | -------- | --------------------------------- |
| `id`           | Có       | ID ổn định, kebab-case, tiếng Anh |
| `title`        | Có       | Tiêu đề section                   |
| `content`      | Có       | Nội dung Markdown                 |
| `tocTitle`     | Không    | Nhãn ngắn cho mục lục website     |
| `table`        | Không    | Bảng dữ liệu có cấu trúc          |
| `contentAfter` | Không    | Markdown sau bảng                 |

### Markdown được hỗ trợ

- Đoạn văn
- `**in đậm**`, `*in nghiêng*`
- Danh sách `-`
- Liên kết `[text](url)`
- Tiêu đề phụ `###` (dùng cho mục con như 10.1, 10.2)

Không dùng HTML, CSS, hoặc cú pháp đặc thù nền tảng trong `content`.

## iOS

App iOS nên load JSON này như bundled resource và map sang model:

```swift
struct PrivacyPolicyDocument: Codable {
    let id: String
    let version: String
    let language: String
    let title: String
    let subtitle: String?
    let effectiveDate: String
    let contact: Contact
    let introduction: String?
    let sections: [PrivacyPolicySection]
}

struct PrivacyPolicySection: Codable {
    let id: String
    let title: String
    let tocTitle: String?
    let content: String
    let table: PrivacyPolicyTable?
    let contentAfter: String?
}
```

UI accordion (`DisclosureGroup`, v.v.) thuộc về app — **không** đưa vào JSON.

## Cập nhật nội dung

1. Sửa `privacy-policy.json`
2. Tăng `version`
3. Cập nhật `effectiveDate`
4. Chạy validation: `python3 scripts/validate-privacy-policy.py`
5. Generate website: `python3 scripts/build-privacy-policy.py`
6. Cập nhật bundled JSON trong iOS project
7. QA website và iOS
8. Commit tất cả thay đổi cùng nhau

## Lưu ý

- Không chỉnh sửa trực tiếp `privacy-policy/index.html` — file đó được generate.
- Không viết lại nội dung pháp lý khi refactor kiến trúc.
- Nếu phát hiện vấn đề nội dung, ghi TODO thay vì tự sửa im lặng.
