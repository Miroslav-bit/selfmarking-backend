const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isHidden: { type: Boolean, default: false }
});

module.exports = mongoose.model('Reply', ReplySchema);
