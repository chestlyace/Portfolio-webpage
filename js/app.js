const API_URL = 'https://portfolio-webpage-gla4.onrender.com/api';
async function fetchPortfolioData() {
    try {
        const response = await fetch(`${API_URL}/portfolio`);
        const data = await response.json();
        renderProfile(data.profile);
        renderSkills(data.skills);
        renderServices(data.services);
        renderWorks(data.works);
        renderJourney(data.journey);
        renderSocials(data.socials);
    } catch (error) {
        console.error('Error fetching portfolio data:', error);
    }
}

function renderProfile(profile) {
    if (!profile) return;
    document.querySelectorAll('.profile-name').forEach(el => el.textContent = profile.display_name);
    document.querySelector('.hero-title-1').textContent = profile.title_1;
    document.querySelector('.hero-title-2').textContent = profile.title_2;
    document.querySelector('.hero-title-3').textContent = `& ${profile.title_3}`;
    document.querySelector('.hero-tagline').textContent = profile.tagline;
    document.querySelector('.hero-image').src = profile.hero_image;
    document.querySelector('.about-quote').textContent = `"${profile.about_quote}"`;
    document.querySelector('.about-text-1').innerHTML = `<span class="float-left text-7xl font-display leading-none mr-4 mt-2 text-black dark:text-white">${profile.about_text_1.charAt(0)}</span>${profile.about_text_1.slice(1)}`;
    document.querySelector('.about-text-2').textContent = profile.about_text_2;
    document.querySelector('.resume-link').href = profile.resume_url;
    document.querySelector('.contact-email').textContent = profile.email;
    document.querySelector('.contact-phone').textContent = profile.phone;
}

function renderSkills(skills) {
    const languagesContainer = document.querySelector('.skills-languages');
    const frameworksContainer = document.querySelector('.skills-frameworks');
    const toolsContainer = document.querySelector('.skills-tools');

    languagesContainer.innerHTML = '';
    frameworksContainer.innerHTML = '';
    toolsContainer.innerHTML = '';

    skills.forEach(skill => {
        const skillHtml = `
            <div class="flex flex-col items-center group">
                <div class="w-16 h-16 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm group-hover:border-primary/50 group-hover:shadow-glow transition-all duration-300">
                    ${skill.icon.startsWith('http') ? `<img src="${skill.icon}" alt="${skill.name}" class="w-8 h-8 group-hover:scale-110 transition-transform" />` : `<i class="${skill.icon} text-3xl"></i>`}
                </div>
                <span class="mt-2 text-[10px] uppercase font-bold text-slate-400 group-hover:text-primary transition-colors">${skill.name}</span>
            </div>
        `;
        if (skill.category === 'language') languagesContainer.innerHTML += skillHtml;
        else if (skill.category === 'framework') frameworksContainer.innerHTML += skillHtml;
        else if (skill.category === 'tool') toolsContainer.innerHTML += skillHtml;
    });
}

function renderServices(services) {
    const servicesContainer = document.querySelector('#services .grid');
    servicesContainer.innerHTML = '';

    services.forEach(service => {
        const itemsList = service.items.map(item => `
            <li class="flex items-center gap-2">
                <span class="text-black dark:text-white">→</span> ${item}
            </li>
        `).join('');

        servicesContainer.innerHTML += `
            <div class="group relative bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-10 rounded-3xl overflow-hidden hover:border-black dark:hover:border-white transition-all duration-300">
                <div class="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition duration-500 transform group-hover:scale-110">
                    <span class="material-icons-outlined text-9xl">${service.icon}</span>
                </div>
                <div class="relative z-10">
                    <div class="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                        <span class="material-icons-outlined text-3xl">${service.icon}</span>
                    </div>
                    <h3 class="font-display text-4xl mb-4">${service.title}</h3>
                    <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">${service.description}</p>
                    <ul class="space-y-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        ${itemsList}
                    </ul>
                </div>
            </div>
        `;
    });
}

