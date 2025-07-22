const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

// Dodavanje potvrde
router.post('/confirm/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.user);
    if (!post || !user) return res.status(404).json({ msg: "Post ili korisnik nije pronađen." });

    if (!post.confirmators.includes(user.name + ' ' + user.surname)) {
      post.confirmators.push(user.name + ' ' + user.surname);
      await post.save();
    }
    res.json({ msg: "Potvrđeno." });
  } catch (err) {
    res.status(500).json({ msg: "Greška pri potvrđivanju." });
  }
});

// Dodavanje demantija
router.post('/deny/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const user = await User.findById(req.user);
    if (!post || !user) return res.status(404).json({ msg: "Post ili korisnik nije pronađen." });

    if (!post.deniers.includes(user.name + ' ' + user.surname)) {
      post.deniers.push(user.name + ' ' + user.surname);
      await post.save();
    }
    res.json({ msg: "Demantovano." });
  } catch (err) {
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

module.exports = router;
