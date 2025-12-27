import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        project: true,
        supplier: true,
        quotation: {
          include: {
            rfq: {
              include: {
                request: true,
              },
            },
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: { name: true, role: true },
            },
          },
        },
        delivery: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get purchase orders' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { quotationId, deliveryAddress, deliveryDate, note } = req.body;

    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(quotationId) },
      include: {
        items: true,
        rfq: {
          include: {
            request: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const count = await prisma.purchaseOrder.count();
    const code = `PO${String(count + 1).padStart(5, '0')}`;

    const vatAmount = quotation.totalAmount * 0.1;
    const grandTotal = quotation.totalAmount + vatAmount;

    const po = await prisma.purchaseOrder.create({
      data: {
        code,
        projectId: quotation.rfq.request.projectId,
        quotationId: parseInt(quotationId),
        supplierId: quotation.supplierId,
        totalAmount: quotation.totalAmount,
        vatAmount,
        grandTotal,
        deliveryAddress,
        deliveryDate: new Date(deliveryDate),
        paymentTerms: quotation.paymentTerms,
        note,
        items: {
          create: quotation.items.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
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
        project: true,
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
        approvals: true,
      },
    });

    res.status(201).json(po);
  } catch (error) {
    console.error('Create PO error:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { status, comment, signature } = req.body;
    const poId = parseInt(req.params.id);

    // Find pending approval for this user's level
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { approvals: true },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Find the pending approval that this user can approve
    const pendingApproval = po.approvals.find(a => a.status === 'pending');
    
    if (!pendingApproval) {
      return res.status(400).json({ error: 'No pending approval found' });
    }

    // Update the approval
    const approval = await prisma.approval.update({
      where: { id: pendingApproval.id },
      data: {
        approverId: req.user.id,
        status,
        comment,
        signature,
        approvedAt: new Date(),
      },
    });

    // Check if all approvals are done
    const allApprovals = await prisma.approval.findMany({
      where: { poId },
    });

    const allApproved = allApprovals.every(a => a.status === 'approved');
    const hasRejected = allApprovals.some(a => a.status === 'rejected');

    // Update PO status
    if (hasRejected) {
      await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'rejected' },
      });
    } else if (allApproved) {
      await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'approved' },
      });
    }

    res.json(approval);
  } catch (error) {
    console.error('Approve PO error:', error);
    res.status(500).json({ error: 'Failed to approve PO' });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const po = await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update PO status' });
  }
});

export default router;
