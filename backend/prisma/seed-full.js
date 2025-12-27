import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding full demo data...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  try { await prisma.notification.deleteMany(); } catch (e) {}
  try { await prisma.supplierEvaluation.deleteMany(); } catch (e) {}
  try { await prisma.payment.deleteMany(); } catch (e) {}
  try { await prisma.delivery.deleteMany(); } catch (e) {}
  try { await prisma.purchaseOrderItem.deleteMany(); } catch (e) {}
  try { await prisma.purchaseOrder.deleteMany(); } catch (e) {}
  try { await prisma.quotationItem.deleteMany(); } catch (e) {}
  try { await prisma.quotation.deleteMany(); } catch (e) {}
  try { await prisma.rFQ.deleteMany(); } catch (e) {}
  try { await prisma.approval.deleteMany(); } catch (e) {}
  try { await prisma.materialRequestItem.deleteMany(); } catch (e) {}
  try { await prisma.materialRequest.deleteMany(); } catch (e) {}
  try { await prisma.material.deleteMany(); } catch (e) {}
  try { await prisma.materialCategory.deleteMany(); } catch (e) {}
  try { await prisma.project.deleteMany(); } catch (e) {}
  try { await prisma.supplier.deleteMany(); } catch (e) {}
  try { await prisma.user.deleteMany(); } catch (e) {}

  // Create users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.create({
    data: { email: 'admin@demo.com', password: await bcrypt.hash('admin123', 10), name: 'Admin', role: 'admin', phone: '0901234567' },
  });

  const truongPhong = await prisma.user.create({
    data: { email: 'truongphong@demo.com', password: hashedPassword, name: 'Nguyễn Văn A', role: 'truong_phong_mh', phone: '0901234568' },
  });

  const nhanVien = await prisma.user.create({
    data: { email: 'nhanvien@demo.com', password: hashedPassword, name: 'Trần Thị B', role: 'nhan_vien_mh', phone: '0901234569' },
  });

  const keToan = await prisma.user.create({
    data: { email: 'ketoan@demo.com', password: hashedPassword, name: 'Lê Văn C', role: 'ke_toan', phone: '0901234570' },
  });

  const giamDoc = await prisma.user.create({
    data: { email: 'giamdoc@demo.com', password: hashedPassword, name: 'Phạm Thị D', role: 'giam_doc', phone: '0901234571' },
  });

  const giamSat = await prisma.user.create({
    data: { email: 'giamsat@demo.com', password: hashedPassword, name: 'Hoàng Văn E', role: 'giam_sat', phone: '0901234572' },
  });

  const ncc1User = await prisma.user.create({
    data: { email: 'ncc1@demo.com', password: hashedPassword, name: 'Công ty TNHH Vật liệu XD ABC', role: 'ncc', phone: '0281234567' },
  });

  const ncc2User = await prisma.user.create({
    data: { email: 'ncc2@demo.com', password: hashedPassword, name: 'Công ty CP Thép XYZ', role: 'ncc', phone: '0281234568' },
  });

  const ncc3User = await prisma.user.create({
    data: { email: 'ncc3@demo.com', password: hashedPassword, name: 'Công ty TNHH Xi măng DEF', role: 'ncc', phone: '0281234569' },
  });

  // Create suppliers
  console.log('🏢 Creating suppliers...');
  const ncc1 = await prisma.supplier.create({
    data: { userId: ncc1User.id, code: 'NCC001', companyName: 'Công ty TNHH Vật liệu XD ABC', taxCode: '0123456789', address: '123 Đường ABC, Quận 1, TP.HCM', phone: '0281234567', email: 'ncc1@demo.com', contactPerson: 'Nguyễn Văn X', rating: 4.5 },
  });

  const ncc2 = await prisma.supplier.create({
    data: { userId: ncc2User.id, code: 'NCC002', companyName: 'Công ty CP Thép XYZ', taxCode: '0123456790', address: '456 Đường XYZ, Quận 2, TP.HCM', phone: '0281234568', email: 'ncc2@demo.com', contactPerson: 'Trần Thị Y', rating: 4.2 },
  });

  const ncc3 = await prisma.supplier.create({
    data: { userId: ncc3User.id, code: 'NCC003', companyName: 'Công ty TNHH Xi măng DEF', taxCode: '0123456791', address: '789 Đường DEF, Quận 3, TP.HCM', phone: '0281234569', email: 'ncc3@demo.com', contactPerson: 'Lê Văn Z', rating: 4.8 },
  });

  // Create projects
  console.log('🏗️  Creating projects...');
  const project1 = await prisma.project.create({
    data: { code: 'DA001', name: 'Dự án Chung cư Sunrise', description: 'Xây dựng chung cư cao cấp 30 tầng', status: 'active', startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31'), budget: 50000000000 },
  });

  const project2 = await prisma.project.create({
    data: { code: 'DA002', name: 'Dự án Nhà máy ABC', description: 'Xây dựng nhà máy sản xuất', status: 'active', startDate: new Date('2024-03-01'), endDate: new Date('2025-06-30'), budget: 30000000000 },
  });

  const project3 = await prisma.project.create({
    data: { code: 'DA003', name: 'Dự án Cầu Vượt XYZ', description: 'Xây dựng cầu vượt 3 tầng', status: 'active', startDate: new Date('2024-06-01'), endDate: new Date('2025-12-31'), budget: 80000000000 },
  });

  // Create material categories
  console.log('📦 Creating material categories...');
  const catVatLieu = await prisma.materialCategory.create({ data: { code: 'VL', name: 'Vật liệu xây dựng' } });
  const catThep = await prisma.materialCategory.create({ data: { code: 'THEP', name: 'Thép xây dựng' } });
  const catXiMang = await prisma.materialCategory.create({ data: { code: 'XM', name: 'Xi măng' } });
  const catDien = await prisma.materialCategory.create({ data: { code: 'DIEN', name: 'Thiết bị điện' } });

  // Create materials
  console.log('🧱 Creating materials...');
  const mat1 = await prisma.material.create({ data: { code: 'VL001', name: 'Xi măng PCB40', description: 'Xi măng bao 50kg', unit: 'bao', categoryId: catXiMang.id, refPrice: 95000, stock: 500, minStock: 100 } });
  const mat2 = await prisma.material.create({ data: { code: 'VL002', name: 'Cát xây dựng', description: 'Cát vàng loại 1', unit: 'm3', categoryId: catVatLieu.id, refPrice: 350000, stock: 50, minStock: 20 } });
  const mat3 = await prisma.material.create({ data: { code: 'VL003', name: 'Đá 1x2', description: 'Đá dăm 1x2', unit: 'm3', categoryId: catVatLieu.id, refPrice: 420000, stock: 30, minStock: 15 } });
  const mat4 = await prisma.material.create({ data: { code: 'THEP001', name: 'Thép D10', description: 'Thép tròn trơn D10', unit: 'kg', categoryId: catThep.id, refPrice: 18000, stock: 2000, minStock: 500 } });
  const mat5 = await prisma.material.create({ data: { code: 'THEP002', name: 'Thép D16', description: 'Thép tròn trơn D16', unit: 'kg', categoryId: catThep.id, refPrice: 17500, stock: 1500, minStock: 500 } });
  const mat6 = await prisma.material.create({ data: { code: 'VL004', name: 'Gạch block', description: 'Gạch block 10x20x40', unit: 'viên', categoryId: catVatLieu.id, refPrice: 3500, stock: 10000, minStock: 2000 } });

  // Create material requests
  console.log('📝 Creating material requests...');
  
  // Request 1: Approved, has RFQ, has quotations, has PO (completed flow)
  const req1 = await prisma.materialRequest.create({
    data: {
      code: 'YC001',
      projectId: project1.id,
      createdById: nhanVien.id,
      description: 'Yêu cầu vật tư cho tầng 5-10',
      status: 'approved',
      priority: 'high',
      needByDate: new Date('2024-12-20'),
      items: {
        create: [
          { materialId: mat1.id, quantity: 100, note: 'Xi măng cho đổ bê tông' },
          { materialId: mat2.id, quantity: 20, note: 'Cát xây' },
          { materialId: mat4.id, quantity: 500, note: 'Thép cốt thép' },
        ],
      },
      approvals: {
        create: [
          { approverId: truongPhong.id, level: 1, status: 'approved', approvedAt: new Date('2024-12-10'), comment: 'Đồng ý' },
          { approverId: keToan.id, level: 2, status: 'approved', approvedAt: new Date('2024-12-11'), comment: 'OK' },
        ],
      },
    },
  });

  // Request 2: Pending approval at level 1
  const req2 = await prisma.materialRequest.create({
    data: {
      code: 'YC002',
      projectId: project2.id,
      createdById: giamSat.id,
      description: 'Yêu cầu vật tư khẩn cấp',
      status: 'pending',
      priority: 'urgent',
      needByDate: new Date('2024-12-15'),
      items: {
        create: [
          { materialId: mat3.id, quantity: 15, note: 'Đá cho móng' },
          { materialId: mat5.id, quantity: 300, note: 'Thép D16' },
        ],
      },
      approvals: {
        create: [
          { approverId: truongPhong.id, level: 1, status: 'pending' },
        ],
      },
    },
  });

  // Request 3: Approved at level 1, pending at level 2
  const req3 = await prisma.materialRequest.create({
    data: {
      code: 'YC003',
      projectId: project3.id,
      createdById: nhanVien.id,
      description: 'Vật tư cho cầu vượt',
      status: 'pending',
      priority: 'normal',
      needByDate: new Date('2024-12-25'),
      items: {
        create: [
          { materialId: mat1.id, quantity: 200 },
          { materialId: mat4.id, quantity: 1000 },
        ],
      },
      approvals: {
        create: [
          { approverId: truongPhong.id, level: 1, status: 'approved', approvedAt: new Date('2024-12-12') },
          { approverId: keToan.id, level: 2, status: 'pending' },
        ],
      },
    },
  });

  // Create RFQ for req1
  console.log('📋 Creating RFQs...');
  const rfq1 = await prisma.rFQ.create({
    data: {
      code: 'RFQ001',
      requestId: req1.id,
      title: 'Yêu cầu báo giá - Dự án Chung cư Sunrise',
      description: 'Cần báo giá cho vật tư tầng 5-10',
      deadline: new Date('2024-12-18'),
      status: 'sent',
    },
  });

  // Create quotations for rfq1
  console.log('💰 Creating quotations...');
  const quot1 = await prisma.quotation.create({
    data: {
      code: 'BG001',
      rfqId: rfq1.id,
      supplierId: ncc1.id,
      totalAmount: 11500000,
      deliveryTime: 5,
      paymentTerms: 'Thanh toán sau 30 ngày',
      status: 'selected',
      validUntil: new Date('2024-12-25'),
      submittedAt: new Date('2024-12-13'),
      items: {
        create: [
          { materialId: mat1.id, quantity: 100, unitPrice: 95000, amount: 9500000 },
          { materialId: mat2.id, quantity: 20, unitPrice: 350000, amount: 7000000 },
          { materialId: mat4.id, quantity: 500, unitPrice: 18000, amount: 9000000 },
        ],
      },
    },
  });

  const quot2 = await prisma.quotation.create({
    data: {
      code: 'BG002',
      rfqId: rfq1.id,
      supplierId: ncc2.id,
      totalAmount: 12000000,
      deliveryTime: 7,
      paymentTerms: 'Thanh toán sau 45 ngày',
      status: 'pending',
      validUntil: new Date('2024-12-25'),
      submittedAt: new Date('2024-12-14'),
      items: {
        create: [
          { materialId: mat1.id, quantity: 100, unitPrice: 98000, amount: 9800000 },
          { materialId: mat2.id, quantity: 20, unitPrice: 360000, amount: 7200000 },
          { materialId: mat4.id, quantity: 500, unitPrice: 19000, amount: 9500000 },
        ],
      },
    },
  });

  // Create PO from quot1
  console.log('📄 Creating purchase orders...');
  const po1 = await prisma.purchaseOrder.create({
    data: {
      code: 'PO001',
      projectId: project1.id,
      quotationId: quot1.id,
      supplierId: ncc1.id,
      totalAmount: 25500000,
      vatAmount: 2550000,
      grandTotal: 28050000,
      deliveryAddress: '123 Đường Sunrise, Quận 1, TP.HCM',
      deliveryDate: new Date('2024-12-20'),
      paymentTerms: 'Thanh toán sau 30 ngày',
      status: 'approved',
      items: {
        create: [
          { materialId: mat1.id, quantity: 100, unitPrice: 95000, amount: 9500000 },
          { materialId: mat2.id, quantity: 20, unitPrice: 350000, amount: 7000000 },
          { materialId: mat4.id, quantity: 500, unitPrice: 18000, amount: 9000000 },
        ],
      },
      approvals: {
        create: [
          { approverId: truongPhong.id, level: 1, status: 'approved', approvedAt: new Date('2024-12-14'), comment: 'Giá tốt' },
          { approverId: keToan.id, level: 2, status: 'approved', approvedAt: new Date('2024-12-15'), comment: 'Đồng ý' },
          { approverId: giamDoc.id, level: 3, status: 'approved', approvedAt: new Date('2024-12-16'), comment: 'OK' },
        ],
      },
    },
  });

  // PO2: Pending approval at level 2
  const po2 = await prisma.purchaseOrder.create({
    data: {
      code: 'PO002',
      projectId: project2.id,
      quotationId: quot2.id,
      supplierId: ncc2.id,
      totalAmount: 26500000,
      vatAmount: 2650000,
      grandTotal: 29150000,
      deliveryAddress: '456 Đường ABC, Quận 2, TP.HCM',
      deliveryDate: new Date('2024-12-22'),
      paymentTerms: 'Thanh toán sau 45 ngày',
      status: 'pending',
      items: {
        create: [
          { materialId: mat1.id, quantity: 100, unitPrice: 98000, amount: 9800000 },
          { materialId: mat2.id, quantity: 20, unitPrice: 360000, amount: 7200000 },
          { materialId: mat4.id, quantity: 500, unitPrice: 19000, amount: 9500000 },
        ],
      },
      approvals: {
        create: [
          { approverId: truongPhong.id, level: 1, status: 'approved', approvedAt: new Date('2024-12-14') },
          { approverId: keToan.id, level: 2, status: 'pending' },
          { approverId: giamDoc.id, level: 3, status: 'pending' },
        ],
      },
    },
  });

  const quot3 = await prisma.quotation.create({
    data: {
      code: 'BG003',
      rfqId: rfq1.id,
      supplierId: ncc3.id,
      totalAmount: 11800000,
      deliveryTime: 3,
      paymentTerms: 'Thanh toán ngay',
      status: 'pending',
      validUntil: new Date('2024-12-25'),
      submittedAt: new Date('2024-12-13'),
      items: {
        create: [
          { materialId: mat3.id, quantity: 15, unitPrice: 420000, amount: 6300000 },
          { materialId: mat5.id, quantity: 300, unitPrice: 17500, amount: 5250000 },
        ],
      },
    },
  });

  const quot4 = await prisma.quotation.create({
    data: {
      code: 'BG004',
      rfqId: rfq1.id,
      supplierId: ncc1.id,
      totalAmount: 10000000,
      deliveryTime: 2,
      paymentTerms: 'Đã thanh toán',
      status: 'selected',
      validUntil: new Date('2024-12-25'),
      submittedAt: new Date('2024-12-01'),
      items: {
        create: [
          { materialId: mat6.id, quantity: 5000, unitPrice: 3500, amount: 17500000 },
        ],
      },
    },
  });

  // PO3: Sent to supplier (for delivery check)
  const po3 = await prisma.purchaseOrder.create({
    data: {
      code: 'PO003',
      projectId: project3.id,
      quotationId: quot3.id,
      supplierId: ncc3.id,
      totalAmount: 15000000,
      vatAmount: 1500000,
      grandTotal: 16500000,
      deliveryAddress: '789 Đường XYZ, Quận 3, TP.HCM',
      deliveryDate: new Date('2024-12-18'),
      paymentTerms: 'Thanh toán ngay',
      status: 'sent',
      items: {
        create: [
          { materialId: mat3.id, quantity: 15, unitPrice: 420000, amount: 6300000 },
          { materialId: mat5.id, quantity: 300, unitPrice: 17500, amount: 5250000 },
        ],
      },
      approvals: {
        create: [
          { approverId: truongPhong.id, level: 1, status: 'approved', approvedAt: new Date('2024-12-10') },
          { approverId: keToan.id, level: 2, status: 'approved', approvedAt: new Date('2024-12-11') },
          { approverId: giamDoc.id, level: 3, status: 'approved', approvedAt: new Date('2024-12-12') },
        ],
      },
    },
  });

  // PO4: Completed (for evaluation)
  const po4 = await prisma.purchaseOrder.create({
    data: {
      code: 'PO004',
      projectId: project1.id,
      quotationId: quot4.id,
      supplierId: ncc1.id,
      totalAmount: 10000000,
      vatAmount: 1000000,
      grandTotal: 11000000,
      deliveryAddress: '123 Đường Sunrise, Quận 1, TP.HCM',
      deliveryDate: new Date('2024-12-05'),
      paymentTerms: 'Đã thanh toán',
      status: 'completed',
      items: {
        create: [
          { materialId: mat6.id, quantity: 5000, unitPrice: 3500, amount: 17500000 },
        ],
      },
      approvals: {
        create: [
          { approverId: truongPhong.id, level: 1, status: 'approved', approvedAt: new Date('2024-12-01') },
          { approverId: keToan.id, level: 2, status: 'approved', approvedAt: new Date('2024-12-02') },
          { approverId: giamDoc.id, level: 3, status: 'approved', approvedAt: new Date('2024-12-03') },
        ],
      },
    },
  });

  console.log('🎉 Full demo data seeding completed!');
  console.log('\n📊 Summary:');
  console.log('- Users: 9');
  console.log('- Suppliers: 3');
  console.log('- Projects: 3');
  console.log('- Materials: 6');
  console.log('- Material Requests: 3');
  console.log('- RFQs: 1');
  console.log('- Quotations: 4');
  console.log('- Purchase Orders: 4');
  console.log('\n✅ Ready for demo!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
