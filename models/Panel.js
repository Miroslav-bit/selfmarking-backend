const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  categories: [ /* ... kao kod tebe ... */ ],

  selectedTrainings: [
    {
      subcategory: String,
      etapa: Number,
      trainingGrade: Number,
      html: String,
      delay: Number,
      delayMap: { type: Map, of: Number }
    }
  ],

  testScores: [
    { subcategory: String, totalPoints: Number }
  ], //  ⬅️ DODAJ OVAJ ZAREZ!

  postScores: [
    { subcategory: String, totalPoints: Number }
  ],

}, { timestamps: true });

module.exports = mongoose.model('Panel', panelSchema);
