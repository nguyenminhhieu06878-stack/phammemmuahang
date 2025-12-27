import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/stats', authenticate, async (req, res) => {
  try {
    const [
      totalProjects,
      totalRequests,
      totalPOs,
      totalSpent,
      pendingRequests,
      pendingPOs,
    ] = await Promise.all([
      prisma.project.count({ where: { status: 'active' } }),
      prisma.materialRequest.count(),
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.aggregate({
        _sum: { grandTotal: true },
        where: { status: { in: ['approved', 'sent', 'delivered', 'completed'] } },
      }),
      prisma.materialRequest.count({ where: { status: 'pending' } }),
      prisma.purchaseOrder.count({ where: { status: 'pending' } }),
    ]);

    res.json({
      totalProjects,
      totalRequests,
      totalPOs,
      totalSpent: totalSpent._sum.grandTotal || 0,
      pendingRequests,
      pendingPOs,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/spending-by-project', authenticate, async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { in: ['approved', 'sent', 'delivered', 'completed'] } },
      include: { project: true },
    });

    const byProject = pos.reduce((acc, po) => {
      const projectName = po.project.name;
      if (!acc[projectName]) {
        acc[projectName] = 0;
      }
      acc[projectName] += po.grandTotal;
      return acc;
    }, {});

    res.json(byProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get spending by project' });
  }
});

router.get('/spending-by-category', authenticate, async (req, res) => {
  try {
    const items = await prisma.purchaseOrderItem.findMany({
      include: {
        material: {
          include: {
            category: true,
          },
        },
        po: true,
      },
    });

    const byCategory = items.reduce((acc, item) => {
      if (item.po.status === 'cancelled' || item.po.status === 'rejected') {
        return acc;
      }
      const categoryName = item.material.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += item.amount;
      return acc;
    }, {});

    res.json(byCategory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get spending by category' });
  }
});

router.get('/top-suppliers', authenticate, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          where: { status: { in: ['approved', 'sent', 'delivered', 'completed'] } },
        },
      },
    });

    const topSuppliers = suppliers
      .map(s => ({
        name: s.companyName,
        totalOrders: s.purchaseOrders.length,
        totalAmount: s.purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0),
        rating: s.rating,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    res.json(topSuppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get top suppliers' });
  }
});

router.get('/po-status', authenticate, async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCount = pos.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    res.json(statusCount);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get PO status' });
  }
});

export default router;
