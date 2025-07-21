const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Panel = require('../models/Panel'); 
const Post = require('../models/Post');
const Rating = require('../models/Rating');

// Get self panel info for a user
router.get('/:username/panel', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ msg: 'Korisnik nije pronađen' });

    const panel = await Panel.findOne({ user: user._id });
    res.json({
      name: user.name,
      age: user.age,
      location: user.location,
      avatar: user.avatar,
      categories: panel.categories
    });
  } catch (err) {
    res.status(500).json({ msg: 'Greška na serveru' });
  }
});

// ruta za pretragu korisnika
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ message: 'Nedostaje parametar pretrage.' });
    }

    const regex = new RegExp(query, 'i'); // Case-insensitive

    const users = await User.find({
      $or: [
        { name: regex },
        { surname: regex },
        { city: regex }
      ]
    }).select('name surname city avatarUrl _id');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Greška na serveru.' });
  }
});

const jwt = require('jsonwebtoken');

// Middleware za autentifikaciju
const auth = (req, res, next) => {
  const bearer = req.header('Authorization');
  if (!bearer || !bearer.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Nevažeći token." });
  }

  const token = bearer.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Nevažeći token." });
  }
};

// Ruta za prikaz svojih podataka
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('name surname city email avatarUrl');
    if (!user) return res.status(404).json({ msg: 'Korisnik nije pronađen' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

// Ruta za ažuriranje korisničkih podataka
router.put('/update', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: 'Korisnik nije pronađen' });

    user.name = req.body.name || user.name;
    user.surname = req.body.surname || user.surname;
    user.city = req.body.city || user.city;
    user.email = req.body.email || user.email;
    user.avatarUrl = req.body.avatarUrl || user.avatarUrl;

    await user.save();
    res.json({ msg: 'Podaci su uspešno ažurirani.' });
  } catch (err) {
    res.status(500).json({ msg: 'Greška pri ažuriranju.' });
  }
});

// DELETE naloga putem tokena (bez userId u URL-u)
router.delete('/me/delete', auth, async (req, res) => {
  try {
    const userId = req.user;

    await Rating.deleteMany({ rater: userId });
    await Post.deleteMany({ user: userId });
    await Panel.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ msg: 'Nalog i svi podaci uspešno obrisani.' });
  } catch (err) {
    console.error('Greška pri brisanju naloga:', err);
    res.status(500).json({ msg: 'Greška na serveru.' });
  }
});

module.exports = router;
