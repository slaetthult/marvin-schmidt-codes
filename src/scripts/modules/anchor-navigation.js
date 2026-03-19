import { isInViewport } from '@scripts/utils/is-in-viewport';
import {isAtTopOfViewport} from '@scripts/utils/is-at-top-of-viewport.js';

export const anchorNavigation = {
    vars: {
        queries: {
            component: '*[data-anchor-navigation]'
        },
        isAtTopOfViewportOffset: 250
    },
    init(){
        anchorNavigation.addEventTrigger();
        anchorNavigation.scrollSpy();
    },
    addEventTrigger() {

        const $anchorNavigation = document.querySelector(anchorNavigation.vars.queries.component);
        const $anchorLinks = $anchorNavigation.querySelectorAll('a');

        const observer = new IntersectionObserver(([e]) => {
            anchorNavigation.toggleIsStickyStyles($anchorNavigation, e);
        }, { threshold: [1] });
        observer.observe($anchorNavigation);

        document.addEventListener('scroll', () => {
            anchorNavigation.scrollSpy();
        });

        for(const $anchorLink of $anchorLinks){
            $anchorLink.addEventListener('click', (event) => {
                anchorNavigation.linkSmoothScroll(event);
            });
        }

    },
    toggleIsStickyStyles($anchorNavigation, e){

    },
    scrollSpy(){
        const $anchorNavigation = document.querySelector(anchorNavigation.vars.queries.component);
        const $anchorLinks = $anchorNavigation.querySelectorAll('a');
        const offset = anchorNavigation.vars.isAtTopOfViewportOffset;

        let sectionIds = [];

        for(const $anchorLink of $anchorLinks){
            sectionIds.push($anchorLink.getAttribute('href').replace('#', ''));
        }

        let $sections = document.querySelectorAll(`#${sectionIds.join(', #')}`);

        // Find the single most relevant section: among all sections whose top
        // is at or above the offset, pick the one closest to it (highest rect.top).
        // This prevents two sections being active simultaneously when negative
        // margins cause overlap.
        let activeSection = null;
        let bestTop = -Infinity;

        for(const $section of $sections){
            const checkEl = $section.dataset.anchorCheckEl
                ? ($section.querySelector($section.dataset.anchorCheckEl) ?? $section)
                : $section;
            const checkOffset = $section.dataset.anchorCheckEl ? 0 : offset;
            const rect = checkEl.getBoundingClientRect();
            if(rect.top <= checkOffset && rect.bottom >= 0){
                if(rect.top > bestTop){
                    bestTop = rect.top;
                    activeSection = $section;
                }
            }
        }

        for(const $section of $sections){
            const sectionId = $section.getAttribute('id');
            const $anchorLink = $anchorNavigation.querySelector(`a[href="#${sectionId}"]`);

            if($section === activeSection){
                $anchorLink.classList.add('active');
                anchorNavigation.centerActiveLink($anchorNavigation.querySelector('ol'), $anchorLink);
            } else {
                $anchorLink.classList.remove('active');
            }
        }

    },
    centerActiveLink($container, $activeItem) {
        if (!$activeItem || !$container) return;

        const containerWidth = $container.offsetWidth;
        const itemOffsetLeft = $activeItem.offsetLeft;
        const itemWidth = $activeItem.offsetWidth;

        const scrollTarget = itemOffsetLeft - (containerWidth / 2) + (itemWidth / 2);

        $container.scrollTo({
            left: scrollTarget,
            behavior: 'smooth'
        });
    },
    linkSmoothScroll(event = null){
        if(!event){
            return false;
        }
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute('href');
        const $targetElement = document.querySelector(targetId);

        if(!$targetElement){
            return false;
        }

        let scrollTop;
        if($targetElement.dataset.anchorCheckEl){
            scrollTop = $targetElement.getBoundingClientRect().top + window.scrollY + window.innerHeight - 1;
        } else {
            scrollTop = $targetElement.offsetTop - 100;
        }

        window.scrollTo({
            top: scrollTop,
            behavior: "smooth"
        });
    }
}