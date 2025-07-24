const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Panel = require('../models/Panel');

// ✅ Ruta 1: Snimi ocenu
router.post('/save', async (req, res) => {
  const { cardName, cardSub, rater, score } = req.body;

  if (!cardName || !cardSub || !rater || score === undefined) {
    return res.status(400).json({ msg: 'Nedostaju podaci za ocenu.' });
  }

  try {
    let existing = await Rating.findOne({ cardName, cardSub, rater });
    if (existing) {
      existing.score = score;
      await existing.save();
      return res.json({ msg: 'Ocena ažurirana.' });
    }

    const nova = new Rating({ cardName, cardSub, rater, score });
    await nova.save();
    res.json({ msg: 'Ocena sačuvana.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

// ✅ Ruta 2: Dohvati ocenjivače određene kartice
router.get('/raters', async (req, res) => {
  const { cardName, cardSub } = req.query;

  if (!cardName || !cardSub) {
    return res.status(400).json({ msg: 'Nedostaju parametri.' });
  }

  try {
    const ocene = await Rating.find({ cardName, cardSub });
    const rezultat = ocene.map(r => ({
      rater: r.rater,
      score: r.score
    }));
    res.json(rezultat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška prilikom dohvatanja ocenjivača.' });
  }
});

// ✅ Ruta 3: Lista ocenjenih od strane korisnika (za my-log.html)
router.get('/evaluated', async (req, res) => {
  const { rater } = req.query;
  if (!rater) return res.status(400).json({ msg: 'Nedostaje rater.' });

  try {
    const ocene = await Rating.find({ rater });
    const jedinstveni = [...new Set(ocene.map(o => o.cardName))];
    res.json(jedinstveni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

// ✅ Ruta 4: Ocene za dosije jednog člana
router.get('/dossier', async (req, res) => {
  const { raterName, ratedName } = req.query;

  if (!raterName || !ratedName) {
    return res.status(400).json({ msg: 'Nedostaju parametri.' });
  }

  try {
    const ocene = await Rating.find({ cardName: ratedName, rater: raterName });
    res.json(ocene);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

// /api/ratings/indirect-raters?cardName=Ivan Nikolić&cardMain=Inteligencija
router.get("/indirect-raters", async (req, res) => {
  const { cardName, cardMain } = req.query;

  if (!cardName || !cardMain) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const directRaters = await Rating.find({ cardName, cardSub: cardMain }).distinct("rater");

    const subRatings = await Rating.find({ cardName });

    const indirectMap = new Map();

    subRatings.forEach(rating => {
      if (rating.cardSub !== cardMain && !directRaters.includes(rating.rater)) {
        if (!indirectMap.has(rating.rater)) {
          indirectMap.set(rating.rater, []);
        }
        indirectMap.get(rating.rater).push(rating.score);
      }
    });

    const indirectList = [];

    for (const [rater, scores] of indirectMap.entries()) {
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      indirectList.push({ rater, score: parseFloat(average.toFixed(2)) });
    }

    res.json(indirectList);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
