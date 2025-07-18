const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// POST /api/ratings/save
router.post('/save', async (req, res) => {
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

router.get('/list', async (req, res) => {
  const { cardName, cardSub } = req.query;

  try {
    const ratings = await Rating.find({ cardName, cardSub });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ msg: 'Greška pri čitanju iz baze' });
  }
});

// GET ocenjivači za konkretnu temu
router.get('/raters', async (req, res) => {
  try {
    const { cardName, cardSub } = req.query;
    const ratings = await Rating.find({ cardName, cardSub }).select('rater score -_id');
    res.json(ratings);
  } catch (err) {
    console.error("Greška pri dohvatanju ocenjivača:", err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

// Dohvati sve ocenjene članove za datog ocenjivača
router.get('/evaluated', async (req, res) => {
  const { rater } = req.query;

  try {
    const ocene = await Rating.find({ rater });
    const jedinstveni = [...new Set(ocene.map(o => o.cardName))]; // Izvuci samo imena ocenjenih
    res.json(jedinstveni);
  } catch (err) {
    console.error("Greška u /evaluated:", err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

// Dohvati sve ocene koje je jedan korisnik dao drugom
router.get('/dossier', async (req, res) => {
  const { raterName, ratedName } = req.query;

  try {
    const ocene = await Rating.find({
      rater: raterName,        // Ispravno polje iz baze
      cardName: ratedName      // Ispravno polje iz baze
    });
    res.json(ocene);
  } catch (err) {
    console.error("Greška u ruti /dossier:", err);
    res.status(500).json({ msg: 'Greška pri učitavanju ocena' });
  }
});

// Nova ruta za računanje indirektne ocene (z)
router.get('/z-score', async (req, res) => {
  const { raterName, ratedName, mainCategory } = req.query;

  if (!raterName || !ratedName || !mainCategory) {
    return res.status(400).json({ msg: 'Nedostaju parametri.' });
  }

  try {
    const allRatings = await Rating.find({
      raterName,
      ratedName
    });

    // Mapiranje potkategorija na glavne kategorije
    const subToMainCategory = {
      "Lice": "Izgled",
      "Stas": "Izgled",
      "OpšTe stanje": "Zdravlje",
      "Kondicija": "Zdravlje",
      "Snaga": "FizičKa snaga",
      "IzdržLjivost": "FizičKa snaga"
    };

    const relevantSubs = Object.entries(subToMainCategory)
      .filter(([_, cat]) => cat === mainCategory)
      .map(([sub, _]) => sub);

    // Filtriraj samo ocene za potkategorije te glavne kategorije
    const potkategorije = allRatings.filter(entry =>
      relevantSubs.includes(entry.cardSub)
    );

    const y = relevantSubs.length;
    const v = potkategorije.filter(p => typeof p.score === 'number').length;
    const w = y - v;
    const a = potkategorije.reduce((acc, p) => acc + (typeof p.score === 'number' ? p.score : 0), 0);
    const b = w * 5;
    const x = a + b;
    const z = y > 0 ? x / y : 0;

    res.json({ z, x, y, a, b, v, w });

  } catch (err) {
    console.error("Greška pri računanju z:", err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

module.exports = router;
