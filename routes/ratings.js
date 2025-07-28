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

// ✅ Ispravka: Total raters - tačno prema vrednosti "u" iz dosijea
router.get("/total-raters", async (req, res) => {
  const { cardName } = req.query;
  if (!cardName) {
    return res.status(400).json({ error: "Nedostaje parametar cardName" });
  }

  try {
    // Sve ocene koje je ocenjeni član dobio
    const sveOcene = await Rating.find({ cardName });

    // Formiraj mapu: rater -> [ocene koje je dao]
    const mapa = new Map();

    for (const o of sveOcene) {
      if (!mapa.has(o.rater)) {
        mapa.set(o.rater, []);
      }
      mapa.get(o.rater).push(o);
    }

    const rezultat = [];

    for (const [rater, ocene] of mapa.entries()) {
      let zbirP = 0; // zbir ocena glavnih kategorija
      let brojP = 0;
      let zbirS = 0; // zbir ocena potkategorija
      let brojS = 0;

      for (const o of ocene) {
        // Ako je ocena za glavnu kategoriju
        if (
          ["Obrazovanje", "Inteligencija", "Karakter"].includes(o.cardSub)
        ) {
          zbirP += o.score;
          brojP++;
        } else {
          zbirS += o.score;
          brojS++;
        }
      }

      if (brojP === 0) continue; // rater nije ocenjivao nijednu glavnu kategoriju

      const p = zbirP / brojP;
      const s = brojS > 0 ? zbirS / brojS * 10 : 50; // podrazumevana vrednost s = 50 ako nema ocena
      const u = +((p + s) / 10).toFixed(2);

      rezultat.push({ rater, score: u });
    }

    res.json(rezultat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

module.exports = router;
