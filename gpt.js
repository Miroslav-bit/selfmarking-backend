const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  surname: String,
  city: String,
  avatarUrl: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  privacy: {
    type: String,
    enum: ["public", "private"],
    default: "public"
  }
});

module.exports = mongoose.model('User', userSchema);
