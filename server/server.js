// server/server.js

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors'); // Import CORS
const socketIo = require('socket.io');
require('dotenv').config();

const gridRoutes = require('./routes/gridRoutes');
const Grid = require('./models/Grid'); // Import your Grid model

const app = express();
app.use(cors()); // Use CORS middleware
app.use(express.json());
app.use('/api', gridRoutes);

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Allow only this origin
        methods: ["GET", "POST"],
        credentials: true // Allow credentials if needed
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

    

    io.on('connection', (socket) => {
        console.log('New client connected');
    
        socket.on('drawNumber', async (number) => {
            io.emit('numberDrawn', number); // Emit to all clients that a number has been drawn
    
            // Update the database for both users
            await Grid.updateMany({}, { $addToSet: { drawnNumbers: number } }); // Add drawn number to all users' records
    
            // Check for winners after updating
            await checkForWinners();
        });
    
        // Function to check for winners
        const checkForWinners = async () => {
            const usersGrids = await Grid.find(); // Fetch all user grids
    
            usersGrids.forEach(userGrid => {
                const { grid, drawnNumbers } = userGrid;
    
                // Check rows and columns for a win condition
                const hasWonRow = grid.some(row => row.every(num => drawnNumbers.includes(num)));
                const hasWonColumn = [0, 1, 2].some(colIndex =>
                    grid.map(row => row[colIndex]).every(num => drawnNumbers.includes(num))
                );
    
                if (hasWonRow || hasWonColumn) {
                    io.emit('winner', userGrid.userId); // Emit winner event with user ID
                }
            });
        };
    
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});