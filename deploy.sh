#!/bin/bash

# Script deploy nhanh lên Vercel
# Sử dụng: ./deploy.sh

echo "🚀 Deployment Script for Vercel"
echo "================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI chưa được cài đặt"
    echo "Chạy: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI đã được cài đặt"
echo ""

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Đăng nhập Vercel..."
    vercel login
fi

echo "✅ Đã đăng nhập Vercel"
echo ""

# Ask which deployment method
echo "Chọn phương thức deploy:"
echo "1. Deploy toàn bộ (Monorepo)"
echo "2. Deploy Backend riêng"
echo "3. Deploy Frontend riêng"
read -p "Nhập lựa chọn (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying monorepo..."
        vercel
        ;;
    2)
        echo ""
        echo "📦 Deploying backend..."
        cd backend
        vercel
        cd ..
        ;;
    3)
        echo ""
        echo "📦 Deploying frontend..."
        cd frontend
        vercel
        cd ..
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ"
        exit 1
        ;;
esac

echo ""
echo "✅ Deploy hoàn tất!"
echo ""
echo "📝 Nhớ:"
echo "1. Cấu hình Environment Variables trong Vercel Dashboard"
echo "2. Chạy migration: cd backend && vercel env pull && npx prisma migrate deploy"
echo "3. Seed data: npx prisma db seed"
echo ""
echo "📖 Xem thêm: DEPLOYMENT-CHECKLIST.md"
