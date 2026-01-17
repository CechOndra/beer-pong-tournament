import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TournamentSetup = ({ teams, onStartTournament }) => {
    const [mode, setMode] = useState('playoffs'); // 'playoffs' or 'groups'
    const [numGroups, setNumGroups] = useState(2);
    const [advancingPerGroup, setAdvancingPerGroup] = useState(2);
    const [tournamentName, setTournamentName] = useState(''); // Optional name

    const [gameTime, setGameTime] = useState(10); // Minutes

    // Calculate valid options based on team count
    const maxGroups = Math.floor(teams.length / 3); // Min 3 teams per group usually
    const validGroupOptions = [];
    for (let i = 1; i <= maxGroups; i++) {
        // We want even number of groups usually for easier bracket, but let's allow 1, 2, 4, 8 etc
        if (teams.length / i >= 3) {
            validGroupOptions.push(i);
        }
    }

    // Ensure defaults are valid
    useEffect(() => {
        if (teams.length < 6) {
            setMode('playoffs'); // Force playoffs if not enough teams for groups
        }
    }, [teams.length]);

    const handleStart = () => {
        onStartTournament({
            mode,
            tournamentName: tournamentName.trim() || null,
            config: {
                ...((mode === 'groups' || mode === 'groups_only') ? { numGroups: mode === 'groups_only' ? 1 : numGroups, advancingPerGroup } : {}),
                gameTime: gameTime * 60 // Convert to seconds
            }
        });
    };

    const totalAdvancing = numGroups * advancingPerGroup;
    // Next power of 2 for bracket size
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalAdvancing)));
    const hasByes = bracketSize > totalAdvancing;

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Tournament Setup
            </h2>

            {/* Optional Tournament Name */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <label className="block text-lg font-semibold mb-4">Tournament Name (Optional)</label>
                <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="e.g., Friday Night Pong"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <label className="block text-lg font-semibold mb-4">Tournament Format</label>
                <div className="flex gap-4 flex-wrap">
                    <button
                        onClick={() => setMode('playoffs')}
                        className={`flex-1 min-w-[150px] py-4 rounded-xl font-bold transition-all border ${mode === 'playoffs'
                            ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                        Direct Playoffs
                    </button>
                    <button
                        onClick={() => setMode('groups')}
                        disabled={teams.length < 6}
                        className={`flex-1 min-w-[150px] py-4 rounded-xl font-bold transition-all border ${mode === 'groups'
                            ? 'bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'} ${teams.length < 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Groups + Playoffs
                        {teams.length < 6 && <div className="text-xs font-normal mt-1 text-gray-400">(Min 6 teams)</div>}
                    </button>
                    <button
                        onClick={() => setMode('groups_only')}
                        className={`flex-1 min-w-[150px] py-4 rounded-xl font-bold transition-all border ${mode === 'groups_only'
                            ? 'bg-green-600 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                        Groups Only
                    </button>
                </div>
            </div>

            {/* Game Time Configuration */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <label className="block text-lg font-semibold mb-4">
                    {(mode === 'groups' || mode === 'groups_only') ? 'Group Stage Game Duration' : 'Game Duration'}
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={gameTime}
                        onChange={(e) => setGameTime(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="min-w-[80px] text-center font-mono text-xl font-bold text-blue-400">
                        {gameTime} min
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Time limit for each game. {mode === 'groups' && 'Playoff time can be set later.'}
                </p>
            </div>

            {(mode === 'groups' || mode === 'groups_only') && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-6"
                >
                    {mode === 'groups' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Number of Groups</label>
                            <div className="flex gap-2 flex-wrap">
                                {validGroupOptions.map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setNumGroups(num)}
                                        className={`px-6 py-2 rounded-lg font-bold transition-all ${numGroups === num
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {Math.floor(teams.length / numGroups)} - {Math.ceil(teams.length / numGroups)} teams per group
                            </p>
                        </div>
                    )}

                    {mode === 'groups' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Teams Advancing per Group</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setAdvancingPerGroup(num)}
                                        disabled={num >= (teams.length / numGroups)}
                                        className={`px-6 py-2 rounded-lg font-bold transition-all ${advancingPerGroup === num
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'} ${num >= (teams.length / numGroups) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'groups' && (
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <h4 className="font-bold text-gray-300 mb-2">Playoff Preview</h4>
                            <p className="text-sm text-gray-400">
                                Total Advancing: <span className="text-white font-bold">{totalAdvancing}</span> teams
                            </p>
                            <p className="text-sm text-blue-400 font-bold mt-1">
                                {bracketSize <= 2 ? 'Finals' :
                                    bracketSize <= 4 ? 'Semi-Finals' :
                                        bracketSize <= 8 ? 'Quarter-Finals' :
                                            bracketSize <= 16 ? 'Round of 16' :
                                                'Round of 32'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Bracket Size: {bracketSize} slots
                                {hasByes && <span className="text-yellow-400 ml-2">({bracketSize - totalAdvancing} Byes)</span>}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            <button
                onClick={handleStart}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-xl shadow-lg hover:scale-[1.02] transition-transform"
            >
                Start Tournament
            </button>
        </div>
    );
};

export default TournamentSetup;
