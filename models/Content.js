const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    hero: { type: mongoose.Schema.Types.Mixed, default: {} },
    about: { type: mongoose.Schema.Types.Mixed, default: {} },
    skills: { type: mongoose.Schema.Types.Mixed, default: {} },
    projects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    designGallery: { type: [mongoose.Schema.Types.Mixed], default: [] },
    events: { type: [mongoose.Schema.Types.Mixed], default: [] },
    services: { type: [mongoose.Schema.Types.Mixed], default: [] },
    experience: { type: [mongoose.Schema.Types.Mixed], default: [] },
    education: { type: [mongoose.Schema.Types.Mixed], default: [] },
    badges: { type: [mongoose.Schema.Types.Mixed], default: [] },
    contact: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { strict: false, timestamps: true });

module.exports = mongoose.model('Content', ContentSchema);
