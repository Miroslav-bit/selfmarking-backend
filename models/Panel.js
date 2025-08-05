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
  ],
  selectedTrainings: [
    {
      subcategory: String,
      etapa: Number,
      html: String,
      delay: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Panel', panelSchema);
