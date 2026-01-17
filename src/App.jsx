import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TeamInput from './components/TeamInput';
import Bracket from './components/Bracket';
import GameScreen from './components/GameScreen';
import TournamentSetup from './components/TournamentSetup';
import GroupStage from './components/GroupStage';
import TopShootersTable from './components/TopShootersTable';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [view, setView] = useState('tournaments'); // tournaments, input, setup, groups, bracket, game
  const [allTournaments, setAllTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]); // [{ name: 'A', teams: [], matches: [], standings: [] }]
  const [tournamentConfig, setTournamentConfig] = useState(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(null); // { roundIndex, matchIndex } or { groupIndex, matchIndex } or { type: 'thirdPlace' }
  const [tournamentId, setTournamentId] = useState(null);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [winner, setWinner] = useState(null);
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(null); // { p1, p2, winner }
  const [playoffGameTime, setPlayoffGameTime] = useState(600); // Seconds
  const [tempPlayoffTime, setTempPlayoffTime] = useState(10); // Minutes (for UI)
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState(null); // { cups1, cups2, timeLeft, streak1, streak2, etc. }
  const [activeGroupTab, setActiveGroupTab] = useState(0); // Track which group tab is active
  const [playoffPlayerStats, setPlayoffPlayerStats] = useState({}); // { teamName: { playerName: { cupsHit, gamesPlayed } } }
  const [showTopShooters, setShowTopShooters] = useState(false); // Show player stats on winner screen

  // --- State Restoration on Load ---
  useEffect(() => {
    const loadTournamentState = async () => {
      try {
        // Fetch all tournaments for the list
        const allRes = await fetch('/api/tournaments');
        const allData = await allRes.json();
        setAllTournaments(allData.tournaments || []);

        // Check if we have a saved tournament ID in sessionStorage
        const savedTournamentId = sessionStorage.getItem('currentTournamentId');

        if (savedTournamentId) {
          // Load the specific tournament we were working on
          const stateRes = await fetch(`/api/tournaments/${savedTournamentId}/state`);
          const stateData = await stateRes.json();

          if (stateData.tournament && stateData.tournament.app_state) {
            const savedState = JSON.parse(stateData.tournament.app_state);

            // Don't auto-restore if tournament is finished (has a winner)
            if (savedState.winner) {
              sessionStorage.removeItem('currentTournamentId');
              setView('tournaments');
            } else {
              // Don't restore 'game' view if match data is missing
              if (savedState.view === 'game' && !savedState.currentMatchIndex) {
                console.warn('Invalid game state detected, resetting to groups/bracket');
                const fallbackView = savedState.groups?.length > 0 ? 'groups' :
                  savedState.matches?.length > 0 ? 'bracket' : 'input';
                savedState.view = fallbackView;
              }

              // Restore all state
              setTournamentId(parseInt(savedTournamentId));
              setView(savedState.view || 'input');
              setTeams(savedState.teams || []);
              setMatches(savedState.matches || []);
              setGroups(savedState.groups || []);
              setTournamentConfig(savedState.tournamentConfig || null);
              setWinner(savedState.winner || null);
              setThirdPlaceMatch(savedState.thirdPlaceMatch || null);
              setPlayoffGameTime(savedState.playoffGameTime || 600);
              setTempPlayoffTime(savedState.tempPlayoffTime || 10);
              setCurrentMatchIndex(savedState.currentMatchIndex || null);
              setCurrentMatchId(savedState.currentMatchId || null);
              setGameState(savedState.gameState || null);
            }
          } else {
            sessionStorage.removeItem('currentTournamentId');
            setView('tournaments');
          }
        } else {
          // No saved session, show tournament list
          setView('tournaments');
        }
      } catch (err) {
        console.error('Failed to restore state:', err);
        sessionStorage.removeItem('currentTournamentId');
        setView('tournaments');
      } finally {
        setIsLoading(false);
      }
    };

    loadTournamentState();
  }, []);

  // --- Load Tournament by ID ---
  const loadTournamentById = async (id) => {
    setIsLoading(true);
    try {
      const stateRes = await fetch(`/api/tournaments/${id}/state`);
      const stateData = await stateRes.json();

      if (stateData.tournament && stateData.tournament.app_state) {
        const savedState = JSON.parse(stateData.tournament.app_state);

        setTournamentId(id);
        sessionStorage.setItem('currentTournamentId', id.toString());
        setView(savedState.view || 'groups');
        setTeams(savedState.teams || []);
        setMatches(savedState.matches || []);
        setGroups(savedState.groups || []);
        setTournamentConfig(savedState.tournamentConfig || null);
        setWinner(savedState.winner || null);
        setThirdPlaceMatch(savedState.thirdPlaceMatch || null);
        setPlayoffGameTime(savedState.playoffGameTime || 600);
        setTempPlayoffTime(savedState.tempPlayoffTime || 10);
        setCurrentMatchIndex(savedState.currentMatchIndex || null);
        setCurrentMatchId(savedState.currentMatchId || null);
        setGameState(savedState.gameState || null);
        setPlayoffPlayerStats(savedState.playoffPlayerStats || {}); // Restore per-tournament playoff stats
        setShowTopShooters(false);
      } else {
        // Tournament exists but no app_state yet, go to input
        setTournamentId(id);
        sessionStorage.setItem('currentTournamentId', id.toString());
        setView('input');
      }
    } catch (err) {
      console.error('Failed to load tournament:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fetch All Tournaments ---
  const fetchAllTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      setAllTournaments(data.tournaments || []);
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
    }
  };

  // --- Exit Tournament (go back to tournament list) ---
  const exitTournament = () => {
    sessionStorage.removeItem('currentTournamentId');
    setTournamentId(null);
    setView('tournaments');
    setTeams([]);
    setMatches([]);
    setGroups([]);
    setTournamentConfig(null);
    setWinner(null);
    setThirdPlaceMatch(null);
    setCurrentMatchIndex(null);
    setCurrentMatchId(null);
    setGameState(null);
    setPlayoffPlayerStats({}); // Reset per-tournament playoff stats
    setShowTopShooters(false);
    fetchAllTournaments();
  };

  // --- Auto-Save State on Changes ---
  useEffect(() => {
    if (!tournamentId || isLoading) return;

    const appState = {
      view,
      teams,
      matches,
      groups,
      tournamentConfig,
      winner,
      thirdPlaceMatch,
      playoffGameTime,
      tempPlayoffTime,
      currentMatchIndex,
      currentMatchId,
      gameState,
      playoffPlayerStats // Include per-tournament playoff stats
    };

    fetch(`/api/tournaments/${tournamentId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appState })
    }).catch(err => console.error('Failed to save state:', err));
  }, [view, teams, matches, groups, tournamentConfig, winner, thirdPlaceMatch, playoffGameTime, tempPlayoffTime, currentMatchIndex, currentMatchId, gameState, playoffPlayerStats, tournamentId, isLoading]);

  // --- Navigation & Setup ---

  const handleTeamInputComplete = (teamList) => {
    setTeams(teamList);
    setView('setup');
  };

  const startTournament = async ({ mode, tournamentName, config }) => {
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tournamentName, config: { mode, ...config } })
      });
      const data = await res.json();
      setTournamentId(data.id);
      sessionStorage.setItem('currentTournamentId', data.id.toString());

      // Save teams
      await Promise.all(teams.map(team =>
        fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tournament_id: data.id, name: team.name, players: team.players, group_name: null })
        })
      ));

      setTournamentConfig({ mode, ...config });

      if (mode === 'groups' || mode === 'groups_only') {
        generateGroups(teams, config.numGroups, config.advancingPerGroup);
      } else {
        setPlayoffGameTime(config.gameTime); // Set playoff time directly
        generateBracket(teams);
      }
    } catch (err) {
      console.error("Error starting tournament:", err);
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
      // Init Standings - use team.name for display, store reference to team object
      group.standings = group.teams.map(team => ({
        name: team.name,
        players: team.players,
        points: 0,
        wins: 0, // Regular Wins (including Shooter Wins)
        otWins: 0,
        otLosses: 0,
        losses: 0, // Regular Losses
        shooterWins: 0,
        cupDiff: 0,
        cupsHit: 0,
        cupsLost: 0,
        gamesPlayed: 0
      }));

      // Generate Round Robin Matches
      for (let i = 0; i < group.teams.length; i++) {
        for (let j = i + 1; j < group.teams.length; j++) {
          group.matches.push({
            id: `g${group.name}-${i}-${j}`,
            p1: group.teams[i].name,
            p1Players: group.teams[i].players,
            p2: group.teams[j].name,
            p2Players: group.teams[j].players,
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

  const handleGroupMatchClick = async (groupIndex, matchIndex) => {
    const group = groups[groupIndex];
    const match = group.matches[matchIndex];

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournamentId,
          p1: match.p1,
          p2: match.p2,
          round_index: null,
          group_id: group.name
        })
      });
      const data = await res.json();
      setCurrentMatchId(data.id);

      setGameState(null); // Reset game state for new match
      setCurrentMatchIndex({ groupIndex, matchIndex, type: 'group' });
      setActiveGroupTab(groupIndex); // Remember which group we're in
      setView('game');
    } catch (err) {
      console.error("Error creating match:", err);
    }
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

    // Points Logic
    // Shooter Win: 3pts, +1 W, +1 SW
    // Regular Win: 3pts, +1 W
    // OT Win: 2pts, +1 OTW
    // OT Loss: 1pt, +1 OTL
    // Regular Loss: 0pts, +1 L

    if (winType === 'shooter') {
      winnerStats.points += 3;
      winnerStats.wins++;
      winnerStats.shooterWins++;
      loserStats.losses++;
    } else if (winType === 'ot') {
      winnerStats.points += 2;
      winnerStats.otWins++;
      loserStats.points += 1;
      loserStats.otLosses++;
    } else {
      // Regular win (Time ran out but won on cups)
      winnerStats.points += 3;
      winnerStats.wins++;
      loserStats.losses++;
    }

    // Cup Stats
    // Assuming 6 cups per side.
    // Cups Hit = 6 - Opponent Remaining
    // Cups Lost = 6 - My Remaining

    // Winner Stats
    const winnerHit = 6 - cupsRemaining.loser;
    const winnerLost = 6 - cupsRemaining.winner;
    winnerStats.cupsHit = (winnerStats.cupsHit || 0) + winnerHit;
    winnerStats.cupsLost = (winnerStats.cupsLost || 0) + winnerLost;
    winnerStats.cupDiff += (winnerHit - winnerLost);

    // Loser Stats
    const loserHit = 6 - cupsRemaining.winner;
    const loserLost = 6 - cupsRemaining.loser;
    loserStats.cupsHit = (loserStats.cupsHit || 0) + loserHit;
    loserStats.cupsLost = (loserStats.cupsLost || 0) + loserLost;
    loserStats.cupDiff += (loserHit - loserLost);

    // Process player-level cup hits
    if (matchResult.cupHits && matchResult.cupHits.length > 0) {
      matchResult.cupHits.forEach(hit => {
        const teamStats = group.standings.find(s => s.name === hit.team);
        if (teamStats && teamStats.players) {
          // Initialize playerStats if not existing
          if (!teamStats.playerStats) {
            teamStats.playerStats = {};
          }
          const playerName = hit.player || 'Unknown';
          if (!teamStats.playerStats[playerName]) {
            teamStats.playerStats[playerName] = { cupsHit: 0, gamesPlayed: 0 };
          }
          teamStats.playerStats[playerName].cupsHit += 1;
        }
      });

      // Update players' gamesPlayed for both teams
      [winnerStats, loserStats].forEach(stats => {
        if (stats.players && stats.playerStats) {
          stats.players.forEach(player => {
            const pName = player || 'Unknown';
            if (!stats.playerStats[pName]) {
              stats.playerStats[pName] = { cupsHit: 0, gamesPlayed: 0 };
            }
            stats.playerStats[pName].gamesPlayed += 1;
          });
        }
      });
    }

    // Sort Standings
    // Priority: 1. Points, 2. Wins (Regular + OT?), 3. Shooter Wins, 4. Cup Diff
    // User didn't specify sort order change, but usually Points is #1.
    // Previous sort was: Wins -> Shooter Wins -> Cup Diff -> Points.
    // Given the detailed point system (3-2-1-0), Points should likely be the primary sorter now.

    group.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.shooterWins !== a.shooterWins) return b.shooterWins - a.shooterWins;
      if (b.cupDiff !== a.cupDiff) return b.cupDiff - a.cupDiff;

      // Head-to-Head Tiebreaker
      const match = group.matches.find(m =>
        (m.p1 === a.name && m.p2 === b.name) ||
        (m.p1 === b.name && m.p2 === a.name)
      );

      if (match && match.winner) {
        return match.winner === a.name ? -1 : 1;
      }

      return 0;
    });

    setGroups(newGroups);
  };

  // Update playoff player stats from cupHits
  const updatePlayoffPlayerStats = (matchResult) => {
    const newStats = { ...playoffPlayerStats };

    // Process each cup hit (if any)
    if (matchResult.cupHits && matchResult.cupHits.length > 0) {
      matchResult.cupHits.forEach(hit => {
        const teamName = hit.team;
        const playerName = hit.player || 'Unknown';

        if (!newStats[teamName]) {
          newStats[teamName] = {};
        }
        if (!newStats[teamName][playerName]) {
          newStats[teamName][playerName] = { cupsHit: 0, gamesPlayed: 0 };
        }
        newStats[teamName][playerName].cupsHit += 1;
      });
    }

    // Update games played for players in both teams
    // Extract team names in case they're objects
    const team1Name = typeof matchResult.winner === 'object' ? matchResult.winner.name : matchResult.winner;
    const team2Name = typeof matchResult.loser === 'object' ? matchResult.loser.name : matchResult.loser;

    [team1Name, team2Name].forEach(teamName => {
      if (!teamName) return;
      const teamData = teams.find(t => t.name === teamName);
      if (teamData && teamData.players) {
        if (!newStats[teamName]) newStats[teamName] = {};
        teamData.players.forEach(player => {
          const pName = player || 'Unknown';
          if (!newStats[teamName][pName]) {
            newStats[teamName][pName] = { cupsHit: 0, gamesPlayed: 0 };
          }
          newStats[teamName][pName].gamesPlayed += 1;
        });
      }
    });

    setPlayoffPlayerStats(newStats);
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

  const handleBracketMatchClick = async (roundIndex, matchIndex) => {
    const match = matches[roundIndex][matchIndex];
    if (!match.p1 || !match.p2) return; // Don't start empty matches

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournamentId,
          p1: match.p1,
          p2: match.p2,
          round_index: roundIndex,
          group_id: null
        })
      });
      const data = await res.json();
      setCurrentMatchId(data.id);

      setGameState(null); // Reset game state for new match
      setCurrentMatchIndex({ roundIndex, matchIndex, type: 'bracket' });
      setView('game');
    } catch (err) {
      console.error("Error creating match:", err);
    }
  };

  const handleThirdPlaceMatchClick = async () => {
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournamentId,
          p1: thirdPlaceMatch.p1,
          p2: thirdPlaceMatch.p2,
          round_index: -1, // Special index for 3rd place?
          group_id: '3rdPlace'
        })
      });
      const data = await res.json();
      setCurrentMatchId(data.id);

      setGameState(null); // Reset game state for new match
      setCurrentMatchIndex({ type: 'thirdPlace' });
      setView('game');
    } catch (err) {
      console.error("Error creating match:", err);
    }
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
      updatePlayoffPlayerStats(result);
      setView('bracket');
    } else {
      // Bracket Match
      const { roundIndex, matchIndex } = currentMatchIndex;
      const newMatches = JSON.parse(JSON.stringify(matches));

      newMatches[roundIndex][matchIndex].winner = winnerName;
      updatePlayoffPlayerStats(result);

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
          // Get loser name from result, or compute from match data
          let loserName;
          if (typeof result === 'object' && result.loser) {
            loserName = result.loser;
          } else {
            const p1 = newMatches[roundIndex][matchIndex].p1;
            const p2 = newMatches[roundIndex][matchIndex].p2;
            const p1Name = typeof p1 === 'object' ? p1.name : p1;
            const p2Name = typeof p2 === 'object' ? p2.name : p2;
            loserName = p1Name === winnerName ? p2Name : p1Name;
          }

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
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-2xl text-white/50 animate-pulse">Loading...</div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'tournaments' && (
            <motion.div
              key="tournaments"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-2xl mx-auto flex flex-col gap-6"
            >
              <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                🏆 Select Tournament
              </h2>

              <button
                onClick={() => setView('input')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white font-bold text-lg shadow-lg transition-all duration-300"
              >
                ➕ Create New Tournament
              </button>

              {allTournaments.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {allTournaments.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => loadTournamentById(t.id)}
                      className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-semibold text-white">
                            {t.name || `Tournament #${t.id}`}
                          </span>
                          <span className="ml-3 text-sm text-white/50">
                            {t.config?.mode || 'Unknown Mode'}
                          </span>
                        </div>
                        <span className="text-xs text-white/40">
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-white/50">No tournaments yet. Create one!</p>
              )}
            </motion.div>
          )}

          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="w-full flex flex-col items-center gap-4"
            >
              <button
                onClick={() => setView('tournaments')}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Back to Tournaments
              </button>
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
              <button
                onClick={exitTournament}
                className="mb-4 text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Exit Tournament
              </button>
              <GroupStage
                groups={groups}
                onMatchClick={handleGroupMatchClick}
                onAdvanceToPlayoffs={goToPlayoffSetup}
                mode={tournamentConfig?.mode}
                initialActiveTab={activeGroupTab}
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
              <button
                onClick={exitTournament}
                className="mb-4 text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Exit Tournament
              </button>
              {winner ? (
                <div className="text-center flex flex-col items-center max-w-2xl mx-auto">
                  <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4 animate-bounce drop-shadow-lg">
                    🏆 Tournament Complete! 🏆
                  </h2>

                  {/* Podium */}
                  <div className="flex items-end justify-center gap-4 mb-8 mt-8">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">🥈</div>
                      <div className="bg-gray-500/30 border border-gray-400/30 rounded-t-xl px-6 py-4 min-w-[120px]">
                        <div className="text-lg font-bold text-gray-300">2nd Place</div>
                        <div className="text-xl font-bold text-white">
                          {(() => {
                            const finalMatch = matches[matches.length - 1]?.[0];
                            if (!finalMatch) return 'TBD';
                            const winnerName = typeof winner === 'object' ? winner.name : winner;
                            const p1Name = typeof finalMatch.p1 === 'object' ? finalMatch.p1.name : finalMatch.p1;
                            const p2Name = typeof finalMatch.p2 === 'object' ? finalMatch.p2.name : finalMatch.p2;
                            return p1Name === winnerName ? p2Name : p1Name;
                          })()}
                        </div>
                      </div>
                      <div className="bg-gray-500/20 h-16 w-full"></div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center">
                      <div className="text-5xl mb-2 animate-bounce">🏆</div>
                      <div className="bg-yellow-500/30 border border-yellow-400/50 rounded-t-xl px-8 py-6 min-w-[140px]">
                        <div className="text-lg font-bold text-yellow-300">Champion</div>
                        <div className="text-2xl font-bold text-white">{typeof winner === 'object' ? winner.name : winner}</div>
                      </div>
                      <div className="bg-yellow-500/20 h-24 w-full"></div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-2">🥉</div>
                      <div className="bg-orange-700/30 border border-orange-600/30 rounded-t-xl px-6 py-4 min-w-[120px]">
                        <div className="text-lg font-bold text-orange-300">3rd Place</div>
                        <div className="text-xl font-bold text-white">
                          {thirdPlaceMatch?.winner ? (typeof thirdPlaceMatch.winner === 'object' ? thirdPlaceMatch.winner.name : thirdPlaceMatch.winner) : 'TBD'}
                        </div>
                      </div>
                      <div className="bg-orange-700/20 h-12 w-full"></div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => setShowTopShooters(!showTopShooters)}
                      className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-6 py-3 rounded-xl font-bold transition-all border border-purple-500/30 hover:scale-105"
                    >
                      {showTopShooters ? 'Hide Top Shooters' : '🎯 Show Top Shooters'}
                    </button>
                    <button
                      onClick={exitTournament}
                      className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all border border-white/20 hover:scale-105"
                    >
                      Back to Tournaments
                    </button>
                  </div>

                  {/* Top Shooters Table */}
                  {showTopShooters && (
                    <TopShootersTable
                      groups={groups}
                      playoffPlayerStats={playoffPlayerStats}
                      teams={teams}
                    />
                  )}
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
                team1Players={
                  currentMatchIndex.type === 'thirdPlace'
                    ? (typeof thirdPlaceMatch.p1 === 'object' ? thirdPlaceMatch.p1.players : teams.find(t => t.name === thirdPlaceMatch.p1)?.players) || []
                    : currentMatchIndex.type === 'group'
                      ? (groups[currentMatchIndex.groupIndex].matches[currentMatchIndex.matchIndex].p1Players || [])
                      : (() => {
                        const p1 = matches[currentMatchIndex.roundIndex][currentMatchIndex.matchIndex].p1;
                        if (typeof p1 === 'object' && p1.players) return p1.players;
                        const p1Name = typeof p1 === 'object' ? p1.name : p1;
                        return teams.find(t => t.name === p1Name)?.players || [];
                      })()
                }
                team2={
                  currentMatchIndex.type === 'thirdPlace'
                    ? thirdPlaceMatch.p2
                    : currentMatchIndex.type === 'group'
                      ? groups[currentMatchIndex.groupIndex].matches[currentMatchIndex.matchIndex].p2
                      : matches[currentMatchIndex.roundIndex][currentMatchIndex.matchIndex].p2
                }
                team2Players={
                  currentMatchIndex.type === 'thirdPlace'
                    ? (typeof thirdPlaceMatch.p2 === 'object' ? thirdPlaceMatch.p2.players : teams.find(t => t.name === thirdPlaceMatch.p2)?.players) || []
                    : currentMatchIndex.type === 'group'
                      ? (groups[currentMatchIndex.groupIndex].matches[currentMatchIndex.matchIndex].p2Players || [])
                      : (() => {
                        const p2 = matches[currentMatchIndex.roundIndex][currentMatchIndex.matchIndex].p2;
                        if (typeof p2 === 'object' && p2.players) return p2.players;
                        const p2Name = typeof p2 === 'object' ? p2.name : p2;
                        return teams.find(t => t.name === p2Name)?.players || [];
                      })()
                }
                onGameEnd={handleGameEnd}
                initialTime={
                  currentMatchIndex.type === 'group'
                    ? tournamentConfig?.gameTime || 600
                    : playoffGameTime
                }
                tournamentId={tournamentId}
                matchId={currentMatchId}
                initialGameState={gameState}
                onGameStateChange={setGameState}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Layout>
  );
}

export default App;
