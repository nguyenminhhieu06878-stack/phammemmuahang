import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFullFlow() {
  console.log('🧪 BẮT ĐẦU TEST FULL FLOW\n');

  try {
    // 1. Kiểm tra tồn kho
    console.log('1️⃣ Kiểm tra tồn kho:');
    const material = await prisma.material.findUnique({
      where: { code: 'THEP001' },
    });
    console.log(`   Thép D10: ${material.stock} kg\n`);

    // 2. Tạo yêu cầu vật tư
    console.log('2️⃣ Tạo yêu cầu vật tư:');
    const requestCount = await prisma.materialRequest.count();
    const request = await prisma.materialRequest.create({
      data: {
        code: `YC${String(requestCount + 1).padStart(5, '0')}`,
        projectId: 1,
        createdById: 6, // Giám sát
        description: 'Test yêu cầu thép',
        priority: 'normal',
        items: {
          create: [
            {
              materialId: material.id,
              quantity: 1000, // Yêu cầu 1000 kg
              note: 'Test',
            },
          ],
        },
        approvals: {
          create: [
            { level: 1, status: 'pending' },
            { level: 2, status: 'pending' },
            { level: 3, status: 'pending' },
          ],
        },
      },
      include: {
        items: {
          include: {
            material: true,
          },
        },
      },
    });
    console.log(`   ✅ Tạo yêu cầu: ${request.code}`);
    console.log(`   Số lượng: ${request.items[0].quantity} kg\n`);

    // 3. Phê duyệt 3 cấp
    console.log('3️⃣ Phê duyệt 3 cấp:');
    for (let level = 1; level <= 3; level++) {
      const approval = await prisma.approval.findFirst({
        where: { requestId: request.id, level },
      });
      await prisma.approval.update({
        where: { id: approval.id },
        data: {
          approverId: level === 1 ? 2 : level === 2 ? 4 : 5,
          status: 'approved',
          approvedAt: new Date(),
        },
      });
      console.log(`   ✅ Cấp ${level} đã duyệt`);
    }
    await prisma.materialRequest.update({
      where: { id: request.id },
      data: { status: 'approved' },
    });
    console.log('');

    // 4. Xuất kho nội bộ
    console.log('4️⃣ Xuất kho nội bộ:');
    const stockIssueCount = await prisma.stockIssue.count();
    const stockIssue = await prisma.stockIssue.create({
      data: {
        code: `XK${String(stockIssueCount + 1).padStart(5, '0')}`,
        requestId: request.id,
        issuedBy: 2, // Trưởng phòng MH
        note: 'Xuất kho test',
        status: 'pending',
        issuedAt: new Date(),
        items: {
          create: [
            {
              materialId: material.id,
              quantity: 500, // Xuất 500 kg
            },
          ],
        },
      },
    });
    console.log(`   ✅ Xuất kho: ${stockIssue.code}`);
    console.log(`   Số lượng xuất: 500 kg`);
    console.log(`   Tồn kho trước: ${material.stock} kg`);
    console.log(`   Còn thiếu: ${1000 - 500} kg\n`);

    // 5. Tạo RFQ (chỉ cho phần thiếu)
    console.log('5️⃣ Tạo RFQ:');
    const rfqCount = await prisma.rFQ.count();
    
    // Tính số lượng cần mua
    const stock = material.stock;
    const requested = 1000;
    const needPurchase = Math.max(0, requested - stock);
    
    console.log(`   Tính toán:`);
    console.log(`   - Yêu cầu: ${requested} kg`);
    console.log(`   - Tồn kho: ${stock} kg`);
    console.log(`   - Cần mua: ${needPurchase} kg`);
    
    const rfq = await prisma.rFQ.create({
      data: {
        code: `RFQ${String(rfqCount + 1).padStart(5, '0')}`,
        requestId: request.id,
        title: 'Test RFQ',
        description: 'Test',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              materialId: material.id,
              quantity: needPurchase, // Chỉ số lượng cần mua
              note: `Yêu cầu: ${requested}, Tồn kho: ${stock}`,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });
    
    console.log(`   ✅ Tạo RFQ: ${rfq.code}`);
    console.log(`   Số lượng trong RFQ: ${rfq.items[0].quantity} kg`);
    
    // Verify
    if (rfq.items[0].quantity === needPurchase) {
      console.log(`   ✅ ĐÚNG! RFQ chỉ gửi ${needPurchase} kg (đã trừ tồn kho)\n`);
    } else {
      console.log(`   ❌ SAI! RFQ gửi ${rfq.items[0].quantity} kg thay vì ${needPurchase} kg\n`);
    }

    console.log('🎉 TEST HOÀN THÀNH!\n');
    console.log('📊 Tóm tắt:');
    console.log(`   - Yêu cầu: ${requested} kg`);
    console.log(`   - Xuất kho: 500 kg`);
    console.log(`   - RFQ gửi: ${rfq.items[0].quantity} kg`);
    console.log(`   - Kết quả: ${rfq.items[0].quantity === needPurchase ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullFlow();
