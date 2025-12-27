# HỆ THỐNG QUẢN LÝ MUA HÀNG - DEMO

Demo hệ thống quản lý quy trình mua hàng cho công ty xây dựng với 9 bước hoàn chỉnh.

## Tính năng chính

### 9 Bước Quy trình
1. ✅ Tạo yêu cầu vật tư
2. ✅ Kiểm tra tồn kho và phê duyệt
3. ✅ Gửi RFQ và lựa chọn nhà cung cấp
4. ✅ Tạo và phê duyệt đơn đặt hàng (PO) - **Có chữ ký số demo**
5. ✅ Theo dõi tiến độ giao hàng
6. ✅ Kiểm tra số lượng - chất lượng
7. ✅ Thanh toán và đối soát chứng từ
8. ✅ Đánh giá nhà cung cấp
9. ✅ Báo cáo, phân tích và lưu trữ

### Tính năng nổi bật
- 🔐 **Chữ ký số demo**: Nhập chữ ký khi phê duyệt, xuất PO có chữ ký
- 📊 **Export Excel**: Xuất báo cáo với 1 click
- ⚠️ **Cảnh báo trễ hạn**: Tự động phát hiện đơn hàng trễ
- 📱 **Mobile responsive**: Hoạt động tốt trên mọi thiết bị
- ⭐ **Xếp hạng NCC**: Tự động đánh giá và xếp hạng nhà cung cấp

### Dashboard
- Chi phí theo dự án
- Chi phí theo nhóm vật tư
- Top nhà cung cấp
- Trạng thái đơn hàng
- Xu hướng chi phí

## Tech Stack

- **Frontend:** React 18 + Vite + Ant Design
- **Backend:** Node.js + Express + Prisma
- **Database:** SQLite (demo) / PostgreSQL (production)
- **Email:** Nodemailer

## Cài đặt

### Backend
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Email (Tùy chọn)
Để gửi email thật, cấu hình SMTP trong `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Hệ thống Mua hàng <your-email@gmail.com>"
FRONTEND_URL=http://localhost:5173
```

📖 **Chi tiết**: Xem [EMAIL-SETUP-GUIDE.md](./EMAIL-SETUP-GUIDE.md)

**Lưu ý**: Không cấu hình SMTP vẫn chạy được (Demo Mode)

## Phân quyền 7 Roles

Hệ thống hỗ trợ 7 vai trò với quyền hạn riêng biệt:

1. **Admin** - Quản trị toàn bộ hệ thống
2. **Trưởng phòng Mua hàng** - Phê duyệt cấp 1, tạo RFQ, chọn NCC
3. **Nhân viên Mua hàng** - Tạo yêu cầu vật tư, theo dõi đơn hàng
4. **Kế toán** - Phê duyệt cấp 2, xử lý thanh toán
5. **Giám đốc** - Phê duyệt cấp 3 (cuối cùng)
6. **Giám sát công trình** - Tạo yêu cầu, kiểm hàng
7. **Nhà cung cấp** - Nhận RFQ, gửi báo giá

📖 **Chi tiết**: Xem [ROLE-TESTING-GUIDE.md](./ROLE-TESTING-GUIDE.md)

## Tài khoản demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Trưởng phòng MH | truongphong@demo.com | 123456 |
| Nhân viên MH | nhanvien@demo.com | 123456 |
| Kế toán | ketoan@demo.com | 123456 |
| Giám đốc | giamdoc@demo.com | 123456 |
| Giám sát | giamsat@demo.com | 123456 |
| Nhà cung cấp | ncc1@demo.com | 123456 |

## Cấu trúc thư mục

```
├── backend/              # Node.js + Express API
│   ├── prisma/          # Database schema & migrations
│   ├── src/
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth, validation
│   │   └── utils/       # Helpers
│   └── package.json
│
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API calls
│   │   ├── store/       # State management
│   │   └── utils/       # Helpers
│   └── package.json
│
└── README.md
```

## License

Demo project - For evaluation purposes only

---

## 🚀 Deploy lên Vercel

### Quick Start
```bash
npm i -g vercel
vercel login
vercel
```

📖 **Tài liệu đầy đủ**: [DOCS-INDEX.md](./DOCS-INDEX.md)

**Hướng dẫn nhanh**:
- [DEPLOY-QUICK.md](./DEPLOY-QUICK.md) - Deploy trong 3 bước
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Checklist chi tiết
- [DATABASE-SETUP.md](./DATABASE-SETUP.md) - Setup PostgreSQL
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Xử lý lỗi

**Lưu ý**: Phải chuyển từ SQLite sang PostgreSQL để deploy production.
