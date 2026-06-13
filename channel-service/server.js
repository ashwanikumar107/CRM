require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const routes  = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use('/api', routes);
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'channel-service' }));

app.listen(PORT, () => console.log(`📡  Channel Service running on port ${PORT}`));
