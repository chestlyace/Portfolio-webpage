// Configuration
const API_URL = 'https://portfolio-webpage-gla4.onrender.com/api';
let token = localStorage.getItem('adminToken');
let allWorks = [];
let allJourney = [];

// Initial state
if (token) {
    showDashboard();
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.token) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            showDashboard();
        } else {
            alert('Invalid password');
        }
    } catch (err) {
        console.error(err);
        alert('Login failed');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.reload();
});

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    fetchData();
}

function showTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event) {
        event.currentTarget.classList.add('active');
    }
}

async function fetchData() {
    try {
        const res = await fetch(`${API_URL}/portfolio`);
        const data = await res.json();
        populateProfile(data.profile);

        allWorks = data.works;
        renderWorksList(allWorks);

        allJourney = data.journey;
        renderJourneyList(allJourney);

        renderSkillsList(data.skills);
    } catch (err) {
        console.error(err);
    }
}

function populateProfile(profile) {
    if (!profile) return;
    const form = document.getElementById('profile-form');
    Object.keys(profile).forEach(key => {
        if (form.elements[key]) {
            form.elements[key].value = profile[key] || '';
        }
    });
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    await saveProfile(data);
});

async function saveProfile(data) {
    try {
        const res = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (res.ok) alert('Profile updated!');
    } catch (err) {
        console.error(err);
    }
}

async function uploadFile(input, fieldName) {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (data.url) {
            await saveProfile({ [fieldName]: data.url });
            alert(`${fieldName} updated!`);
        }
    } catch (err) {
        console.error(err);
    }
}

