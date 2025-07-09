const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('Authorization');
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
  const { text } = req.body;
  const newPost = new Post({ text, user: req.user });
  await newPost.save();
  res.json(newPost);
});

router.get('/', async (req, res) => {
  const posts = await Post.find().populate('user', 'ime prezime avatar').sort({ date: -1 });
  res.json(posts);
});

module.exports = router;
