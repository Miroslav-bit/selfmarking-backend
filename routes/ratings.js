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
    const ocene = await Rating.find({
      cardName,
      cardSub: new RegExp(`^${cardSub}$`, 'i')  // ignorise velika/mala slova
    });
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
    // Dobavi direktne ocenjivače
    const directRaters = await Rating.find({ cardName, cardSub: cardMain }).distinct("rater");

    // Sve ocene koje je osoba dobila
    const allRatings = await Rating.find({ cardName });

    // Mapiraj potkategorije glavne kategorije
    const subToMain = {
      "matematika": "Obrazovanje",
      "fizika": "Obrazovanje",
      "hemija": "Obrazovanje",
      "astronomija": "Obrazovanje",
      "geologija": "Obrazovanje",
      "logika": "Inteligencija",
      "komunikativnost": "Inteligencija",
      "duhovitost": "Inteligencija",
      "hrabrost": "Karakterne osobine",
      "samouverenost": "Karakterne osobine",
      "smirenost": "Karakterne osobine",
      "empatija": "Karakterne osobine"
    };

    const relevantSubs = Object.entries(subToMain)
      .filter(([_, main]) => main.toLowerCase() === cardMain.toLowerCase())
      .map(([sub]) => sub);

    const y = relevantSubs.length;
    const indirectMap = new Map();

    allRatings.forEach(({ rater, cardSub, score }) => {
      if (
        relevantSubs.includes(cardSub?.toLowerCase()) &&
        !directRaters.includes(rater)
      ) {
        if (!indirectMap.has(rater)) {
          indirectMap.set(rater, []);
        }
        indirectMap.get(rater).push(score);
      }
    });

    const result = [];

    for (const [rater, scores] of indirectMap.entries()) {
      const v = scores.length;
      const w = y - v;
      const a = scores.reduce((acc, val) => acc + val, 0);
      const b = w * 5;
      const x = a + b;
      const z = y > 0 ? +(x / y).toFixed(2) : null;
      result.push({ rater, score: z });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
