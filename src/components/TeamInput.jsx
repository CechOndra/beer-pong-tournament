import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamInput = ({ onStartTournament }) => {
    const [teams, setTeams] = useState([]); // [{ name: '', playerCount: 2, players: ['', ''] }]
    const [currentTeamName, setCurrentTeamName] = useState('');
    const [defaultPlayersPerTeam, setDefaultPlayersPerTeam] = useState(2);

    const addTeam = () => {
        if (currentTeamName.trim()) {
            setTeams([...teams, {
                name: currentTeamName.trim(),
                playerCount: defaultPlayersPerTeam,
                players: Array(defaultPlayersPerTeam).fill('')
            }]);
            setCurrentTeamName('');
        }
    };

    const removeTeam = (index) => {
        setTeams(teams.filter((_, i) => i !== index));
    };

    const updateTeamName = (index, newName) => {
        const newTeams = [...teams];
        newTeams[index].name = newName;
        setTeams(newTeams);
    };

    const updatePlayerName = (teamIndex, playerIndex, name) => {
        const newTeams = [...teams];
        newTeams[teamIndex].players[playerIndex] = name;
        setTeams(newTeams);
    };

    const adjustPlayerCount = (teamIndex, delta) => {
        const newTeams = [...teams];
        const team = newTeams[teamIndex];
        const newCount = Math.max(1, Math.min(6, team.playerCount + delta));

        if (newCount > team.playerCount) {
            team.players.push('');
        } else if (newCount < team.playerCount) {
            team.players.pop();
        }
        team.playerCount = newCount;
        setTeams(newTeams);
    };

    const handleStart = () => {
        if (teams.length >= 2) {
            // Convert to format expected by App.jsx
            const teamsData = teams.map(t => ({
                name: t.name,
                players: t.players.map((p, i) => p.trim() || `Player ${i + 1}`)
            }));
            onStartTournament(teamsData);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
            {/* Global Players Per Team Setting */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">Default players per team:</span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDefaultPlayersPerTeam(Math.max(1, defaultPlayersPerTeam - 1))}
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-colors"
                        >-</button>
                        <span className="text-white font-bold text-lg w-6 text-center">{defaultPlayersPerTeam}</span>
                        <button
                            onClick={() => setDefaultPlayersPerTeam(Math.min(6, defaultPlayersPerTeam + 1))}
                            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-colors"
                        >+</button>
                    </div>
                </div>
            </div>

            {/* Add Team Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={currentTeamName}
                    onChange={(e) => setCurrentTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                    placeholder="Enter team name"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <button
                    onClick={addTeam}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                    Add
                </button>
            </div>

            {/* Teams List */}
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                    {teams.map((team, teamIndex) => (
                        <motion.div
                            key={`team-${teamIndex}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                        >
                            {/* Team Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-purple-400 font-bold">{teamIndex + 1}.</span>
                                    <input
                                        type="text"
                                        value={team.name}
                                        onChange={(e) => updateTeamName(teamIndex, e.target.value)}
                                        className="flex-1 bg-transparent border-none text-white font-semibold focus:outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Player Count Adjustment */}
                                    <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
                                        <button
                                            onClick={() => adjustPlayerCount(teamIndex, -1)}
                                            className="w-6 h-6 text-white/50 hover:text-white text-sm transition-colors"
                                        >-</button>
                                        <span className="text-xs text-white/70 w-12 text-center">
                                            {team.playerCount} player{team.playerCount > 1 ? 's' : ''}
                                        </span>
                                        <button
                                            onClick={() => adjustPlayerCount(teamIndex, 1)}
                                            className="w-6 h-6 text-white/50 hover:text-white text-sm transition-colors"
                                        >+</button>
                                    </div>
                                    <button
                                        onClick={() => removeTeam(teamIndex)}
                                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Player Name Inputs */}
                            <div className="grid grid-cols-2 gap-2">
                                {team.players.map((player, playerIndex) => (
                                    <input
                                        key={`player-${playerIndex}`}
                                        type="text"
                                        value={player}
                                        onChange={(e) => updatePlayerName(teamIndex, playerIndex, e.target.value)}
                                        placeholder={`Player ${playerIndex + 1}`}
                                        className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Start Button */}
            <div className="mt-4 flex flex-col items-center gap-2">
                <button
                    onClick={handleStart}
                    disabled={teams.length < 2}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 w-full md:w-auto ${teams.length >= 2
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Generate Bracket
                </button>
                {teams.length === 0 && (
                    <p className="text-gray-400 text-sm">
                        Add at least 2 teams to start.
                    </p>
                )}
            </div>
        </div>
    );
};

export default TeamInput;
