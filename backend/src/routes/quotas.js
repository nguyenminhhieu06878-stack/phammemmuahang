import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all quotas
router.get('/', authenticate, async (req, res) => {
  try {
    const quotas = await prisma.materialQuota.findMany({
      include: {
        project: true,
        material: {
          include: {
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quotas);
  } catch (error) {
    console.error('Get quotas error:', error);
    res.status(500).json({ error: 'Failed to get quotas' });
  }
});

// Get quotas by project
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const quotas = await prisma.materialQuota.findMany({
      where: { projectId: parseInt(req.params.projectId) },
      include: {
        material: {
          include: {
            category: true,
          },
        },
      },
    });
    res.json(quotas);
  } catch (error) {
    console.error('Get project quotas error:', error);
    res.status(500).json({ error: 'Failed to get project quotas' });
  }
});

// Create or update quota
router.post('/', authenticate, async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'phong_os') {
      return res.status(403).json({ error: 'Only admin or phong_os can manage quotas' });
    }

    const { projectId, materialId, maxQuantity } = req.body;

    // Check if quota exists
    const existing = await prisma.materialQuota.findUnique({
      where: {
        projectId_materialId: {
          projectId: parseInt(projectId),
          materialId: parseInt(materialId),
        },
      },
    });

    let quota;
    if (existing) {
      // Update existing quota
      quota = await prisma.materialQuota.update({
        where: { id: existing.id },
        data: { maxQuantity: parseFloat(maxQuantity) },
        include: {
          project: true,
          material: true,
        },
      });
    } else {
      // Create new quota
      quota = await prisma.materialQuota.create({
        data: {
          projectId: parseInt(projectId),
          materialId: parseInt(materialId),
          maxQuantity: parseFloat(maxQuantity),
          createdById: req.user.id,
        },
        include: {
          project: true,
          material: true,
        },
      });
    }

    res.status(201).json(quota);
  } catch (error) {
    console.error('Create/Update quota error:', error);
    res.status(500).json({ error: 'Failed to create/update quota' });
  }
});

// Delete quota
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check permission
    if (req.user.role !== 'admin' && req.user.role !== 'phong_os') {
      return res.status(403).json({ error: 'Only admin or phong_os can delete quotas' });
    }

    await prisma.materialQuota.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Quota deleted successfully' });
  } catch (error) {
    console.error('Delete quota error:', error);
    res.status(500).json({ error: 'Failed to delete quota' });
  }
});

// Check quota for a request (used when creating request)
router.post('/check', authenticate, async (req, res) => {
  try {
    const { projectId, items } = req.body;

    const violations = [];

    for (const item of items) {
      // Get quota for this material in this project
      const quota = await prisma.materialQuota.findUnique({
        where: {
          projectId_materialId: {
            projectId: parseInt(projectId),
            materialId: parseInt(item.materialId),
          },
        },
        include: {
          material: true,
        },
      });

      if (quota) {
        // Calculate total requested quantity for this material in this project
        const existingRequests = await prisma.materialRequest.findMany({
          where: {
            projectId: parseInt(projectId),
            status: { in: ['pending', 'approved', 'processing'] },
          },
          include: {
            items: {
              where: { materialId: parseInt(item.materialId) },
            },
          },
        });

        const totalRequested = existingRequests.reduce((sum, req) => {
          return sum + req.items.reduce((itemSum, i) => itemSum + i.quantity, 0);
        }, 0);

        const newTotal = totalRequested + parseFloat(item.quantity);

        if (newTotal > quota.maxQuantity) {
          violations.push({
            materialId: item.materialId,
            materialName: quota.material.name,
            materialUnit: quota.material.unit,
            requestedQuantity: parseFloat(item.quantity),
            totalRequested: newTotal,
            maxQuantity: quota.maxQuantity,
            exceeded: newTotal - quota.maxQuantity,
          });
        }
      }
    }

    res.json({
      hasViolations: violations.length > 0,
      violations,
    });
  } catch (error) {
    console.error('Check quota error:', error);
    res.status(500).json({ error: 'Failed to check quota' });
  }
});

export default router;
