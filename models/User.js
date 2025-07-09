const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  ime: String,
  prezime: String,
  prebivaliste: String,
  avatar: String,
  email: { type: String, required: true, unique: true },
  lozinka: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);
