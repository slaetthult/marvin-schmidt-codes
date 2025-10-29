export const typingEffect = {
    vars: {
        queries: {
            element: '*[data-typing-effect]'
        },
        minDelay: 10,
        maxDelay: 250,
        observer: null
    },

    init() {
        const elements = document.querySelectorAll(this.vars.queries.element);
        if (!elements || elements.length === 0) return;

        if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
            if (!this.vars.observer) {
                this.vars.observer = new IntersectionObserver(
                    this.handleIntersect.bind(this),
                    { root: null, rootMargin: '0px', threshold: 0.2 }
                );
            }

            elements.forEach(($element) => {
                if ($element.dataset.typingProcessed === 'true' || $element.dataset.typingObserved === 'true') return;

                $element.style.visibility = 'hidden';
                $element.dataset.typingObserved = 'true';
                this.vars.observer.observe($element);
            });
        } else {
            elements.forEach(($element) => this.startTypingEffect($element));
        }
    },

    find() {
        this.init();
    },

    handleIntersect(entries, observer) {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const $element = entry.target;
            this.startTypingEffect($element);
            observer.unobserve($element);
        });
    },

    startTypingEffect($element) {
        if (!$element || $element.dataset.typingProcessed === 'true' || $element.dataset.typingStarted === 'true') {
            return;
        }

        const text = $element.textContent;
        $element.textContent = '';
        $element.style.visibility = 'visible';
        $element.dataset.typingStarted = 'true';

        let currentChar = 0;

        const type = () => {
            if (currentChar < text.length) {
                $element.textContent += text[currentChar];
                currentChar++;
                const randomDelay = Math.floor(
                    Math.random() * (this.vars.maxDelay - this.vars.minDelay + 1)
                ) + this.vars.minDelay;
                setTimeout(type, randomDelay);
            } else {
                $element.dataset.typingProcessed = 'true';
            }
        };

        setTimeout(type, 200);
    }
};