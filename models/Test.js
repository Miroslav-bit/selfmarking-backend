const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },        // Ko polaže test
  panelOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Čiji je panel
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  question: { type: String, required: true },
  answers: [{
    text: String,
    points: Number
  }],
  selectedIndex: { type: Number }, // null dok korisnik ne odgovori
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', TestSchema);
