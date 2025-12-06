
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['active', 'scheduled', 'ended'], default: 'scheduled' },
  organizerId: String
});

const CameraSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  name: String,
  location: String,
  streamUrl: String,
  status: { type: String, enum: ['active', 'offline', 'maintenance'], default: 'active' },
  capacityThreshold: Number,
  zoneId: String,
  lastMaintenance: Date
});

const AlertSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  title: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  cameraId: String,
  resolved: { type: Boolean, default: false }
});

const CrowdMetricSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  timestamp: { type: Date, default: Date.now },
  cameraId: String,
  count: Number,
  density: Number,
  flowRate: Number,
  riskScore: Number
});

module.exports = {
  Event: mongoose.model('Event', EventSchema),
  Camera: mongoose.model('Camera', CameraSchema),
  Alert: mongoose.model('Alert', AlertSchema),
  CrowdMetric: mongoose.model('CrowdMetric', CrowdMetricSchema)
};
