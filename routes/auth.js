
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Panel = require('../models/Panel');

const router = express.Router();

// Registracija korisnika i kreiranje self panela
router.post('/register', async (req, res) => {
  const { ime, prezime, prebivaliste, avatar, email, lozinka } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email već postoji.' });

    const hashed = await bcrypt.hash(lozinka, 10);
    const user = new User({ ime, prezime, prebivaliste, avatar, email, lozinka: hashed });

    await user.save();

    // AUTOMATSKO KREIRANJE SELF PANELA
    const panel = new Panel({
      user: user._id,
      categories: [
        { name: 'Izgled', subcategories: ['Lice', 'Telo', 'Odeća'] },
        { name: 'Zdravlje', subcategories: ['Opšte stanje', 'Ishrana', 'Navike'] },
        { name: 'Fizička spremnost', subcategories: ['Snaga', 'Brzina', 'Izdržljivost'] }
      ]
    });

    await panel.save();

    res.json({ msg: 'Uspešno registrovan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

module.exports = router;
