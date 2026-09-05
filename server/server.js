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
  limits: { fileSize: 50 * 1024 * 1024 },
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
    const result = await Tesseract.recognize(filePath, 'eng', { logger: m => console.log(m) });
    return result.data.text;
  }
  return '';
}

async function processSingleFile(file, batchOptions = {}) {
  const rawText = await extractText(file.path, file.mimetype);
  if (!rawText.trim()) {
    throw new Error('Could not extract text from document');
  }

  const parsed = await parseDocument(rawText);
  const id = uuidv4();
  const now = new Date().toISOString();
  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.join(', ') : parsed.keywords;

  const projectNickname = batchOptions.projectNickname || null;
  const isActive = batchOptions.isActive !== undefined ? (batchOptions.isActive ? 1 : 0) : 0;
  const supersededById = null;

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO documents (
        id, filename, originalName, filePath, fileType, uploadedAt,
        estimateDate, supplierName, property, description, keywords,
        serviceCategory, totalPrice, recurring, billingInterval, intervalAmount,
        expirationDate, cancellationTerms, rawText,
        projectNickname, isActive, supersededById
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, file.filename, file.originalname, file.path, file.mimetype, now,
        parsed.estimateDate || null, parsed.supplierName || null, parsed.property || 'Other',
        parsed.description || null, keywords || null, parsed.serviceCategory || null,
        parsed.totalPrice || null, parsed.recurring ? 1 : 0, parsed.billingInterval || null,
        parsed.intervalAmount || null, parsed.expirationDate || null,
        parsed.cancellationTerms || null, rawText,
        projectNickname, isActive, supersededById
      ],
      function(err) {
        if (err) {
          console.error('DB error:', err);
          reject(new Error('Failed to save document'));
        } else {
          resolve({ id, ...parsed, uploadedAt: now, originalName: file.originalname, projectNickname, isActive, supersededById });
        }
      }
    );
  });
}

app.post('/api/upload', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const batchOptions = {
      projectNickname: req.body.projectNickname || null,
      isActive: req.body.isActive === 'true'
    };

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const result = await processSingleFile(file, batchOptions);
        results.push({ success: true, ...result });
      } catch (err) {
        console.error(`Error processing ${file.originalname}:`, err.message);
        errors.push({ file: file.originalname, error: err.message });
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    res.json({ results, errors, totalProcessed: results.length, totalFailed: errors.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process documents' });
  }
});

app.put('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const {
    estimateDate, supplierName, property, description, keywords,
    serviceCategory, totalPrice, recurring, billingInterval,
    intervalAmount, expirationDate, cancellationTerms,
    projectNickname, isActive, supersededById
  } = req.body;

  const fields = [];
  const values = [];

  if (estimateDate !== undefined) { fields.push('estimateDate = ?'); values.push(estimateDate); }
  if (supplierName !== undefined) { fields.push('supplierName = ?'); values.push(supplierName); }
  if (property !== undefined) { fields.push('property = ?'); values.push(property); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (keywords !== undefined) { fields.push('keywords = ?'); values.push(keywords); }
  if (serviceCategory !== undefined) { fields.push('serviceCategory = ?'); values.push(serviceCategory); }
  if (totalPrice !== undefined) { fields.push('totalPrice = ?'); values.push(totalPrice); }
  if (recurring !== undefined) { fields.push('recurring = ?'); values.push(recurring ? 1 : 0); }
  if (billingInterval !== undefined) { fields.push('billingInterval = ?'); values.push(billingInterval); }
  if (intervalAmount !== undefined) { fields.push('intervalAmount = ?'); values.push(intervalAmount); }
  if (expirationDate !== undefined) { fields.push('expirationDate = ?'); values.push(expirationDate); }
  if (cancellationTerms !== undefined) { fields.push('cancellationTerms = ?'); values.push(cancellationTerms); }
  if (projectNickname !== undefined) { fields.push('projectNickname = ?'); values.push(projectNickname); }
  if (isActive !== undefined) { fields.push('isActive = ?'); values.push(isActive ? 1 : 0); }
  if (supersededById !== undefined) { fields.push('supersededById = ?'); values.push(supersededById || null); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);

  db.run(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row && row.supersededById) {
        db.get('SELECT id, originalName, projectNickname FROM documents WHERE id = ?', [row.supersededById], (err, supRow) => {
          if (err) return res.status(500).json({ error: err.message });
          row.supersededBy = supRow || null;
          res.json(row);
        });
      } else {
        row.supersededBy = null;
        res.json(row);
      }
    });
  });
});

