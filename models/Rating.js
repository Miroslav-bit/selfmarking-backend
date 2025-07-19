const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  cardName: {
    type: String,
    required: true
  },
  cardSub: {
    type: String,
    required: true
  },
  rater: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  isIndirect: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Rating', RatingSchema);
