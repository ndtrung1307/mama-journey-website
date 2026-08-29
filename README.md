# MamaJourney Website

Website tĩnh phục vụ Chính sách quyền riêng tư và trang Liên hệ của ứng dụng MamaJourney. Được thiết kế để triển khai trực tiếp qua GitHub Pages.

## Privacy Policy Architecture

Chính sách quyền riêng tư có **một nguồn nội dung duy nhất**:

```
shared/legal/privacy-policy/privacy-policy.json
```

- **Website:** generate `privacy-policy/index.html` từ JSON — không duy trì bản sao thủ công.
- **iOS:** bundle cùng file JSON (hoặc bản copy được đồng bộ tự động) — không viết lại nội dung trong app.

### Cập nhật Chính sách quyền riêng tư

1. Sửa `shared/legal/privacy-policy/privacy-policy.json`
2. Tăng `version` và cập nhật `effectiveDate`
3. Validate: `python3 scripts/validate-privacy-policy.py`
4. Generate website: `python3 scripts/build-privacy-policy.py`
5. Cập nhật bundled JSON trong iOS project
6. QA website và iOS
7. Commit tất cả thay đổi cùng nhau

Chi tiết schema và hướng dẫn iOS: `shared/legal/privacy-policy/README.md`

## Cấu trúc thư mục

```
mamajourney-website/
├── shared/
│   └── legal/
│       └── privacy-policy/
│           ├── privacy-policy.json   # Nguồn nội dung chính thức
│           └── README.md
├── scripts/
│   ├── build-privacy-policy.py       # Generate HTML từ JSON
│   ├── validate-privacy-policy.py    # Validate JSON
│   └── markdown_utils.py
├── index.html
├── privacy-policy/
│   └── index.html                    # Generated — không sửa thủ công
├── contact/
│   └── index.html
├── css/
│   └── style.css
├── assets/
│   ├── application-icon.png
│   └── home-header.png
├── .nojekyll
└── README.md
```

## Xem trước cục bộ

```bash
python3 scripts/validate-privacy-policy.py
python3 scripts/build-privacy-policy.py
python3 -m http.server 8000
```

Truy cập: `http://localhost:8000`

## Triển khai với GitHub Pages

1. Chạy build script trước khi commit (nếu đã sửa JSON).
2. Push repository lên GitHub.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**.
5. Branch: `main`, folder: `/ (root)`.
6. Lưu và đợi vài phút.

URL mặc định: `https://<username>.github.io/mamajourney-website/`

## Kết nối custom domain (sau này)

Khi DNS cho `mamajourney.app` đã sẵn sàng:

1. Tạo file `CNAME` ở root với nội dung: `mamajourney.app`
2. Cấu hình custom domain trong GitHub Pages settings.
3. Cấu hình DNS theo hướng dẫn của GitHub.

## Thông tin liên hệ

Email: `ndtrung1307@gmail.com`

Trang liên hệ: `contact/index.html`

## Lưu ý quan trọng

- Website này **không** thu thập dữ liệu người dùng, không dùng analytics, cookies hay form.
- Khi thay đổi cách xử lý dữ liệu trong app, cập nhật JSON chính sách và kiểm tra khai báo App Store Connect.
- Không chỉnh sửa trực tiếp `privacy-policy/index.html` — file đó được generate.
