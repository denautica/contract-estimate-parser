const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const db = require('./database');
const { parseDocument } = require('./parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, JPG, and PNG files allowed'));
  }
});

app.use('/uploads', express.static(uploadsDir));

async function extractText(filePath, fileType) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(m)
    });
    return result.data.text;
  }
  return '';
}

async function processSingleFile(file) {
  const rawText = await extractText(file.path, file.mimetype);
  if (!rawText.trim()) {
    throw new Error('Could not extract text from document');
  }

  const parsed = await parseDocument(rawText);
  const id = uuidv4();
  const now = new Date().toISOString();

  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.join(', ') : parsed.keywords;

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        file.filename,
        file.originalname,
        file.path,
        file.mimetype,
        now,
        parsed.estimateDate || null,
        parsed.supplierName || null,
        parsed.property || 'Other',
        parsed.description || null,
        keywords || null,
        parsed.serviceCategory || null,
        parsed.totalPrice || null,
        parsed.recurring ? 1 : 0,
        parsed.billingInterval || null,
        parsed.intervalAmount || null,
        parsed.expirationDate || null,
        parsed.cancellationTerms || null,
        rawText
      ],
      function(err) {
        if (err) {
          console.error('DB error:', err);
          reject(new Error('Failed to save document'));
        } else {
          resolve({ id, ...parsed, uploadedAt: now, originalName: file.originalname });
        }
      }
    );
  });
}

app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const result = await processSingleFile(file);
        results.push({ success: true, ...result });
      } catch (err) {
        console.error(`Error processing ${file.originalname}:`, err.message);
        errors.push({ file: file.originalname, error: err.message });
        // Clean up failed file
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    res.json({ results, errors, totalProcessed: results.length, totalFailed: errors.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process documents' });
  }
});

app.get('/api/documents', (req, res) => {
  const { search, property, serviceCategory, recurring, supplierName } = req.query;
  let sql = 'SELECT * FROM documents WHERE 1=1';
  const params = [];

  if (search) {
    sql += ` AND (
      originalName LIKE ? OR supplierName LIKE ? OR description LIKE ? OR 
      keywords LIKE ? OR serviceCategory LIKE ? OR rawText LIKE ?
    )`;
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }
  if (property) {
    sql += ' AND property = ?';
    params.push(property);
  }
  if (serviceCategory) {
    sql += ' AND serviceCategory = ?';
    params.push(serviceCategory);
  }
  if (recurring !== undefined) {
    sql += ' AND recurring = ?';
    params.push(recurring === 'true' ? 1 : 0);
  }
  if (supplierName) {
    sql += ' AND supplierName LIKE ?';
    params.push(`%${supplierName}%`);
  }

  sql += ' ORDER BY uploadedAt DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/documents/:id', (req, res) => {
  db.get('SELECT * FROM documents WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Document not found' });
    res.json(row);
  });
});

app.delete('/api/documents/:id', (req, res) => {
  db.get('SELECT filePath FROM documents WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Document not found' });
    
    if (fs.existsSync(row.filePath)) fs.unlinkSync(row.filePath);
    
    db.run('DELETE FROM documents WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.post('/api/compare', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
    return res.status(400).json({ error: 'Select 2 to 4 documents to compare' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.all(`SELECT * FROM documents WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/stats', (req, res) => {
  db.all('SELECT DISTINCT property FROM documents ORDER BY property', [], (err, properties) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all('SELECT DISTINCT serviceCategory FROM documents WHERE serviceCategory IS NOT NULL ORDER BY serviceCategory', [], (err, categories) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT COUNT(*) as total FROM documents', [], (err, count) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          totalDocuments: count.total,
          properties: properties.map(p => p.property),
          serviceCategories: categories.map(c => c.serviceCategory)
        });
      });
    });
  });
});

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
