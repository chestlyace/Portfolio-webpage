const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://portfolio-webpage-gla4.onrender.com/api';
let designWorks = [];
let activeDesignIndex = 0;

function setMetaContent(selector, content) {
    const element = document.querySelector(selector);
    if (element && content) {
        element.setAttribute('content', content);
    }
}

function optimizeCloudinaryImage(url, options = {}) {
    if (!url || !url.includes('/image/upload/')) {
        return url;
    }

    const transforms = [
        'f_auto',
        'q_auto:good',
    ];

    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.crop) transforms.push(`c_${options.crop}`);

    return url.replace('/image/upload/', `/image/upload/${transforms.join(',')}/`);
}

function updateSeo(profile, socials) {
    if (!profile) return;

    const name = profile.display_name || 'Chestly Ace';
    const alternateNames = ['Amahndong Chestly', 'Chestly Amahndong'];
    const roleParts = [profile.title_1, profile.title_2, profile.title_3].filter(Boolean);
    const roleText = roleParts.length
        ? roleParts.join(', ').replace(/,([^,]*)$/, ' &$1')
        : 'Software Developer, Graphic Designer & Photographer';
    const tagline = profile.tagline || 'Software developer, graphic designer, and photographer.';
    const aboutText = [profile.about_text_1, profile.about_text_2].filter(Boolean).join(' ');
    const description = `${name}, also known as Amahndong Chestly, is a ${roleText}. ${tagline} ${aboutText}`.trim().slice(0, 300);
    const pageTitle = `${name} (Amahndong Chestly) | ${roleText}`;
    const imageUrl = optimizeCloudinaryImage(profile.hero_image, { width: 1200, height: 1600, crop: 'limit' })
        || 'https://chestlyace.online/hero-optimized.webp';
    const canonicalUrl = 'https://chestlyace.online/';

    document.title = pageTitle;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', pageTitle);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:image"]', imageUrl);
    setMetaContent('meta[property="og:image:alt"]', `Portrait of ${name}`);
    setMetaContent('meta[name="twitter:title"]', pageTitle);
    setMetaContent('meta[name="twitter:description"]', description);
    setMetaContent('meta[name="twitter:image"]', imageUrl);

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
        canonicalLink.setAttribute('href', canonicalUrl);
    }

    const socialUrls = Array.isArray(socials)
        ? socials.map((social) => social.url).filter(Boolean)
        : [];
    const faqEntities = Array.from(document.querySelectorAll('#faq details')).map((item) => ({
        '@type': 'Question',
        name: item.querySelector('summary')?.textContent?.trim(),
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.querySelector('p')?.textContent?.trim(),
        },
    })).filter((item) => item.name && item.acceptedAnswer.text);

    const structuredData = document.getElementById('structured-data');
    if (structuredData) {
        structuredData.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'WebSite',
                    '@id': `${canonicalUrl}#website`,
                    url: canonicalUrl,
                    name: `${name} Portfolio`,
                    description,
                },
                {
                    '@type': 'Person',
                    '@id': `${canonicalUrl}#person`,
                    name,
                    alternateName: alternateNames,
                    url: canonicalUrl,
                    image: imageUrl,
                    jobTitle: roleParts,
                    description,
                    email: profile.email ? `mailto:${profile.email}` : undefined,
                    telephone: profile.phone || undefined,
                    sameAs: socialUrls.length ? socialUrls : [canonicalUrl],
                    knowsAbout: [
                        'Web development',
                        'Frontend development',
                        'Backend development',
                        'Graphic design',
                        'Brand identity design',
                        'Photography',
                    ],
                },
                {
                    '@type': 'ItemList',
                    '@id': `${canonicalUrl}#services`,
                    name: 'Creative and technical services by Chestly Ace',
                    itemListElement: [
                        {
                            '@type': 'Service',
                            position: 1,
                            name: 'Software Development',
                            url: `${canonicalUrl}software-development.html`,
                        },
                        {
                            '@type': 'Service',
                            position: 2,
                            name: 'Graphic Design',
                            url: `${canonicalUrl}graphic-design.html`,
                        },
                        {
                            '@type': 'Service',
                            position: 3,
                            name: 'Photography',
                            url: `${canonicalUrl}photography.html`,
                        },
                    ],
                },
                ...(faqEntities.length ? [{
                    '@type': 'FAQPage',
                    '@id': `${canonicalUrl}#faq`,
                    mainEntity: faqEntities,
                }] : []),
            ],
        });
    }
}

