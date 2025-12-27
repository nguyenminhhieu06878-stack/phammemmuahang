import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all materials
router.get('/', authenticate, async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      include: {
        category: true,
      },
      orderBy: { code: 'asc' },
    });
    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to get materials' });
  }
});

// Get material categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await prisma.materialCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Create material (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create materials' });
    }

    const { code, name, description, unit, categoryId, refPrice, stock, minStock } = req.body;

    // Check if code already exists
    const existing = await prisma.material.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({ error: 'Material code already exists' });
    }

    const material = await prisma.material.create({
      data: {
        code,
        name,
        description,
        unit,
        categoryId: parseInt(categoryId),
        refPrice: refPrice ? parseFloat(refPrice) : null,
        stock: stock ? parseInt(stock) : 0,
        minStock: minStock ? parseInt(minStock) : 0,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// Update material (admin only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update materials' });
    }

    const { name, description, unit, categoryId, refPrice, stock, minStock } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (refPrice !== undefined) updateData.refPrice = refPrice ? parseFloat(refPrice) : null;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (minStock !== undefined) updateData.minStock = parseInt(minStock);

    const material = await prisma.material.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        category: true,
      },
    });

    res.json(material);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// Delete material (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete materials' });
    }

    // Check if material has related data
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        requestItems: true,
        quotationItems: true,
        purchaseOrderItems: true,
      },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (material.requestItems.length > 0 || material.quotationItems.length > 0 || material.purchaseOrderItems.length > 0) {
      return res.status(400).json({ error: 'Cannot delete material with related data' });
    }

    await prisma.material.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;
