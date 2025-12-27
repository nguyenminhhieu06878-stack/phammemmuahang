import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all quotations
router.get('/', authenticate, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        rfq: {
          include: {
            request: {
              include: {
                project: true,
              },
            },
          },
        },
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quotations);
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Failed to get quotations' });
  }
});

// Get quotations by RFQ
router.get('/rfq/:rfqId', authenticate, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { rfqId: parseInt(req.params.rfqId) },
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });
    res.json(quotations);
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Failed to get quotations' });
  }
});

// Create quotation (for suppliers)
router.post('/', authenticate, async (req, res) => {
  try {
    const { rfqId, deliveryTime, paymentTerms, note, validUntil, items } = req.body;

    // Get supplier profile
    const supplier = await prisma.supplier.findUnique({
      where: { userId: req.user.id },
    });

    if (!supplier) {
      return res.status(403).json({ error: 'Only suppliers can create quotations' });
    }

    // Generate code
    const count = await prisma.quotation.count();
    const code = `QT${String(count + 1).padStart(5, '0')}`;

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const quotation = await prisma.quotation.create({
      data: {
        code,
        rfqId: parseInt(rfqId),
        supplierId: supplier.id,
        totalAmount,
        deliveryTime: parseInt(deliveryTime),
        paymentTerms,
        note,
        validUntil: new Date(validUntil),
        submittedAt: new Date(),
        items: {
          create: items.map(item => ({
            materialId: parseInt(item.materialId),
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            amount: parseFloat(item.quantity) * parseFloat(item.unitPrice),
            note: item.note,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// Select quotation
router.post('/:id/select', authenticate, async (req, res) => {
  try {
    const quotationId = parseInt(req.params.id);

    // Update selected quotation
    const quotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'selected' },
    });

    // Reject other quotations
    await prisma.quotation.updateMany({
      where: {
        rfqId: quotation.rfqId,
        id: { not: quotationId },
      },
      data: { status: 'rejected' },
    });

    res.json(quotation);
  } catch (error) {
    console.error('Select quotation error:', error);
    res.status(500).json({ error: 'Failed to select quotation' });
  }
});

export default router;