// Works Management
function renderWorksList(works) {
    const container = document.getElementById('works-list');
    container.innerHTML = '';
    works.forEach(work => {
        const div = document.createElement('div');
        div.className = 'glass p-4 rounded-xl flex justify-between items-center';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${work.image_url}" class="w-12 h-12 object-cover rounded-lg">
                <div>
                    <h4 class="font-bold">${work.title}</h4>
                    <span class="text-[10px] uppercase text-gray-400">${work.type} | ${work.category_label || ''}</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="edit-work-btn text-blue-400 hover:text-blue-300 text-sm font-bold uppercase">Edit</button>
                <button class="delete-work-btn text-red-400 hover:text-red-300 text-sm font-bold uppercase">Delete</button>
            </div>
        `;
        div.querySelector('.edit-work-btn').onclick = () => editWork(work.id);
        div.querySelector('.delete-work-btn').onclick = () => deleteWork(work.id);
        container.appendChild(div);
    });
}

function openWorkModal(work = null) {
    const form = document.getElementById('work-form');
    form.reset();
    form.elements.id.value = '';
    document.getElementById('modal-title').textContent = work ? 'Edit Work' : 'Add New Work';
    if (work) {
        Object.keys(work).forEach(key => {
            if (form.elements[key]) {
                if (form.elements[key].type === 'checkbox') {
                    form.elements[key].checked = !!work[key];
                } else {
                    form.elements[key].value = work[key] || '';
                }
            }
        });
        if (work.type === 'project' && work.tech_stack) form.elements.tech_stack_input.value = Array.isArray(work.tech_stack) ? work.tech_stack.join(', ') : work.tech_stack;
        if (work.type === 'event' && work.highlights) form.elements.tech_stack_input.value = Array.isArray(work.highlights) ? work.highlights.join(', ') : work.highlights;
    }

    updateWorkFormVisibility();
    document.getElementById('work-modal').classList.remove('hidden');
}

function updateWorkFormVisibility() {
    const form = document.getElementById('work-form');
    const type = form.elements.type.value;

    const designFields = document.getElementById('design-fields');
    const techStackGroup = document.getElementById('tech-stack-group');
    const techStackLabel = document.getElementById('tech-stack-label');
    const liveUrlGroup = document.getElementById('live-url-group');
    const sourceUrlLabel = document.getElementById('source-url-label');
    const livePrivateGroup = document.getElementById('live-private-group');
    const sourcePrivateGroup = document.getElementById('source-private-group');

    // Default visibility
    designFields.classList.add('hidden');
    techStackGroup.classList.remove('hidden');
    liveUrlGroup.classList.remove('hidden');
    livePrivateGroup.classList.remove('hidden');
    sourcePrivateGroup.classList.remove('hidden');
    sourceUrlLabel.textContent = 'Source URL';

    if (type === 'project') {
        techStackLabel.textContent = 'Tech Stack (Comma separated)';
    } else if (type === 'design') {
        designFields.classList.remove('hidden');
        techStackGroup.classList.add('hidden');
        liveUrlGroup.classList.add('hidden');
        sourceUrlLabel.textContent = 'Design URL (Optional)';
        sourcePrivateGroup.classList.add('hidden');
    } else if (type === 'event') {
        techStackLabel.textContent = 'Highlights (Comma separated)';
        liveUrlGroup.classList.add('hidden');
        sourceUrlLabel.textContent = 'Album Link';
        sourcePrivateGroup.classList.add('hidden');
    }
}

document.querySelector('select[name="type"]').addEventListener('change', updateWorkFormVisibility);

function editWork(id) {
    const work = allWorks.find(w => w.id === id);
    if (work) openWorkModal(work);
}

document.getElementById('work-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');

    // Handle checkboxes (they are not included in FormData if not checked)
    const isLivePrivate = e.target.elements.is_live_url_private.checked;
    const isSourcePrivate = e.target.elements.is_source_url_private.checked;
    formData.set('is_live_url_private', isLivePrivate);
    formData.set('is_source_url_private', isSourcePrivate);

    // Handle tech stack / highlights
    const itemsInput = formData.get('tech_stack_input');
    const items = itemsInput ? itemsInput.split(',').map(s => s.trim()).filter(s => s !== '') : [];

    if (formData.get('type') === 'project') {
        formData.set('tech_stack', JSON.stringify(items));
        formData.set('highlights', JSON.stringify([]));
    } else if (formData.get('type') === 'event') {
        formData.set('highlights', JSON.stringify(items));
        formData.set('tech_stack', JSON.stringify([]));
    } else {
        formData.set('tech_stack', JSON.stringify([]));
        formData.set('highlights', JSON.stringify([]));
    }

    formData.delete('tech_stack_input');

    const url = id ? `${API_URL}/works/${id}` : `${API_URL}/works`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            closeModal('work-modal');
            fetchData();
        }
    } catch (err) {
        console.error(err);
    }
});

async function deleteWork(id) {
    if (!confirm('Are you sure?')) return;
    await fetch(`${API_URL}/works/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
}

// Journey Management
function renderJourneyList(journey) {
    const container = document.getElementById('journey-list');
    container.innerHTML = '';
    journey.forEach(item => {
        const div = document.createElement('div');
        div.className = 'glass p-4 rounded-xl flex justify-between items-center';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                    ${item.logo_url ? `<img src="${item.logo_url}" class="w-full h-full object-cover">` : '<span class="material-icons-outlined text-gray-500">business</span>'}
                </div>
                <div>
                    <h4 class="font-bold">${item.role}</h4>
                    <span class="text-xs text-gray-400">${item.company} | ${item.dates}</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="edit-journey-btn text-blue-400 hover:text-blue-300 text-sm font-bold uppercase">Edit</button>
                <button class="delete-journey-btn text-red-400 hover:text-red-300 text-sm font-bold uppercase">Delete</button>
            </div>
        `;
        div.querySelector('.edit-journey-btn').onclick = () => editJourney(item.id);
        div.querySelector('.delete-journey-btn').onclick = () => deleteJourney(item.id);
        container.appendChild(div);
    });
}

function openJourneyModal(item = null) {
    const form = document.getElementById('journey-form');
    form.reset();
    form.elements.id.value = '';
    document.getElementById('journey-modal-title').textContent = item ? 'Edit Journey' : 'Add New Journey';
    if (item) {
        Object.keys(item).forEach(key => {
            if (form.elements[key]) form.elements[key].value = item[key] || '';
        });
    }
    document.getElementById('journey-modal').classList.remove('hidden');
}

function editJourney(id) {
    const item = allJourney.find(j => j.id === id);
    if (item) openJourneyModal(item);
}

document.getElementById('journey-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const data = Object.fromEntries(formData.entries());
    delete data.id;

    const url = id ? `${API_URL}/journey/${id}` : `${API_URL}/journey`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            closeModal('journey-modal');
            fetchData();
        }
    } catch (err) {
        console.error(err);
    }
});

async function deleteJourney(id) {
    if (!confirm('Are you sure?')) return;
    await fetch(`${API_URL}/journey/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
}

// Skills Management
function renderSkillsList(skills) {
    const container = document.getElementById('skills-list');
    container.innerHTML = '';
    skills.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'glass p-3 rounded-xl flex justify-between items-center';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 uppercase">${skill.category.charAt(0)}</span>
                <span class="font-medium">${skill.name}</span>
            </div>
            <button class="delete-skill-btn material-icons-outlined text-red-400 text-lg">delete</button>
        `;
        div.querySelector('.delete-skill-btn').onclick = () => deleteSkill(skill.id);
        container.appendChild(div);
    });
}

document.getElementById('skill-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('skill-name').value;
    const icon = document.getElementById('skill-icon').value;
    const category = document.getElementById('skill-category').value;

    await fetch(`${API_URL}/skills`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, icon, category })
    });
    e.target.reset();
    fetchData();
});

async function deleteSkill(id) {
    await fetch(`${API_URL}/skills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}
