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

// ✅ Ruta 5: Indirektni ocenjivači (NOVO!)
router.get('/indirect-raters', async (req, res) => {
  const { cardName, cardSub } = req.query;

  if (!cardName || !cardSub) {
    return res.status(400).json({ msg: 'Nedostaje cardName ili cardSub' });
  }

  try {
    const [ime, ...prezimeDelovi] = cardName.trim().split(" ");
    const prezime = prezimeDelovi.join(" ").trim();

    const panel = await Panel.findOne({ name: ime, surname: prezime });
    if (!panel) return res.status(404).json({ msg: 'Panel nije pronađen.' });

    const glavnaKategorija = panel.categories.find(cat => cat.name.toLowerCase() === cardSub.toLowerCase());
    if (!glavnaKategorija) return res.status(404).json({ msg: 'Glavna kategorija nije pronađena.' });

    const potkategorije = glavnaKategorija.subcategories.map(sub => sub.name);

    const direktneOcene = await Rating.find({ cardName, cardSub });
    const direktniOcenjivaci = new Set(direktneOcene.map(r => r.rater));

    const indirektneOcene = await Rating.find({
      cardName,
      cardSub: { $in: potkategorije }
    });

    const rezultat = [];

    for (const ocena of indirektneOcene) {
      if (!direktniOcenjivaci.has(ocena.rater)) {
        rezultat.push({ rater: ocena.rater });
        direktniOcenjivaci.add(ocena.rater);
      }
    }

    res.json(rezultat);
  } catch (err) {
    console.error("Greška:", err);
    res.status(500).json({ msg: 'Greška na serveru' });
  }
});

module.exports = router;
