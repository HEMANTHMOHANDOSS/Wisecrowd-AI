
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Initialize App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsafe', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected')).catch(err => console.error(err));

// Routes
app.use('/api/cameras', require('./routes/cameraRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));

// WebSocket for Real-time Updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Simulate stream data broadcast
  socket.on('join_feed', (feedId) => {
    socket.join(feedId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
