import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTransactions() {
  try {
    console.log('🗑️  Đang xóa dữ liệu giao dịch...');

    // Xóa theo thứ tự (từ con đến cha)
    await prisma.supplierEvaluation.deleteMany();
    console.log('✅ Đã xóa đánh giá NCC');

    await prisma.payment.deleteMany();
    console.log('✅ Đã xóa thanh toán');

    await prisma.delivery.deleteMany();
    console.log('✅ Đã xóa giao hàng');

    await prisma.purchaseOrderItem.deleteMany();
    console.log('✅ Đã xóa chi tiết PO');

    await prisma.approval.deleteMany();
    console.log('✅ Đã xóa phê duyệt');

    await prisma.purchaseOrder.deleteMany();
    console.log('✅ Đã xóa đơn đặt hàng (PO)');

    await prisma.quotationItem.deleteMany();
    console.log('✅ Đã xóa chi tiết báo giá');

    await prisma.quotation.deleteMany();
    console.log('✅ Đã xóa báo giá');

    await prisma.rFQ.deleteMany();
    console.log('✅ Đã xóa RFQ');

    await prisma.materialRequestItem.deleteMany();
    console.log('✅ Đã xóa chi tiết yêu cầu');

    await prisma.materialRequest.deleteMany();
    console.log('✅ Đã xóa yêu cầu vật tư');

    await prisma.notification.deleteMany();
    console.log('✅ Đã xóa thông báo');

    await prisma.materialQuota.deleteMany();
    console.log('✅ Đã xóa định mức vật tư');

    console.log('\n✨ Hoàn tất! Dữ liệu giao dịch đã được xóa.');
    console.log('📦 Master data (Users, Projects, Materials, Suppliers) vẫn còn nguyên.');
    console.log('\n🎯 Bạn có thể test lại từ đầu!');

  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTransactions();
