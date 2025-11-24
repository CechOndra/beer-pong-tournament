import React, { useState } from 'react';
import { motion } from 'framer-motion';

const GroupStage = ({ groups, onMatchClick, onAdvanceToPlayoffs }) => {
    const [activeTab, setActiveTab] = useState(0);

    const isGroupComplete = (group) => {
        return group.matches.every(m => m.winner);
    };

    const allGroupsComplete = groups.every(isGroupComplete);

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in">
            {/* Group Tabs */}
            <div className="flex justify-center gap-4 flex-wrap">
                {groups.map((group, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`px-6 py-3 rounded-xl font-bold text-lg transition-all border ${activeTab === index
                            ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Group {String.fromCharCode(65 + index)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Standings Table */}
                <motion.div
                    key={`standings-${activeTab}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-2xl border border-white/10 p-6 overflow-hidden"
                >
                    <h3 className="text-2xl font-bold mb-6 text-blue-300">Standings</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10 text-sm uppercase tracking-wider">
                                    <th className="p-3">#</th>
                                    <th className="p-3">Team</th>
                                    <th className="p-3 text-center">PTS</th>
                                    <th className="p-3 text-center">W</th>
                                    <th className="p-3 text-center">L</th>
                                    <th className="p-3 text-center">SW</th>
                                    <th className="p-3 text-center">+/-</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {groups[activeTab].standings.map((team, i) => (
                                    <tr key={i} className={`border-b border-white/5 ${i < groups[activeTab].advancingCount ? 'bg-green-500/10' : ''}`}>
                                        <td className="p-3 font-mono text-gray-400">{i + 1}</td>
                                        <td className="p-3 font-bold text-white">{team.name}</td>
                                        <td className="p-3 text-center font-bold text-yellow-400">{team.points}</td>
                                        <td className="p-3 text-center">{team.wins}</td>
                                        <td className="p-3 text-center">{team.losses}</td>
                                        <td className="p-3 text-center text-purple-400">{team.shooterWins}</td>
                                        <td className={`p-3 text-center ${team.cupDiff > 0 ? 'text-green-400' : team.cupDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                            {team.cupDiff > 0 ? '+' : ''}{team.cupDiff}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 flex gap-4">
                        <span>SW = Shooter Win (3pts)</span>
                        <span>PTS = Points</span>
                        <span>+/- = Cup Diff</span>
                    </div>
                </motion.div>

                {/* Matches List */}
                <motion.div
                    key={`matches-${activeTab}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-4"
                >
                    <h3 className="text-2xl font-bold mb-2 text-purple-300">Matches</h3>
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {groups[activeTab].matches.map((match, i) => (
                            <div
                                key={match.id}
                                onClick={() => !match.winner && onMatchClick(activeTab, i)}
                                className={`p-4 rounded-xl border transition-all relative ${match.winner
                                    ? 'bg-black/20 border-white/5 opacity-70'
                                    : 'bg-white/10 border-white/20 cursor-pointer hover:bg-white/15 hover:scale-[1.02]'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold ${match.winner === match.p1 ? 'text-green-400' : 'text-white'}`}>
                                        {match.p1}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">VS</span>
                                    <span className={`font-bold ${match.winner === match.p2 ? 'text-green-400' : 'text-white'}`}>
                                        {match.p2}
                                    </span>
                                </div>
                                {match.winner && (
                                    <div className="mt-2 text-xs text-center text-gray-400 border-t border-white/5 pt-2 flex justify-center gap-4">
                                        <span>Winner: {match.winner}</span>
                                        {match.winType === 'shooter' && <span className="text-purple-400">SHOOTER WIN</span>}
                                        {match.winType === 'ot' && <span className="text-yellow-400">OT WIN</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {allGroupsComplete && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mt-8"
                >
                    <button
                        onClick={onAdvanceToPlayoffs}
                        className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl font-bold text-2xl shadow-xl hover:scale-105 transition-transform animate-pulse"
                    >
                        Proceed to Playoffs 🏆
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default GroupStage;
