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

router.get('/evaluated', async (req, res) => {
  const { raterId } = req.query;

  if (!raterId) {
    return res.status(400).json({ msg: "Nedostaje raterId." });
  }

  try {
    const ocene = await Rating.find({ raterId });
    const jedinstveni = [...new Set(ocene.map(o => o.cardName))];
    res.json(jedinstveni);
  } catch (err) {
    console.error("Greška u /evaluated:", err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

module.exports = router;
