const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/:subCategory/:etapa', (req, res) => {
  const { subCategory, etapa } = req.params;
  const filePath = path.join(__dirname, '..', 'tutorials', subCategory, `etapa-${etapa}.html`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Etapa nije pronađena.' });
  }

  const htmlContent = fs.readFileSync(filePath, 'utf8');
  res.json({ html: htmlContent });
});

const Panel = require('../models/Panel');

// POST /api/training/save
router.post('/save', async (req, res) => {
  const { userId, sub, etapa } = req.body;

  try {
    let panel = await Panel.findOne({ userId });

    if (!panel) {
      panel = new Panel({ userId, categories: [], selectedTrainings: [] });
    }

    const existing = panel.selectedTrainings.find(t => t.subcategory === sub);

    if (existing) {
      existing.etapa = etapa;
    } else {
      panel.selectedTrainings.push({ subcategory: sub, etapa });
    }

    await panel.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri snimanju treninga.' });
  }
});

// GET /api/training/selected/:userId/:sub
router.get('/selected/:userId/:sub', async (req, res) => {
  const { userId, sub } = req.params;

  try {
    const panel = await Panel.findOne({ userId });

    if (!panel) return res.json({ etapa: null });

    const record = panel.selectedTrainings.find(t => t.subcategory === sub);
    res.json({ etapa: record ? record.etapa : null });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju treninga.' });
  }
});

// POST /api/training/save-full
router.post('/save-full', async (req, res) => {
  const { userId, sub, etapa, html, delay, delayMap } = req.body;

  try {
    let panel = await Panel.findOne({ userId });
    if (!panel) panel = new Panel({ userId, categories: [], selectedTrainings: [] });

    const existing = panel.selectedTrainings.find(t => t.subcategory === sub);
    if (existing) {
      existing.etapa = etapa;
      existing.html = html;
      existing.delay = delay ?? 0;
      existing.delayMap = delayMap ?? {};
    } else {
      panel.selectedTrainings.push({
        subcategory: sub,
        etapa,
        html,
        delay: delay ?? 0,
        delayMap: delayMap ?? {}
      });
    }

    await panel.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri snimanju kompletnog treninga.' });
  }
});

// GET /api/training/saved
router.get('/saved', async (req, res) => {
  const { user, sub } = req.query;

  try {
    const panel = await Panel.findOne({ userId: user });
    const record = panel?.selectedTrainings?.find(t => t.subcategory === sub);
    if (record?.html) {
      const legacyDelay = record.delay || 0;
      const migratedDelayMap = record.delayMap || (legacyDelay > 0 ? { "1": legacyDelay } : {});

      return res.json({
        html: record.html,
        delay: legacyDelay,
        delayMap: migratedDelayMap
      });
    } else {
      return res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju sačuvanog treninga.' });
  }
});

module.exports = router;
