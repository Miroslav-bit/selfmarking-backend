const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET /api/training-menu/:subcategory
router.get('/:subcategory', (req, res) => {
  const { subcategory } = req.params;
  const filePath = path.join(__dirname, '..', 'training-menu', `${subcategory}.html`);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) return res.status(404).json({ msg: 'Trening meni nije pronađen.' });
    res.send(data);
  });
});

module.exports = router;
