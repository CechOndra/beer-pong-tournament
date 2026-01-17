import React, { useState, useEffect } from 'react';
import Cup from './Cup';
import { motion } from 'framer-motion';

const GameScreen = ({ team1, team1Players = [], team2, team2Players = [], onGameEnd, initialTime = 600, tournamentId, matchId, initialGameState, onGameStateChange }) => {
    // True means cup is standing, False means cup is hit/removed
    const [cups1, setCups1] = useState(initialGameState?.cups1 || Array(6).fill(true));
    const [cups2, setCups2] = useState(initialGameState?.cups2 || Array(6).fill(true));
    const [timeLeft, setTimeLeft] = useState(initialGameState?.timeLeft ?? initialTime);
    const [isActive, setIsActive] = useState(initialGameState?.isActive || false);
    const [suddenDeath, setSuddenDeath] = useState(initialGameState?.suddenDeath || false);
    const [streak1, setStreak1] = useState(initialGameState?.streak1 || 0); // Consecutive hits for team 1
    const [streak2, setStreak2] = useState(initialGameState?.streak2 || 0); // Consecutive hits for team 2

    const [history, setHistory] = useState(initialGameState?.history || []);

    // Rearrange state
    const [rearrangeUsed1, setRearrangeUsed1] = useState(initialGameState?.rearrangeUsed1 || false);
    const [rearrangeUsed2, setRearrangeUsed2] = useState(initialGameState?.rearrangeUsed2 || false);
    const [formation1, setFormation1] = useState(initialGameState?.formation1 || null); // { type: 'diamond'|'pyramid'|'line', slots: [] }
    const [formation2, setFormation2] = useState(initialGameState?.formation2 || null);

    // Game Summary State
    const [gameResult, setGameResult] = useState(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Player selection popup state
    const [playerSelectPopup, setPlayerSelectPopup] = useState(null); // { team, cupIndex, timeoutId }
    const [cupHits, setCupHits] = useState(initialGameState?.cupHits || []); // [{ player, team, cupIndex }]

    // Handle back button - if game started, show confirmation
    const handleBack = () => {
        if (isActive || history.length > 0) {
            // Game has started - pause and show confirm
            setIsActive(false);
            setShowExitConfirm(true);
        } else {
            // Game not started - just return
            onGameEnd(null);
        }
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        onGameEnd(null);
    };

    const cancelExit = () => {
        setShowExitConfirm(false);
        // Don't auto-resume, let user press Play
    };

    // Report state changes to parent for persistence
    useEffect(() => {
        if (!onGameStateChange) return;
        onGameStateChange({
            cups1, cups2, timeLeft, isActive, suddenDeath, streak1, streak2,
            history, rearrangeUsed1, rearrangeUsed2, formation1, formation2
        });
    }, [cups1, cups2, timeLeft, isActive, suddenDeath, streak1, streak2, history, rearrangeUsed1, rearrangeUsed2, formation1, formation2]);

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

    const logEvent = async (eventType, details) => {
        if (!tournamentId || !matchId) return;

        const elapsedTime = initialTime - timeLeft;
        const mins = Math.floor(elapsedTime / 60);
        const secs = elapsedTime % 60;
        const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Cups After
        const remaining1 = cups1.filter(c => c).length;
        const remaining2 = cups2.filter(c => c).length;
        // Adjust if this is called *before* state update or *after*?
        // Let's pass the specific values in details if needed, otherwise use current state (which might be stale if called immediately)
        // Better to pass logic values.

        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournament_id: tournamentId,
                    match_id: matchId,
                    hit_number: history.length + 1,
                    game_time_str: timeStr,
                    game_time_sec: elapsedTime,
                    phase: suddenDeath ? 'Overtime' : 'Regulation',
                    event_type: eventType,
                    ...details
                })
            });
        } catch (err) {
            console.error("Failed to log event:", err);
        }
    };

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

    // Player selection popup handlers
    const showPlayerSelect = (team, cupIndex) => {
        // If there's already a pending selection, auto-assign Unknown
        if (playerSelectPopup) {
            // Clear existing timeout
            if (playerSelectPopup.timeoutId) {
                clearTimeout(playerSelectPopup.timeoutId);
            }
            // Record the previous hit as Unknown
            const previousHit = {
                player: 'Unknown',
                team: playerSelectPopup.team === 1 ? team2 : team1,
                cupIndex: playerSelectPopup.cupIndex,
                timestamp: Date.now()
            };
            setCupHits(prev => [...prev, previousHit]);
        }

        // Set new popup with 15-second timeout
        const timeoutId = setTimeout(() => {
            selectPlayer('Unknown');
        }, 15000);

        setPlayerSelectPopup({ team, cupIndex, timeoutId });
    };

    const selectPlayer = (playerName) => {
        if (!playerSelectPopup) return;

        // Clear timeout
        if (playerSelectPopup.timeoutId) {
            clearTimeout(playerSelectPopup.timeoutId);
        }

        // Record the hit with player attribution
        const newHit = {
            player: playerName,
            team: playerSelectPopup.team === 1 ? team2 : team1, // Hitting team
            cupIndex: playerSelectPopup.cupIndex,
            timestamp: Date.now()
        };
        setCupHits(prev => [...prev, newHit]);

        // Log event with player name
        const hittingTeam = playerSelectPopup.team === 1 ? team2 : team1;
        logEvent('Hit', {
            team_name: hittingTeam,
            player_name: playerName,
            cup_hit: `Cup ${playerSelectPopup.cupIndex + 1}`,
            notes: `${playerName} hit Cup ${playerSelectPopup.cupIndex + 1}`
        });

        setPlayerSelectPopup(null);
    };

    const dismissPlayerSelect = () => {
        selectPlayer('Unknown');
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

                // Show player selection popup (Team 2 hit Team 1's cup)
                showPlayerSelect(team, index);
            }

            if (suddenDeath && !newCups[index]) {
                // Cup removed in sudden death -> Team 2 wins
                handleGameEnd(team2, 'ot', newCups, cups2);
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

                // Show player selection popup (Team 1 hit Team 2's cup)
                showPlayerSelect(team, index);
            }

            if (suddenDeath && !newCups[index]) {
                // Cup removed in sudden death -> Team 1 wins
                handleGameEnd(team1, 'ot', cups1, newCups);
            } else {
                checkWinner(cups1, newCups);
            }
        }
    };

    const checkWinner = (c1, c2) => {
        // If Team 1 loses all cups, Team 2 wins
        if (c1.every(c => !c)) {
            // Show game result immediately - player selection will be on the summary screen
            handleGameEnd(team2, 'shooter', c1, c2);
        }
        // If Team 2 loses all cups, Team 1 wins
        if (c2.every(c => !c)) {
            handleGameEnd(team1, 'shooter', c1, c2);
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
            },
            cupHits: cupHits // Include player-level cup hits
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
            logEvent('Formation Change', {
                team_name: team1,
                notes: `${team1} chose ${type}`,
                cup_hit: '',
                score_after: '', // Keep previous? Or empty.
                cups_left: `${cups1.filter(c => c).length}-${cups2.filter(c => c).length}`
            });
        } else {
            setRearrangeUsed2(true);
            setFormation1({ type, slots: activeIndices });
            logEvent('Formation Change', {
                team_name: team2,
                notes: `${team2} chose ${type}`,
                cup_hit: '',
                score_after: '',
                cups_left: `${cups1.filter(c => c).length}-${cups2.filter(c => c).length}`
            });
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

        // Check if there's a pending player selection for the winning shot
        const hasPendingSelection = playerSelectPopup !== null;

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-2xl w-full mx-4 shadow-2xl flex flex-col items-center">
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
                        GAME OVER
                    </h2>
                    <div className="text-2xl font-bold text-white mb-8">
                        Winner: <span className="text-green-400">{gameResult.winner}</span>
                    </div>

                    {/* Player Selection for winning shot */}
                    {hasPendingSelection && (
                        <div className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 mb-6">
                            <p className="text-center text-white text-sm mb-3">
                                <span className="text-purple-400 font-bold">{playerSelectPopup.team === 1 ? team2 : team1}</span> hit the winning shot — Who scored?
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {(playerSelectPopup.team === 1 ? team2Players : team1Players).map((player, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectPlayer(player || `Player ${i + 1}`)}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-sm transition-all"
                                    >
                                        {player || `Player ${i + 1}`}
                                    </button>
                                ))}
                                <button
                                    onClick={() => selectPlayer('Unknown')}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg text-sm transition-all border border-white/10"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    )}

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
                        disabled={hasPendingSelection}
                        className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all transform ${hasPendingSelection
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {hasPendingSelection ? 'Select who scored first' : 'Return to Tournament'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center w-full max-w-5xl animate-fade-in relative">
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="self-start mb-4 text-sm text-white/50 hover:text-white transition-colors"
            >
                ← Back to Matches
            </button>

            {renderSummary()}

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-2xl border border-white/10 max-w-md text-center">
                        <h3 className="text-2xl font-bold text-white mb-4">Exit Game?</h3>
                        <p className="text-white/70 mb-6">
                            The game is in progress. Are you sure you want to exit? Your progress will NOT be saved.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={cancelExit}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
                            >
                                Continue Playing
                            </button>
                            <button
                                onClick={confirmExit}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all"
                            >
                                Exit Game
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Inline Player Selection */}
            {playerSelectPopup && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4 mt-4 max-w-md mx-auto relative"
                >
                    {/* Close X button */}
                    <button
                        onClick={() => selectPlayer('Unknown')}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-all"
                    >
                        ✕
                    </button>

                    <p className="text-center text-white text-sm mb-3 pr-6">
                        <span className="text-purple-400 font-bold">{playerSelectPopup.team === 1 ? team2 : team1}</span> hit Cup #{playerSelectPopup.cupIndex + 1} — Who scored?
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {(playerSelectPopup.team === 1 ? team2Players : team1Players).map((player, i) => (
                            <button
                                key={i}
                                onClick={() => selectPlayer(player || `Player ${i + 1}`)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-sm transition-all"
                            >
                                {player || `Player ${i + 1}`}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default GameScreen;
