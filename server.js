const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/userRoutes');
const ratingsRoutes = require('./routes/ratings'); // ✅ Ovde uključujemo i ocenjivanje i dnevnik

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Povezan sa MongoDB'))
  .catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

// Rute
app.use('/api', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ratings', ratingsRoutes); // ✅ Sve što se tiče ocena i dnevnika ide kroz ovaj prefiks

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server aktivan na portu ${PORT}`));
