const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const EvaluatorLog = require('../models/EvaluatorLog');

// ===== OCENE =====
router.post('/ratings/save', async (req, res) => {
  const { cardName, cardSub, rater, score } = req.body;

  try {
    let rating = await Rating.findOne({ cardName, cardSub, rater });
    if (rating) {
      rating.score = score;
      await rating.save();
    } else {
      rating = new Rating({ cardName, cardSub, rater, score });
      await rating.save();
    }
    res.json({ msg: 'Ocena sačuvana', rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška pri upisu ocene u bazu' });
  }
});

router.get('/ratings/list', async (req, res) => {
  const { cardName, cardSub } = req.query;

  try {
    const ratings = await Rating.find({ cardName, cardSub });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ msg: 'Greška pri čitanju iz baze' });
  }
});

router.get('/ratings/raters', async (req, res) => {
  try {
    const { cardName, cardSub } = req.query;
    const ratings = await Rating.find({ cardName, cardSub }).select('rater score -_id');
    res.json(ratings);
  } catch (err) {
    console.error("Greška pri dohvatanju ocenjivača:", err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

// ===== DNEVNIK OCENJIVANJA =====
router.post('/log/add', async (req, res) => {
  const { rater, evaluated } = req.body;

  try {
    let log = await EvaluatorLog.findOne({ rater });

    if (!log) {
      log = new EvaluatorLog({ rater, evaluated: [evaluated] });
    } else if (!log.evaluated.includes(evaluated)) {
      log.evaluated.push(evaluated);
    }

    await log.save();
    res.json({ msg: 'Upisano u dnevnik.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška pri upisu u dnevnik.' });
  }
});

router.get('/log/rater/:name', async (req, res) => {
  try {
    const log = await EvaluatorLog.findOne({ rater: req.params.name });
    if (!log) return res.json({ evaluated: [] });
    res.json({ evaluated: log.evaluated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška pri dohvatanju dnevnika.' });
  }
});

module.exports = router;
