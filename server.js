const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/userRoutes');
const ratingsRoutes = require('./routes/ratings'); // uključuje i /ratings/save i /log/add itd.

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Povezan sa MongoDB'))
  .catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

// Osnovne rute
app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/user', userRoutes);

// Sve rute za ocenjivanje i dnevnik dostupne pod /api/ratings/*
app.use('/api/ratings', ratingsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server aktivan na portu ${PORT}`));
