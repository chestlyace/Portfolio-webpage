-- Supabase Setup SQL

-- Drop existing tables if they exist (careful with this in production)
DROP TABLE IF EXISTS socials;
DROP TABLE IF EXISTS journey;
DROP TABLE IF EXISTS works;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS profile;

-- Profile and general info
CREATE TABLE profile (
    id SERIAL PRIMARY KEY,
    name TEXT,
    display_name TEXT,
    title_1 TEXT,
    title_2 TEXT,
    title_3 TEXT,
    tagline TEXT,
    hero_image TEXT,
    about_quote TEXT,
    about_text_1 TEXT,
    about_text_2 TEXT,
    resume_url TEXT,
    phone TEXT,
    email TEXT,
    whatsapp_number TEXT
);

-- Skills
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name TEXT,
    icon TEXT,
    category TEXT -- 'language', 'framework', 'tool'
);

-- Services
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    icon TEXT,
    items JSONB -- Array of strings
);

-- Work (Projects, Designs, Events)
CREATE TABLE works (
    id SERIAL PRIMARY KEY,
    type TEXT, -- 'project', 'design', 'event'
    title TEXT,
    description TEXT,
    image_url TEXT,
    tech_stack JSONB, -- Array of strings
    live_url TEXT,
    source_url TEXT,
    category_label TEXT, -- e.g. 'Full Stack', 'Mobile App'
    highlights JSONB -- For events
);

-- Journey (Experience & Education)
CREATE TABLE journey (
    id SERIAL PRIMARY KEY,
    role TEXT,
    company TEXT,
    dates TEXT,
    description TEXT,
    logo_url TEXT,
    type TEXT, -- 'work', 'education'
    order_index INT DEFAULT 0
);

-- Social Links
CREATE TABLE socials (
    id SERIAL PRIMARY KEY,
    platform TEXT,
    url TEXT,
    icon TEXT
);

-- Insert Initial Data from index.html

INSERT INTO profile (
    name, display_name, title_1, title_2, title_3, tagline, hero_image,
    about_quote, about_text_1, about_text_2, resume_url, phone, email, whatsapp_number
) VALUES (
    'Chestly Ace', 'DEV.ACE', 'Developer', 'Designer', 'PHOTOGRAPHER', 'Open to Remote Roles', '684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png',
    'Blending logic with creativity to craft digital experiences that matter.',
    'I am a multi-disciplinary creative based in the tech world. My journey started with a curiosity for how things work, leading me down the path of Software Engineering. Along the way, I discovered that function without form is incomplete, sparking my passion for Design and Photography.',
    'Whether I''m writing clean code in Python or capturing a candid moment through my lens, my goal is always the same: to tell a story and solve a problem elegantly. I believe in the power of minimalism and the impact of bold choices.',
    'resume.pdf', '+237 676 940 247', 'developerace0@gmail.com', '237676940247'
);

