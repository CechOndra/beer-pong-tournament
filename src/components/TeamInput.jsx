import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamInput = ({ onStartTournament }) => {
    const [teams, setTeams] = useState([]);
    const [currentTeam, setCurrentTeam] = useState('');

    const addTeam = () => {
        if (currentTeam.trim()) {
            setTeams([...teams, currentTeam.trim()]);
            setCurrentTeam('');
        }
    };

    const removeTeam = (index) => {
        const newTeams = teams.filter((_, i) => i !== index);
        setTeams(newTeams);
    };

    const handleStart = () => {
        if (teams.length >= 2) {
            onStartTournament(teams);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={currentTeam}
                    onChange={(e) => setCurrentTeam(e.target.value)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                    {teams.map((team, index) => (
                        <motion.div
                            key={`${team}-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/5"
                        >
                            <span className="font-medium truncate mr-2">{index + 1}. {team}</span>
                            <button
                                onClick={() => removeTeam(index)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                            >
                                ✕
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

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
