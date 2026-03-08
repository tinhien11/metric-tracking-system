const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(__dirname, '../../metrics.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS metrics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT    NOT NULL,
    type        TEXT    NOT NULL,
    value       REAL    NOT NULL,
    unit        TEXT    NOT NULL,
    date        DATE    NOT NULL,
    created_at  DATETIME DEFAULT (datetime('now'))
  )
`);

module.exports = db;
