import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all stock issues
router.get('/', authenticate, async (req, res) => {
  try {
    const issues = await prisma.stockIssue.findMany({
      include: {
        request: {
          include: {
            project: true,
            createdBy: {
              select: { name: true },
            },
          },
        },
        issuer: {
          select: { name: true },
        },
        items: {
          include: {
            material: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(issues);
  } catch (error) {
    console.error('Get stock issues error:', error);
    res.status(500).json({ error: 'Failed to get stock issues' });
  }
});

// Get stock issue by request ID
router.get('/request/:requestId', authenticate, async (req, res) => {
  try {
    const issue = await prisma.stockIssue.findUnique({
      where: { requestId: parseInt(req.params.requestId) },
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
        issuer: {
          select: { name: true },
        },
        receiver: {
          select: { name: true },
        },
        items: {
          include: {
            material: true,
          },
        },
      },
    });
    res.json(issue);
  } catch (error) {
    console.error('Get stock issue error:', error);
    res.status(500).json({ error: 'Failed to get stock issue' });
  }
});

// Create stock issue (xuất kho nội bộ)
router.post('/', authenticate, async (req, res) => {
  try {
    const { requestId, items, note } = req.body;

    // Get request details
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

    if (request.status !== 'approved') {
      return res.status(400).json({ error: 'Request must be approved first' });
    }

    // Check if stock issue already exists
    const existing = await prisma.stockIssue.findUnique({
      where: { requestId: parseInt(requestId) },
    });

    if (existing) {
      return res.status(400).json({ error: 'Stock issue already exists for this request' });
    }

    // Validate stock availability
    for (const item of items) {
      const material = await prisma.material.findUnique({
        where: { id: parseInt(item.materialId) },
      });

      if (!material) {
        return res.status(404).json({ error: `Material ${item.materialId} not found` });
      }

      if (material.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${material.name}. Available: ${material.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    // Generate code
    const count = await prisma.stockIssue.count();
    const code = `XK${String(count + 1).padStart(5, '0')}`;

    // Create stock issue
    const issue = await prisma.stockIssue.create({
      data: {
        code,
        requestId: parseInt(requestId),
        issuedBy: req.user.id,
        note,
        status: 'pending', // Chưa trừ stock, chờ Giám sát xác nhận
        issuedAt: new Date(),
        items: {
          create: items.map((item) => ({
            materialId: parseInt(item.materialId),
            quantity: parseFloat(item.quantity),
            note: item.note,
          })),
        },
      },
      include: {
        request: {
          include: {
            project: true,
          },
        },
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    // KHÔNG trừ stock ở đây, chờ Giám sát xác nhận

    // Update request status to "in_transit"
    await prisma.materialRequest.update({
      where: { id: parseInt(requestId) },
      data: { status: 'processing' },
    });

    res.status(201).json(issue);
  } catch (error) {
    console.error('Create stock issue error:', error);
    res.status(500).json({ error: 'Failed to create stock issue' });
  }
});

// Check if request can be fulfilled from stock
router.post('/check', authenticate, async (req, res) => {
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

    const analysis = {
      canFulfillFully: true,
      canFulfillPartially: false,
      items: [],
    };

    for (const item of request.items) {
      const available = item.material.stock;
      const requested = item.quantity;
      const canFulfill = available >= requested;
      const fulfillQuantity = Math.min(available, requested);
      const needToBuy = Math.max(0, requested - available);

      analysis.items.push({
        materialId: item.materialId,
        materialName: item.material.name,
        materialUnit: item.material.unit,
        requested,
        available,
        canFulfill,
        fulfillQuantity,
        needToBuy,
      });

      if (!canFulfill) {
        analysis.canFulfillFully = false;
      }

      if (fulfillQuantity > 0) {
        analysis.canFulfillPartially = true;
      }
    }

    res.json(analysis);
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ error: 'Failed to check stock' });
  }
});

// Confirm receive stock (Giám sát xác nhận đã nhận hàng)
router.post('/:id/receive', authenticate, async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const { note } = req.body;

    // Get stock issue
    const issue = await prisma.stockIssue.findUnique({
      where: { id: issueId },
      include: {
        items: true,
        request: true,
      },
    });

    if (!issue) {
      return res.status(404).json({ error: 'Stock issue not found' });
    }

    if (issue.status !== 'pending') {
      return res.status(400).json({ error: 'Stock issue already processed' });
    }

    // Update stock issue
    const updatedIssue = await prisma.stockIssue.update({
      where: { id: issueId },
      data: {
        status: 'completed',
        receivedBy: req.user.id,
        receivedAt: new Date(),
        note: note || issue.note,
      },
      include: {
        request: {
          include: {
            project: true,
          },
        },
        issuer: {
          select: { name: true },
        },
        receiver: {
          select: { name: true },
        },
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    // NOW trừ stock khi Giám sát xác nhận
    for (const item of issue.items) {
      await prisma.material.update({
        where: { id: item.materialId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Update request status to completed
    await prisma.materialRequest.update({
      where: { id: issue.requestId },
      data: { status: 'completed' },
    });

    res.json(updatedIssue);
  } catch (error) {
    console.error('Confirm receive error:', error);
    res.status(500).json({ error: 'Failed to confirm receive' });
  }
});

export default router;