function getServiceLink(serviceTitle) {
    const normalizedTitle = (serviceTitle || '').toLowerCase();
    if (normalizedTitle.includes('software')) return 'software-development.html';
    if (normalizedTitle.includes('design')) return 'graphic-design.html';
    if (normalizedTitle.includes('photo')) return 'photography.html';
    return '#contact';
}

function getDesignMetaText(work) {
    return [work.design_tool, work.client_name].filter(Boolean).join(' • ') || 'Design gallery item';
}

function updateLightboxContent(index) {
    if (!designWorks.length) return;

    activeDesignIndex = (index + designWorks.length) % designWorks.length;
    const activeWork = designWorks[activeDesignIndex];
    const optimizedImage = optimizeCloudinaryImage(activeWork.image_url, {
        width: 1600,
        height: 2000,
        crop: 'limit',
    }) || activeWork.image_url;

    document.getElementById('lightbox-image').src = optimizedImage;
    document.getElementById('lightbox-image').alt = `${activeWork.title} design preview`;
    document.getElementById('lightbox-title').textContent = activeWork.title;
    document.getElementById('lightbox-meta').textContent = getDesignMetaText(activeWork);
    document.getElementById('lightbox-counter').textContent = `${activeDesignIndex + 1} / ${designWorks.length}`;
}

function openDesignLightbox(index) {
    if (!designWorks.length) return;

    const lightbox = document.getElementById('design-lightbox');
    lightbox.classList.remove('hidden');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    updateLightboxContent(index);
}

function closeDesignLightbox() {
    const lightbox = document.getElementById('design-lightbox');
    lightbox.classList.add('hidden');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
}

function showNextDesign(step) {
    if (!designWorks.length) return;
    updateLightboxContent(activeDesignIndex + step);
}

