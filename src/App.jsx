import React, { useState } from 'react';
import Layout from './components/Layout';
import TeamInput from './components/TeamInput';
import Bracket from './components/Bracket';
import GameScreen from './components/GameScreen';
import TournamentSetup from './components/TournamentSetup';
import GroupStage from './components/GroupStage';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [view, setView] = useState('input'); // input, setup, groups, bracket, game
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]); // [{ name: 'A', teams: [], matches: [], standings: [] }]
  const [tournamentConfig, setTournamentConfig] = useState(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(null); // { roundIndex, matchIndex } or { groupIndex, matchIndex } or { type: 'thirdPlace' }
  const [winner, setWinner] = useState(null);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(null); // { p1, p2, winner }
  const [playoffGameTime, setPlayoffGameTime] = useState(600); // Seconds
  const [tempPlayoffTime, setTempPlayoffTime] = useState(10); // Minutes (for UI)

  // --- Navigation & Setup ---

  const handleTeamInputComplete = (teamList) => {
    setTeams(teamList);
    setView('setup');
  };

  const startTournament = ({ mode, config }) => {
    setTournamentConfig({ mode, ...config });

    if (mode === 'groups') {
      generateGroups(teams, config.numGroups, config.advancingPerGroup);
    } else {
      setPlayoffGameTime(config.gameTime); // Set playoff time directly
      generateBracket(teams);
    }
  };

  // --- Group Stage Logic ---

  const generateGroups = (teamList, numGroups, advancingCount) => {
    // Shuffle teams
    const shuffled = [...teamList].sort(() => Math.random() - 0.5);
    const newGroups = [];

    for (let i = 0; i < numGroups; i++) {
      newGroups.push({
        name: String.fromCharCode(65 + i),
        teams: [],
        matches: [],
        standings: [],
        advancingCount
      });
    }

    // Distribute teams (Snake draft style not strictly necessary for random, but good for balance if seeded later)
    shuffled.forEach((team, index) => {
      const groupIndex = index % numGroups;
      newGroups[groupIndex].teams.push(team);
    });

    // Initialize Standings and Generate Matches for each group
    newGroups.forEach(group => {
      // Init Standings
      group.standings = group.teams.map(team => ({
        name: team,
        points: 0,
        wins: 0,
        losses: 0,
        shooterWins: 0,
        cupDiff: 0,
        gamesPlayed: 0
      }));

      // Generate Round Robin Matches
      for (let i = 0; i < group.teams.length; i++) {
        for (let j = i + 1; j < group.teams.length; j++) {
          group.matches.push({
            id: `g${group.name}-${i}-${j}`,
            p1: group.teams[i],
            p2: group.teams[j],
            winner: null,
            winType: null, // 'regular', 'ot', 'shooter'
            stats: null
          });
        }
      }
    });

    setGroups(newGroups);
    setView('groups');
  };

  const handleGroupMatchClick = (groupIndex, matchIndex) => {
    setCurrentMatchIndex({ groupIndex, matchIndex, type: 'group' });
    setView('game');
  };

  const updateGroupStandings = (groupIndex, matchResult) => {
    const newGroups = [...groups];
    const group = newGroups[groupIndex];
    const { winner, loser, winType, cupsRemaining } = matchResult;

    // Helper to find team stats
    const getStats = (teamName) => group.standings.find(s => s.name === teamName);
    const winnerStats = getStats(winner);
    const loserStats = getStats(loser);

    // Update Stats
    winnerStats.gamesPlayed++;
    loserStats.gamesPlayed++;
    winnerStats.wins++;
    loserStats.losses++;

    // Points Logic
    // Shooter Win (3pts), OT Win (2pts), OT Loss (1pt), Regular Loss (0pts)
    if (winType === 'shooter') {
      winnerStats.points += 3;
      winnerStats.shooterWins++;
    } else if (winType === 'ot') {
      winnerStats.points += 2;
      loserStats.points += 1;
    } else {
      // Regular win
      winnerStats.points += 3; // Wait, user said "Win before timer... is 3 pts". Regular win is usually 3 pts?
      // User said: "Win before timer ran out... is worth 3 points... and is also a so called 'shooters win'"
      // This implies a normal win (cups cleared) IS a shooter win.
      // But what if timer runs out and I have more cups? That's a win, but NOT a shooter win.
      // My GameScreen logic: if type='regular' and loserCups=0 -> shooter.
      // If type='regular' and loserCups > 0 (time ran out, I had more cups) -> Regular Win.

      // Let's refine points:
      // Shooter Win (Cleared cups): 3 pts
      // Regular Win (Time out, more cups): 3 pts? User didn't specify, but usually win is a win. 
      // Let's assume 3 pts for any non-OT win, but only track "Shooter Wins" for tiebreaker if cups cleared.
      // User: "Win before timer ran out... is worth 3 points... and is also a so called 'shooters win'"
      // This implies: Win by Time Out != Shooter Win.
      // Let's assume Win by Time Out = 3 pts (standard win) but NO shooter win increment.

      winnerStats.points += 3;
    }

    // Cup Diff
    // User: "Cup differential (opponent cups remaining minus own cups remaining)"
    // Wait, usually it's (My Cups Remaining - Opponent Cups Remaining).
    // If I win 6-0. My cups=6, Opp=0. Diff = +6.
    // If I lose 0-6. My cups=0, Opp=6. Diff = -6.
    // User said: "opponent cups remaining minus own cups remaining".
    // If I am winner (6 cups left), opponent (0 cups left). 0 - 6 = -6? That sounds wrong for the winner.
    // I will assume standard: (Own Remaining - Opponent Remaining).

    winnerStats.cupDiff += (cupsRemaining.winner - cupsRemaining.loser);
    loserStats.cupDiff += (cupsRemaining.loser - cupsRemaining.winner);

    // Sort Standings
    // 1. Wins, 2. H2H (Too complex for simple sort, maybe skip for now or do basic), 3. Games won before timer (Shooter Wins?), 4. Cup Diff, 5. Fewest Opponent Cups
    // User said: Primary: Wins. Secondary: H2H. Tertiary: Games won before timer (Shooter Wins). Quaternary: Cup Diff.

    group.standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      // H2H logic is hard to do in a simple sort without looking up matches. 
      // Simplified: Skip H2H for auto-sort, user can manually verify if close.
      if (b.shooterWins !== a.shooterWins) return b.shooterWins - a.shooterWins;
      if (b.cupDiff !== a.cupDiff) return b.cupDiff - a.cupDiff;
      return b.points - a.points; // Fallback to points if not covered
    });

    setGroups(newGroups);
  };

  const goToPlayoffSetup = () => {
    setView('playoffSetup');
  };

  const advanceToBracket = () => {
    // Set the chosen time
    setPlayoffGameTime(tempPlayoffTime * 60);

    // Seed teams from groups
    // Assumption: 2 groups, 2 advancing.
    // A1 vs B2, B1 vs A2.
    // If 4 groups, 1 advancing: A1 vs D1? No, usually A1 vs B1 etc.
    // Let's collect all advancing teams and seed them.

    const seededTeams = [];
    groups.forEach(group => {
      for (let i = 0; i < group.advancingCount; i++) {
        seededTeams.push({ ...group.standings[i], sourceGroup: group.name, rank: i + 1 });
      }
    });

    // Simple pairing: Top seeds vs Bottom seeds if possible, or just standard bracket gen
    // For now, let's just extract names and use generateBracket, but maybe shuffle or order them intelligently?
    // If we just pass names to generateBracket, it pairs 0 vs 1, 2 vs 3.
    // We want A1 vs B2 (if 2 groups).
    // seededTeams = [A1, A2, B1, B2]
    // We want A1 vs B2, B1 vs A2.
    // Ordered list for generateBracket: [A1, B2, B1, A2] -> Pair 1: A1-B2, Pair 2: B1-A2.

    let bracketTeams = [];
    if (groups.length === 2 && groups[0].advancingCount === 2) {
      // Special case for 2 groups, 2 advancing
      const A1 = groups[0].standings[0].name;
      const A2 = groups[0].standings[1].name;
      const B1 = groups[1].standings[0].name;
      const B2 = groups[1].standings[1].name;
      bracketTeams = [A1, B2, B1, A2];
    } else {
      // Generic fallback: Just take them in order of groups (A1, A2, B1, B2...)
      // This might result in A1 vs A2 in first round if we aren't careful.
      // Let's try to interleave if possible, otherwise just random.
      bracketTeams = seededTeams.map(t => t.name);
    }

    generateBracket(bracketTeams);
  };

  // --- Bracket Logic ---

  const generateBracket = (teamList) => {
    // Handle odd number of teams by adding a "Bye"
    if (teamList.length % 2 !== 0) {
      teamList.push('Bye');
    }

    const round1 = [];
    for (let i = 0; i < teamList.length; i += 2) {
      const p1 = teamList[i];
      const p2 = teamList[i + 1];
      const isByeMatch = p2 === 'Bye';

      round1.push({
        id: `r0-m${i / 2}`,
        p1: p1,
        p2: p2,
        winner: isByeMatch ? p1 : null
      });
    }

    // Generate subsequent empty rounds
    const newMatches = [round1];
    let currentRoundSize = round1.length;
    let r = 1;
    while (currentRoundSize > 1) {
      const nextRound = [];
      for (let i = 0; i < currentRoundSize; i += 2) {
        nextRound.push({
          id: `r${r}-m${i / 2}`,
          p1: null,
          p2: null,
          winner: null
        });
      }
      newMatches.push(nextRound);
      currentRoundSize = nextRound.length;
      r++;
    }

    // Propagate initial Bye wins to the next round
    for (let i = 0; i < round1.length; i++) {
      if (round1[i].winner) {
        const nextRoundMatchIndex = Math.floor(i / 2);
        const isPlayer1Position = i % 2 === 0;
        if (newMatches[1]) {
          if (isPlayer1Position) {
            newMatches[1][nextRoundMatchIndex].p1 = round1[i].winner;
          } else {
            newMatches[1][nextRoundMatchIndex].p2 = round1[i].winner;
          }
        }
      }
    }

    setMatches(newMatches);
    setTeams(teamList);
    setThirdPlaceMatch(null); // Reset 3rd place match
    setView('bracket');
  };

  const handleBracketMatchClick = (roundIndex, matchIndex) => {
    setCurrentMatchIndex({ roundIndex, matchIndex, type: 'bracket' });
    setView('game');
  };

  const handleThirdPlaceMatchClick = () => {
    setCurrentMatchIndex({ type: 'thirdPlace' });
    setView('game');
  };

  const handleGameEnd = (result) => {
    // result = { winner, loser, winType, cupsRemaining }
    // If result is null/string (legacy or simple cancel), handle gracefully

    // If user clicked "Back" or something without result
    if (!result) {
      if (view === 'game') setView(currentMatchIndex.type === 'group' ? 'groups' : 'bracket');
      setCurrentMatchIndex(null);
      return;
    }

    const winnerName = typeof result === 'object' ? result.winner : result;

    if (currentMatchIndex.type === 'group') {
      const { groupIndex, matchIndex } = currentMatchIndex;
      const newGroups = [...groups];

      // Update match winner
      newGroups[groupIndex].matches[matchIndex].winner = winnerName;
      newGroups[groupIndex].matches[matchIndex].winType = result.winType;
      newGroups[groupIndex].matches[matchIndex].stats = result.cupsRemaining;

      setGroups(newGroups);
      updateGroupStandings(groupIndex, result);
      setView('groups');
    } else if (currentMatchIndex.type === 'thirdPlace') {
      // 3rd Place Match
      const newThirdPlace = { ...thirdPlaceMatch, winner: winnerName };
      setThirdPlaceMatch(newThirdPlace);
      setView('bracket');
    } else {
      // Bracket Match
      const { roundIndex, matchIndex } = currentMatchIndex;
      const newMatches = JSON.parse(JSON.stringify(matches));

      newMatches[roundIndex][matchIndex].winner = winnerName;

      // Check if this is a semi-final (second-to-last round)
      const isSemiFinal = roundIndex === newMatches.length - 2;

      if (roundIndex + 1 < newMatches.length) {
        const nextRoundMatchIndex = Math.floor(matchIndex / 2);
        const isPlayer1Position = matchIndex % 2 === 0;

        if (isPlayer1Position) {
          newMatches[roundIndex + 1][nextRoundMatchIndex].p1 = winnerName;
        } else {
          newMatches[roundIndex + 1][nextRoundMatchIndex].p2 = winnerName;
        }

        // If semi-final, add loser to 3rd place match
        if (isSemiFinal) {
          const loserName = typeof result === 'object' ? result.loser :
            (newMatches[roundIndex][matchIndex].p1 === winnerName ?
              newMatches[roundIndex][matchIndex].p2 :
              newMatches[roundIndex][matchIndex].p1);

          if (!thirdPlaceMatch) {
            // First semi-final completed
            setThirdPlaceMatch({ p1: loserName, p2: null, winner: null });
          } else {
            // Second semi-final completed
            setThirdPlaceMatch({ ...thirdPlaceMatch, p2: loserName });
          }
        }
      } else {
        setWinner(winnerName);
      }

      setMatches(newMatches);
      setView('bracket');
    }
    setCurrentMatchIndex(null);
  };

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {view === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-full flex justify-center"
          >
            <TeamInput onStartTournament={handleTeamInputComplete} />
          </motion.div>
        )}

        {view === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full"
          >
            <TournamentSetup teams={teams} onStartTournament={startTournament} />
          </motion.div>
        )}

        {view === 'groups' && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full"
          >
            <GroupStage
              groups={groups}
              onMatchClick={handleGroupMatchClick}
              onAdvanceToPlayoffs={goToPlayoffSetup}
            />
          </motion.div>
        )}

        {view === 'playoffSetup' && (
          <motion.div
            key="playoffSetup"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-2xl mx-auto flex flex-col gap-8 animate-fade-in"
          >
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Playoff Configuration
            </h2>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <label className="block text-lg font-semibold mb-4">
                Playoff Game Duration
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={tempPlayoffTime}
                  onChange={(e) => setTempPlayoffTime(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="min-w-[80px] text-center font-mono text-xl font-bold text-blue-400">
                  {tempPlayoffTime} min
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Set the time limit for all playoff matches.
              </p>
            </div>
            <button
              onClick={advanceToBracket}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-xl shadow-lg hover:scale-[1.02] transition-transform"
            >
              Generate Bracket
            </button>
          </motion.div>
        )}

        {view === 'bracket' && (
          <motion.div
            key="bracket"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full"
          >
            {winner ? (
              <div className="text-center flex flex-col items-center">
                <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-8 animate-bounce drop-shadow-lg">
                  🏆 {winner} Wins! 🏆
                </h2>
                <div className="text-2xl text-white/80 mb-12">The ultimate beer pong champions</div>
                <button
                  onClick={() => {
                    setWinner(null);
                    setMatches([]);
                    setTeams([]);
                    setGroups([]);
                    setView('input');
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all border border-white/20 hover:scale-105"
                >
                  Start New Tournament
                </button>
              </div>
            ) : (
              <Bracket
                matches={matches}
                onMatchClick={handleBracketMatchClick}
                thirdPlaceMatch={thirdPlaceMatch}
                onThirdPlaceMatchClick={handleThirdPlaceMatchClick}
              />
            )}
          </motion.div>
        )}

        {view === 'game' && currentMatchIndex && (
          <motion.div
            key="game"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full flex justify-center"
          >
            <GameScreen
              team1={
                currentMatchIndex.type === 'thirdPlace'
                  ? thirdPlaceMatch.p1
                  : currentMatchIndex.type === 'group'
                    ? groups[currentMatchIndex.groupIndex].matches[currentMatchIndex.matchIndex].p1
                    : matches[currentMatchIndex.roundIndex][currentMatchIndex.matchIndex].p1
              }
              team2={
                currentMatchIndex.type === 'thirdPlace'
                  ? thirdPlaceMatch.p2
                  : currentMatchIndex.type === 'group'
                    ? groups[currentMatchIndex.groupIndex].matches[currentMatchIndex.matchIndex].p2
                    : matches[currentMatchIndex.roundIndex][currentMatchIndex.matchIndex].p2
              }
              onGameEnd={handleGameEnd}
              initialTime={
                currentMatchIndex.type === 'group'
                  ? tournamentConfig?.gameTime || 600
                  : playoffGameTime
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default App;
