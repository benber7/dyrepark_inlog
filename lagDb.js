const db = require("better-sqlite3")("database.db")


db.exec(`
    CREATE TABLE IF NOT EXISTS user(
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        hash TEXT
    )
`)
