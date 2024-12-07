const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

class BlogAnimation {
    constructor() {
        this.animationFrameId = null;
        this.mousePosition = { x: 0, y: 0 };
        this.posts = $$('.post');
        this.loader = $('.loader-wrapper');
        this.init();
    }

    init() {
        this.setupLoader();
        this.setupPostAnimations();
        this.setupScrollAnimations();
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    setupLoader() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loader.style.opacity = '0';
                setTimeout(() => this.loader.style.display = 'none', 500);
            }, 1000);
        });
    }

    setupPostAnimations() {
        const observer = new IntersectionObserver(
            entries => entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.animatePostChildren(entry.target);
                    observer.unobserve(entry.target);
                }
            }),
            { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
        );

        this.posts.forEach((post, index) => {
            post.style.animationDelay = `${index * 0.1}s`;
            observer.observe(post);
        });
    }

    animatePostChildren(post) {
        const children = post.children;
        Array.from(children).forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.1}s`;
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
        });
    }

    setupScrollAnimations() {
        let lastScrollTop = 0;
        const nav = $('nav');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            nav.style.transform = `translateY(${
                scrollTop > lastScrollTop ? '-100%' : '0'
            })`;
            nav.style.transition = 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)';
            lastScrollTop = scrollTop;
        });
    }

    handleMouseMove(e) {
        this.mousePosition = { x: e.clientX, y: e.clientY };
        this.handlePostHover(e);
    }

    handlePostHover(e) {
        this.posts.forEach(post => {
            const rect = post.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                const xPercent = (x / rect.width - 0.5) * 20;
                const yPercent = (y / rect.height - 0.5) * 20;
                post.style.transform = 
                    `translateY(-8px) perspective(1000px) 
                     rotateX(${yPercent}deg) rotateY(${xPercent}deg)`;
            } else {
                post.style.transform = '';
            }
        });
    }

    handleResize = () => {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('resize', this.handleResize);
    }
}

class SmoothScroll {
    constructor() {
        this.links = $$('a[href^="#"]');
        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = $(link.getAttribute('href'));
                if (target) {
                    this.scrollToTarget(target);
                }
            });
        });
    }

    scrollToTarget(target) {
        const start = window.pageYOffset;
        const targetPosition = target.getBoundingClientRect().top + start;
        const distance = targetPosition - start;
        const duration = 1000;
        let startTime = null;

        const animation = currentTime => {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;
            const easing = progress => 1 - Math.pow(1 - progress, 4);
            
            if (progress < 1) {
                window.scrollTo(0, start + distance * easing(progress));
                requestAnimationFrame(animation);
            } else {
                window.scrollTo(0, targetPosition);
            }
        };

        requestAnimationFrame(animation);
    }
}

class ReadMoreEffect {
    constructor() {
        this.buttons = $$('.read-more');
        this.init();
    }

    init() {
        this.buttons.forEach(button => {
            button.addEventListener('mousemove', e => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                button.style.setProperty('--mouse-x', `${x}px`);
                button.style.setProperty('--mouse-y', `${y}px`);
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.removeProperty('--mouse-x');
                button.style.removeProperty('--mouse-y');
            });
        });
    }
}

class TextColorizer {
    constructor() {
        this.colors = [
            '#0066cc', '#FF9500', '#30B0C7', '#FF3B30', 
            '#5856D6', '#34C759', '#FF2D55', '#5AC8FA',
            '#007AFF', '#FF6482'
        ];
        this.excludeSelectors = [
            '.nav-link', 'button', 'input', 'textarea',
            '.read-more', '.loader', '.noise', 'code',
            'script', 'style', '.post-category'
        ];
        this.init();
    }

    init() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: node => {
                    if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                    if (this.shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach(node => {
            if (node.parentElement) {
                const wrapper = document.createElement('span');
                wrapper.className = 'text-wrapper';
                node.parentElement.insertBefore(wrapper, node);

                [...node.textContent].forEach(char => {
                    if (char === ' ') {
                        wrapper.appendChild(document.createTextNode(' '));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'hover-letter';
                        span.textContent = char;
                        this.attachHoverEvents(span);
                        wrapper.appendChild(span);
                    }
                });

                node.remove();
            }
        });
    }

    shouldSkipNode(node) {
        const parent = node.parentElement;
        if (!parent) return true;

        return this.excludeSelectors.some(selector => 
            parent.matches(selector) || parent.closest(selector)
        );
    }

    attachHoverEvents(element) {
        let originalColor = null;
        let timeoutId = null;

        element.addEventListener('mouseover', () => {
            if (!originalColor) originalColor = window.getComputedStyle(element).color;
            clearTimeout(timeoutId);
            
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            element.style.color = color;
            element.style.transform = 'translateY(-1px)';
        });

        element.addEventListener('mouseout', () => {
            element.style.transform = '';
            timeoutId = setTimeout(() => {
                element.style.color = originalColor;
            }, 150);
        });
    }
}

class TextAnimation {
    static get properties() {
        return {
            perspective: 250,
            duration: 800,
            easing: 'cubic-bezier(0.19, 1, 0.22, 1)'
        };
    }

    static createKeyframes(intensity = 1) {
        return {
            transform: [
                'translateZ(0) rotateX(0) rotateY(0)',
                `translateZ(${20 * intensity}px) rotateX(${-20 * intensity}deg) rotateY(${10 * intensity}deg)`,
                'translateZ(0) rotateX(0) rotateY(0)'
            ],
            opacity: ['1', '0.7', '1']
        };
    }

    static setupAnimation() {
        document.querySelectorAll('.hover-letter').forEach(letter => {
            letter.addEventListener('mouseenter', () => {
                const animation = letter.animate(
                    TextAnimation.createKeyframes(),
                    {
                        duration: TextAnimation.properties.duration,
                        easing: TextAnimation.properties.easing,
                        fill: 'forwards'
                    }
                );
                
                animation.onfinish = () => letter.style.transform = '';
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const colorizer = new TextColorizer();
    TextAnimation.setupAnimation();
});

class BlogModal {
    constructor() {
        this.modalHtml = `
            <div class="blog-modal">
                <div class="modal-overlay"></div>
                <div class="modal-container">
                    <div class="modal-header">
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-content"></div>
                </div>
            </div>
        `;
        this.contentTypes = {
            about: {
                title: 'About',
                content: `
                    <h1>About Me</h1>
                    <p>former toddler</p>
                `
            },
            contact: {
                title: 'Contact',
                content: `
                    <h1>Contact Me</h1>
                    <p>jaidencoleflannery@gmail.com</p>
                `
            }
        };
        this.init();
    }

    init() {
        document.body.insertAdjacentHTML('beforeend', this.modalHtml);
        this.modal = document.querySelector('.blog-modal');
        this.overlay = document.querySelector('.modal-overlay');
        this.container = document.querySelector('.modal-container');
        this.closeBtn = document.querySelector('.modal-close');
        this.content = document.querySelector('.modal-content');
        
        this.setupEventListeners();
        this.setupPostLinks();
        this.setupNavLinks();
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        this.container.addEventListener('wheel', e => e.stopPropagation());
    }

    setupNavLinks() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const type = link.textContent.toLowerCase();
                if (this.contentTypes[type]) {
                    this.openNavContent(type);
                }
            });
        });
    }

    setupPostLinks() {
        document.querySelectorAll('.post').forEach(post => {
            post.addEventListener('click', (e) => {
                if (!e.target.closest('.read-more')) {
                    const title = post.querySelector('h2').textContent;
                    const category = post.querySelector('.post-category')?.textContent || '';
                    const postbody = post.querySelector('.post-body').textContent || '';
                    this.openBlogPost(title, category, postbody);
                }
            });
        });
    }

    async openNavContent(type) {
        const content = this.contentTypes[type];
        this.content.innerHTML = this.formatContent(content);
        
        document.body.style.overflow = 'hidden';
        this.modal.classList.add('active');
        this.container.classList.add('active');

        this.processVideos();
    }

    async openBlogPost(title, category, postbody) {
        const content = await this.fetchBlogContent(title, category, postbody);
        this.content.innerHTML = this.formatContent(content);
        
        document.body.style.overflow = 'hidden';
        this.modal.classList.add('active');
        this.container.classList.add('active');

        this.processVideos();
    }

    close() {
        this.modal.classList.remove('active');
        this.container.classList.remove('active');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            this.content.innerHTML = '';
        }, 300);
    }

    async fetchBlogContent(title, category, postbody) {
        return {
            title,
            content: `
                <h1>${title}</h1>
                <span class="post-category">${category}</span>
                <div class="post-content">${postbody}</div>
            `
        };
    }

    formatContent(data) {
        return `
            <article class="blog-post">
                <div class="blog-body">
                    ${data.content}
                </div>
            </article>
        `;
    }

    processVideos() {
        this.content.querySelectorAll('.video-embed').forEach(embed => {
            const videoId = embed.dataset.youtubeId;
            if (videoId) {
                embed.innerHTML = `
                    <iframe 
                        width="100%" 
                        height="315" 
                        src="https://www.youtube.com/embed/${videoId}"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                    ></iframe>
                    <div> video </div>
                `;
            }
        });
    }
}

new BlogModal();
new BlogAnimation();
new SmoothScroll();
new ReadMoreEffect();