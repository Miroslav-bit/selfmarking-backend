const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  text: String,
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  panelOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mainCategory: String,
  subCategory: String
});

module.exports = mongoose.model('Post', postSchema);
