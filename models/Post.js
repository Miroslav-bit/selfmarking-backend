const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  panelOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
