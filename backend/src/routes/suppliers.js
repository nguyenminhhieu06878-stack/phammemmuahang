import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all suppliers
router.get('/', authenticate, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
});

// Get supplier by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        evaluations: {
          include: {
            evaluator: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to get supplier' });
  }
});

// Create supplier (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create suppliers' });
    }

    const { email, password, name, phone, companyName, taxCode, address, contactPerson } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate supplier code
    const count = await prisma.supplier.count();
    const code = `NCC${String(count + 1).padStart(4, '0')}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and supplier in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'ncc',
          active: true,
        },
      });

      // Create supplier profile
      const supplier = await tx.supplier.create({
        data: {
          userId: user.id,
          code,
          companyName,
          taxCode,
          address,
          phone,
          email,
          contactPerson,
          rating: 0,
          status: 'active',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return supplier;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier (admin only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update suppliers' });
    }

    const { companyName, taxCode, address, phone, email, contactPerson, status } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: parseInt(req.params.id) },
      data: {
        companyName,
        taxCode,
        address,
        phone,
        email,
        contactPerson,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.json(supplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete/Deactivate supplier (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete suppliers' });
    }

    // Soft delete: set status to inactive and deactivate user
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await prisma.$transaction([
      prisma.supplier.update({
        where: { id: parseInt(req.params.id) },
        data: { status: 'inactive' },
      }),
      prisma.user.update({
        where: { id: supplier.userId },
        data: { active: false },
      }),
    ]);

    res.json({ message: 'Supplier deactivated successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
