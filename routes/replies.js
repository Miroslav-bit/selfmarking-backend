const express = require('express');
const router = express.Router();
const Reply = require('../models/Reply');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const bearer = req.header('Authorization');
  if (!bearer || !bearer.startsWith("Bearer ")) return res.status(401).json({ msg: "Nema tokena." });
  const token = bearer.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    return res.status(400).json({ msg: "Nevažeći token." });
  }
};

// Kreiranje nove replike
router.post('/', auth, async (req, res) => {
  const { postId, text } = req.body;

  const newReply = new Reply({
    postId,
    user: req.user,
    text
  });

  try {
    await newReply.save();
    res.status(201).json(newReply);
  } catch (err) {
    res.status(500).json({ msg: 'Greška pri čuvanju replike.' });
  }
});

// Dohvatanje replika za dati post
router.get('/:postId', async (req, res) => {
  try {
    const replies = await Reply.find({ postId: req.params.postId }).populate('user', 'name surname avatarUrl').sort({ date: 1 });
    res.json(replies);
  } catch (err) {
    res.status(500).json({ msg: 'Greška pri dohvatanju replika.' });
  }
});

module.exports = router;
