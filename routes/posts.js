const { generateReply } = require('../gpt');
const Reply = require('../models/Reply');

const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Panel = require('../models/Panel');

const auth = (req, res, next) => {
  const bearer = req.header('Authorization');
  if (!bearer || !bearer.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Nevažeći token." });
  }
const token = bearer.split(" ")[1];
  if (!token) return res.status(401).json({ msg: 'Nema tokena.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(400).json({ msg: 'Nevažeći token.' });
  }
};

router.post('/', auth, async (req, res) => {
  const { text, imageUrl, videoUrl, panelOwnerId, mainCategory, subCategory } = req.body;

  const newPost = new Post({
    text,
    imageUrl: imageUrl || null,
    videoUrl: videoUrl || null,
    user: req.user,
    panelOwnerId,
    mainCategory,
    subCategory
  });

  try {
    await newPost.save();

    // Pronađi AI korisnika (GPT)
    const aiUser = await User.findOne({ email: "gpt@selfmarking.com" });

    if (aiUser) {
    const panelOwner = await User.findById(panelOwnerId);
    if (!panelOwner) {
      console.error("❌ panelOwner nije pronađen:", panelOwnerId);
      return res.status(500).json({ msg: "Vlasnik panela nije pronađen." });
    }
    const fullName = `${panelOwner.name} ${panelOwner.surname}`;
      const gptResponse = await generateReply(text, subCategory, fullName);

      if (gptResponse && gptResponse.comment) {
        const aiReply = new Reply({
          postId: newPost._id,
          user: aiUser._id,
          text: gptResponse.comment,
          gptScore: gptResponse.score
        });
        await aiReply.save();
      }
    }

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Greška pri snimanju objave:", err);
    res.status(500).json({ msg: "Greška pri čuvanju objave." });
  }
});

router.get('/', async (req, res) => {
  const posts = await Post.find().populate('user', 'name surname avatarUrl').sort({ date: -1 });
  res.json(posts);
});

router.get('/filter', async (req, res) => {
  const { ownerId, mainCategory, subCategory } = req.query;

  try {
    const posts = await Post.find({
      panelOwnerId: ownerId,
      mainCategory,
      subCategory
    })
    .populate('user', 'name surname avatarUrl')
    .sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Greška u /filter:", err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

// Dodavanje potvrde (sa uklanjanjem iz demanti)
router.post('/confirm/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.user);
    if (!post || !user) return res.status(404).json({ msg: "Post ili korisnik nije pronađen." });

    const fullName = user.name + ' ' + user.surname;

    const wasConfirmed = post.confirmators.includes(fullName);
    const wasDenied = post.deniers.includes(fullName);

    if (wasConfirmed) {
      // Ako je već potvrdio, ukloni ga
      post.confirmators = post.confirmators.filter(name => name !== fullName);
    } else {
      // Dodaj u confirmators
      post.confirmators.push(fullName);
      // Ukloni iz deniers ako postoji
      if (wasDenied) {
        post.deniers = post.deniers.filter(name => name !== fullName);
      }
    }

    await post.save();
    res.json({ msg: "Potvrda ažurirana." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Greška pri potvrđivanju." });
  }
});

// Dodavanje demantija (sa uklanjanjem iz potvrda)
router.post('/deny/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.user);
    if (!post || !user) return res.status(404).json({ msg: "Post ili korisnik nije pronađen." });

    const fullName = user.name + ' ' + user.surname;

    const wasDenied = post.deniers.includes(fullName);
    const wasConfirmed = post.confirmators.includes(fullName);

    if (wasDenied) {
      // Ako je već demantovao, ukloni ga
      post.deniers = post.deniers.filter(name => name !== fullName);
    } else {
      // Dodaj u deniers
      post.deniers.push(fullName);
      // Ukloni iz confirmators ako postoji
      if (wasConfirmed) {
        post.confirmators = post.confirmators.filter(name => name !== fullName);
      }
    }

    await post.save();
    res.json({ msg: "Demanti ažuriran." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Greška pri demantovanju." });
  }
});

// Dohvatanje validacija po tipu
router.get('/validators/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: "Post ne postoji." });
    res.json({ confirmators: post.confirmators || [], deniers: post.deniers || [] });
  } catch (err) {
    res.status(500).json({ msg: "Greška pri učitavanju validacija." });
  }
});

// Provera statusa validacije trenutnog korisnika
router.get('/validation-status/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.user);
    if (!post || !user) return res.status(404).json({ msg: "Post ili korisnik nije pronađen." });

    const fullName = user.name + ' ' + user.surname;

    const hasConfirmed = post.confirmators.includes(fullName);
    const hasDenied = post.deniers.includes(fullName);

    res.json({ confirmed: hasConfirmed, denied: hasDenied });
  } catch (err) {
    res.status(500).json({ msg: "Greška pri proveri validacije." });
  }
});

