import React, { useState, useEffect } from 'react';
import Cup from './Cup';
import { motion } from 'framer-motion';

const GameScreen = ({ team1, team2, onGameEnd, initialTime = 600 }) => {
    // True means cup is standing, False means cup is hit/removed
    const [cups1, setCups1] = useState(Array(6).fill(true));
    const [cups2, setCups2] = useState(Array(6).fill(true));
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isActive, setIsActive] = useState(false);
    const [suddenDeath, setSuddenDeath] = useState(false);
    const [streak1, setStreak1] = useState(0); // Consecutive hits for team 1
    const [streak2, setStreak2] = useState(0); // Consecutive hits for team 2

    const [history, setHistory] = useState([]);

    // Rearrange state
    const [rearrangeUsed1, setRearrangeUsed1] = useState(false);
    const [rearrangeUsed2, setRearrangeUsed2] = useState(false);
    const [formation1, setFormation1] = useState(null); // { type: 'diamond'|'pyramid'|'line', slots: [] }
    const [formation2, setFormation2] = useState(null);

    // Game Summary State
    const [gameResult, setGameResult] = useState(null);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0 && !suddenDeath && !gameResult) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && !suddenDeath && !gameResult) {
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
    }, [isActive, timeLeft, suddenDeath, cups1, cups2, gameResult]);

    const addToHistory = () => {
        setHistory(prev => [...prev, {
            cups1: [...cups1],
            cups2: [...cups2],
            streak1,
            streak2,
            suddenDeath,
            rearrangeUsed1,
            rearrangeUsed2,
            formation1,
            formation2
        }]);
    };

    const undo = () => {
        if (history.length === 0) return;

        const lastState = history[history.length - 1];
        setCups1(lastState.cups1);
        setCups2(lastState.cups2);
        setStreak1(lastState.streak1);
        setStreak2(lastState.streak2);
        setSuddenDeath(lastState.suddenDeath);
        setRearrangeUsed1(lastState.rearrangeUsed1);
        setRearrangeUsed2(lastState.rearrangeUsed2);
        setFormation1(lastState.formation1);
        setFormation2(lastState.formation2);

        setHistory(prev => prev.slice(0, -1));
    };

    const toggleCup = (team, index) => {
        if (!isActive && !suddenDeath) setIsActive(true);

        // Save state before modification
        addToHistory();

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
                setTimeout(() => handleGameEnd(team2, 'ot', newCups, cups2), 500);
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
                setTimeout(() => handleGameEnd(team1, 'ot', cups1, newCups), 500);
            } else {
                checkWinner(cups1, newCups);
            }
        }
    };

    const checkWinner = (c1, c2) => {
        // If Team 1 loses all cups, Team 2 wins
        if (c1.every(c => !c)) {
            setTimeout(() => handleGameEnd(team2, 'shooter', c1, c2), 500);
        }
        // If Team 2 loses all cups, Team 1 wins
        if (c2.every(c => !c)) {
            setTimeout(() => handleGameEnd(team1, 'shooter', c1, c2), 500);
        }
    };

    const handleGameEnd = (winnerName, type = 'regular', finalCups1 = cups1, finalCups2 = cups2) => {
        const remaining1 = finalCups1.filter(c => c).length;
        const remaining2 = finalCups2.filter(c => c).length;

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

        setGameResult({
            winner: actualWinner,
            loser: loser,
            winType: winType,
            cupsRemaining: {
                winner: winnerCups,
                loser: loserCups
            },
            stats: {
                [team1]: { hits: 6 - remaining2, remaining: remaining1 },
                [team2]: { hits: 6 - remaining1, remaining: remaining2 }
            }
        });
        setIsActive(false);
    };

    const finalizeGame = () => {
        if (gameResult) {
            onGameEnd(gameResult);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleRearrange = (team, type) => {
        addToHistory();

        const targetCups = team === 1 ? cups2 : cups1; // Team 1 rearranges Team 2's cups
        const activeIndices = targetCups.map((c, i) => c ? i : -1).filter(i => i !== -1);

        if (team === 1) {
            setRearrangeUsed1(true);
            setFormation2({ type, slots: activeIndices });
        } else {
            setRearrangeUsed2(true);
            setFormation1({ type, slots: activeIndices });
        }
    };

    const renderRearrangeOptions = (team) => {
        const isTeam1 = team === 1;
        const opponentCups = isTeam1 ? cups2 : cups1;
        const remaining = opponentCups.filter(c => c).length;
        const used = isTeam1 ? rearrangeUsed1 : rearrangeUsed2;

        // Always render a container with fixed height to prevent layout shifts
        return (
            <div className="mt-4 flex flex-col gap-2 items-center h-[60px] justify-start">
                {remaining <= 4 && (
                    <>
                        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">Rearrange Opponent</span>
                        {used ? (
                            <button disabled className="px-4 py-1 bg-gray-700/50 text-gray-500 rounded-lg text-xs font-mono cursor-not-allowed border border-gray-700">
                                Rearrange Used
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                {remaining === 4 && (
                                    <button
                                        onClick={() => handleRearrange(team, 'diamond')}
                                        className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 rounded text-xs transition-all"
                                    >
                                        Diamond
                                    </button>
                                )}
                                {remaining === 3 && (
                                    <>
                                        <button
                                            onClick={() => handleRearrange(team, 'pyramid_1_2')}
                                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 rounded text-xs transition-all"
                                        >
                                            Pyramid (1-2)
                                        </button>
                                        <button
                                            onClick={() => handleRearrange(team, 'pyramid_2_1')}
                                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 rounded text-xs transition-all"
                                        >
                                            Pyramid (2-1)
                                        </button>
                                    </>
                                )}
                                {remaining === 2 && (
                                    <>
                                        <button
                                            onClick={() => handleRearrange(team, 'line_vert')}
                                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 rounded text-xs transition-all"
                                        >
                                            Line (I)
                                        </button>
                                        <button
                                            onClick={() => handleRearrange(team, 'line_horiz')}
                                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 rounded text-xs transition-all"
                                        >
                                            Line (-)
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderPyramid = (cups, teamId, color = 'red', flipped = false) => {
        const formation = teamId === 1 ? formation1 : formation2;

        // Custom Formation Rendering
        if (formation) {
            const { type, slots } = formation;

            // Helper to render a cup by its original index
            const renderCup = (index) => (
                <Cup active={cups[index]} onClick={() => toggleCup(teamId, index)} color={color} />
            );

            if (type === 'diamond') { // 1-2-1
                return (
                    <div className="flex flex-col gap-2 items-center">
                        <div className="flex gap-2">{renderCup(slots[0])}</div>
                        <div className="flex gap-2">
                            {renderCup(slots[1])}
                            {renderCup(slots[2])}
                        </div>
                        <div className="flex gap-2">{renderCup(slots[3])}</div>
                    </div>
                );
            }
            if (type === 'pyramid_1_2') { // 1-2 (1 in front, 2 behind)
                if (teamId === 1) {
                    // Team 1 (Left): Front is Right.
                    // Row 1 (Right): 1 cup
                    // Row 2 (Left): 2 cups
                    return (
                        <div className="flex gap-2 items-center">
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[1])}
                                {renderCup(slots[2])}
                            </div>
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[0])}
                            </div>
                        </div>
                    );
                } else {
                    // Team 2 (Right): Front is Left.
                    // Row 1 (Left): 1 cup
                    // Row 2 (Right): 2 cups
                    return (
                        <div className="flex gap-2 items-center">
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[0])}
                            </div>
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[1])}
                                {renderCup(slots[2])}
                            </div>
                        </div>
                    );
                }
            }
            if (type === 'pyramid_2_1') { // 2-1 (2 in front, 1 behind)
                if (teamId === 1) {
                    // Team 1 (Left): Front is Right.
                    // Row 1 (Right): 2 cups
                    // Row 2 (Left): 1 cup
                    return (
                        <div className="flex gap-2 items-center">
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[2])}
                            </div>
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[0])}
                                {renderCup(slots[1])}
                            </div>
                        </div>
                    );
                } else {
                    // Team 2 (Right): Front is Left.
                    // Row 1 (Left): 2 cups
                    // Row 2 (Right): 1 cup
                    return (
                        <div className="flex gap-2 items-center">
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[0])}
                                {renderCup(slots[1])}
                            </div>
                            <div className="flex flex-col gap-2">
                                {renderCup(slots[2])}
                            </div>
                        </div>
                    );
                }
            }
            if (type === 'line_vert') { // Vertical line
                return (
                    <div className="flex flex-col gap-2 items-center">
                        {slots.map(idx => <div key={idx} className="flex gap-2">{renderCup(idx)}</div>)}
                    </div>
                );
            }
            if (type === 'line_horiz') { // Horizontal line
                return (
                    <div className="flex gap-2 items-center">
                        {slots.map(idx => <div key={idx} className="flex gap-2">{renderCup(idx)}</div>)}
                    </div>
                );
            }
        }

        // Default Layouts
        if (flipped) {
            // Team 2 pyramid - horizontal (1-2-3 from left to right)
            return (
                <div className="flex gap-2 items-center">
                    <div className="flex flex-col gap-2">
                        <Cup active={cups[5]} onClick={() => toggleCup(teamId, 5)} color={color} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Cup active={cups[3]} onClick={() => toggleCup(teamId, 3)} color={color} />
                        <Cup active={cups[4]} onClick={() => toggleCup(teamId, 4)} color={color} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Cup active={cups[0]} onClick={() => toggleCup(teamId, 0)} color={color} />
                        <Cup active={cups[1]} onClick={() => toggleCup(teamId, 1)} color={color} />
                        <Cup active={cups[2]} onClick={() => toggleCup(teamId, 2)} color={color} />
                    </div>
                </div>
            );
        }

        // Team 1 pyramid - horizontal (3-2-1 from left to right)
        return (
            <div className="flex gap-2 items-center">
                <div className="flex flex-col gap-2">
                    <Cup active={cups[0]} onClick={() => toggleCup(teamId, 0)} color={color} />
                    <Cup active={cups[1]} onClick={() => toggleCup(teamId, 1)} color={color} />
                    <Cup active={cups[2]} onClick={() => toggleCup(teamId, 2)} color={color} />
                </div>
                <div className="flex flex-col gap-2">
                    <Cup active={cups[3]} onClick={() => toggleCup(teamId, 3)} color={color} />
                    <Cup active={cups[4]} onClick={() => toggleCup(teamId, 4)} color={color} />
                </div>
                <div className="flex flex-col gap-2">
                    <Cup active={cups[5]} onClick={() => toggleCup(teamId, 5)} color={color} />
                </div>
            </div>
        );
    };

    const renderSummary = () => {
        if (!gameResult) return null;

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-2xl w-full mx-4 shadow-2xl flex flex-col items-center">
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
                        GAME OVER
                    </h2>
                    <div className="text-2xl font-bold text-white mb-8">
                        Winner: <span className="text-green-400">{gameResult.winner}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-8 w-full mb-8">
                        <div className="bg-white/5 p-6 rounded-xl flex flex-col items-center border border-white/5">
                            <h3 className="text-xl font-bold text-blue-400 mb-4">{team1}</h3>
                            <div className="text-4xl font-mono font-bold text-white mb-2">
                                {gameResult.cupsRemaining.winner === gameResult.stats[team1].remaining ? gameResult.cupsRemaining.winner : gameResult.cupsRemaining.loser}
                            </div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Cups Left</span>
                            <div className="mt-4 pt-4 border-t border-white/10 w-full text-center">
                                <span className="text-2xl font-bold text-green-400">+{gameResult.stats[team1].hits}</span>
                                <p className="text-xs text-gray-500 uppercase mt-1">Cups Hit</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl flex flex-col items-center border border-white/5">
                            <h3 className="text-xl font-bold text-red-400 mb-4">{team2}</h3>
                            <div className="text-4xl font-mono font-bold text-white mb-2">
                                {gameResult.cupsRemaining.winner === gameResult.stats[team2].remaining ? gameResult.cupsRemaining.winner : gameResult.cupsRemaining.loser}
                            </div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Cups Left</span>
                            <div className="mt-4 pt-4 border-t border-white/10 w-full text-center">
                                <span className="text-2xl font-bold text-green-400">+{gameResult.stats[team2].hits}</span>
                                <p className="text-xs text-gray-500 uppercase mt-1">Cups Hit</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={finalizeGame}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Return to Tournament
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center w-full max-w-5xl animate-fade-in relative">
            {renderSummary()}

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
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 shadow-inner min-h-[300px] flex items-center justify-center">
                        {renderPyramid(cups1, 1, 'blue', false)}
                    </div>
                    <p className="mt-4 text-sm text-gray-400 font-mono">CUPS REMAINING: {cups1.filter(c => c).length}</p>
                    {renderRearrangeOptions(1)}
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/50 to-transparent">VS</span>
                </div>

                {/* Team 2 Side */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-3xl font-bold text-red-400 drop-shadow-lg">{team2}</h2>
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
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 shadow-inner min-h-[300px] flex items-center justify-center">
                        {renderPyramid(cups2, 2, 'red', true)}
                    </div>
                    <p className="mt-4 text-sm text-gray-400 font-mono">CUPS REMAINING: {cups2.filter(c => c).length}</p>
                    {renderRearrangeOptions(2)}
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
                    onClick={undo}
                    disabled={history.length === 0}
                    className={`px-6 py-2 rounded-lg transition-all font-semibold border ${history.length === 0 ? 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed' : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}
                >
                    UNDO
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
