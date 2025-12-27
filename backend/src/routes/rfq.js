import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { sendRFQEmail } from '../utils/email.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all RFQs
router.get('/', authenticate, async (req, res) => {
  try {
    const rfqs = await prisma.rFQ.findMany({
      include: {
        request: {
          include: {
            project: true,
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        quotations: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rfqs);
  } catch (error) {
    console.error('Get RFQs error:', error);
    res.status(500).json({ error: 'Failed to get RFQs' });
  }
});

// Get RFQ by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        request: {
          include: {
            project: true,
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        quotations: {
          include: {
            supplier: true,
            items: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error) {
    console.error('Get RFQ error:', error);
    res.status(500).json({ error: 'Failed to get RFQ' });
  }
});

// Check stock availability before creating RFQ
router.post('/check-stock', authenticate, async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await prisma.materialRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const stockAnalysis = request.items.map(item => {
      const stock = item.material.stock || 0;
      const requested = item.quantity;
      const needPurchase = Math.max(0, requested - stock);
      const canFulfillFromStock = stock >= requested;

      return {
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        unit: item.material.unit,
        requested,
        stock,
        needPurchase,
        canFulfillFromStock,
      };
    });

    const allCanFulfill = stockAnalysis.every(item => item.canFulfillFromStock);
    const totalNeedPurchase = stockAnalysis.reduce((sum, item) => sum + item.needPurchase, 0);

    res.json({
      requestId: request.id,
      requestCode: request.code,
      items: stockAnalysis,
      summary: {
        allCanFulfill,
        totalNeedPurchase,
        shouldCreateRFQ: !allCanFulfill,
        shouldIssueFromStock: allCanFulfill,
      },
    });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ error: 'Failed to check stock' });
  }
});

// Get RFQ by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        request: {
          include: {
            project: true,
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        quotations: {
          include: {
            supplier: true,
            items: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }

    res.json(rfq);
  } catch (error) {
    console.error('Get RFQ error:', error);
    res.status(500).json({ error: 'Failed to get RFQ' });
  }
});

// Create RFQ from request
router.post('/', authenticate, async (req, res) => {
  try {
    const { requestId, supplierIds, deadline, description } = req.body;

    // Get request details
    const request = await prisma.materialRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        project: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Calculate quantities needed (subtract stock)
    const itemsNeedPurchase = [];
    let totalNeedPurchase = 0;

    for (const item of request.items) {
      const stock = item.material.stock || 0;
      const requested = item.quantity;
      const needPurchase = Math.max(0, requested - stock);
      
      if (needPurchase > 0) {
        itemsNeedPurchase.push({
          materialId: item.materialId,
          materialName: item.material.name,
          requested,
          stock,
          needPurchase,
        });
        totalNeedPurchase += needPurchase;
      }
    }

    // If all items can be fulfilled from stock, don't create RFQ
    if (totalNeedPurchase === 0) {
      return res.status(400).json({ 
        error: 'Tất cả vật tư đều đủ trong kho. Vui lòng xuất kho nội bộ thay vì tạo RFQ.',
        canFulfillFromStock: true,
      });
    }

    // Generate code
    const count = await prisma.rFQ.count();
    const code = `RFQ${String(count + 1).padStart(5, '0')}`;

    // Create description with stock info
    let rfqDescription = description || request.description || '';
    rfqDescription += '\n\n📦 Phân tích tồn kho:\n';
    for (const item of itemsNeedPurchase) {
      rfqDescription += `- ${item.materialName}: Yêu cầu ${item.requested}, Tồn kho ${item.stock} → Cần mua ${item.needPurchase}\n`;
    }

    // Create RFQ with items (only items that need purchase)
    const rfq = await prisma.rFQ.create({
      data: {
        code,
        requestId: parseInt(requestId),
        title: `Yêu cầu báo giá - ${request.project.name}`,
        description: rfqDescription,
        deadline: new Date(deadline),
        items: {
          create: itemsNeedPurchase.map(item => ({
            materialId: item.materialId,
            quantity: item.needPurchase, // Chỉ số lượng cần mua (đã trừ tồn kho)
            note: `Yêu cầu: ${item.requested}, Tồn kho: ${item.stock}`,
          })),
        },
      },
      include: {
        request: {
          include: {
            project: true,
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    // Send email to suppliers
    const suppliers = await prisma.supplier.findMany({
      where: {
        id: {
          in: supplierIds.map(id => parseInt(id)),
        },
      },
    });

    for (const supplier of suppliers) {
      try {
        await sendRFQEmail(supplier, rfq);
      } catch (emailError) {
        console.error(`Failed to send email to ${supplier.email}:`, emailError);
      }
    }

    // Update request status
    await prisma.materialRequest.update({
      where: { id: parseInt(requestId) },
      data: { status: 'processing' },
    });

    res.status(201).json(rfq);
  } catch (error) {
    console.error('Create RFQ error:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  }
});

export default router;