// PUT /api/posts/hide/:id
router.put('/hide/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { hide } = req.body;
  const userId = req.user;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ msg: "Objava nije pronađena." });

    if (post.panelOwnerId.toString() !== userId) {
      return res.status(403).json({ msg: "Nemate pravo da prikrivate ovu objavu." });
    }

    post.isHidden = hide;
    await post.save();
    res.json({ success: true, hidden: hide });
  } catch (err) {
    console.error("Greška pri prikrivanju objave:", err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

// 🔹 Ažuriraj zbir objavnih bodova u panelu
router.put('/update-score', async (req, res) => {
  const { userId, subCategory, totalPoints } = req.body;

  console.log(">>> RUTA '/update-score' [POSTS] POZVANA");
  console.log("📨 Primljeni podaci:", { userId, subCategory, totalPoints });

  try {
    const panel = await Panel.findOne({ userId });
    if (!panel) {
      console.log("❌ Panel NIJE pronađen u bazi.");
      return res.status(404).json({ msg: "Panel nije pronađen" });
    }

    console.log("✅ Panel PRONAĐEN:", panel._id);

    if (!panel.postScores) {
      panel.postScores = [];
      console.log("ℹ️ Polje postScores nije postojalo – inicijalizovano kao prazan niz.");
    }

    const existing = panel.postScores.find(s => s.subcategory === subCategory);

    if (existing) {
      console.log("🔄 Postojeći unos pronađen – ažuriranje vrednosti.");
      existing.totalPoints = totalPoints;
    } else {
      console.log("➕ Novi unos za postScores – dodavanje.");
      panel.postScores.push({ subcategory: subCategory, totalPoints });
    }

    await panel.save();
    console.log("💾 panel.save() uspešan – bodovi su sačuvani.");

    res.json({ msg: "Bodovi uspešno ažurirani" });
  } catch (err) {
    console.error("❗ Greška u ruti /update-score [POSTS]:", err);
    res.status(500).json({ msg: "Greška pri ažuriranju bodova" });
  }
});

// 🔹 Dohvati ceo panel korisnika da bi se iz njega izvukli post bodovi
router.get('/panel/:userId', async (req, res) => {
  try {
    const panel = await Panel.findOne({ userId: req.params.userId });

    if (!panel) {
      return res.status(404).json({ msg: "Panel nije pronađen" });
    }

    res.json(panel); // Vrati ceo panel (uključuje i postScores)
  } catch (err) {
    console.error("❗ Greška pri dohvatanju panela:", err);
    res.status(500).json({ msg: "Greška na serveru" });
  }
});

// 🔹 Dohvati userId prema imenu i prezimenu
router.get('/user-id', async (req, res) => {
  const { name, surname } = req.query;

  try {
    const user = await User.findOne({ name, surname });
    if (!user) return res.status(404).json({ msg: 'Korisnik nije pronađen' });

    res.json({ userId: user._id });
  } catch (err) {
    console.error("❗ Greška pri dohvatanju korisnika:", err);
    res.status(500).json({ msg: 'Greška na serveru' });
  }
});

module.exports = router;
