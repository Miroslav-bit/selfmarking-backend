const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/userRoutes');
const ratingRoutes = require('./routes/ratings');
const replyRoutes = require('./routes/replies');
const User = require('./models/User'); // <- premestiti ovde

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Povezan sa MongoDB');

  // Dodavanje GPT korisnika ako ne postoji
  const existing = await User.findOne({ email: "gpt@selfmarking.com" });
  if (!existing) {
    const aiUser = new User({
      name: "AI",
      surname: "Komentator",
      city: "Internet",
      avatarUrl: "https://i.imgur.com/MnTHTyN.png",
      email: "gpt@selfmarking.com",
      password: "nebitno123"
    });
    await aiUser.save();
    console.log("🤖 GPT korisnik uspešno dodat.");
  } else {
    console.log("ℹ GPT korisnik već postoji.");
  }

}).catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/replies', replyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server aktivan na portu ${PORT}`));
