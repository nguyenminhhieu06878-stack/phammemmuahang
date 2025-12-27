# 🚀 Hướng dẫn Deploy lên Vercel

## 📋 Tổng quan

Dự án này có 2 phần cần deploy riêng:
1. **Frontend** (React + Vite)
2. **Backend** (Node.js + Express + Prisma)

---

## 🎯 Bước 1: Deploy Backend

### 1.1. Truy cập Vercel
- Vào https://vercel.com
- Login bằng GitHub account

### 1.2. Import Backend Project
1. Click **"Add New"** → **"Project"**
2. Chọn repository: `phammemmuahang`
3. Click **"Import"**

### 1.3. Configure Backend
```
Framework Preset: Other
Root Directory: backend
Build Command: (để trống)
Output Directory: (để trống)
Install Command: npm install
```

### 1.4. Environment Variables
Thêm các biến môi trường sau:

```env
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key-here
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@procurement.com
FRONTEND_URL=https://your-frontend-url.vercel.app
```

⚠️ **LƯU Ý:** 
- Vercel không hỗ trợ SQLite tốt cho production
- Nên chuyển sang PostgreSQL hoặc MySQL
- Có thể dùng Vercel Postgres (miễn phí)

### 1.5. Deploy
- Click **"Deploy"**
- Đợi build xong
- Copy URL backend (VD: `https://phammemmuahang-backend.vercel.app`)

---

## 🎨 Bước 2: Deploy Frontend

### 2.1. Import Frontend Project
1. Click **"Add New"** → **"Project"**
2. Chọn repository: `phammemmuahang`
3. Click **"Import"**

### 2.2. Configure Frontend
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 2.3. Environment Variables
Thêm biến môi trường:

```env
VITE_API_URL=https://phammemmuahang-backend.vercel.app/api
```

(Thay URL backend bằng URL thật từ bước 1.5)

### 2.4. Deploy
- Click **"Deploy"**
- Đợi build xong
- Copy URL frontend (VD: `https://phammemmuahang.vercel.app`)

---

## 🔧 Bước 3: Cập nhật CORS

Sau khi có URL frontend, cập nhật backend:

### 3.1. Cập nhật backend/src/index.js
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://phammemmuahang.vercel.app', // Thay bằng URL frontend thật
  ],
  credentials: true
}));
```

### 3.2. Push lên GitHub
```bash
git add .
git commit -m "Update CORS for production"
git push
```

Vercel sẽ tự động redeploy!

---

## 🗄️ Bước 4: Setup Database (Khuyến nghị)

### Option 1: Vercel Postgres (Miễn phí)
1. Vào project backend trên Vercel
2. Tab **"Storage"** → **"Create Database"**
3. Chọn **"Postgres"**
4. Copy connection string
5. Update `DATABASE_URL` trong Environment Variables

### Option 2: Railway.app (Miễn phí)
1. Vào https://railway.app
2. Tạo PostgreSQL database
3. Copy connection string
4. Update `DATABASE_URL`

### Option 3: Supabase (Miễn phí)
1. Vào https://supabase.com
2. Tạo project mới
3. Copy Postgres connection string
4. Update `DATABASE_URL`

### 4.1. Cập nhật Prisma Schema
```prisma
datasource db {
  provider = "postgresql"  // Thay vì sqlite
  url      = env("DATABASE_URL")
}
```

### 4.2. Chạy Migration
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

---

## ✅ Bước 5: Test

### 5.1. Test Backend
```bash
curl https://your-backend-url.vercel.app/api/health
```

### 5.2. Test Frontend
- Mở browser: `https://your-frontend-url.vercel.app`
- Login với tài khoản demo
- Test các tính năng

---

## 🔄 Bước 6: Auto Deploy

Vercel đã tự động setup CI/CD:
- Mỗi khi push lên GitHub → Tự động deploy
- Mỗi Pull Request → Tạo preview deployment
- Main branch → Deploy production

---

## 📝 Checklist

- [ ] Backend deployed thành công
- [ ] Frontend deployed thành công
- [ ] Environment variables đã set đúng
- [ ] CORS đã cập nhật
- [ ] Database đã setup (nếu dùng Postgres)
- [ ] Migration đã chạy
- [ ] Seed data đã import
- [ ] Test login thành công
- [ ] Test các tính năng chính

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module"
- Kiểm tra `package.json` có đầy đủ dependencies
- Chạy `npm install` lại

### Lỗi: "Database connection failed"
- Kiểm tra `DATABASE_URL` đúng format
- Nếu dùng SQLite, chuyển sang Postgres

### Lỗi: "CORS policy"
- Kiểm tra backend CORS config
- Đảm bảo frontend URL đã được thêm vào whitelist

### Lỗi: "API calls fail"
- Kiểm tra `VITE_API_URL` trong frontend
- Đảm bảo backend đang chạy

---

## 💡 Tips

1. **Free Tier Limits:**
   - Vercel: 100GB bandwidth/month
   - Vercel Postgres: 256MB storage
   - Railway: $5 credit/month

2. **Performance:**
   - Enable caching
   - Optimize images
   - Use CDN

3. **Monitoring:**
   - Vercel Analytics (miễn phí)
   - Vercel Logs
   - Error tracking

---

## 📞 Support

Nếu gặp vấn đề:
1. Check Vercel logs
2. Check browser console
3. Check network tab
4. Đọc Vercel docs: https://vercel.com/docs

---

## 🎉 Hoàn thành!

Sau khi deploy xong, bạn có:
- ✅ Frontend URL: `https://phammemmuahang.vercel.app`
- ✅ Backend URL: `https://phammemmuahang-backend.vercel.app`
- ✅ Auto deploy khi push code
- ✅ HTTPS miễn phí
- ✅ Global CDN

Chia sẻ URL với team và bắt đầu sử dụng! 🚀
