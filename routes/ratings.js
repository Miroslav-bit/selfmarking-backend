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

const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Panel = require('../models/Panel');

// NOVA RUTA: Indirektni ocenjivači
router.get('/indirect-raters', async (req, res) => {
  const { cardName, cardSub } = req.query;

  if (!cardName || !cardSub) {
    return res.status(400).json({ msg: 'Nedostaje cardName ili cardSub' });
  }

  try {
    // 1. Nađi panel vlasnika (po imenu)
    const [ime, ...prezimeDelovi] = cardName.trim().split(" ");
    const prezime = prezimeDelovi.join(" ").trim();

    const panel = await Panel.findOne({ name: ime, surname: prezime });
    if (!panel) return res.status(404).json({ msg: 'Panel nije pronađen.' });

    // 2. Pronađi glavnu kategoriju po imenu
    const glavnaKategorija = panel.categories.find(cat => cat.name.toLowerCase() === cardSub.toLowerCase());
    if (!glavnaKategorija) return res.status(404).json({ msg: 'Glavna kategorija nije pronađena.' });

    const potkategorije = glavnaKategorija.subcategories.map(sub => sub.name);

    // 3. Skupi sve ocenjivače glavne kategorije
    const direktneOcene = await Rating.find({ cardName, cardSub });
    const direktniOcenjivaci = new Set(direktneOcene.map(r => r.rater));

    // 4. Skupi sve ocenjivače svih potkategorija
    const indirektneOcene = await Rating.find({
      cardName,
      cardSub: { $in: potkategorije }
    });

    // 5. Ukloni duplikate i one koji su već direktno ocenili
    const rezultat = [];

    for (const ocena of indirektneOcene) {
      if (!direktniOcenjivaci.has(ocena.rater)) {
        rezultat.push({ rater: ocena.rater });
        direktniOcenjivaci.add(ocena.rater); // da izbegnemo duplikate
      }
    }

    res.json(rezultat);
  } catch (err) {
    console.error("Greška:", err);
    res.status(500).json({ msg: 'Greška na serveru' });
  }
});

module.exports = router;
