import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get tracking history for a PO
router.get('/po/:poId', authenticate, async (req, res) => {
  try {
    const trackings = await prisma.deliveryTracking.findMany({
      where: { poId: parseInt(req.params.poId) },
      orderBy: { createdAt: 'asc' },
    });
    res.json(trackings);
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({ error: 'Failed to get tracking' });
  }
});

// Add tracking update
router.post('/', authenticate, async (req, res) => {
  try {
    const { poId, status, location, note, isDelayed, delayReason } = req.body;

    // Get PO details
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(poId) },
      include: {
        project: true,
        supplier: true,
        quotation: {
          include: {
            rfq: {
              include: {
                request: {
                  include: {
                    createdBy: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'PO not found' });
    }

    // Create tracking record
    const tracking = await prisma.deliveryTracking.create({
      data: {
        poId: parseInt(poId),
        status,
        location,
        note,
        isDelayed: isDelayed || false,
        delayReason,
      },
    });

    // Update PO status based on tracking status
    let poStatus = po.status;
    if (status === 'shipped' || status === 'in_transit') {
      poStatus = 'in_transit';
    } else if (status === 'arrived') {
      poStatus = 'delivered';
    }

    await prisma.purchaseOrder.update({
      where: { id: parseInt(poId) },
      data: { 
        status: poStatus,
        actualDelivery: status === 'arrived' ? new Date() : po.actualDelivery,
      },
    });

    // Send notification if delayed
    if (isDelayed) {
      // Notify requester
      await prisma.notification.create({
        data: {
          userId: po.quotation.rfq.request.createdById,
          title: '⚠️ Đơn hàng bị chậm trễ',
          message: `Đơn hàng ${po.code} bị chậm trễ. Lý do: ${delayReason}`,
          type: 'warning',
          link: `/po/${po.id}`,
        },
      });

      // Send email
      try {
        await sendEmail({
          to: po.quotation.rfq.request.createdBy.email,
          subject: `⚠️ Đơn hàng ${po.code} bị chậm trễ`,
          html: `
            <h2>Thông báo chậm trễ giao hàng</h2>
            <p>Đơn hàng <strong>${po.code}</strong> cho dự án <strong>${po.project.name}</strong> bị chậm trễ.</p>
            <p><strong>Lý do:</strong> ${delayReason}</p>
            <p><strong>Vị trí hiện tại:</strong> ${location || 'Đang cập nhật'}</p>
            <p><strong>Ghi chú:</strong> ${note || 'Không có'}</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send delay email:', emailError);
      }
    }

    // Send notification when arrived
    if (status === 'arrived') {
      await prisma.notification.create({
        data: {
          userId: po.quotation.rfq.request.createdById,
          title: '✅ Đơn hàng đã đến',
          message: `Đơn hàng ${po.code} đã đến. Vui lòng kiểm tra và xác nhận.`,
          type: 'success',
          link: `/po/${po.id}`,
        },
      });
    }

    res.status(201).json(tracking);
  } catch (error) {
    console.error('Create tracking error:', error);
    res.status(500).json({ error: 'Failed to create tracking' });
  }
});

// Check for delayed orders (cron job endpoint)
router.get('/check-delays', authenticate, async (req, res) => {
  try {
    const now = new Date();
    
    // Find POs that are overdue
    const delayedPOs = await prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ['approved', 'sent', 'in_transit'],
        },
        deliveryDate: {
          lt: now,
        },
      },
      include: {
        project: true,
        supplier: true,
        quotation: {
          include: {
            rfq: {
              include: {
                request: {
                  include: {
                    createdBy: true,
                  },
                },
              },
            },
          },
        },
        trackings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const results = [];

    for (const po of delayedPOs) {
      // Check if already marked as delayed
      const lastTracking = po.trackings[0];
      if (lastTracking && lastTracking.isDelayed) {
        continue; // Already notified
      }

      // Create delay tracking
      await prisma.deliveryTracking.create({
        data: {
          poId: po.id,
          status: 'delayed',
          isDelayed: true,
          delayReason: 'Quá hạn giao hàng dự kiến',
          note: `Dự kiến: ${po.deliveryDate.toLocaleDateString('vi-VN')}`,
        },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: po.quotation.rfq.request.createdById,
          title: '⚠️ Cảnh báo chậm trễ',
          message: `Đơn hàng ${po.code} đã quá hạn giao hàng dự kiến`,
          type: 'warning',
          link: `/po/${po.id}`,
        },
      });

      results.push({
        poCode: po.code,
        expectedDate: po.deliveryDate,
        daysLate: Math.floor((now - po.deliveryDate) / (1000 * 60 * 60 * 24)),
      });
    }

    res.json({
      message: `Checked ${delayedPOs.length} delayed orders`,
      results,
    });
  } catch (error) {
    console.error('Check delays error:', error);
    res.status(500).json({ error: 'Failed to check delays' });
  }
});

export default router;
