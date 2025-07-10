const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [
    {
      name: String,
      subcategories: [
        {
          name: String,
          posts: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Post'
            }
          ]
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Panel', panelSchema);