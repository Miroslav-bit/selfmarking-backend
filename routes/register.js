const express = require('express');
const router = express.Router();
const User = require('../models/User'); // prilagodi putanju ako se model nalazi drugde

// POST /api/register - registracija korisnika
router.post('/register', async (req, res) => {
  const { ime, prezime, prebivaliste, avatar, email, lozinka } = req.body;

  // Provera da li su svi potrebni podaci poslati
  if (!ime || !prezime || !email || !lozinka) {
    return res.status(400).json({ message: 'Nedostaju obavezna polja.' });
  }

  try {
    // Provera da li korisnik već postoji
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Korisnik sa tim emailom već postoji.' });
    }

    // Kreiranje i čuvanje novog korisnika
    const newUser = new User({ ime, prezime, prebivaliste, avatar, email, lozinka });
    await newUser.save();

    res.status(201).json({ message: 'Registracija uspešna.' });
  } catch (err) {
    console.error('Greška pri registraciji:', err);
    res.status(500).json({ message: 'Greška na serveru.', error: err.message });
  }
});

module.exports = router;