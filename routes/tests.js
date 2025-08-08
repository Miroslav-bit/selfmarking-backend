const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const User = require('../models/User');
const { generateQuestion } = require('../gpt'); 
const Panel = require('../models/Panel');

// 🔹 Generiši novo pitanje
router.post('/generate', async (req, res) => {
  const { userId, panelOwnerId, mainCategory, subCategory } = req.body;

  try {
    const user = await User.findById(panelOwnerId);
    if (!user) return res.status(404).json({ msg: 'Panel korisnik nije pronađen' });

    const gptData = await generateQuestion(subCategory, `${user.name} ${user.surname}`);

    const test = new Test({
      userId,
      panelOwnerId,
      mainCategory,
      subCategory,
      question: gptData.question,
      answers: gptData.answers,
      selectedIndex: null
    });

    await test.save();
    res.status(201).json(test);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška prilikom generisanja pitanja' });
  }
});

// 🔹 Zabeleži odgovor
router.post('/submit', async (req, res) => {
  const { testId, selectedIndex } = req.body;

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ msg: 'Test nije pronađen' });

    test.selectedIndex = selectedIndex;
    await test.save();

    res.json({ msg: 'Odgovor sačuvan', points: test.answers[selectedIndex].points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška prilikom čuvanja odgovora' });
  }
});

// 🔹 Dohvati sve testove za korisnika i potkategoriju
router.get('/user/:userId', async (req, res) => {
  const { mainCategory, subCategory } = req.query;

  try {
    const tests = await Test.find({
      userId: req.params.userId,
      mainCategory,
      subCategory
    }).sort({ date: -1 });

    res.json(tests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška prilikom dohvatanja testova' });
  }
});

// 🔹 Ažuriraj zbir test bodova u panelu
router.put('/update-score', async (req, res) => {
  const { userId, subCategory, totalPoints } = req.body;

  try {
    const panel = await Panel.findOne({ userId });
    if (!panel) return res.status(404).json({ msg: "Panel nije pronađen" });

    // Ako ne postoji testScores polje, napravi ga kao prazan niz
    if (!panel.testScores) {
      panel.testScores = [];
    }

    // Traži već postojeći unos za subkategoriju
    const existing = panel.testScores.find(s => s.subcategory === subCategory);

    if (existing) {
      existing.totalPoints = totalPoints; // ažuriraj vrednost
    } else {
      panel.testScores.push({ subcategory: subCategory, totalPoints });
    }

    await panel.save();
    res.json({ msg: "Bodovi uspešno ažurirani" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Greška pri ažuriranju bodova" });
  }
});

module.exports = router;
