import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

const dbPath = join(__dirname, 'tournament.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS tournaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            name TEXT,
            config TEXT,
            app_state TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER,
            p1 TEXT,
            p2 TEXT,
            round_index INTEGER,
            group_id TEXT,
            winner TEXT,
            FOREIGN KEY(tournament_id) REFERENCES tournaments(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER,
            name TEXT,
            players TEXT,
            group_name TEXT,
            games_played INTEGER DEFAULT 0,
            points INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            ot_wins INTEGER DEFAULT 0,
            ot_losses INTEGER DEFAULT 0,
            shooter_wins INTEGER DEFAULT 0,
            cup_diff INTEGER DEFAULT 0,
            cups_hit INTEGER DEFAULT 0,
            cups_lost INTEGER DEFAULT 0,
            FOREIGN KEY(tournament_id) REFERENCES tournaments(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tournament_id INTEGER,
            match_id INTEGER,
            hit_number INTEGER,
            game_time_str TEXT,
            game_time_sec INTEGER,
            team_name TEXT,
            player_name TEXT,
            cup_hit TEXT,
            score_after TEXT,
            cups_left TEXT,
            phase TEXT,
            event_type TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
            FOREIGN KEY(match_id) REFERENCES matches(id)
        )`);
    });
}

// Routes
app.post('/api/tournaments', (req, res) => {
    console.log('POST /api/tournaments body:', req.body);
    try {
        const { name, config } = req.body;
        const sql = `INSERT INTO tournaments (name, config) VALUES (?, ?)`;
        const params = [name || null, JSON.stringify(config || {})];
        db.run(sql, params, function (err) {
            if (err) {
                console.error('DB Error:', err.message);
                return res.status(400).json({ error: err.message });
            }
            console.log('Tournament created, ID:', this.lastID);
            res.json({ id: this.lastID });
        });
    } catch (error) {
        console.error('Server Exception:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/teams', (req, res) => {
    console.log('POST /api/teams body:', req.body);
    try {
        const { tournament_id, name, group_name } = req.body;
        const sql = `INSERT INTO teams (tournament_id, name, group_name) VALUES (?, ?, ?)`;
        db.run(sql, [tournament_id, name, group_name], function (err) {
            if (err) {
                console.error('DB Error:', err.message);
                return res.status(400).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
    } catch (error) {
        console.error('Server Exception:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/matches', (req, res) => {
    console.log('POST /api/matches body:', req.body);
    try {
        const { tournament_id, p1, p2, round_index, group_id } = req.body;
        const sql = `INSERT INTO matches (tournament_id, p1, p2, round_index, group_id) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [tournament_id, p1, p2, round_index, group_id], function (err) {
            if (err) {
                console.error('DB Error:', err.message);
                return res.status(400).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
    } catch (error) {
        console.error('Server Exception:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/events', (req, res) => {
    console.log('POST /api/events body:', req.body);
    try {
        const {
            tournament_id, match_id, hit_number, game_time_str, game_time_sec,
            team_name, player_name, cup_hit, score_after, cups_left, phase, event_type, notes
        } = req.body;

        const sql = `INSERT INTO events (
            tournament_id, match_id, hit_number, game_time_str, game_time_sec,
            team_name, player_name, cup_hit, score_after, cups_left, phase, event_type, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            tournament_id, match_id, hit_number, game_time_str, game_time_sec,
            team_name, player_name, cup_hit, score_after, cups_left, phase, event_type, notes
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('DB Error:', err.message);
                return res.status(400).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
    } catch (error) {
        console.error('Server Exception:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET Endpoints for State Restoration
app.get('/api/tournaments', (req, res) => {
    const sql = `SELECT id, created_at, name, config FROM tournaments ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        const tournaments = rows.map(row => ({
            ...row,
            config: JSON.parse(row.config || '{}')
        }));
        res.json({ tournaments });
    });
});

app.get('/api/tournaments/latest', (req, res) => {
    const sql = `SELECT * FROM tournaments ORDER BY id DESC LIMIT 1`;
    db.get(sql, [], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!row) return res.json({ tournament: null });
        res.json({
            tournament: {
                ...row,
                config: JSON.parse(row.config || '{}'),
                app_state: row.app_state ? JSON.parse(row.app_state) : null
            }
        });
    });
});

// PUT Endpoint to Save App State
app.put('/api/tournaments/:id/state', (req, res) => {
    const tournamentId = req.params.id;
    const { appState } = req.body;

    const sql = `UPDATE tournaments SET app_state = ? WHERE id = ?`;
    db.run(sql, [JSON.stringify(appState), tournamentId], function (err) {
        if (err) {
            console.error('DB Error:', err.message);
            return res.status(400).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.get('/api/tournaments/:id/state', (req, res) => {
    const tournamentId = req.params.id;

    const result = {
        tournament: null,
        teams: [],
        matches: [],
        events: []
    };

    db.get(`SELECT * FROM tournaments WHERE id = ?`, [tournamentId], (err, tournament) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

        result.tournament = { ...tournament, config: JSON.parse(tournament.config || '{}') };

        db.all(`SELECT * FROM teams WHERE tournament_id = ?`, [tournamentId], (err, teams) => {
            if (err) return res.status(400).json({ error: err.message });
            result.teams = teams;

            db.all(`SELECT * FROM matches WHERE tournament_id = ?`, [tournamentId], (err, matches) => {
                if (err) return res.status(400).json({ error: err.message });
                result.matches = matches;

                db.all(`SELECT * FROM events WHERE tournament_id = ? ORDER BY id`, [tournamentId], (err, events) => {
                    if (err) return res.status(400).json({ error: err.message });
                    result.events = events;

                    res.json(result);
                });
            });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
