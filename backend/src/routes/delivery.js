import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  try {
    const { poId, deliveryDate, receivedBy, actualQuantity, qualityStatus, photos, note } = req.body;

    const delivery = await prisma.delivery.create({
      data: {
        poId: parseInt(poId),
        deliveryDate: new Date(deliveryDate),
        receivedBy,
        actualQuantity: JSON.stringify(actualQuantity),
        qualityStatus,
        photos: photos ? JSON.stringify(photos) : null,
        note,
      },
    });

    await prisma.purchaseOrder.update({
      where: { id: parseInt(poId) },
      data: { status: 'delivered' },
    });

    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

router.get('/po/:poId', authenticate, async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { poId: parseInt(req.params.poId) },
      include: {
        po: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get delivery' });
  }
});

export default router;
