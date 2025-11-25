import React, { useState } from 'react';
import { motion } from 'framer-motion';

const GroupStage = ({ groups, onMatchClick, onAdvanceToPlayoffs, mode }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [activeHeaderTooltip, setActiveHeaderTooltip] = useState(null);

    const isGroupComplete = (group) => {
        return group.matches.every(m => m.winner);
    };

    const allGroupsComplete = groups.every(isGroupComplete);

    return (
        <div className="w-full max-w-[95%] mx-auto flex flex-col gap-8 animate-fade-in pb-20">
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

            <div className="flex flex-col gap-12">
                {/* Standings Table */}
                <motion.div
                    key={`standings-${activeTab}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 rounded-2xl border border-white/10 p-6"
                >
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-2xl font-bold text-blue-300">Standings</h3>

                        {/* Dynamic Legend / Info Bar */}
                        <div className="text-sm text-gray-300 bg-black/30 px-4 py-2 rounded-lg border border-white/10 min-h-[40px] flex items-center">
                            {activeHeaderTooltip ? (
                                <span className="animate-fade-in">
                                    <span className="font-bold text-blue-400">{activeHeaderTooltip}:</span> {
                                        activeHeaderTooltip === 'PTS' ? 'Points' :
                                            activeHeaderTooltip === 'MP' ? 'Matches Played' :
                                                activeHeaderTooltip === 'W' ? 'Regular Wins (3 pts)' :
                                                    activeHeaderTooltip === 'OTW' ? 'Overtime Wins (2 pts)' :
                                                        activeHeaderTooltip === 'OTL' ? 'Overtime Losses (1 pt)' :
                                                            activeHeaderTooltip === 'L' ? 'Losses (0 pts)' :
                                                                activeHeaderTooltip === 'SW' ? 'Shooter Wins (All cups hit)' :
                                                                    activeHeaderTooltip === '+/-' ? 'Cup Difference' : ''
                                    }
                                </span>
                            ) : (
                                <span className="text-gray-500 italic">Click headers for details</span>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10 text-sm uppercase tracking-wider">
                                    <th className="p-3">#</th>
                                    <th className="p-3">Team</th>
                                    {['PTS', 'MP', 'W', 'OTW', 'OTL', 'L', 'SW', '+/-'].map(header => (
                                        <th
                                            key={header}
                                            className="p-3 text-center cursor-pointer hover:text-white transition-colors select-none"
                                            onClick={() => setActiveHeaderTooltip(activeHeaderTooltip === header ? null : header)}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {groups[activeTab].standings.map((team, i) => {
                                    let rowClass = `border-b border-white/5`;
                                    let rankDisplay = i + 1;

                                    if (mode === 'groups_only' && allGroupsComplete) {
                                        if (i === 0) {
                                            rowClass += ' bg-yellow-500/20 border-yellow-500/50 shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]';
                                            rankDisplay = '🥇';
                                        } else if (i === 1) {
                                            rowClass += ' bg-gray-400/20 border-gray-400/50 shadow-[inset_0_0_20px_rgba(156,163,175,0.2)]';
                                            rankDisplay = '🥈';
                                        } else if (i === 2) {
                                            rowClass += ' bg-orange-700/20 border-orange-700/50 shadow-[inset_0_0_20px_rgba(194,65,12,0.2)]';
                                            rankDisplay = '🥉';
                                        }
                                    } else if (i < groups[activeTab].advancingCount) {
                                        rowClass += ' bg-green-500/10';
                                    }

                                    return (
                                        <tr key={i} className={rowClass}>
                                            <td className="p-3 font-mono text-gray-400 text-center">{rankDisplay}</td>
                                            <td className="p-3 font-bold text-white">{team.name}</td>
                                            <td className="p-3 text-center font-bold text-yellow-400">{team.points}</td>
                                            <td className="p-3 text-center text-gray-300">{team.gamesPlayed}</td>
                                            <td className="p-3 text-center">{team.wins}</td>
                                            <td className="p-3 text-center text-blue-400">{team.otWins || 0}</td>
                                            <td className="p-3 text-center text-orange-400">{team.otLosses || 0}</td>
                                            <td className="p-3 text-center">{team.losses}</td>
                                            <td className="p-3 text-center text-purple-400">{team.shooterWins}</td>
                                            <td
                                                className={`p-3 text-center relative cursor-pointer group ${team.cupDiff > 0 ? 'text-green-400' : team.cupDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}
                                                onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
                                                onMouseEnter={() => setActiveTooltip(i)}
                                                onMouseLeave={() => setActiveTooltip(null)}
                                            >
                                                {team.cupDiff > 0 ? '+' : ''}{team.cupDiff}

                                                {/* Tooltip for Cup Stats */}
                                                {activeTooltip === i && (
                                                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50">
                                                        <div className="flex gap-3">
                                                            <span className="text-green-400">Hit: {team.cupsHit || 0}</span>
                                                            <span className="text-red-400">Lost: {team.cupsLost || 0}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
                        onClick={mode === 'groups_only' ? () => window.location.reload() : onAdvanceToPlayoffs}
                        className={`px-12 py-4 rounded-2xl font-bold text-2xl shadow-xl hover:scale-105 transition-transform animate-pulse ${mode === 'groups_only'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                            }`}
                    >
                        {mode === 'groups_only' ? 'Finish Tournament 🏁' : 'Proceed to Playoffs 🏆'}
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default GroupStage;
