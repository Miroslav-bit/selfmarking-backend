const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Panel = require('../models/Panel'); // panel struktura i objave

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

module.exports = router;
