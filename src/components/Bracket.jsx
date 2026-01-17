import React from 'react';
import { motion } from 'framer-motion';

// Helper to extract team name from either string or object
const getTeamName = (team) => {
    if (!team) return null;
    return typeof team === 'object' ? team.name : team;
};

const Bracket = ({ matches, onMatchClick, thirdPlaceMatch, onThirdPlaceMatchClick }) => {
    return (
        <div className="w-full">
            <div className="flex flex-row gap-12 overflow-x-auto p-4 items-center justify-start md:justify-center min-h-[60vh] w-full">
                {matches.map((round, roundIndex) => (
                    <div key={roundIndex} className="flex flex-col justify-around h-full gap-8 min-w-[220px]">
                        <h3 className="text-center text-purple-300 font-bold mb-4 uppercase tracking-widest text-xs md:text-sm">
                            {roundIndex === matches.length - 1 ? 'Final' : `Round ${roundIndex + 1}`}
                        </h3>
                        <div className="flex flex-col justify-center gap-8 flex-grow">
                            {round.map((match, matchIndex) => {
                                const p1Name = getTeamName(match.p1);
                                const p2Name = getTeamName(match.p2);
                                const winnerName = getTeamName(match.winner);

                                return (
                                    <motion.div
                                        key={match.id}
                                        whileHover={!winnerName && p1Name && p2Name ? { scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' } : {}}
                                        className={`bg-white/5 border ${winnerName ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-white/10'} rounded-xl p-4 cursor-pointer relative backdrop-blur-sm transition-all w-full`}
                                        onClick={() => !winnerName && p1Name && p2Name && onMatchClick(roundIndex, matchIndex)}
                                    >
                                        <div className={`flex justify-between items-center mb-2 p-1 rounded ${winnerName === p1Name ? 'bg-green-500/20 text-green-400 font-bold' : 'text-white'}`}>
                                            <span className="truncate">{p1Name || 'TBD'}</span>
                                            {winnerName === p1Name && <span>🏆</span>}
                                        </div>
                                        <div className="h-[1px] w-full bg-white/10 mb-2"></div>
                                        <div className={`flex justify-between items-center p-1 rounded ${winnerName === p2Name ? 'bg-green-500/20 text-green-400 font-bold' : 'text-white'}`}>
                                            <span className="truncate">{p2Name || 'TBD'}</span>
                                            {winnerName === p2Name && <span>🏆</span>}
                                        </div>

                                        {!winnerName && p1Name && p2Name && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 rounded-xl transition-opacity backdrop-blur-[2px]">
                                                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg transform hover:scale-110 transition-transform">PLAY MATCH</span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3rd Place Match */}
            {thirdPlaceMatch && getTeamName(thirdPlaceMatch.p1) && getTeamName(thirdPlaceMatch.p2) && (() => {
                const p1Name = getTeamName(thirdPlaceMatch.p1);
                const p2Name = getTeamName(thirdPlaceMatch.p2);
                const winnerName = getTeamName(thirdPlaceMatch.winner);

                return (
                    <div className="flex justify-center mt-8 mb-4">
                        <div className="w-full max-w-[280px]">
                            <h3 className="text-center text-amber-400 font-bold mb-4 uppercase tracking-widest text-sm">
                                🥉 3rd Place Match
                            </h3>
                            <motion.div
                                whileHover={!winnerName ? { scale: 1.05, borderColor: 'rgba(251, 191, 36, 0.5)' } : {}}
                                className={`bg-white/5 border ${winnerName ? 'border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-white/10'} rounded-xl p-4 cursor-pointer relative backdrop-blur-sm transition-all`}
                                onClick={() => !winnerName && onThirdPlaceMatchClick()}
                            >
                                <div className={`flex justify-between items-center mb-2 p-1 rounded ${winnerName === p1Name ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-white'}`}>
                                    <span className="truncate">{p1Name}</span>
                                    {winnerName === p1Name && <span>🥉</span>}
                                </div>
                                <div className="h-[1px] w-full bg-white/10 mb-2"></div>
                                <div className={`flex justify-between items-center p-1 rounded ${winnerName === p2Name ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-white'}`}>
                                    <span className="truncate">{p2Name}</span>
                                    {winnerName === p2Name && <span>🥉</span>}
                                </div>

                                {!winnerName && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 rounded-xl transition-opacity backdrop-blur-[2px]">
                                        <span className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg transform hover:scale-110 transition-transform">PLAY MATCH</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Bracket;
