const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const getTokenFromHeader = (req) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return authHeader;
};

router.post('/register', async (req, res) => {
  const { ime, prezime, prebivaliste, avatar, email, lozinka } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email već postoji.' });

    const hashed = await bcrypt.hash(lozinka, 10);
    const user = new User({ ime, prezime, prebivaliste, avatar, email, lozinka: hashed });

    await user.save();
    res.json({ msg: 'Uspešno registrovan.' });
  } catch (err) {
    console.error('❌ Greška pri registraciji:', err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, lozinka } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Nepostojeći korisnik.' });

    const isMatch = await bcrypt.compare(lozinka, user.lozinka);
    if (!isMatch) return res.status(400).json({ msg: 'Pogrešna lozinka.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, ime: user.ime, avatar: user.avatar } });
  } catch (err) {
    console.error('❌ Greška pri prijavi:', err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

router.get('/user', async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ msg: 'Nema tokena.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-lozinka');
    if (!user) return res.status(404).json({ msg: 'Korisnik nije pronađen.' });

    res.json(user);
  } catch (err) {
    res.status(400).json({ msg: 'Nevažeći token.' });
  }
});

module.exports = router;
