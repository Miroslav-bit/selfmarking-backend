const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  cardName: String,       // Ime ocenjenog člana
  cardSub: String,        // Potkategorija (npr. "Snaga")
  rater: String,          // Ime ocenjivača
  score: Number,          // Dodeljena ocena
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);
