const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/:subCategory/:etapa', (req, res) => {
  const { subCategory, etapa } = req.params;
  const filePath = path.join(__dirname, '..', 'tutorials', subCategory, `etapa-${etapa}.html`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Etapa nije pronađena.' });
  }

  const htmlContent = fs.readFileSync(filePath, 'utf8');
  res.json({ html: htmlContent });
});

module.exports = router;
