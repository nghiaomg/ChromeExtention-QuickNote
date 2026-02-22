# QuickNote Preline 📝

**QuickNote Preline** là một tiện ích mở rộng Chrome (Chrome Extension) tối giản, hiện đại và siêu nhanh giúp bạn ghi chú nhanh chóng ngay trên trình duyệt. Được xây dựng dựa trên **Tailwind CSS** và **Preline UI**, tiện ích này mang lại trải nghiệm người dùng cao cấp với đầy đủ chế độ Dark/Light mode.

---

## ✨ Tính năng nổi bật

- 🚀 **Siêu nhanh & Nhẹ:** Khởi động tức thì, không làm chậm trình duyệt.
- 🔍 **Tìm kiếm trực tiếp (Live Search):** Tìm lại ghi chú cũ chỉ trong một nốt nhạc.
- 📌 **Ghim ghi chú:** Giữ những thông tin quan trọng luôn ở trên đầu.
- 🖱️ **Kéo thả sắp xếp:** Thay đổi thứ tự ghi chú linh hoạt bằng SortableJS.
- 📋 **Sao chép nhanh:** Nút copy tích hợp kèm hiệu ứng phản hồi trực quan.
- 🖥️ **Chế độ Toàn màn hình:** Không gian làm việc rộng rãi hơn cho việc quản lý nhiều ghi chú.
- 🌓 **Dark Mode:** Tự động đồng bộ với giao diện hệ thống/trình duyệt.

---

## 🛠️ Công nghệ sử dụng

- **Manifest V3:** Tuân thủ tiêu chuẩn mới nhất của Chrome Extension.
- **Tailwind CSS v4:** Xử lý giao diện hiện đại và linh hoạt.
- **Preline UI:** Thư viện linh kiện UI dựa trên Tailwind cho trải nghiệm cao cấp.
- **SortableJS:** Thư viện hỗ trợ kéo thả mượt mà.
- **Chrome Storage API:** Lưu trữ dữ liệu ghi chú cục bộ, an toàn và riêng tư.

---

## 📂 Cấu trúc dự án

```text
NoteExtention/
├── manifest.json         # Cấu hình chính của extension
├── popup.html            # Giao diện cửa sổ nhỏ
├── popup.js              # Logic xử lý chính (ghi chú, tìm kiếm, kéo thả)
├── fullscreen.html       # Giao diện chế độ toàn màn hình
├── styles.css            # Tùy chỉnh CSS thêm và hiệu ứng
├── lib/                  # Thư viện lưu trữ cục bộ (Tuân thủ CSP)
│   ├── tailwindcss.js
│   ├── preline.min.js
│   └── sortable.min.js
└── icons/                # Các file biểu tượng ứng dụng
```

---

## 🚀 Hướng dẫn cài đặt (Dành cho nhà phát triển)

1. **Tải xuống hoặc Clone dự án này:**
   ```bash
   git clone https://github.com/nghiaomg/ChromeExtention-QuickNote.git
   ```
2. **Truy cập quản lý tiện ích của Chrome:**
   - Mở trình duyệt Chrome.
   - Truy cập: `chrome://extensions/`
3. **Bật chế độ nhà phát triển:**
   - Gạt công tắc **Developer mode** ở góc trên bên phải sang "On".
4. **Cài đặt tiện ích:**
   - Nhấn vào nút **Load unpacked**.
   - Chọn thư mục `NoteExtention` vừa tải về.

---

## 🛡️ Bảo mật và Quyền hạn

Tiện ích này được thiết kế với sự ưu tiên về bảo mật:
- **Local Resources Only:** Toàn bộ thư viện Javascript và CSS được lưu trữ cục bộ để tuân thủ Content Security Policy (CSP), không tải từ CDN bên ngoài.
- **Quyền hạn tối thiểu:** Chỉ yêu cầu quyền `storage` để lưu ghi chú của bạn. Dữ liệu không bao giờ rời khỏi máy tính của bạn.

---

## 📄 Giấy phép

Dự án này được cấp phép theo tiêu chuẩn dành cho việc học tập và sử dụng cá nhân.

---

*Phát triển bởi nghiaomg*