function renderWorks(works) {
    const projectsContainer = document.getElementById('projects-section');
    const designContainer = document.getElementById('design-section').querySelector('.grid');
    const eventsContainer = document.getElementById('events-section');

    projectsContainer.innerHTML = '';
    designContainer.innerHTML = '';
    eventsContainer.innerHTML = '';

    works.forEach(work => {
        if (work.type === 'project') {
            const techHtml = work.tech_stack.map(tech => `
                <span class="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full">${tech}</span>
            `).join('');

            const liveBtn = work.is_live_url_private
                ? `<button disabled class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 rounded-xl font-semibold text-sm cursor-not-allowed">Private <span class="material-icons text-sm">lock</span></button>`
                : `<a class="flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity" href="${work.live_url}">Live Link <span class="material-icons text-sm">arrow_outward</span></a>`;

            const sourceBtn = work.is_source_url_private
                ? `<button disabled class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 rounded-xl font-semibold text-sm cursor-not-allowed">Private <span class="material-icons text-sm">lock</span></button>`
                : `<a class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" href="${work.source_url}">GitHub <span class="material-icons text-sm">code</span></a>`;

            projectsContainer.innerHTML += `
                <article class="card-hover group relative bg-white dark:bg-card-dark border border-gray-200 dark:border-glass-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-300/20 dark:hover:shadow-white/5 transition-all duration-300 flex flex-col h-full">
                    <div class="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img alt="${work.title}" class="thumbnail w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" src="${work.image_url}" />
                        <div class="absolute top-4 right-4 bg-black/70 dark:bg-white/90 text-white dark:text-black text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider">${work.category_label}</div>
                    </div>
                    <div class="p-6 md:p-8 flex flex-col flex-grow">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-2xl font-bold font-body text-gray-900 dark:text-white mb-2">${work.title}</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">${work.description}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2 mb-8 mt-auto pt-4">${techHtml}</div>
                        <div class="grid grid-cols-2 gap-4">
                            ${liveBtn}
                            ${sourceBtn}
                        </div>
                    </div>
                </article>
            `;
        } else if (work.type === 'design') {
            const designMeta = (work.design_tool || work.client_name) ? `
                <div class="mt-2 flex flex-wrap gap-2 justify-center">
                    ${work.design_tool ? `<span class="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">${work.design_tool}</span>` : ''}
                    ${work.client_name ? `<span class="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">${work.client_name}</span>` : ''}
                </div>
            ` : '';

            designContainer.innerHTML += `
                <div class="group relative overflow-hidden rounded-2xl cursor-pointer">
                    <img src="${work.image_url}" alt="${work.title}" class="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                        <span class="text-white font-display text-xl tracking-wider border-b-2 border-white pb-1">${work.title}</span>
                        ${designMeta}
                    </div>
                </div>
            `;
        } else if (work.type === 'event') {
            const highlightsHtml = work.highlights.map(h => `
                <span class="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full">${h}</span>
            `).join('');

            eventsContainer.innerHTML += `
                <article class="card-hover group relative bg-white dark:bg-card-dark border border-gray-200 dark:border-glass-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-300/20 dark:hover:shadow-white/5 transition-all duration-300 flex flex-col h-full">
                    <div class="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img alt="${work.title}" class="thumbnail w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" src="${work.image_url}" />
                        <div class="absolute top-4 right-4 bg-black/70 dark:bg-white/90 text-white dark:text-black text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider">${work.category_label}</div>
                    </div>
                    <div class="p-6 md:p-8 flex flex-col flex-grow">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-2xl font-bold font-body text-gray-900 dark:text-white mb-2">${work.title}</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">${work.description}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2 mb-8 mt-auto pt-4">${highlightsHtml}</div>
                        <div class="w-full">
                            <a class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" href="${work.source_url || '#'}">Photo Album <span class="material-icons text-sm">collections</span></a>
                        </div>
                    </div>
                </article>
            `;
        }
    });
}

function renderJourney(journey) {
    const timeline = document.querySelector('.timeline-line').parentElement;
    // Clear existing timeline items (keeping the line)
    const items = timeline.querySelectorAll('.relative.mb-12');
    items.forEach(item => item.remove());

    journey.forEach((item, index) => {
        const isEven = index % 2 === 1;
        const itemHtml = `
            <div class="relative mb-12 md:mb-20">
                <div class="flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center w-full">
                    <div class="hidden md:block md:w-5/12"></div>
                    <div class="w-full md:w-5/12 ${isEven ? 'pl-16 md:pl-8' : 'pl-16 md:pl-0 md:pr-8 text-left md:text-right'}">
                        <div class="p-6 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 shadow-lg glass-card hover:translate-y-[-4px] transition-transform duration-300">
                            <div class="flex justify-between items-start ${!isEven ? 'flex-row-reverse md:flex-row' : ''}">
                                <div class="flex items-center ${!isEven ? 'md:justify-end' : ''} gap-2 text-primary text-sm font-semibold mb-2">
                                    <span class="material-icons-round text-base">${item.type === 'work' ? 'work' : 'school'}</span>
                                    <span>${item.dates}</span>
                                </div>
                                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10">
                                    ${item.logo_url ? `<img src="${item.logo_url}" alt="${item.company}">` : '<span class="text-xs font-bold text-gray-400">LOGO</span>'}
                                </div>
                            </div>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">${item.role}</h3>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">@ ${item.company}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${item.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        timeline.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function renderSocials(socials) {
    const socialIconsContainer = document.querySelector('.flex.gap-3.text-xl');
    const contactSocialsGrid = document.querySelector('#contact .grid.grid-cols-4.gap-4');
    const footerSocials = document.querySelector('footer .flex.space-x-4');

    socialIconsContainer.innerHTML = '';
    contactSocialsGrid.innerHTML = '';
    footerSocials.innerHTML = '';

    socials.forEach(social => {
        socialIconsContainer.innerHTML += `<a class="hover:text-primary transition-colors" href="${social.url}"><i class="${social.icon}"></i></a>`;
        contactSocialsGrid.innerHTML += `
            <a class="aspect-square flex flex-col items-center justify-center rounded-xl glass-panel bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:bg-background-dark hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300" href="${social.url}">
                <i class="${social.icon} text-2xl mb-1"></i>
            </a>
        `;
        footerSocials.innerHTML += `<a class="text-gray-400 hover:text-white transition-colors" href="${social.url}"><i class="${social.icon}"></i></a>`;
    });
}

document.addEventListener('DOMContentLoaded', fetchPortfolioData);
