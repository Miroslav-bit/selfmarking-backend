const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { ime, prezime, prebivaliste, avatar, email, lozinka } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: 'Email već postoji.' });

  const hashed = await bcrypt.hash(lozinka, 10);
  const user = new User({ ime, prezime, prebivaliste, avatar, email, lozinka: hashed });

  await user.save();
  res.json({ msg: 'Uspešno registrovan.' });
});

router.post('/login', async (req, res) => {
  const { email, lozinka } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: 'Nepostojeći korisnik.' });

  const isMatch = await bcrypt.compare(lozinka, user.lozinka);
  if (!isMatch) return res.status(400).json({ msg: 'Pogrešna lozinka.' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token, user: { id: user._id, ime: user.ime, avatar: user.avatar } });
});

module.exports = router;
