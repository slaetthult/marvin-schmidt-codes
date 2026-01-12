export const heroIntro = {
    vars: {
        queries: {
            component: '*[data-hero-intro]'
        }
    },
    init(){

        const $module = document.querySelector(heroIntro.vars.queries.component);
        const $anchorLinks = $module.querySelectorAll('a');

        for(const $anchorLink of $anchorLinks){
            $anchorLink.addEventListener('click', (event) => {
                heroIntro.linkSmoothScroll(event);
            });
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
};