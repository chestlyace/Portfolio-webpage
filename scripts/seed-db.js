require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Content = require('../models/Content');

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_PATH = path.join(__dirname, '..', 'data', 'content.json');

async function seedDatabase() {
    if (!MONGODB_URI) {
        console.error('❌ Error: MONGODB_URI not found in .env file');
        console.log('Please create a .env file with your MongoDB connection string');
        process.exit(1);
    }

    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Read the JSON file
        console.log('📖 Reading content.json...');
        const rawData = await fs.readFile(DATA_PATH, 'utf-8');
        const contentData = JSON.parse(rawData);

        // Check if content already exists
        const existingContent = await Content.findOne();

        if (existingContent) {
            console.log('⚠️  Database already contains content');
            console.log('Do you want to overwrite it? (This will delete existing data)');
            console.log('To proceed, delete the existing content manually or modify this script');

            // Uncomment the line below to force overwrite
            // await Content.deleteMany({});
            // console.log('🗑️  Existing content deleted');
        }

        if (!existingContent) {
            console.log('💾 Seeding database with content from JSON file...');
            await Content.create(contentData);
            console.log('✅ Database seeded successfully!');
        }

        console.log('\n📊 Current content summary:');
        const content = await Content.findOne();
        console.log(`   - Projects: ${content.projects?.length || 0}`);
        console.log(`   - Experience: ${content.experience?.length || 0}`);
        console.log(`   - Education: ${content.education?.length || 0}`);
        console.log(`   - Badges: ${content.badges?.length || 0}`);

        await mongoose.connection.close();
        console.log('\n✅ Done! Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seedDatabase();
