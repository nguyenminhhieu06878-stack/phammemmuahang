import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in correct order due to foreign keys)
  try {
    await prisma.notification.deleteMany();
  } catch (e) {}
  try {
    await prisma.supplierEvaluation.deleteMany();
  } catch (e) {}
  try {
    await prisma.payment.deleteMany();
  } catch (e) {}
  try {
    await prisma.delivery.deleteMany();
  } catch (e) {}
  try {
    await prisma.purchaseOrderItem.deleteMany();
  } catch (e) {}
  try {
    await prisma.purchaseOrder.deleteMany();
  } catch (e) {}
  try {
    await prisma.quotationItem.deleteMany();
  } catch (e) {}
  try {
    await prisma.quotation.deleteMany();
  } catch (e) {}
  try {
    await prisma.rFQ.deleteMany();
  } catch (e) {}
  try {
    await prisma.approval.deleteMany();
  } catch (e) {}
  try {
    await prisma.materialRequestItem.deleteMany();
  } catch (e) {}
  try {
    await prisma.materialRequest.deleteMany();
  } catch (e) {}
  try {
    await prisma.materialQuota.deleteMany();
  } catch (e) {}
  try {
    await prisma.material.deleteMany();
  } catch (e) {}
  try {
    await prisma.materialCategory.deleteMany();
  } catch (e) {}
  try {
    await prisma.project.deleteMany();
  } catch (e) {}
  try {
    await prisma.supplier.deleteMany();
  } catch (e) {}
  try {
    await prisma.user.deleteMany();
  } catch (e) {}

  // Create users
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin',
      role: 'admin',
      phone: '0901234567',
    },
  });

  const truongPhong = await prisma.user.create({
    data: {
      email: 'truongphong@demo.com',
      password: hashedPassword,
      name: 'Nguyễn Văn A',
      role: 'truong_phong_mh',
      phone: '0901234568',
    },
  });

  const nhanVien = await prisma.user.create({
    data: {
      email: 'nhanvien@demo.com',
      password: hashedPassword,
      name: 'Trần Thị B',
      role: 'nhan_vien_mh',
      phone: '0901234569',
    },
  });

  const keToan = await prisma.user.create({
    data: {
      email: 'ketoan@demo.com',
      password: hashedPassword,
      name: 'Lê Văn C',
      role: 'ke_toan',
      phone: '0901234570',
    },
  });

  const giamDoc = await prisma.user.create({
    data: {
      email: 'giamdoc@demo.com',
      password: hashedPassword,
      name: 'Phạm Thị D',
      role: 'giam_doc',
      phone: '0901234571',
    },
  });

  const giamSat = await prisma.user.create({
    data: {
      email: 'giamsat@demo.com',
      password: hashedPassword,
      name: 'Hoàng Văn E',
      role: 'giam_sat',
      phone: '0901234572',
    },
  });

  // Create supplier users
  const ncc1User = await prisma.user.create({
    data: {
      email: 'ncc1@demo.com',
      password: hashedPassword,
      name: 'Công ty TNHH Vật liệu XD ABC',
      role: 'ncc',
      phone: '0281234567',
    },
  });

  const ncc2User = await prisma.user.create({
    data: {
      email: 'ncc2@demo.com',
      password: hashedPassword,
      name: 'Công ty CP Thép XYZ',
      role: 'ncc',
      phone: '0281234568',
    },
  });

  const ncc3User = await prisma.user.create({
    data: {
      email: 'ncc3@demo.com',
      password: hashedPassword,
      name: 'Công ty TNHH Xi măng DEF',
      role: 'ncc',
      phone: '0281234569',
    },
  });

  console.log('✅ Users created');

  // Create suppliers
  const ncc1 = await prisma.supplier.create({
    data: {
      userId: ncc1User.id,
      code: 'NCC001',
      companyName: 'Công ty TNHH Vật liệu XD ABC',
      taxCode: '0123456789',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      phone: '0281234567',
      email: 'ncc1@demo.com',
      contactPerson: 'Nguyễn Văn X',
      rating: 4.5,
    },
  });

  const ncc2 = await prisma.supplier.create({
    data: {
      userId: ncc2User.id,
      code: 'NCC002',
      companyName: 'Công ty CP Thép XYZ',
      taxCode: '0123456790',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      phone: '0281234568',
      email: 'ncc2@demo.com',
      contactPerson: 'Trần Thị Y',
      rating: 4.2,
    },
  });

  const ncc3 = await prisma.supplier.create({
    data: {
      userId: ncc3User.id,
      code: 'NCC003',
      companyName: 'Công ty TNHH Xi măng DEF',
      taxCode: '0123456791',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      phone: '0281234569',
      email: 'ncc3@demo.com',
      contactPerson: 'Lê Văn Z',
      rating: 4.8,
    },
  });

  console.log('✅ Suppliers created');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      code: 'DA001',
      name: 'Dự án Chung cư Sunrise',
      description: 'Xây dựng chung cư cao cấp 30 tầng',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      budget: 50000000000,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      code: 'DA002',
      name: 'Dự án Nhà máy ABC',
      description: 'Xây dựng nhà máy sản xuất',
      status: 'active',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-06-30'),
      budget: 30000000000,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      code: 'DA003',
      name: 'Dự án Cầu Vượt XYZ',
      description: 'Xây dựng cầu vượt 3 tầng',
      status: 'active',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-12-31'),
      budget: 80000000000,
    },
  });

  console.log('✅ Projects created');

  // Create material categories
  const catVatLieu = await prisma.materialCategory.create({
    data: { code: 'VL', name: 'Vật liệu xây dựng' },
  });

  const catThep = await prisma.materialCategory.create({
    data: { code: 'THEP', name: 'Thép xây dựng' },
  });

  const catXiMang = await prisma.materialCategory.create({
    data: { code: 'XM', name: 'Xi măng' },
  });

  const catDien = await prisma.materialCategory.create({
    data: { code: 'DIEN', name: 'Thiết bị điện' },
  });

  console.log('✅ Material categories created');

  // Create materials
  const materials = await Promise.all([
    prisma.material.create({
      data: {
        code: 'VL001',
        name: 'Xi măng PCB40',
        description: 'Xi măng bao 50kg',
        unit: 'bao',
        categoryId: catXiMang.id,
        refPrice: 95000,
        stock: 500,
        minStock: 100,
      },
    }),
    prisma.material.create({
      data: {
        code: 'VL002',
        name: 'Cát xây dựng',
        description: 'Cát vàng loại 1',
        unit: 'm3',
        categoryId: catVatLieu.id,
        refPrice: 350000,
        stock: 50,
        minStock: 20,
      },
    }),
    prisma.material.create({
      data: {
        code: 'VL003',
        name: 'Đá 1x2',
        description: 'Đá dăm 1x2',
        unit: 'm3',
        categoryId: catVatLieu.id,
        refPrice: 420000,
        stock: 30,
        minStock: 15,
      },
    }),
    prisma.material.create({
      data: {
        code: 'THEP001',
        name: 'Thép D10',
        description: 'Thép tròn trơn D10',
        unit: 'kg',
        categoryId: catThep.id,
        refPrice: 18000,
        stock: 2000,
        minStock: 500,
      },
    }),
    prisma.material.create({
      data: {
        code: 'THEP002',
        name: 'Thép D16',
        description: 'Thép tròn trơn D16',
        unit: 'kg',
        categoryId: catThep.id,
        refPrice: 17500,
        stock: 1500,
        minStock: 500,
      },
    }),
    prisma.material.create({
      data: {
        code: 'VL004',
        name: 'Gạch block',
        description: 'Gạch block 10x20x40',
        unit: 'viên',
        categoryId: catVatLieu.id,
        refPrice: 3500,
        stock: 10000,
        minStock: 2000,
      },
    }),
    prisma.material.create({
      data: {
        code: 'DIEN001',
        name: 'Dây điện 2x2.5',
        description: 'Dây điện đôi 2x2.5mm',
        unit: 'm',
        categoryId: catDien.id,
        refPrice: 8500,
        stock: 500,
        minStock: 100,
      },
    }),
    prisma.material.create({
      data: {
        code: 'DIEN002',
        name: 'Ổ cắm 3 chấu',
        description: 'Ổ cắm 3 chấu 16A',
        unit: 'cái',
        categoryId: catDien.id,
        refPrice: 45000,
        stock: 200,
        minStock: 50,
      },
    }),
  ]);

  console.log('✅ Materials created');

  // Create Material Quotas (BOQ)
  console.log('📊 Creating Material Quotas (BOQ)...');

  // Quotas for Project 1 (Chung cư Sunrise)
  await prisma.materialQuota.create({
    data: {
      projectId: project1.id,
      materialId: materials[0].id, // Xi măng PCB40
      maxQuantity: 5000, // 5000 bao
      usedQuantity: 1200, // Đã dùng 1200 bao (24%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project1.id,
      materialId: materials[1].id, // Cát xây dựng
      maxQuantity: 500, // 500 m3
      usedQuantity: 380, // Đã dùng 380 m3 (76% - cảnh báo cam)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project1.id,
      materialId: materials[2].id, // Đá 1x2
      maxQuantity: 300, // 300 m3
      usedQuantity: 280, // Đã dùng 280 m3 (93% - cảnh báo đỏ)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project1.id,
      materialId: materials[3].id, // Thép D10
      maxQuantity: 50000, // 50 tấn
      usedQuantity: 15000, // Đã dùng 15 tấn (30%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project1.id,
      materialId: materials[5].id, // Gạch block
      maxQuantity: 100000, // 100,000 viên
      usedQuantity: 45000, // Đã dùng 45,000 viên (45%)
      createdById: admin.id,
    },
  });

  // Quotas for Project 2 (Nhà máy ABC)
  await prisma.materialQuota.create({
    data: {
      projectId: project2.id,
      materialId: materials[0].id, // Xi măng PCB40
      maxQuantity: 3000, // 3000 bao
      usedQuantity: 500, // Đã dùng 500 bao (17%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project2.id,
      materialId: materials[1].id, // Cát xây dựng
      maxQuantity: 200, // 200 m3
      usedQuantity: 50, // Đã dùng 50 m3 (25%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project2.id,
      materialId: materials[4].id, // Thép D16
      maxQuantity: 30000, // 30 tấn
      usedQuantity: 8000, // Đã dùng 8 tấn (27%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project2.id,
      materialId: materials[6].id, // Dây điện
      maxQuantity: 5000, // 5000 m
      usedQuantity: 4500, // Đã dùng 4500 m (90% - cảnh báo đỏ)
      createdById: admin.id,
    },
  });

  // Quotas for Project 3 (Cầu Vượt XYZ)
  await prisma.materialQuota.create({
    data: {
      projectId: project3.id,
      materialId: materials[0].id, // Xi măng PCB40
      maxQuantity: 8000, // 8000 bao
      usedQuantity: 2000, // Đã dùng 2000 bao (25%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project3.id,
      materialId: materials[2].id, // Đá 1x2
      maxQuantity: 1000, // 1000 m3
      usedQuantity: 300, // Đã dùng 300 m3 (30%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project3.id,
      materialId: materials[3].id, // Thép D10
      maxQuantity: 100000, // 100 tấn
      usedQuantity: 35000, // Đã dùng 35 tấn (35%)
      createdById: admin.id,
    },
  });

  await prisma.materialQuota.create({
    data: {
      projectId: project3.id,
      materialId: materials[4].id, // Thép D16
      maxQuantity: 80000, // 80 tấn
      usedQuantity: 60000, // Đã dùng 60 tấn (75% - cảnh báo cam)
      createdById: admin.id,
    },
  });

  console.log('✅ Material Quotas (BOQ) created');
  console.log('   - Project 1: 5 quotas (1 đỏ, 1 cam, 3 xanh)');
  console.log('   - Project 2: 4 quotas (1 đỏ, 3 xanh)');
  console.log('   - Project 3: 4 quotas (1 cam, 3 xanh)');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
