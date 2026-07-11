// Minimal Express + Sequelize scaffold (entry point)

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');

const app = express();
app.use(bodyParser.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mount routers (to be implemented)
app.use('/auth', require('./routes/auth'));
app.use('/channels', require('./routes/channels'));
app.use('/admin', require('./routes/admin'));

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.authenticate();
  console.log('DB connected');
  app.listen(PORT, () => console.log('Server started on', PORT));
}

start().catch(err => {
  console.error('Failed to start', err);
  process.exit(1);
});