app.put('/api/documents/bulk/status', (req, res) => {
  const { ids, isActive } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No document IDs provided' });
  }
  const placeholders = ids.map(() => '?').join(',');
  const newStatus = isActive ? 1 : 0;
  db.run(`UPDATE documents SET isActive = ? WHERE id IN (${placeholders})`, [newStatus, ...ids], function(err) {
    if (err) {
      console.error('Bulk update error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ updated: this.changes });
  });
});

app.get('/api/documents', (req, res) => {
  const { search, property, serviceCategory, recurring, supplierName, isActive } = req.query;
  let sql = 'SELECT * FROM documents WHERE 1=1';
  const params = [];

  if (search) {
    sql += ` AND (
      originalName LIKE ? OR supplierName LIKE ? OR description LIKE ? OR 
      keywords LIKE ? OR serviceCategory LIKE ? OR rawText LIKE ? OR projectNickname LIKE ?
    )`;
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like, like);
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
  if (isActive !== undefined) {
    if (isActive === 'true') {
      sql += ' AND isActive = 1';
    } else {
      sql += ' AND (isActive = 0 OR isActive IS NULL)';
    }
  }

  sql += ' ORDER BY uploadedAt DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/documents/expiring', (req, res) => {
  const now = new Date().toISOString().split('T')[0];
  const sql = `
    SELECT *, 
      CASE 
        WHEN expirationDate < ? THEN 'expired'
        WHEN julianday(expirationDate) - julianday(?) <= 30 THEN 'critical'
        WHEN julianday(expirationDate) - julianday(?) <= 60 THEN 'warning'
        WHEN julianday(expirationDate) - julianday(?) <= 90 THEN 'notice'
        ELSE 'healthy'
      END as urgency
    FROM documents
    WHERE expirationDate IS NOT NULL
    ORDER BY expirationDate ASC
  `;
  db.all(sql, [now, now, now, now], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/documents/:id', (req, res) => {
  db.get('SELECT * FROM documents WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Document not found' });
    
    if (row.supersededById) {
      db.get('SELECT id, originalName, projectNickname FROM documents WHERE id = ?', [row.supersededById], (err, supRow) => {
        if (err) return res.status(500).json({ error: err.message });
        row.supersededBy = supRow || null;
        res.json(row);
      });
    } else {
      row.supersededBy = null;
      res.json(row);
    }
  });
});

app.get('/api/documents/:id/supersedes', (req, res) => {
  db.all('SELECT id, originalName, projectNickname, uploadedAt, supplierName FROM documents WHERE supersededById = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
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
        db.get('SELECT COUNT(*) as active FROM documents WHERE isActive = 1', [], (err, activeCount) => {
          if (err) return res.status(500).json({ error: err.message });
          db.get('SELECT COUNT(*) as expiring FROM documents WHERE expirationDate IS NOT NULL AND expirationDate >= date("now") AND julianday(expirationDate) - julianday(date("now")) <= 90', [], (err, expiringCount) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
              totalDocuments: count.total,
              activeDocuments: activeCount.active,
              expiringSoon: expiringCount.expiring,
              properties: properties.map(p => p.property),
              serviceCategories: categories.map(c => c.serviceCategory)
            });
          });
        });
      });
    });
  });
});

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
