import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all requests
router.get('/', authenticate, async (req, res) => {
  try {
    const requests = await prisma.materialRequest.findMany({
      include: {
        project: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            material: {
              include: {
                category: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

// Get request by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await prisma.materialRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        project: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            material: {
              include: {
                category: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: { level: 'asc' },
        },
        rfq: {
          include: {
            quotations: {
              include: {
                supplier: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to get request' });
  }
});

// Create request
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, description, priority, needByDate, items } = req.body;

    // Generate code
    const count = await prisma.materialRequest.count();
    const code = `YC${String(count + 1).padStart(5, '0')}`;

    const request = await prisma.materialRequest.create({
      data: {
        code,
        projectId: parseInt(projectId),
        createdById: req.user.id,
        description,
        priority: priority || 'normal',
        needByDate: needByDate ? new Date(needByDate) : null,
        items: {
          create: items.map(item => ({
            materialId: parseInt(item.materialId),
            quantity: parseFloat(item.quantity),
            note: item.note,
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
        items: {
          include: {
            material: true,
          },
        },
        approvals: true,
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Update request status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    const request = await prisma.materialRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: {
        project: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Approve/Reject request
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { status, comment } = req.body;
    const requestId = parseInt(req.params.id);

    // Find pending approval for this user's level
    const request = await prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Find the pending approval that this user can approve
    const pendingApproval = request.approvals.find(a => a.status === 'pending');
    
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
        approvedAt: new Date(),
      },
    });

    // Check if all approvals are done
    const allApprovals = await prisma.approval.findMany({
      where: { requestId },
    });

    const allApproved = allApprovals.every(a => a.status === 'approved');
    const hasRejected = allApprovals.some(a => a.status === 'rejected');

    // Update request status
    if (hasRejected) {
      await prisma.materialRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });
    } else if (allApproved) {
      await prisma.materialRequest.update({
        where: { id: requestId },
        data: { status: 'approved' },
      });

      // Update usedQuantity in MaterialQuota when request is fully approved
      const requestWithItems = await prisma.materialRequest.findUnique({
        where: { id: requestId },
        include: { items: true },
      });

      for (const item of requestWithItems.items) {
        // Find quota for this material in this project
        const quota = await prisma.materialQuota.findUnique({
          where: {
            projectId_materialId: {
              projectId: requestWithItems.projectId,
              materialId: item.materialId,
            },
          },
        });

        if (quota) {
          // Update usedQuantity
          await prisma.materialQuota.update({
            where: { id: quota.id },
            data: {
              usedQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    }

    res.json(approval);
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

export default router;
