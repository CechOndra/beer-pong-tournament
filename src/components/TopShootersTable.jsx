import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TopShootersTable = ({ groups, playoffPlayerStats, teams }) => {
    const [phaseFilter, setPhaseFilter] = useState('all'); // 'all', 'groups', 'playoffs'
    const [hideUnknown, setHideUnknown] = useState(true);

    // Get group player stats
    const getGroupPlayerStats = () => {
        const playerList = [];

        groups.forEach(group => {
            group.standings.forEach(team => {
                if (!team.players) return;

                team.players.forEach(player => {
                    const playerName = player || 'Unknown';
                    const stats = team.playerStats?.[playerName] || { cupsHit: 0, gamesPlayed: 0 };

                    playerList.push({
                        name: playerName,
                        team: team.name,
                        phase: 'groups',
                        cupsHit: stats.cupsHit || 0,
                        gamesPlayed: stats.gamesPlayed || 0
                    });
                });

                // Add Unknown if hits exist
                if (team.playerStats?.['Unknown'] && !team.players.includes('Unknown')) {
                    playerList.push({
                        name: 'Unknown',
                        team: team.name,
                        phase: 'groups',
                        cupsHit: team.playerStats['Unknown'].cupsHit || 0,
                        gamesPlayed: team.playerStats['Unknown'].gamesPlayed || 0
                    });
                }
            });
        });

        return playerList;
    };

    // Get playoff player stats
    const getPlayoffPlayerStats = () => {
        const playerList = [];

        Object.entries(playoffPlayerStats).forEach(([teamName, players]) => {
            Object.entries(players).forEach(([playerName, stats]) => {
                playerList.push({
                    name: playerName,
                    team: teamName,
                    phase: 'playoffs',
                    cupsHit: stats.cupsHit || 0,
                    gamesPlayed: stats.gamesPlayed || 0
                });
            });
        });

        return playerList;
    };

    // Combine and aggregate stats
    const getAllStats = () => {
        const groupStats = getGroupPlayerStats();
        const playoffStats = getPlayoffPlayerStats();

        if (phaseFilter === 'groups') {
            return groupStats.sort((a, b) => b.cupsHit - a.cupsHit);
        }
        if (phaseFilter === 'playoffs') {
            return playoffStats.sort((a, b) => b.cupsHit - a.cupsHit);
        }

        // Combine all stats
        const combined = {};

        [...groupStats, ...playoffStats].forEach(p => {
            const key = `${p.team}-${p.name}`;
            if (!combined[key]) {
                combined[key] = { name: p.name, team: p.team, cupsHit: 0, gamesPlayed: 0 };
            }
            combined[key].cupsHit += p.cupsHit;
            combined[key].gamesPlayed += p.gamesPlayed;
        });

        return Object.values(combined).sort((a, b) => b.cupsHit - a.cupsHit);
    };

    const stats = getAllStats().filter(p => !hideUnknown || p.name !== 'Unknown');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full bg-white/5 rounded-2xl border border-white/10 p-6"
        >
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h3 className="text-2xl font-bold text-purple-300">🎯 Top Shooters</h3>
                <div className="flex items-center gap-4">
                    <select
                        value={phaseFilter}
                        onChange={(e) => setPhaseFilter(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">All Matches</option>
                        <option value="groups">Groups Only</option>
                        <option value="playoffs">Playoffs Only</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={hideUnknown}
                            onChange={(e) => setHideUnknown(e.target.checked)}
                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                        />
                        Hide Unknown
                    </label>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 border-b border-white/10 text-sm uppercase tracking-wider">
                            <th className="p-3">#</th>
                            <th className="p-3">Player</th>
                            <th className="p-3">Team</th>
                            <th className="p-3 text-center">Cups Hit</th>
                            <th className="p-3 text-center">Games</th>
                            <th className="p-3 text-center">Cups/Game</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {stats.slice(0, 10).map((player, i) => (
                            <tr key={i} className="border-b border-white/5">
                                <td className="p-3 font-mono text-gray-400">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                </td>
                                <td className="p-3 font-bold text-white">{player.name}</td>
                                <td className="p-3 text-gray-300">{player.team}</td>
                                <td className="p-3 text-center text-green-400">{player.cupsHit}</td>
                                <td className="p-3 text-center text-gray-300">{player.gamesPlayed}</td>
                                <td className="p-3 text-center text-yellow-400">
                                    {player.gamesPlayed > 0 ? (player.cupsHit / player.gamesPlayed).toFixed(1) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {stats.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No player data available yet.</p>
                )}
            </div>
        </motion.div>
    );
};

export default TopShootersTable;
