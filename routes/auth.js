const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
const Panel = require('../models/Panel');

// REGISTRACIJA
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
        { name: "Obrazovanje", subcategories: [{ name: "Matematika" }, { name: "Fizika" }, { name: "Hemija" }, { name: "Astronomija" }, { name: "Geologija" }] },
        { name: "Inteligencija", subcategories: [{ name: "Logika" }, { name: "Komunikativnost" }, { name: "Duhovitost" }] },
        { name: "Karakterne osobine", subcategories: [{ name: "Hrabrost" }, { name: "Samouverenost" }, { name: "Smirenost" }, { name: "Empatija" }] },
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

// PRIJAVA
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Korisnik nije pronađen." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Pogrešna lozinka." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

// PANEL
router.get('/user/:id/panel', async (req, res) => {
  try {
    const panel = await Panel.findOne({ userId: req.params.id });
    const user = await User.findById(req.params.id);

    if (!panel || !user) return res.status(404).json({ msg: "Panel ili korisnik nisu pronađeni." });

    res.json({
      name: user.name,
      surname: user.surname,
      city: user.city,
      avatar: user.avatarUrl,
      categories: panel.categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Greška na serveru." });
  }
});

module.exports = router;
