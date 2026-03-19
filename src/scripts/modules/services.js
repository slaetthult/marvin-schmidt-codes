export const services = {

    _cache: {
        section: null,
        slides: null,
        dots: null,
        counter: null,
        currentIndex: -1,
        totalSlides: 0,
    },

    init() {
        this._cacheDOMElements();
        if (!this._cache.section) return;

        this._initDotClickHandlers();

        // Set initial state
        this._onScroll();

        window.addEventListener('scroll', () => this._onScroll(), { passive: true });
    },

    _cacheDOMElements() {
        this._cache.section = document.querySelector('[data-services]');
        if (!this._cache.section) return;

        this._cache.slides = this._cache.section.querySelectorAll('[data-services-slide]');
        this._cache.dots   = this._cache.section.querySelectorAll('[data-services-dot]');
        this._cache.counter = this._cache.section.querySelector('[data-services-counter]');
        this._cache.totalSlides = this._cache.slides.length;
    },

    _onScroll() {
        const { section, totalSlides } = this._cache;
        const scrolled = -section.getBoundingClientRect().top;

        const index = scrolled < 0
            ? 0
            : Math.min(Math.floor(scrolled / (window.innerHeight * 1)), totalSlides - 1);

        this._setActiveSlide(index);
    },

    _setActiveSlide(index) {
        if (index === this._cache.currentIndex) return;
        this._cache.currentIndex = index;

        this._cache.slides.forEach((slide, i) => {
            slide.classList.toggle('is-active', i === index);
        });

        this._cache.dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === index);
        });

        if (this._cache.counter) {
            const current = String(index + 1).padStart(2, '0');
            const total   = String(this._cache.totalSlides).padStart(2, '0');
            this._cache.counter.innerHTML = `${current} <span class="hidden 3xl:inline-block"> / ${total}</span>`;
        }
    },

    _initDotClickHandlers() {
        this._cache.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const sectionTop = this._cache.section.getBoundingClientRect().top + window.scrollY;
                const targetY = sectionTop + index * window.innerHeight * 1;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            });
        });
    },

    destroy() {
        window.removeEventListener('scroll', this._onScroll);
        this._cache = {
            section: null,
            slides: null,
            dots: null,
            counter: null,
            currentIndex: -1,
            totalSlides: 0,
        };
    }
};