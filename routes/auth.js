const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const Panel = require('../models/Panel');

// @route   POST /api/auth/register
// @desc    Register a new user and create an empty panel
// @access  Public
router.post('/register', async (req, res) => {
  const { firstName, lastName, location, avatarUrl, email, password } = req.body;

  try {
    // Provera da li korisnik već postoji
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Korisnik sa ovom email adresom već postoji.' });
    }

    // Hesiranje lozinke
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kreiranje korisnika
    const newUser = new User({
      firstName,
      lastName,
      location,
      avatarUrl,
      email,
      password: hashedPassword
    });

    // Čuvanje korisnika u bazi
    const savedUser = await newUser.save();

    // Kreiranje panela za korisnika
    const panel = new Panel({
      userId: savedUser._id,
      categories: [
        {
          name: 'Izgled',
          subcategories: [
            { name: 'Lice' },
            { name: 'Stas' },
            { name: 'Stil' }
          ]
        },
        {
          name: 'Zdravlje',
          subcategories: [
            { name: 'Opšte stanje' },
            { name: 'Ishrana' },
            { name: 'San' }
          ]
        },
        {
          name: 'Fizičke sposobnosti',
          subcategories: [
            { name: 'Snaga' },
            { name: 'Izdržljivost' },
            { name: 'Brzina' }
          ]
        }
      ]
    });

    await panel.save();

    // Generisanje JWT tokena
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

module.exports = router;