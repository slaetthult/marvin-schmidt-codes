export const scrollReveal = {
    vars: {
        queries: {
            element: '*[data-scroll-reveal]'
        },
        classes: {
            reveal: 'reveal-module'
        }
    },
    init(){
        const $scrollRevealElements = document.querySelectorAll(scrollReveal.vars.queries.element);
        const io = new IntersectionObserver(es=>es.forEach(e=>{
            if(e.isIntersecting){ e.target.classList.add(scrollReveal.vars.classes.reveal); io.unobserve(e.target); }
        }),{threshold:.15});
        $scrollRevealElements.forEach(el=>io.observe(el));
    }
}