-- Languages
INSERT INTO skills (name, icon, category) VALUES
('HTML', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', 'language'),
('CSS', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', 'language'),
('JS', 'fab fa-js text-yellow-400', 'language'),
('Python', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', 'language'),
('C', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg', 'language'),
('PHP', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', 'language'),
('Java', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg', 'language'),
('Dart', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg', 'language');

-- Frameworks
INSERT INTO skills (name, icon, category) VALUES
('React', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', 'framework'),
('Tailwind', 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg', 'framework'),
('Next.js', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', 'framework'),
('Flutter', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg', 'framework'),
('React Native', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', 'framework'),
('Node.js', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', 'framework'),
('Express', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', 'framework'),
('Django', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg', 'framework'),
('BS5', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg', 'framework');

-- Tools
INSERT INTO skills (name, icon, category) VALUES
('Figma', 'fab fa-figma text-pink-500', 'tool'),
('Git', 'fab fa-git-alt text-red-500', 'tool'),
('VS Code', 'fas fa-code text-blue-500', 'tool'),
('Ps', 'text-blue-400 border-2 border-blue-400 rounded p-1', 'tool'),
('Linux', 'fab fa-linux text-yellow-500', 'tool'),
('Canva', 'text-teal-400', 'tool'),
('Lr', 'text-blue-300 border-2 border-blue-300 rounded p-1', 'tool'),
('MongoDB', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', 'tool'),
('MySQL', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', 'tool'),
('PostgreSQL', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', 'tool'),
('Google Cloud', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg', 'tool'),
('AWS', 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg', 'tool');

-- Services
INSERT INTO services (title, description, icon, items) VALUES
('Software Development', 'Building robust, scalable, and efficient web and mobile applications tailored to your specific needs.', 'code', '["Full Stack Web Apps", "Mobile Applications", "API Integration"]'),
('UI/UX & Graphic Design', 'Crafting intuitive user interfaces and compelling visual identities that resonate with your audience.', 'design_services', '["User Interface Design", "Brand Identity", "Poster & Social Media Art"]'),
('Photography', 'Capturing moments, portraits, and products with a unique artistic perspective and high-quality editing.', 'photo_camera', '["Portrait Photography", "Product Shoots", "Street & Urban"]'),
('Event Coverage', 'Professional documentation of your events, ensuring every important memory is preserved beautifully.', 'videocam', '["Corporate Events", "Social Gatherings", "Video Highlights"]');

-- Projects
INSERT INTO works (type, title, description, image_url, tech_stack, live_url, source_url, category_label) VALUES
('project', 'Alexdy', 'Alexdy is a premium digital marketplace designed to bridge the gap between quality service providers and consumers. The platform features a robust, bilingual (English/French) architecture that supports diverse categories—ranging from electronics and fashion to specialized technical services like appliance repair and beauty. I developed this platform to prioritize user trust, featuring secure checkout, service provider verification, and a streamlined "request-to-delivery" workflow.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuApiCSKKDhaEL-DankJ2lj73_vwRIutzB79mP2uRmBjCxMtEQa-wa6WXPy-EWcDpRbLYYPhfgxu3604B0BdWb0JCwBOMMr_mIwG6HR-e6lNOjeWt1oPk_uX3F8DLSEsB8vSWz5Rg2AvL2XDCvKiGZJUvBe_N2fMgWidenRji5TPJw9rakBBPdTgaxbaYkwxsnEoW6hSPYnQsOq8W0lQE55SQDyAnUt7HYkroQo21ZZm3XABn_EDYWtjn7yvK9hqOqpYOySQ0tlkHxY2', '["Laravel", "PHP", "Tailwind", "MySQL"]', 'https://alexdy.com', '', 'Full Stack'),
('project', 'Lens & Life', 'A social platform for street photographers to share locations and stories. Built with React Native for cross-platform performance.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6te8U5OVZAqYh25V48LtpKpKMpSkRxNlUl363FdQA4X8bRAwV0oP2zbidMfVSnVw_kbFZvtl_DHsVTTBfz5a7iaEJkZTVHbXnIwoW8hZyR-uv4LX6Hxjv4h_11aMWBhpt-RQxHbO8odiBQpT401fUub7GDK4n-1WYzmW2RHb_-otF4_Woh00IDTO09INtfY0iMCQMCWPjrVv6eHDLxdalAQwgaChPKb8iDgJkQpul51FGRhegK1f6kfszksS3hVYqhrqFjlWpdbJu', '["React Native", "Firebase", "Google Maps API"]', '#', '#', 'Mobile App');

-- Design Gallery
INSERT INTO works (type, title, image_url) VALUES
('design', 'Flyer Design', 'https://images.unsplash.com/photo-1626785774573-4b799314346d?q=80&w=1000&auto=format&fit=crop'),
('design', 'Brand Logo', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop'),
('design', 'Event Poster', 'https://images.unsplash.com/photo-1558655146-d09347e0b7a9?q=80&w=1000&auto=format&fit=crop'),
('design', 'Social Media', 'https://images.unsplash.com/photo-1629341492330-22c9497d9539?q=80&w=1000&auto=format&fit=crop'),
('design', 'Typography', 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=1000&auto=format&fit=crop'),
('design', 'Digital Art', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop');

-- Events
INSERT INTO works (type, title, description, image_url, highlights, category_label) VALUES
('event', 'Tech Summit 2024', 'Official coverage for the annual regional tech summit, capturing keynote speeches, networking sessions, and panel discussions.', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop', '["Photography", "Videography", "Editing"]', 'Event Coverage'),
('event', 'City Art Fest', 'Documenting the vibrant energy, performances, and art installations of the city''s largest cultural festival.', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop', '["Candids", "Event", "Social"]', 'Festival');

-- Journey
INSERT INTO journey (role, company, dates, description, logo_url, type, order_index) VALUES
('Backend Developer(Intern)', 'NHA Health Tech.', 'Dec 2025 - Present', 'Building tech solutions for the healthcare, sector in Cameroon focusing on scalable backend architecture.', 'ets_nhahealthtech_logo.jpeg', 'work', 1),
('Software Developer', 'Digimark Consulting', 'Jun 2025 - Present', 'Building tech solutions for clients, focusing on scalable backend architecture.', 'digimark.jpeg', 'work', 2),
('Bachelor''s Degree', 'Yaounde Int. Business School', '2025 - Present', 'Continuing advanced studies in Software Engineering and Business.', 'yibs.png', 'education', 3),
('Frontend Developer', 'NGCodeX', 'Sep 2024 - Oct 2024', 'Developed responsive and interactive UI for hospital consultation systems.', 'logoNGcodeX.png', 'work', 4),
('Software Developer (Intern)', 'Camsoft Group sarl.', 'Jul 2024 - Sep 2024', 'Worked on building responsive web apps using React, Tailwind, and Modern JS.', '', 'work', 5),
('Photographer/Designer', 'CEY2 Youth Church', '2024 - Present', 'Capturing moments during services and designing posters for events and programs.', '', 'work', 6),
('Graphic Designer', 'Kris Kitchen', '2024 - Present', 'Creating visually appealing designs for social media and marketing materials.', '', 'work', 7),
('HND in Software Engineering', 'University Institute of Sci. & Tech.', '2023 - 2025', 'Foundation in computer science, software engineering and web development.', '', 'education', 8);

-- Socials
INSERT INTO socials (platform, url, icon) VALUES
('Instagram', 'https://instagram.com/chestlyace', 'fab fa-instagram'),
('LinkedIn', 'https://linkedin.com/in/chestlyace', 'fab fa-linkedin-in'),
('GitHub', 'https://github.com/chestlyace', 'fab fa-github'),
('TikTok', 'https://tiktok.com/@chestlyace', 'fab fa-tiktok');
