#!/bin/bash

echo "🚀 Quick Deploy Script"
echo "====================="
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Chưa login Vercel"
    echo "Chạy: vercel login"
    echo ""
    echo "Sau khi login xong, chạy lại script này"
    exit 1
fi

echo "✅ Đã login Vercel"
echo ""

# Deploy backend
echo "📦 Deploying backend..."
cd backend
vercel --prod
BACKEND_URL=$(vercel ls --prod 2>/dev/null | grep "https://" | head -1 | awk '{print $2}')
cd ..

echo ""
echo "✅ Backend deployed!"
echo "Backend URL: $BACKEND_URL"
echo ""

# Update frontend API URL
echo "📝 Updating frontend API URL..."
cat > frontend/src/services/api-config.js << EOF
export const API_BASE_URL = '${BACKEND_URL}/api';
EOF

# Update api.js to use config
sed -i.bak "s|baseURL: '/api'|baseURL: process.env.NODE_ENV === 'production' ? '${BACKEND_URL}/api' : '/api'|g" frontend/src/services/api.js

# Deploy frontend
echo "📦 Deploying frontend..."
cd frontend
vercel --prod
FRONTEND_URL=$(vercel ls --prod 2>/dev/null | grep "https://" | head -1 | awk '{print $2}')
cd ..

echo ""
echo "✅ Frontend deployed!"
echo "Frontend URL: $FRONTEND_URL"
echo ""

echo "🎉 Deploy hoàn tất!"
echo ""
echo "📝 Bước tiếp theo:"
echo "1. Vào Vercel Dashboard → Backend Project → Settings → Environment Variables"
echo "2. Thêm các biến sau:"
echo "   DATABASE_URL=postgresql://..."
echo "   JWT_SECRET=$(openssl rand -base64 32)"
echo "   FRONTEND_URL=$FRONTEND_URL"
echo "   NODE_ENV=production"
echo ""
echo "3. Chạy migration:"
echo "   cd backend"
echo "   vercel env pull"
echo "   npx prisma migrate deploy"
echo "   npx prisma db seed"
