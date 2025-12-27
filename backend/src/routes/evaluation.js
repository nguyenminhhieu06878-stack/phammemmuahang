import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  try {
    const { supplierId, poId, priceScore, qualityScore, deliveryScore, supportScore, comment } = req.body;

    const avgScore = (priceScore + qualityScore + deliveryScore + supportScore) / 4;

    const evaluation = await prisma.supplierEvaluation.create({
      data: {
        supplierId: parseInt(supplierId),
        evaluatorId: req.user.id,
        poId: parseInt(poId),
        priceScore: parseInt(priceScore),
        qualityScore: parseInt(qualityScore),
        deliveryScore: parseInt(deliveryScore),
        supportScore: parseInt(supportScore),
        avgScore,
        comment,
      },
    });

    // Update supplier rating
    const allEvaluations = await prisma.supplierEvaluation.findMany({
      where: { supplierId: parseInt(supplierId) },
    });

    const totalAvg = allEvaluations.reduce((sum, e) => sum + e.avgScore, 0) / allEvaluations.length;

    await prisma.supplier.update({
      where: { id: parseInt(supplierId) },
      data: { rating: totalAvg },
    });

    res.status(201).json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
});

router.get('/supplier/:supplierId', authenticate, async (req, res) => {
  try {
    const evaluations = await prisma.supplierEvaluation.findMany({
      where: { supplierId: parseInt(req.params.supplierId) },
      include: {
        evaluator: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get evaluations' });
  }
});

export default router;
