const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(path.join(dataDir, 'documents.db'));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT,
      originalName TEXT,
      filePath TEXT,
      fileType TEXT,
      uploadedAt TEXT,
      estimateDate TEXT,
      supplierName TEXT,
      property TEXT,
      description TEXT,
      keywords TEXT,
      serviceCategory TEXT,
      totalPrice REAL,
      recurring INTEGER,
      billingInterval TEXT,
      intervalAmount REAL,
      expirationDate TEXT,
      cancellationTerms TEXT,
      rawText TEXT,
      projectNickname TEXT,
      isActive INTEGER DEFAULT 1,
      supersededById TEXT
    )
  `);

  // Migrate existing tables: silently ignore errors if columns already exist
  db.run(`ALTER TABLE documents ADD COLUMN projectNickname TEXT`, () => {});
  db.run(`ALTER TABLE documents ADD COLUMN isActive INTEGER DEFAULT 1`, () => {});
  db.run(`ALTER TABLE documents ADD COLUMN supersededById TEXT`, () => {});
});

module.exports = db;
