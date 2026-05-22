require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Neon Postgres Setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Test DB connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('Connected to Neon Postgres'))
    .catch(err => console.error('Database connection error:', err.message));

// Cloudinary Setup
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

function isImageUpload(file) {
    return Boolean(file?.mimetype?.startsWith('image/'));
}

function getUploadFolder(file) {
    if (file.fieldname === 'logo') return 'portfolio/journey';
    if (file.fieldname === 'image') return 'portfolio/works';
    return 'portfolio/profile';
}

function getImageTransformation(file) {
    if (file.fieldname === 'logo') {
        return [
            {
                width: 600,
                height: 600,
                crop: 'limit',
                quality: 'auto:good',
                fetch_format: 'auto',
            },
        ];
    }

    return [
        {
            width: 1600,
            height: 1600,
            crop: 'limit',
            quality: 'auto:good',
            fetch_format: 'auto',
        },
    ];
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const imageUpload = isImageUpload(file);
        return {
            folder: getUploadFolder(file),
            resource_type: imageUpload ? 'image' : 'raw',
            allowed_formats: imageUpload ? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] : ['pdf'],
            format: imageUpload ? 'webp' : undefined,
            transformation: imageUpload ? getImageTransformation(file) : undefined,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
        };
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.error('Auth failure: No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Auth failure: Invalid token', err.message);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// --- SQL Helper Functions ---

// Build a dynamic UPDATE query from an object
function buildUpdateQuery(table, data, whereCol, whereVal) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    values.push(whereVal);
    return {
        text: `UPDATE "${table}" SET ${setClause} WHERE "${whereCol}" = $${values.length} RETURNING *`,
        values,
    };
}

// Build a dynamic INSERT query from an object
function buildInsertQuery(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    return {
        text: `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`,
        values,
    };
}

// Routes

// Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    }
    res.status(401).json({ message: 'Invalid password' });
});

// GET all data
app.get('/api/portfolio', async (req, res) => {
    try {
        const [profileRes, skillsRes, servicesRes, worksRes, journeyRes, socialsRes] = await Promise.all([
            pool.query('SELECT * FROM profile LIMIT 1'),
            pool.query('SELECT * FROM skills'),
            pool.query('SELECT * FROM services'),
            pool.query('SELECT * FROM works'),
            pool.query('SELECT * FROM journey ORDER BY order_index ASC'),
            pool.query('SELECT * FROM socials'),
        ]);

        res.json({
            profile: profileRes.rows[0] || null,
            skills: skillsRes.rows,
            services: servicesRes.rows,
            works: worksRes.rows,
            journey: journeyRes.rows,
            socials: socialsRes.rows,
        });
    } catch (error) {
        console.error('Portfolio Fetch Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Update Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const query = buildUpdateQuery('profile', req.body, 'id', 1);
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Profile Update Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// CRUD for Works (Projects, Designs, Events)
app.post('/api/works', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const workData = { ...req.body };
        if (req.file) {
            workData.image_url = req.file.path;
        }
        // Parse JSON fields if they come as strings
        if (typeof workData.tech_stack === 'string') workData.tech_stack = JSON.parse(workData.tech_stack);
        if (typeof workData.highlights === 'string') workData.highlights = JSON.parse(workData.highlights);

        // Handle boolean fields from FormData
        workData.is_live_url_private = workData.is_live_url_private === 'true';
        workData.is_source_url_private = workData.is_source_url_private === 'true';

        // Stringify JSONB fields for pg
        if (workData.tech_stack) workData.tech_stack = JSON.stringify(workData.tech_stack);
        if (workData.highlights) workData.highlights = JSON.stringify(workData.highlights);

        delete workData.id;

        const query = buildInsertQuery('works', workData);
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (parseError) {
        console.error('Work Data Parsing Error:', parseError);
        res.status(400).json({ message: 'Invalid work data format', error: parseError.message });
    }
});

app.put('/api/works/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const workData = { ...req.body };
        if (req.file) {
            workData.image_url = req.file.path;
        }
        if (typeof workData.tech_stack === 'string') workData.tech_stack = JSON.parse(workData.tech_stack);
        if (typeof workData.highlights === 'string') workData.highlights = JSON.parse(workData.highlights);

        // Handle boolean fields from FormData
        workData.is_live_url_private = workData.is_live_url_private === 'true';
        workData.is_source_url_private = workData.is_source_url_private === 'true';

        // Stringify JSONB fields for pg
        if (workData.tech_stack) workData.tech_stack = JSON.stringify(workData.tech_stack);
        if (workData.highlights) workData.highlights = JSON.stringify(workData.highlights);

        delete workData.id;

        const query = buildUpdateQuery('works', workData, 'id', req.params.id);
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (parseError) {
        console.error('Work Data Parsing Error:', parseError);
        res.status(400).json({ message: 'Invalid work data format', error: parseError.message });
    }
});

app.delete('/api/works/:id', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query('DELETE FROM works WHERE id = $1 RETURNING *', [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error('Work Delete Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Upload Resume/Hero Image
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ url: req.file.path });
});

// CRUD for Journey
app.post('/api/journey', authenticateToken, upload.single('logo'), async (req, res) => {
    try {
        const journeyData = { ...req.body };
        if (req.file) {
            journeyData.logo_url = req.file.path;
        }
        delete journeyData.id;

        const query = buildInsertQuery('journey', journeyData);
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Journey Insert Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/journey/:id', authenticateToken, upload.single('logo'), async (req, res) => {
    try {
        const journeyData = { ...req.body };
        if (req.file) {
            journeyData.logo_url = req.file.path;
        }
        delete journeyData.id;

        const query = buildUpdateQuery('journey', journeyData, 'id', req.params.id);
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Journey Update Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/journey/:id', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query('DELETE FROM journey WHERE id = $1 RETURNING *', [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error('Journey Delete Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// CRUD for Skills
app.post('/api/skills', authenticateToken, async (req, res) => {
    try {
        const query = buildInsertQuery('skills', req.body);
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Skill Insert Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/skills/:id', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING *', [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error('Skill Delete Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

app.get('/', (req, res) => res.send('Portfolio API running'));
app.get('/health', (req, res) => res.json({ ok: true }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message: err.code === 'LIMIT_FILE_SIZE'
                ? 'Upload failed: file is too large. Maximum size is 10 MB.'
                : `Upload failed: ${err.message}`,
        });
    }

    if (err?.http_code === 400 || err?.name === 'Error') {
        return res.status(400).json({
            message: err.message || 'Upload failed. Please check the file type and try again.',
        });
    }

    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
