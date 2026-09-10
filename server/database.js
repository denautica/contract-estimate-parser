const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'documents.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    originalName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileType TEXT NOT NULL,
    uploadedAt TEXT NOT NULL,
    estimateDate TEXT,
    supplierName TEXT,
    property TEXT DEFAULT 'Other',
    description TEXT,
    keywords TEXT,
    serviceCategory TEXT,
    totalPrice REAL,
    recurring INTEGER DEFAULT 0,
    billingInterval TEXT,
    intervalAmount REAL,
    expirationDate TEXT,
    cancellationTerms TEXT,
    rawText TEXT,
    projectNickname TEXT,
    isActive INTEGER DEFAULT 0,
    supersededById TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt TEXT NOT NULL
  )`);
});

module.exports = db;
