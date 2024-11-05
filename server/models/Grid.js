const mongoose = require('mongoose');

const gridSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    grid: { type: [[Number]], required: true }, // 3x3 grid of numbers
    drawnNumbers: { type: [Number], default: [] } // Store drawn numbers for each user
});

const Grid = mongoose.model('Grid', gridSchema);
module.exports = Grid;