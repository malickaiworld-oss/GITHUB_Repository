require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./src/config/db');
const analyzeRoutes = require('./src/routes/analyze');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Resume parser backend is running.' });
});

app.use('/api', analyzeRoutes);

async function startServer() {
  await connectMongo();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start application:', error);
  process.exit(1);
});
