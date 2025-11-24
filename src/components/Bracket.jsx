import React from 'react';
import { motion } from 'framer-motion';

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
                            {round.map((match, matchIndex) => (
                                <motion.div
                                    key={match.id}
                                    whileHover={!match.winner && match.p1 && match.p2 ? { scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' } : {}}
                                    className={`bg-white/5 border ${match.winner ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-white/10'} rounded-xl p-4 cursor-pointer relative backdrop-blur-sm transition-all w-full`}
                                    onClick={() => !match.winner && match.p1 && match.p2 && onMatchClick(roundIndex, matchIndex)}
                                >
                                    <div className={`flex justify-between items-center mb-2 p-1 rounded ${match.winner === match.p1 ? 'bg-green-500/20 text-green-400 font-bold' : 'text-white'}`}>
                                        <span className="truncate">{match.p1 || 'TBD'}</span>
                                        {match.winner === match.p1 && <span>🏆</span>}
                                    </div>
                                    <div className="h-[1px] w-full bg-white/10 mb-2"></div>
                                    <div className={`flex justify-between items-center p-1 rounded ${match.winner === match.p2 ? 'bg-green-500/20 text-green-400 font-bold' : 'text-white'}`}>
                                        <span className="truncate">{match.p2 || 'TBD'}</span>
                                        {match.winner === match.p2 && <span>🏆</span>}
                                    </div>

                                    {!match.winner && match.p1 && match.p2 && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 rounded-xl transition-opacity backdrop-blur-[2px]">
                                            <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg transform hover:scale-110 transition-transform">PLAY MATCH</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3rd Place Match */}
            {thirdPlaceMatch && thirdPlaceMatch.p1 && thirdPlaceMatch.p2 && (
                <div className="flex justify-center mt-8 mb-4">
                    <div className="w-full max-w-[280px]">
                        <h3 className="text-center text-amber-400 font-bold mb-4 uppercase tracking-widest text-sm">
                            🥉 3rd Place Match
                        </h3>
                        <motion.div
                            whileHover={!thirdPlaceMatch.winner ? { scale: 1.05, borderColor: 'rgba(251, 191, 36, 0.5)' } : {}}
                            className={`bg-white/5 border ${thirdPlaceMatch.winner ? 'border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-white/10'} rounded-xl p-4 cursor-pointer relative backdrop-blur-sm transition-all`}
                            onClick={() => !thirdPlaceMatch.winner && onThirdPlaceMatchClick()}
                        >
                            <div className={`flex justify-between items-center mb-2 p-1 rounded ${thirdPlaceMatch.winner === thirdPlaceMatch.p1 ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-white'}`}>
                                <span className="truncate">{thirdPlaceMatch.p1}</span>
                                {thirdPlaceMatch.winner === thirdPlaceMatch.p1 && <span>🥉</span>}
                            </div>
                            <div className="h-[1px] w-full bg-white/10 mb-2"></div>
                            <div className={`flex justify-between items-center p-1 rounded ${thirdPlaceMatch.winner === thirdPlaceMatch.p2 ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-white'}`}>
                                <span className="truncate">{thirdPlaceMatch.p2}</span>
                                {thirdPlaceMatch.winner === thirdPlaceMatch.p2 && <span>🥉</span>}
                            </div>

                            {!thirdPlaceMatch.winner && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 rounded-xl transition-opacity backdrop-blur-[2px]">
                                    <span className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg transform hover:scale-110 transition-transform">PLAY MATCH</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bracket;
