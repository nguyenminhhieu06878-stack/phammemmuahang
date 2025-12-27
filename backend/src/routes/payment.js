import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create payment request (UNC - Ủy nhiệm chi)
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      poId, 
      amount, 
      paymentMethod, 
      paymentType, 
      invoiceNumber,
      vatInvoiceFile,
      deliveryNote,
      acceptanceNote,
      note 
    } = req.body;

    // Get PO with delivery info
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(poId) },
      include: {
        delivery: true,
        payment: true,
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'PO not found' });
    }

    if (po.payment) {
      return res.status(400).json({ error: 'Payment already exists for this PO' });
    }

    // Validate required documents for postpay
    if (paymentType === 'postpay') {
      const missingDocs = [];
      
      if (!po.delivery) {
        missingDocs.push('Biên bản giao nhận (chưa kiểm hàng)');
      }
      
      if (!vatInvoiceFile) {
        missingDocs.push('Hóa đơn VAT');
      }
      
      if (missingDocs.length > 0) {
        return res.status(400).json({ 
          error: 'Thiếu chứng từ bắt buộc',
          missingDocuments: missingDocs,
          message: `Không thể thanh toán vì thiếu: ${missingDocs.join(', ')}`
        });
      }
    }

    // Generate UNC number
    const count = await prisma.payment.count();
    const uncNumber = `UNC${String(count + 1).padStart(5, '0')}`;

    // Create payment request
    const payment = await prisma.payment.create({
      data: {
        poId: parseInt(poId),
        amount: parseFloat(amount),
        paymentMethod,
        paymentType,
        invoiceNumber,
        vatInvoiceFile,
        deliveryNote: deliveryNote || 'Đã có biên bản giao nhận',
        acceptanceNote: acceptanceNote || 'Đã nghiệm thu đạt yêu cầu',
        uncNumber,
        note,
        status: 'pending', // Chờ Kế toán trưởng duyệt
      },
      include: {
        po: {
          include: {
            project: true,
            supplier: true,
          },
        },
      },
    });

    // Create notification for Kế toán trưởng
    const ketoan = await prisma.user.findFirst({
      where: { role: 'ke_toan' },
    });

    if (ketoan) {
      await prisma.notification.create({
        data: {
          userId: ketoan.id,
          title: '💰 Yêu cầu thanh toán mới',
          message: `Ủy nhiệm chi ${uncNumber} cho PO ${po.code} cần phê duyệt`,
          type: 'info',
          link: `/po/${po.id}`,
        },
      });
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Approve payment (Kế toán trưởng)
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { status, note } = req.body; // approved or rejected

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        po: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: status === 'approved' ? 'approved' : 'cancelled',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        note: note || payment.note,
      },
    });

    // If approved, mark as paid
    if (status === 'approved') {
      await prisma.payment.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      // Update PO status to completed
      await prisma.purchaseOrder.update({
        where: { id: payment.poId },
        data: { status: 'completed' },
      });
    }

    res.json(updatedPayment);
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// Get payment by PO
router.get('/po/:poId', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { poId: parseInt(req.params.poId) },
    });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment' });
  }
});

// Check if can create payment (validate documents)
router.post('/check-documents', authenticate, async (req, res) => {
  try {
    const { poId, paymentType } = req.body;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(poId) },
      include: {
        delivery: true,
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'PO not found' });
    }

    const documents = {
      po: { exists: true, name: 'Đơn đặt hàng (PO)' },
      delivery: { 
        exists: !!po.delivery, 
        name: 'Biên bản giao nhận',
        required: paymentType === 'postpay'
      },
      vatInvoice: { 
        exists: false, // Will be uploaded
        name: 'Hóa đơn VAT',
        required: paymentType === 'postpay'
      },
    };

    const missingRequired = Object.entries(documents)
      .filter(([key, doc]) => doc.required && !doc.exists)
      .map(([key, doc]) => doc.name);

    const canProceed = missingRequired.length === 0;

    res.json({
      canProceed,
      documents,
      missingRequired,
      message: canProceed 
        ? 'Đủ chứng từ để thanh toán' 
        : `Thiếu: ${missingRequired.join(', ')}`
    });
  } catch (error) {
    console.error('Check documents error:', error);
    res.status(500).json({ error: 'Failed to check documents' });
  }
});

export default router;
