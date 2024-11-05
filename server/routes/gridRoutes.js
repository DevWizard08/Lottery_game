const express = require('express');
const router = express.Router();
const Grid = require('../models/Grid'); // Import the Grid model

// Endpoint to start the game and initialize grids for users (example)
router.post('/start-game', async (req, res) => {
    const { gridUser1, gridUser2 } = req.body;

    try {
        // Save both users' grids to the database (you can add validation here)
        await Grid.deleteMany({}); // Clear previous grids if necessary
        
        await Grid.create([{ userId: 'User 1', grid: gridUser1 }, { userId: 'User 2', grid: gridUser2 }]);
        
        res.status(200).send('Game started');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error starting game');
    }
});

module.exports = router;