function setupDesignLightbox() {
    const lightbox = document.getElementById('design-lightbox');
    const closeBtn = document.getElementById('lightbox-close');
    const backdropCloseBtn = document.getElementById('lightbox-backdrop-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const prevMobileBtn = document.getElementById('lightbox-prev-mobile');
    const nextMobileBtn = document.getElementById('lightbox-next-mobile');
    const stage = document.getElementById('lightbox-stage');

    if (!lightbox || lightbox.dataset.ready === 'true') return;

    closeBtn.addEventListener('click', closeDesignLightbox);
    backdropCloseBtn.addEventListener('click', closeDesignLightbox);
    prevBtn.addEventListener('click', () => showNextDesign(-1));
    nextBtn.addEventListener('click', () => showNextDesign(1));
    prevMobileBtn.addEventListener('click', () => showNextDesign(-1));
    nextMobileBtn.addEventListener('click', () => showNextDesign(1));

    document.addEventListener('keydown', (event) => {
        if (lightbox.classList.contains('hidden')) return;

        if (event.key === 'Escape') closeDesignLightbox();
        if (event.key === 'ArrowLeft') showNextDesign(-1);
        if (event.key === 'ArrowRight') showNextDesign(1);
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;

    stage.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;
        touchActive = true;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener('touchend', (event) => {
        if (!touchActive || event.changedTouches.length !== 1) return;

        const deltaX = event.changedTouches[0].clientX - touchStartX;
        const deltaY = event.changedTouches[0].clientY - touchStartY;
        const horizontalDistance = Math.abs(deltaX);
        const verticalDistance = Math.abs(deltaY);
        const swipeThreshold = 48;

        touchActive = false;

        if (horizontalDistance < swipeThreshold || horizontalDistance <= verticalDistance) {
            return;
        }

        if (deltaX < 0) {
            showNextDesign(1);
        } else {
            showNextDesign(-1);
        }
    }, { passive: true });

    stage.addEventListener('touchcancel', () => {
        touchActive = false;
    }, { passive: true });

    lightbox.dataset.ready = 'true';
}

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
        updateSeo(data.profile, data.socials);
        setupDesignLightbox();
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
    document.querySelector('.hero-image').src = optimizeCloudinaryImage(profile.hero_image, {
        width: 1200,
        height: 1600,
        crop: 'limit',
    }) || 'hero-optimized.webp';
    document.querySelector('.about-quote').textContent = `"${profile.about_quote}"`;
    document.querySelector('.about-text-1').innerHTML = `<span class="float-left text-7xl font-display leading-none mr-4 mt-2 text-black dark:text-white">${profile.about_text_1.charAt(0)}</span>${profile.about_text_1.slice(1)}`;
    document.querySelector('.about-text-2').textContent = profile.about_text_2;
    document.querySelector('.resume-link').href = profile.resume_url;
    document.querySelector('.contact-email').textContent = profile.email;
    document.querySelector('.contact-phone').textContent = profile.phone;
    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
        link.href = `mailto:${profile.email}`;
    });
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
        link.href = `tel:${profile.phone.replace(/\s+/g, '')}`;
    });
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
                    ${skill.icon.startsWith('http') ? `<img src="${skill.icon}" alt="${skill.name} logo" loading="lazy" decoding="async" class="w-8 h-8 group-hover:scale-110 transition-transform" />` : `<i class="${skill.icon} text-3xl" aria-hidden="true"></i>`}
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
        const serviceLink = getServiceLink(service.title);

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
                    <a class="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white hover:text-primary transition-colors"
                        href="${serviceLink}">
                        Learn More
                        <span class="material-icons-outlined text-base">arrow_forward</span>
                    </a>
                </div>
            </div>
        `;
    });
}

function renderWorks(works) {
    const projectsContainer = document.getElementById('projects-section');
    const designContainer = document.getElementById('design-section').querySelector('.masonry-gallery');
    const eventsContainer = document.getElementById('events-section');
    designWorks = works.filter((work) => work.type === 'design');

    projectsContainer.innerHTML = '';
    designContainer.innerHTML = '';
    eventsContainer.innerHTML = '';

    works.forEach(work => {
        const optimizedWorkImage = optimizeCloudinaryImage(work.image_url, {
            width: work.type === 'design' ? 900 : 1200,
            height: work.type === 'design' ? 900 : 900,
            crop: 'limit',
        }) || work.image_url;

        if (work.type === 'project') {
            const techHtml = work.tech_stack.map(tech => `
                <span class="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full">${tech}</span>
            `).join('');

            const liveBtn = work.is_live_url_private
                ? `<button disabled class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 rounded-xl font-semibold text-sm cursor-not-allowed">Private <span class="material-icons text-sm">lock</span></button>`
                : `<a class="flex items-center justify-center gap-2 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity" href="${work.live_url}" target="_blank" rel="noopener noreferrer">Live Link <span class="material-icons text-sm">arrow_outward</span></a>`;

            const sourceBtn = work.is_source_url_private
                ? `<button disabled class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 rounded-xl font-semibold text-sm cursor-not-allowed">Private <span class="material-icons text-sm">lock</span></button>`
                : `<a class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" href="${work.source_url}" target="_blank" rel="noopener noreferrer">GitHub <span class="material-icons text-sm">code</span></a>`;

            projectsContainer.innerHTML += `
                <article class="card-hover group relative bg-white dark:bg-card-dark border border-gray-200 dark:border-glass-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-300/20 dark:hover:shadow-white/5 transition-all duration-300 flex flex-col h-full">
                    <div class="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img alt="${work.title} project preview" loading="lazy" decoding="async" class="thumbnail w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" src="${optimizedWorkImage}" />
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
            const designIndex = designWorks.findIndex((item) => item.id === work.id);
            const designMeta = (work.design_tool || work.client_name) ? `
                <div class="mt-2 flex flex-wrap gap-2 justify-center">
                    ${work.design_tool ? `<span class="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">${work.design_tool}</span>` : ''}
                    ${work.client_name ? `<span class="text-[10px] uppercase font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">${work.client_name}</span>` : ''}
                </div>
            ` : '';

            designContainer.innerHTML += `
                <article class="masonry-item group relative overflow-hidden rounded-2xl cursor-pointer bg-gray-100 dark:bg-white/5"
                    role="button"
                    tabindex="0"
                    aria-label="Open ${work.title} preview"
                    data-design-index="${designIndex}">
                    <img src="${optimizedWorkImage}" alt="${work.title} design preview" loading="lazy" decoding="async" class="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]" />
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                        <span class="text-white font-display text-xl tracking-wider border-b-2 border-white pb-1">${work.title}</span>
                        ${designMeta}
                    </div>
                </article>
            `;
        } else if (work.type === 'event') {
            const highlightsHtml = work.highlights.map(h => `
                <span class="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full">${h}</span>
            `).join('');

            eventsContainer.innerHTML += `
                <article class="card-hover group relative bg-white dark:bg-card-dark border border-gray-200 dark:border-glass-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gray-300/20 dark:hover:shadow-white/5 transition-all duration-300 flex flex-col h-full">
                    <div class="relative h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img alt="${work.title} event gallery cover" loading="lazy" decoding="async" class="thumbnail w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" src="${optimizedWorkImage}" />
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
                            <a class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" href="${work.source_url || '#'}" target="_blank" rel="noopener noreferrer">Photo Album <span class="material-icons text-sm">collections</span></a>
                        </div>
                    </div>
                </article>
            `;
        }
    });

    designContainer.querySelectorAll('[data-design-index]').forEach((item) => {
        item.addEventListener('click', () => openDesignLightbox(Number(item.dataset.designIndex)));
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDesignLightbox(Number(item.dataset.designIndex));
            }
        });
    });
}

function renderJourney(journey) {
    const timeline = document.querySelector('.timeline-line').parentElement;
    // Clear existing timeline items (keeping the line)
    const items = timeline.querySelectorAll('.relative.mb-12');
    items.forEach(item => item.remove());

    journey.forEach((item, index) => {
        const isEven = index % 2 === 1;
        const optimizedLogoUrl = optimizeCloudinaryImage(item.logo_url, {
            width: 120,
            height: 120,
            crop: 'limit',
        }) || item.logo_url;
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
                                    ${optimizedLogoUrl ? `<img src="${optimizedLogoUrl}" alt="${item.company} logo" loading="lazy" decoding="async">` : '<span class="text-xs font-bold text-gray-400">LOGO</span>'}
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
        const socialName = social.platform || social.name || 'Social profile';
        socialIconsContainer.innerHTML += `<a class="hover:text-primary transition-colors" href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${socialName}"><i class="${social.icon}" aria-hidden="true"></i></a>`;
        contactSocialsGrid.innerHTML += `
            <a class="aspect-square flex flex-col items-center justify-center rounded-xl glass-panel bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:bg-background-dark hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300" href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${socialName}">
                <i class="${social.icon} text-2xl mb-1" aria-hidden="true"></i>
            </a>
        `;
        footerSocials.innerHTML += `<a class="text-gray-400 hover:text-white transition-colors" href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${socialName}"><i class="${social.icon}" aria-hidden="true"></i></a>`;
    });
}

document.addEventListener('DOMContentLoaded', fetchPortfolioData);
