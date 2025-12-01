const sectionsConfig = {
  hero: { label: 'Hero', type: 'object', hint: 'Name, chips, tagline, CTA labels, stats, avatar.' },
  about: { label: 'About', type: 'object', hint: 'Bio paragraphs and résumé link.' },
  skills: { label: 'Skills', type: 'object', hint: 'Languages, frameworks, tools, and soft skills arrays.' },
  projects: {
    label: 'Projects',
    type: 'array',
    sample: {
      title: 'New project',
      description: 'Short summary of the project.',
      tech: ['Tech 1', 'Tech 2'],
      liveUrl: 'https://example.com',
      sourceUrl: 'https://github.com/user/repo',
      statusDot: 'bg-blue-500'
    }
  },
  designGallery: {
    label: 'Design Gallery',
    type: 'array',
    sample: { src: 'https://example.com/thumb.jpg', alt: 'New design asset' }
  },
  events: {
    label: 'Events',
    type: 'array',
    sample: {
      title: 'Event name',
      year: '2025',
      description: 'How you contributed.',
      highlights: ['Photography', 'Branding'],
      image: 'https://example.com/event.jpg'
    }
  },
  services: {
    label: 'Services',
    type: 'array',
    sample: {
      title: 'Service name',
      description: 'What you deliver.',
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      icon: '<path d="..."/>'
    }
  },
  experience: {
    label: 'Experience',
    type: 'array',
    sample: {
      role: 'Job title',
      company: 'Company',
      dates: 'Jan 2024 – Present',
      description: 'Key responsibilities.',
      logo: 'company.png'
    }
  },
  education: {
    label: 'Education',
    type: 'array',
    sample: {
      title: 'Degree',
      school: 'School name',
      dates: '2023 – 2025',
      description: 'Focus or achievements.',
      logo: 'school.png'
    }
  },
  badges: {
    label: 'Badges & Certifications',
    type: 'array',
    sample: {
      title: 'Certification name',
      image: 'https://example.com/cert.svg'
    }
  },
  contact: { label: 'Contact & Socials', type: 'object', hint: 'Quote, email, and social links.' }
};

const sectionsContainer = document.getElementById('sectionsContainer');
const toastEl = document.getElementById('toast');
const saveAllBtn = document.getElementById('saveAllBtn');

let originalData = {};
const editors = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
  saveAllBtn?.addEventListener('click', handleSaveAll);
});

async function loadContent() {
  try {
    const res = await fetch('/api/content');
    if (!res.ok) throw new Error('Failed to fetch content');
    originalData = await res.json();
    renderSections();
  } catch (error) {
    showToast(`Load failed: ${error.message}`, true);
  }
}

function renderSections() {
  Object.entries(sectionsConfig).forEach(([key, config]) => {
    const value = originalData[key];
    if (typeof value === 'undefined') return;
    const sectionEl = createSectionEditor(key, config, value);
    sectionsContainer.appendChild(sectionEl);
  });
}

function createSectionEditor(key, config, value) {
  const section = document.createElement('section');
  section.className = 'p-4 sm:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur space-y-4';

  const header = document.createElement('div');
  header.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2';
  header.innerHTML = `
    <div>
      <p class="text-sm uppercase tracking-[0.3em] text-blue-400">${config.type}</p>
      <h3 class="text-xl font-semibold">${config.label}</h3>
      ${config.hint ? `<p class="text-xs text-slate-400 mt-1">${config.hint}</p>` : ''}
    </div>
    <div class="flex flex-wrap gap-2">
      ${config.sample ? `<button class="px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition" data-action="sample">Add sample</button>` : ''}
      <button class="px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition" data-action="reset">Reset</button>
      <button class="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-600/30" data-action="save">Save section</button>
    </div>
  `;

  const textarea = document.createElement('textarea');
  textarea.className = 'w-full min-h-[220px] text-sm bg-slate-900/60 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/60';
  textarea.value = JSON.stringify(value, null, 2);
  textarea.dataset.section = key;

  const footer = document.createElement('p');
  footer.className = 'text-xs text-slate-400';
  footer.textContent = 'Tip: Ensure valid JSON before saving. Arrays should use [] brackets.';

  section.appendChild(header);
  section.appendChild(textarea);
  section.appendChild(footer);

  header.querySelector('[data-action="save"]').addEventListener('click', () => handleSaveSection(key));
  header.querySelector('[data-action="reset"]').addEventListener('click', () => resetSection(key));
  const sampleBtn = header.querySelector('[data-action="sample"]');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => appendSample(key));
  }

  editors.set(key, { textarea, config });
  return section;
}

function resetSection(key) {
  const editor = editors.get(key);
  if (!editor) return;
  editor.textarea.value = JSON.stringify(originalData[key], null, 2);
  showToast(`${sectionsConfig[key]?.label || key} reset.`);
}

async function handleSaveSection(key) {
  const editor = editors.get(key);
  if (!editor) return;
  const parsed = parseTextareaJSON(editor.textarea, editor.config);
  if (parsed.error) return showToast(parsed.error, true);

  try {
    const res = await fetch(`/api/sections/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.value)
    });
    if (!res.ok) throw new Error('Save failed');
    const data = await res.json();
    originalData[key] = data;
    editor.textarea.value = JSON.stringify(data, null, 2);
    showToast(`${sectionsConfig[key]?.label || key} saved.`);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleSaveAll() {
  const payload = { ...originalData };
  for (const [key, editor] of editors.entries()) {
    const parsed = parseTextareaJSON(editor.textarea, editor.config);
    if (parsed.error) {
      showToast(`Section ${key}: ${parsed.error}`, true);
      return;
    }
    payload[key] = parsed.value;
  }

  try {
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save file');
    originalData = payload;
    showToast('All sections saved.');
  } catch (error) {
    showToast(error.message, true);
  }
}

function appendSample(key) {
  const editor = editors.get(key);
  const sample = sectionsConfig[key]?.sample;
  if (!editor || !sample) return;
  const parsed = parseTextareaJSON(editor.textarea, editor.config);
  if (parsed.error) return showToast(parsed.error, true);
  const next = Array.isArray(parsed.value) ? parsed.value : [];
  next.push(clone(sample));
  editor.textarea.value = JSON.stringify(next, null, 2);
  showToast(`Sample added to ${sectionsConfig[key]?.label || key}.`);
}

function parseTextareaJSON(textarea, config) {
  try {
    const value = JSON.parse(textarea.value);
    if (config.type === 'array' && !Array.isArray(value)) {
      return { error: 'Section expects an array.' };
    }
    if (config.type === 'object' && typeof value !== 'object') {
      return { error: 'Section expects an object.' };
    }
    return { value };
  } catch (error) {
    return { error: `Invalid JSON: ${error.message}` };
  }
}

function clone(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

let toastTimeout;
function showToast(message, isError = false) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = `fixed bottom-6 right-6 px-4 py-3 rounded-xl border ${
    isError ? 'bg-rose-900/90 border-rose-500/40' : 'bg-emerald-900/90 border-emerald-500/40'
  } shadow-2xl pointer-events-none opacity-0`;
  requestAnimationFrame(() => {
    toastEl.classList.add('opacity-100');
  });
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('opacity-100');
  }, 3000);
}

