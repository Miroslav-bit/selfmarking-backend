const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
const Panel = require('../models/Panel');

router.post('/register', async (req, res) => {
  try {
    const { name, surname, city, avatarUrl, email, password } = req.body;

    if (!name || !surname || !city || !email || !password) {
      return res.status(400).json({ msg: "Sva obavezna polja moraju biti popunjena." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Korisnik sa ovom email adresom već postoji." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      surname,
      city,
      avatarUrl,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    const selfPanel = new Panel({
      userId: savedUser._id,
      categories: [
        { name: "Izgled", subcategories: [{ name: "Lice" }, { name: "Stas" }] },
        { name: "Zdravlje", subcategories: [{ name: "Opšte stanje" }, { name: "Kondicija" }] },
        { name: "Fizička snaga", subcategories: [{ name: "Snaga" }, { name: "Izdržljivost" }] },
      ],
    });

    await selfPanel.save();

    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

module.exports = router;