import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get project by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        materialRequests: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        purchaseOrders: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Create project (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create projects' });
    }

    const { code, name, description, startDate, endDate, budget } = req.body;

    // Check if code already exists
    const existing = await prisma.project.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({ error: 'Project code already exists' });
    }

    const project = await prisma.project.create({
      data: {
        code,
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        status: 'active',
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project (admin only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update projects' });
    }

    const { name, description, startDate, endDate, budget, status } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (status !== undefined) updateData.status = status;

    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete projects' });
    }

    // Check if project has related data
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        materialRequests: true,
        purchaseOrders: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.materialRequests.length > 0 || project.purchaseOrders.length > 0) {
      // Soft delete: change status to cancelled
      await prisma.project.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'cancelled' },
      });
      return res.json({ message: 'Project cancelled (has related data)' });
    }

    // Hard delete if no related data
    await prisma.project.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
