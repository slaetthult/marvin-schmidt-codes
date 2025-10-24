import { isInViewport } from '@scripts/utils/is-in-viewport';
import {isAtTopOfViewport} from '@scripts/utils/is-at-top-of-viewport.js';

export const anchorNavigation = {
    vars: {
        queries: {
            component: '*[data-anchor-navigation]'
        },
        isAtTopOfViewportOffset: 100
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

        let sectionIds = [];

        for(const $anchorLink of $anchorLinks){
            sectionIds.push($anchorLink.getAttribute('href').replace('#', ''));
        }

        let $sections = document.querySelectorAll(`#${sectionIds.join(', #')}`);

        for(const $section of $sections){

            const sectionId = $section.getAttribute('id');
            const $anchorLink = $anchorNavigation.querySelector(`a[href="#${sectionId}"]`);

            if(isAtTopOfViewport($section, anchorNavigation.vars.isAtTopOfViewportOffset)){
                $anchorLink.classList.add('active');
            } else {
                $anchorLink.classList.remove('active');
            }
        }

    },
    linkSmoothScroll(event = null){
        if(!event){
            return false;
        }
        event.preventDefault();
        const targetId = event.target.getAttribute('href');
        const $targetElement = document.querySelector(targetId);

        if(!$targetElement){
            return false;
        }

        window.scrollTo({
            top: $targetElement.offsetTop - 100,
            behavior: "smooth"
        });
    }
}