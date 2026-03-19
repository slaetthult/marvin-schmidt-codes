export const accordion = {
    vars: {
        queries: {
            component:              '*[data-accordion]',
            toggleButton:           '*[data-accordion-button]',
            content:                '*[data-accordion-content]',
            icon:                   '*[data-accordion-icon]',
        },
        attributes: {
            openInitially:          'data-accordion-initially-open',
        },
        icons: {
            plus: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-25 h-25 lg:w-33 lg:h-33">
                    <path fill="currentColor" d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
            `,
            minus: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-25 h-25 lg:w-33 lg:h-33">
                    <path fill="currentColor" d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" />
                </svg>
            `
        }

    },

    init(){
        accordion.setInitialAccordionState();
        accordion.addEventListener();
        accordion.addResizeListener();
    },

    addEventListener(){

        const $toggleButtons = document.querySelectorAll(accordion.vars.queries.toggleButton);

        $toggleButtons.forEach(($toggleButton) => {
            $toggleButton.addEventListener('click', (event) => {
                accordion.toggleAccordion(event);
            });
        });

    },

    setAccordionState($accordion, expanded) {
        if (!$accordion) return;

        const $content = $accordion.querySelector(accordion.vars.queries.content);
        const $icon    = $accordion.querySelector(accordion.vars.queries.icon);
        const $toggleButton    = $accordion.querySelector(accordion.vars.queries.toggleButton);

        if (!$content) return;

        if($accordion.getAttribute(accordion.vars.attributes.openInitially) === 'true'){
            expanded = true;
            $accordion.removeAttribute(accordion.vars.attributes.openInitially);
        }

        if ($icon) $icon.innerHTML = expanded ? accordion.vars.icons.minus : accordion.vars.icons.plus;
        $toggleButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');

        $accordion.dataset.expanded = expanded ? 'true' : 'false';

        const isDesktop = window.innerWidth >= 1024;

        if (expanded) {
            $content.removeAttribute('hidden');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (isDesktop) {
                        const expandedWidth = $accordion.parentElement.offsetWidth - 98 * 3;
                        $content.style.width = expandedWidth + 'px';
                        $content.style.maxHeight = '';
                    } else {
                        $content.style.width = '';
                        $content.style.maxHeight = $content.scrollHeight + 'px';
                    }
                });
            });
        } else {
            if (isDesktop) {
                $content.style.width = '0';
                $content.style.maxHeight = '';
            } else {
                $content.style.width = '';
                $content.style.maxHeight = '0';
            }
            setTimeout(() => {
                if ($accordion.dataset.expanded === 'false') {
                    $content.setAttribute('hidden', 'true');
                }
            }, 400);
        }

    },

    closeSiblingsExcept($current) {
        if (!$current) return;
        const $parent = $current.parentElement;
        if (!$parent) return;

        // Only close accordion components that share the same parent (i.e., siblings)
        $parent.querySelectorAll(accordion.vars.queries.component).forEach(($item) => {
            if ($item !== $current) setTimeout(() => accordion.setAccordionState($item, false), 2);
        });
    },

    toggleAccordion(event) {
        const $clicked = event.target;
        const $accordion = $clicked.closest(accordion.vars.queries.component);
        if (!$accordion) return;

        const isExpanded = $accordion.dataset.expanded === 'true';
        accordion.closeSiblingsExcept($accordion);
        accordion.setAccordionState($accordion, !isExpanded);
    },

    addResizeListener() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                document.querySelectorAll(accordion.vars.queries.component).forEach(($accordion) => {
                    const $content = $accordion.querySelector(accordion.vars.queries.content);
                    if (!$content || $accordion.dataset.expanded !== 'true') return;

                    if (window.innerWidth >= 1024) {
                        const expandedWidth = $accordion.parentElement.offsetWidth - 98 * 3;
                        $content.style.width = expandedWidth + 'px';
                        $content.style.maxHeight = '';
                    } else {
                        $content.style.width = '';
                        $content.style.maxHeight = $content.scrollHeight + 'px';
                    }
                });
            }, 100);
        });
    },

    setInitialAccordionState() {

        document.querySelectorAll(accordion.vars.queries.component).forEach(($accordion) => {
            const expanded = $accordion.dataset.expanded === 'true';
            accordion.setAccordionState($accordion, !!expanded);
        });

    }
}