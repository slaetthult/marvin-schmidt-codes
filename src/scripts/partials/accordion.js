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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="w-20 h-20">
                    <path fill="#FFF" d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
            `,
            minus: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-20 h-20">
                    <path fill="#FFF" d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" />
                </svg>
            `
        }

    },

    init(){
        accordion.setInitialAccordionState();
        accordion.addEventListener();
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

        setTimeout(() => {
            document.querySelectorAll(accordion.vars.queries.component).forEach(($accordionElement) => {
                const $contentElement = $accordionElement.querySelector(accordion.vars.queries.content);
                const expandedElement = $accordionElement.dataset.expanded === 'true';
                if(!expandedElement){
                    setTimeout(() => {
                        $contentElement.setAttribute('hidden', 'true');
                    }, 400);
                } else {
                    $contentElement.removeAttribute('hidden');
                }
            });

            setTimeout(() => {
                if(window.innerWidth >= 1024){
                    $content.style.width = expanded ? (812 + 'px') : '0';
                    $content.style.maxHeight = '';
                } else {
                    $content.style.width = '';
                    $content.style.maxHeight = expanded ? ($content.scrollHeight + 'px') : '0';
                }
            }, 20);

        }, 10);

    },

    closeSiblingsExcept($current) {
        if (!$current) return;
        const $parent = $current.parentElement;
        if (!$parent) return;

        // Only close accordion components that share the same parent (i.e., siblings)
        $parent.querySelectorAll(accordion.vars.queries.component).forEach(($item) => {
            if ($item !== $current) accordion.setAccordionState($item, false);
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

    setInitialAccordionState() {

        document.querySelectorAll(accordion.vars.queries.component).forEach(($accordion) => {
            const expanded = $accordion.dataset.expanded === 'true';
            accordion.setAccordionState($accordion, !!expanded);
        });

    }
}