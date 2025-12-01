require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'content.json');
const USE_MONGODB = process.env.MONGODB_URI && process.env.USE_MONGODB !== 'false';

const ARRAY_SECTIONS = new Set([
  'projects',
  'designGallery',
  'events',
  'services',
  'experience',
  'education',
  'badges'
]);

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

// MongoDB setup (optional)
let Content, connectDB;
if (USE_MONGODB) {
  const mongoose = require('mongoose');
  connectDB = require('./config/db');
  Content = require('./models/Content');

  connectDB().catch(err => {
    console.error('MongoDB connection failed:', err.message);
    console.log('Falling back to JSON file storage');
  });
}

// Helper functions for JSON file storage
async function readContentFromFile() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeContentToFile(content) {
  await fs.writeFile(DATA_PATH, JSON.stringify(content, null, 2));
}

// Helper functions for MongoDB storage
async function readContentFromDB() {
  let content = await Content.findOne();
  if (!content) {
    // Seed from JSON file if DB is empty
    const defaultContent = await readContentFromFile();
    content = await Content.create(defaultContent);
    console.log('Database seeded with content from JSON file');
  }
  return content.toObject();
}

async function writeContentToDB(data) {
  const content = await Content.findOneAndUpdate({}, data, {
    new: true,
    upsert: true,
    runValidators: false
  });
  return content.toObject();
}

// Unified read/write functions
async function readContent() {
  if (USE_MONGODB) {
    return await readContentFromDB();
  }
  return await readContentFromFile();
}

async function writeContent(content) {
  if (USE_MONGODB) {
    return await writeContentToDB(content);
  }
  await writeContentToFile(content);
  return content;
}

// Routes
app.get('/api/content', async (req, res) => {
  try {
    const content = await readContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read content file', details: error.message });
  }
});

app.put('/api/content', async (req, res) => {
  try {
    const content = await writeContent(req.body);
    res.json({ status: 'ok', content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save content file', details: error.message });
  }
});

app.get('/api/sections/:section', async (req, res) => {
  try {
    const content = await readContent();
    const sectionName = req.params.section;
    if (!(sectionName in content)) {
      return res.status(404).json({ error: `Section "${sectionName}" not found` });
    }
    res.json(content[sectionName]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read section', details: error.message });
  }
});

app.put('/api/sections/:section', async (req, res) => {
  try {
    const content = await readContent();
    const sectionName = req.params.section;
    if (!(sectionName in content)) {
      return res.status(404).json({ error: `Section "${sectionName}" not found` });
    }
    if (ARRAY_SECTIONS.has(sectionName) && !Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Payload must be an array' });
    }
    content[sectionName] = req.body;
    await writeContent(content);
    res.json(content[sectionName]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section', details: error.message });
  }
});

app.post('/api/sections/:section', async (req, res) => {
  try {
    const sectionName = req.params.section;
    if (!ARRAY_SECTIONS.has(sectionName)) {
      return res.status(400).json({ error: `Section "${sectionName}" does not support append operations` });
    }
    const content = await readContent();
    if (!Array.isArray(content[sectionName])) {
      content[sectionName] = [];
    }
    content[sectionName].push(req.body);
    await writeContent(content);
    res.status(201).json({ index: content[sectionName].length - 1, item: req.body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add entry', details: error.message });
  }
});

app.put('/api/sections/:section/:index', async (req, res) => {
  try {
    const sectionName = req.params.section;
    const idx = Number(req.params.index);
    if (!ARRAY_SECTIONS.has(sectionName)) {
      return res.status(400).json({ error: `Section "${sectionName}" cannot be edited via index` });
    }
    const content = await readContent();
    if (!Array.isArray(content[sectionName]) || Number.isNaN(idx) || idx < 0 || idx >= content[sectionName].length) {
      return res.status(404).json({ error: 'Item not found' });
    }
    content[sectionName][idx] = req.body;
    await writeContent(content);
    res.json(content[sectionName][idx]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update entry', details: error.message });
  }
});

app.delete('/api/sections/:section/:index', async (req, res) => {
  try {
    const sectionName = req.params.section;
    const idx = Number(req.params.index);
    if (!ARRAY_SECTIONS.has(sectionName)) {
      return res.status(400).json({ error: `Section "${sectionName}" cannot be edited via index` });
    }
    const content = await readContent();
    if (!Array.isArray(content[sectionName]) || Number.isNaN(idx) || idx < 0 || idx >= content[sectionName].length) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const [removed] = content[sectionName].splice(idx, 1);
    await writeContent(content);
    res.json({ removed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Portfolio backend running on http://localhost:${PORT}`);
  console.log(`Storage mode: ${USE_MONGODB ? 'MongoDB' : 'JSON file'}`);
});
