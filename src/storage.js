
const Database = require('better-sqlite3');
const db = new Database('data.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  url TEXT,
  status INTEGER,
  latency INTEGER,
  timestamp TEXT
)`).run();

module.exports = {
  save(log){
    db.prepare("INSERT INTO logs VALUES (?, ?, ?, ?, ?)")
    .run(log.id, log.url, log.status, log.latency, log.timestamp);
  },
  getAll(){
    return db.prepare("SELECT * FROM logs ORDER BY timestamp DESC").all();
  }
}
