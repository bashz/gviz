var mongoose = require('mongoose');

var incidentSchema = mongoose.Schema({
  id: Number,
  date: Date,
  address: String,
  region: String,
  state: String,
  latitude: Number,
  longitude: Number,
  participants: [],
  characteristics: [],
  notes: [],
  guns: [],
  sources: [],
  districts: {congressional: Number, senate: Number, house: Number}
});

module.exports = mongoose.model('incident', incidentSchema);
