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

  // 📌 LOGOVANJE – odmah na početku rute
  console.log(">>> RUTA '/update-score' POZVANA");
  console.log("📨 Primljeni podaci:");
  console.log("userId:", userId);
  console.log("subCategory:", subCategory);
  console.log("totalPoints:", totalPoints);

  try {
    const panel = await Panel.findOne({ userId });
    if (!panel) {
      console.log("❌ Panel NIJE pronađen u bazi.");
      return res.status(404).json({ msg: "Panel nije pronađen" });
    }

    console.log("✅ Panel PRONAĐEN:", panel._id);

    if (!panel.testScores) {
      panel.testScores = [];
      console.log("ℹ️ Polje testScores nije postojalo – inicijalizovano kao prazan niz.");
    }

    const existing = panel.testScores.find(s => s.subcategory === subCategory);

    if (existing) {
      console.log("🔄 Postojeći unos pronađen – ažuriranje vrednosti.");
      existing.totalPoints = totalPoints;
    } else {
      console.log("➕ Novi unos za testScores – dodavanje.");
      panel.testScores.push({ subcategory: subCategory, totalPoints });
    }

    await panel.save();
    console.log("💾 panel.save() uspešan – bodovi su sačuvani.");

    res.json({ msg: "Bodovi uspešno ažurirani" });
  } catch (err) {
    console.error("❗ Greska u ruti /update-score:", err);
    res.status(500).json({ msg: "Greška pri ažuriranju bodova" });
  }
});

// 🔹 Dohvati ceo panel korisnika da bi se iz njega izvukli test bodovi
router.get('/panel/:userId', async (req, res) => {
  try {
    const panel = await Panel.findOne({ userId: req.params.userId });

    if (!panel) {
      return res.status(404).json({ msg: "Panel nije pronađen" });
    }

    res.json(panel); // Vrati ceo panel (uključuje i testScores)
  } catch (err) {
    console.error("❗ Greška pri dohvatanju panela:", err);
    res.status(500).json({ msg: "Greška na serveru" });
  }
});

module.exports = router;
