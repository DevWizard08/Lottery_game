import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// Use the backend URL from environment variables
const backendUrl = process.env.REACT_APP_BACKEND_URL;
const socket = io(backendUrl); // Connect to your live backend

const LotteryGrid = () => {
    const [gridUser1, setGridUser1] = useState(Array(3).fill().map(() => Array(3).fill(null)));
    const [gridUser2, setGridUser2] = useState(Array(3).fill().map(() => Array(3).fill(null)));
    const [numbersDrawn, setNumbersDrawn] = useState([]);
    const [winner, setWinner] = useState(null);
    const [isGameActive, setIsGameActive] = useState(false);
    const [hasWinnerBeenDeclared, setHasWinnerBeenDeclared] = useState(false);
    const [isGridSubmitted, setIsGridSubmitted] = useState(false);
    const [intervalId, setIntervalId] = useState(null);

    useEffect(() => {
        socket.on('numberDrawn', (number) => {
            if (isGameActive) {
                setNumbersDrawn(prev => [...prev, number]);
                updateGridsWithDrawnNumber(number);
            }
        });

        socket.on('winner', (winnerId) => {
            if (!hasWinnerBeenDeclared) {
                setWinner(winnerId);
                setHasWinnerBeenDeclared(true);
                setIsGameActive(false);
                alert(`${winnerId} wins!`);
            }
        });

        return () => {
            socket.off('numberDrawn');
            socket.off('winner');
        };
    }, [isGameActive, hasWinnerBeenDeclared]);

    const updateGridsWithDrawnNumber = (number) => {
        setGridUser1(prevGrid => 
            prevGrid.map(row => row.map(cell => (cell === number ? 'X' : cell)))
        );

        setGridUser2(prevGrid => 
            prevGrid.map(row => row.map(cell => (cell === number ? 'X' : cell)))
        );
    };

    const handleInputChange = (row, col, value, user) => {
        if (user === 1) {
            const newGrid = gridUser1.map(r => [...r]);
            newGrid[row][col] = parseInt(value);
            setGridUser1(newGrid);
        } else {
            const newGrid = gridUser2.map(r => [...r]);
            newGrid[row][col] = parseInt(value);
            setGridUser2(newGrid);
        }
    };

    const submitGrid = async () => {
        try {
            await axios.post(`${backendUrl}/api/start-game`, { gridUser1, gridUser2 });
            setIsGridSubmitted(true);
            alert("Grids submitted successfully! Now, press 'Start Game' to begin.");
        } catch (error) {
            console.error("Error submitting grids:", error);
        }
    };

    const startGame = () => {
        if (!isGridSubmitted) {
            alert("Please submit the grids first.");
            return;
        }
        setNumbersDrawn([]); // Clear drawn numbers at the start of the game
        setIsGameActive(true);
        generateRandomNumbers();
    };

    const stopGame = () => {
        setIsGameActive(false);
        clearInterval(intervalId);
        setIntervalId(null);
        setNumbersDrawn([]); // Clear drawn numbers when stopping the game
        alert("Game stopped.");
    };

    const generateRandomNumbers = () => {
        let numbers = Array.from({ length: 9 }, (_, i) => i + 1); // Reinitialize numbers from 1 to 9
        const newIntervalId = setInterval(() => {
            if (!isGameActive || numbers.length === 0) {
                clearInterval(newIntervalId);
                setIntervalId(null);
                return;
            }
            const randomIndex = Math.floor(Math.random() * numbers.length);
            const numberDrawn = numbers.splice(randomIndex, 1)[0]; // Remove the number from available numbers
            socket.emit('drawNumber', numberDrawn);
        }, 1000);
        setIntervalId(newIntervalId); // Set the interval ID to manage it later
    };

    return (
        <div>
            <h2>User 1's Grid</h2>
            {gridUser1.map((row, rowIndex) => (
                <div key={rowIndex}>
                    {row.map((num, colIndex) => (
                        <input 
                            key={colIndex} 
                            type="text" 
                            value={num === 'X' ? 'X' : num || ''} 
                            onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value, 1)} 
                            disabled={isGameActive || isGridSubmitted} 
                        />
                    ))}
                </div>
            ))}
            
            <h2>User 2's Grid</h2>
            {gridUser2.map((row, rowIndex) => (
                <div key={rowIndex}>
                    {row.map((num, colIndex) => (
                        <input 
                            key={colIndex} 
                            type="text" 
                            value={num === 'X' ? 'X' : num || ''} 
                            onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value, 2)} 
                            disabled={isGameActive || isGridSubmitted} 
                        />
                    ))}
                </div>
            ))}
            
            <button onClick={submitGrid} disabled={isGridSubmitted}>Submit Grid</button>
            <button onClick={startGame}>Start Game</button>
            <button onClick={stopGame} disabled={!isGameActive}>Stop Game</button>
            
            <div>
                <h3>Numbers Drawn: {numbersDrawn.join(', ')}</h3>
                {winner && <h2>Winner: {winner}</h2>}
            </div>
        </div>
    );
};

export default LotteryGrid;
