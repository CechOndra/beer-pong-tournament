import React, { useState, useEffect } from 'react';
import Cup from './Cup';
import { motion } from 'framer-motion';

const GameScreen = ({ team1, team2, onGameEnd }) => {
    // True means cup is standing, False means cup is hit/removed
    const [cups1, setCups1] = useState(Array(6).fill(true));
    const [cups2, setCups2] = useState(Array(6).fill(true));
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [isActive, setIsActive] = useState(false);
    const [suddenDeath, setSuddenDeath] = useState(false);
    const [streak1, setStreak1] = useState(0); // Consecutive hits for team 1
    const [streak2, setStreak2] = useState(0); // Consecutive hits for team 2

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0 && !suddenDeath) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && !suddenDeath) {
            // Check for draw
            const remaining1 = cups1.filter(c => c).length;
            const remaining2 = cups2.filter(c => c).length;

            if (remaining1 === remaining2) {
                setSuddenDeath(true);
            } else {
                handleGameEnd(null, 'regular');
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, suddenDeath, cups1, cups2]);

    const toggleCup = (team, index) => {
        if (!isActive && !suddenDeath) setIsActive(true);

        // In sudden death, if a cup is hit (removed), the OTHER team loses immediately (so the hitting team wins)

        if (team === 1) {
            const newCups = [...cups1];
            const wasStanding = newCups[index];
            newCups[index] = !newCups[index];
            setCups1(newCups);

            // Update streaks: if cup was hit (standing -> removed), increment team2's streak and reset team1's
            if (wasStanding && !newCups[index]) {
                setStreak2(prev => prev + 1);
                setStreak1(0);
            }

            if (suddenDeath && !newCups[index]) {
                // Cup removed in sudden death -> Team 2 wins
                setTimeout(() => handleGameEnd(team2, 'ot'), 500);
            } else {
                checkWinner(newCups, cups2);
            }
        } else {
            const newCups = [...cups2];
            const wasStanding = newCups[index];
            newCups[index] = !newCups[index];
            setCups2(newCups);

            // Update streaks: if cup was hit (standing -> removed), increment team1's streak and reset team2's
            if (wasStanding && !newCups[index]) {
                setStreak1(prev => prev + 1);
                setStreak2(0);
            }

            if (suddenDeath && !newCups[index]) {
                // Cup removed in sudden death -> Team 1 wins
                setTimeout(() => handleGameEnd(team1, 'ot'), 500);
            } else {
                checkWinner(cups1, newCups);
            }
        }
    };

    const checkWinner = (c1, c2) => {
        // If Team 1 loses all cups, Team 2 wins
        if (c1.every(c => !c)) {
            setTimeout(() => handleGameEnd(team2, 'regular'), 500);
        }
        // If Team 2 loses all cups, Team 1 wins
        if (c2.every(c => !c)) {
            setTimeout(() => handleGameEnd(team1, 'regular'), 500);
        }
    };

    const handleGameEnd = (winnerName, type = 'regular') => {
        const remaining1 = cups1.filter(c => c).length;
        const remaining2 = cups2.filter(c => c).length;

        // Determine actual winner if not passed explicitly (e.g. from timer end)
        let actualWinner = winnerName;
        if (!actualWinner) {
            if (remaining1 > remaining2) actualWinner = team1;
            else if (remaining2 > remaining1) actualWinner = team2;
            else {
                setSuddenDeath(true);
                return;
            }
        }

        const loser = actualWinner === team1 ? team2 : team1;
        const winnerCups = actualWinner === team1 ? remaining1 : remaining2;
        const loserCups = actualWinner === team1 ? remaining2 : remaining1;

        let winType = type;
        if (suddenDeath) winType = 'ot';
        else if (type === 'regular' && loserCups === 0) winType = 'shooter';

        onGameEnd({
            winner: actualWinner,
            loser: loser,
            winType: winType,
            cupsRemaining: {
                winner: winnerCups,
                loser: loserCups
            }
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderPyramid = (cups, teamId) => (
        <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-2">
                <Cup active={cups[0]} onClick={() => toggleCup(teamId, 0)} />
                <Cup active={cups[1]} onClick={() => toggleCup(teamId, 1)} />
                <Cup active={cups[2]} onClick={() => toggleCup(teamId, 2)} />
            </div>
            <div className="flex gap-2">
                <Cup active={cups[3]} onClick={() => toggleCup(teamId, 3)} />
                <Cup active={cups[4]} onClick={() => toggleCup(teamId, 4)} />
            </div>
            <div className="flex gap-2">
                <Cup active={cups[5]} onClick={() => toggleCup(teamId, 5)} />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full max-w-5xl animate-fade-in">
            <div className={`text-6xl font-mono font-bold mb-12 px-8 py-4 rounded-2xl border backdrop-blur-md transition-all ${suddenDeath ? 'text-red-500 border-red-500/50 bg-red-900/20 animate-pulse' : 'text-white border-white/10 bg-black/40 shadow-[0_0_30px_rgba(168,85,247,0.2)]'}`}>
                {suddenDeath ? 'SUDDEN DEATH' : formatTime(timeLeft)}
            </div>

            <div className="flex flex-col md:flex-row justify-between w-full gap-16 items-center">
                {/* Team 1 Side */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-3xl font-bold text-blue-400 drop-shadow-lg">{team1}</h2>
                        {streak1 >= 3 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1 rounded-full"
                            >
                                <span className="text-sm font-black text-white animate-pulse">ON FIRE</span>
                                <span className="text-xl animate-bounce">🔥</span>
                            </motion.div>
                        )}
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                        {renderPyramid(cups1, 1)}
                    </div>
                    <p className="mt-4 text-sm text-gray-400 font-mono">CUPS REMAINING: {cups1.filter(c => c).length}</p>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/50 to-transparent">VS</span>
                </div>

                {/* Team 2 Side */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-3xl font-bold text-pink-400 drop-shadow-lg">{team2}</h2>
                        {streak2 >= 3 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1 rounded-full"
                            >
                                <span className="text-sm font-black text-white animate-pulse">ON FIRE</span>
                                <span className="text-xl animate-bounce">🔥</span>
                            </motion.div>
                        )}
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                        {renderPyramid(cups2, 2)}
                    </div>
                    <p className="mt-4 text-sm text-gray-400 font-mono">CUPS REMAINING: {cups2.filter(c => c).length}</p>
                </div>
            </div>

            <div className="mt-16 flex gap-4">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-all font-semibold"
                >
                    {isActive ? 'PAUSE' : 'START'}
                </button>
                <button
                    onClick={() => handleGameEnd()}
                    className="bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-6 py-2 rounded-lg transition-all"
                >
                    End Game
                </button>
            </div>
        </div>
    );
};

export default GameScreen;
