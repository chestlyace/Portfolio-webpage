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
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
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
    const { data, error } = await supabase.from('profile').update(req.body).eq('id', 1);
    if (error) return res.status(500).json(error);
    res.json(data);
});

// CRUD for Works (Projects, Designs, Events)
app.post('/api/works', authenticateToken, upload.single('image'), async (req, res) => {
    const workData = { ...req.body };
    if (req.file) {
        workData.image_url = req.file.path;
    }
    // Parse JSON fields if they come as strings
    if (typeof workData.tech_stack === 'string') workData.tech_stack = JSON.parse(workData.tech_stack);
    if (typeof workData.highlights === 'string') workData.highlights = JSON.parse(workData.highlights);

    const { data, error } = await supabase.from('works').insert([workData]);
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.put('/api/works/:id', authenticateToken, upload.single('image'), async (req, res) => {
    const workData = { ...req.body };
    if (req.file) {
        workData.image_url = req.file.path;
    }
    if (typeof workData.tech_stack === 'string') workData.tech_stack = JSON.parse(workData.tech_stack);
    if (typeof workData.highlights === 'string') workData.highlights = JSON.parse(workData.highlights);

    const { data, error } = await supabase.from('works').update(workData).eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.delete('/api/works/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('works').delete().eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json(data);
});

// Upload Resume/Hero Image
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ url: req.file.path });
});

// CRUD for Journey
app.post('/api/journey', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('journey').insert([req.body]);
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.put('/api/journey/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('journey').update(req.body).eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.delete('/api/journey/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('journey').delete().eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json(data);
});

// CRUD for Skills
app.post('/api/skills', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('skills').insert([req.body]);
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.delete('/api/skills/:id', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('skills').delete().eq('id', req.params.id);
    if (error) return res.status(500).json(error);
    res.json(data);
});

app.get('/', (req, res) => res.send('Portfolio API running'));
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
