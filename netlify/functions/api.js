const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const connectDB = require('../../config/db');
const Content = require('../../models/Content');
const defaultContent = require('../../data/content.json');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to Database
connectDB();

const ARRAY_SECTIONS = new Set([
    'projects',
    'designGallery',
    'events',
    'services',
    'experience',
    'education',
    'badges'
]);

// Helper to get or seed content
async function getContent() {
    let content = await Content.findOne();
    if (!content) {
        content = await Content.create(defaultContent);
        console.log('Database seeded with default content');
    }
    return content;
}

const router = express.Router();

// GET all content
router.get('/content', async (req, res) => {
    try {
        const content = await getContent();
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read content', details: error.message });
    }
});

// PUT update all content
router.put('/content', async (req, res) => {
    try {
        // We use findOneAndUpdate to update the single document
        // upsert: true ensures it's created if missing (though getContent handles that usually)
        const content = await Content.findOneAndUpdate({}, req.body, {
            new: true,
            upsert: true,
            runValidators: false // Allow flexibility
        });
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save content', details: error.message });
    }
});

// GET specific section
router.get('/sections/:section', async (req, res) => {
    try {
        const content = await getContent();
        const sectionName = req.params.section;

        // Mongoose document to object
        const contentObj = content.toObject();

        if (!(sectionName in contentObj)) {
            return res.status(404).json({ error: `Section "${sectionName}" not found` });
        }
        res.json(contentObj[sectionName]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read section', details: error.message });
    }
});

// PUT update specific section
router.put('/sections/:section', async (req, res) => {
    try {
        const sectionName = req.params.section;

        // Validation for array sections
        if (ARRAY_SECTIONS.has(sectionName) && !Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Payload must be an array' });
        }

        const update = {};
        update[sectionName] = req.body;

        const content = await Content.findOneAndUpdate({}, update, { new: true });

        if (!content) {
            // Should not happen if seeded, but handle anyway
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json(content[sectionName]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update section', details: error.message });
    }
});

// POST append to array section
router.post('/sections/:section', async (req, res) => {
    try {
        const sectionName = req.params.section;
        if (!ARRAY_SECTIONS.has(sectionName)) {
            return res.status(400).json({ error: `Section "${sectionName}" does not support append operations` });
        }

        const content = await getContent();
        if (!Array.isArray(content[sectionName])) {
            content[sectionName] = [];
        }
        content[sectionName].push(req.body);
        await content.save();

        res.status(201).json({ index: content[sectionName].length - 1, item: req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add entry', details: error.message });
    }
});

// PUT update item in array section
router.put('/sections/:section/:index', async (req, res) => {
    try {
        const sectionName = req.params.section;
        const idx = Number(req.params.index);

        if (!ARRAY_SECTIONS.has(sectionName)) {
            return res.status(400).json({ error: `Section "${sectionName}" cannot be edited via index` });
        }

        const content = await getContent();

        if (!Array.isArray(content[sectionName]) || Number.isNaN(idx) || idx < 0 || idx >= content[sectionName].length) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update the specific item
        content[sectionName][idx] = req.body;

        // Mark as modified because we are modifying a Mixed type array or nested object
        content.markModified(sectionName);

        await content.save();
        res.json(content[sectionName][idx]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update entry', details: error.message });
    }
});

// DELETE item from array section
router.delete('/sections/:section/:index', async (req, res) => {
    try {
        const sectionName = req.params.section;
        const idx = Number(req.params.index);

        if (!ARRAY_SECTIONS.has(sectionName)) {
            return res.status(400).json({ error: `Section "${sectionName}" cannot be edited via index` });
        }

        const content = await getContent();

        if (!Array.isArray(content[sectionName]) || Number.isNaN(idx) || idx < 0 || idx >= content[sectionName].length) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const [removed] = content[sectionName].splice(idx, 1);
        content.markModified(sectionName);
        await content.save();

        res.json({ removed });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete entry', details: error.message });
    }
});

// Mount router at /api
app.use('/api', router);

module.exports.handler = serverless(app);
