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

// Snimi indirektnu ocenu
router.post('/indirect', async (req, res) => {
  try {
    const { rater, rated, cardSub, score } = req.body;

    // Provera da li već postoji ta indirektna ocena (izbegavamo duplikate)
    const existing = await Rating.findOne({ rater, rated, cardSub, isIndirect: true });
    if (existing) {
      existing.score = score;
      await existing.save();
      return res.json({ message: "Ažurirana postojeća indirektna ocena." });
    }

    const newRating = new Rating({ rater, rated, cardSub, score, isIndirect: true });
    await newRating.save();
    res.status(201).json({ message: "Indirektna ocena sačuvana." });
  } catch (err) {
    res.status(500).json({ error: "Greška pri čuvanju indirektne ocene." });
  }
});

// Vrati sve ocenjivače za datu osobu i potkategoriju (direktne i indirektne)
router.get('/raters-full', async (req, res) => {
  try {
    const { cardName, cardSub } = req.query;
    const ratings = await Rating.find({ rated: cardName, cardSub });

    const result = ratings.map(r => ({
      rater: r.rater,
      score: r.score,
      isIndirect: r.isIndirect || false
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Greška pri učitavanju ocenjivača." });
  }
});

module.exports = router;
