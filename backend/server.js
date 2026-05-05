require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
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

// Supabase Setup
// Use SERVICE_ROLE_KEY if available to bypass RLS, otherwise fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

// Cloudinary Setup
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'portfolio',
        resource_type: 'auto',
    },
});

const upload = multer({ storage: storage });

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
        const { data: profile } = await supabase.from('profile').select('*').single();
        const { data: skills } = await supabase.from('skills').select('*');
        const { data: services } = await supabase.from('services').select('*');
        const { data: works } = await supabase.from('works').select('*');
        const { data: journey } = await supabase.from('journey').select('*').order('order_index', { ascending: true });
        const { data: socials } = await supabase.from('socials').select('*');

        res.json({ profile, skills, services, works, journey, socials });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('profile').update(req.body).eq('id', 1).select();
    if (error) {
        console.error('Supabase Profile Update Error:', error);
        return res.status(500).json(error);
    }
    res.json(data);
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

        delete workData.id;

        const { data, error } = await supabase.from('works').insert([workData]).select();
        if (error) {
            console.error('Supabase Work Insert Error:', error);
            return res.status(500).json(error);
        }
        res.json(data);
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

        delete workData.id;

        const { data, error } = await supabase.from('works').update(workData).eq('id', req.params.id).select();
        if (error) {
            console.error('Supabase Work Update Error:', error);
            return res.status(500).json(error);
        }
        res.json(data);
    } catch (parseError) {
        console.error('Work Data Parsing Error:', parseError);
        res.status(400).json({ message: 'Invalid work data format', error: parseError.message });
    }
});

app.delete('/api/works/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('works').delete().eq('id', req.params.id).select();
    if (error) {
        console.error('Supabase Work Delete Error:', error);
        return res.status(500).json(error);
    }
    res.json(data);
});

// Upload Resume/Hero Image
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ url: req.file.path });
});

// CRUD for Journey
app.post('/api/journey', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('journey').insert([req.body]).select();
    if (error) {
        console.error('Supabase Journey Insert Error:', error);
        return res.status(500).json(error);
    }
    res.json(data);
});

app.put('/api/journey/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('journey').update(req.body).eq('id', req.params.id).select();
    if (error) {
        console.error('Supabase Journey Update Error:', error);
        return res.status(500).json(error);
    }
    res.json(data);
});

app.delete('/api/journey/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('journey').delete().eq('id', req.params.id).select();
    if (error) {
        console.error('Supabase Journey Delete Error:', error);
        return res.status(500).json(error);
    }
    res.json(data);
});

// CRUD for Skills
app.post('/api/skills', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('skills').insert([req.body]).select();
    if (error) {
        console.error('Supabase Skill Insert Error:', error);
        return res.status(500).json(error);
    }
    res.json(data);
});

app.delete('/api/skills/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('skills').delete().eq('id', req.params.id).select();
    if (error) {
        console.error('Supabase Skill Delete Error:', error);
        return res.status(500).json(error);
    }
    res.json(data);
});

app.get('/', (req, res) => res.send('Portfolio API running'));
app.get('/health', (req, res) => res.json({ ok: true }));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
