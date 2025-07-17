const mongoose = require('mongoose');

const EvaluatorLogSchema = new mongoose.Schema({
  rater: { type: String, required: true },
  evaluated: { type: [String], default: [] }
});

module.exports = mongoose.model('EvaluatorLog', EvaluatorLogSchema);
