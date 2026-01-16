export const countUpNumber = {
    vars: {
        attributes: {
            component:                  'data-count-up-number',
        },
        values: {
            duration:                   3500
        }
    },
    init(){
        const counters = document.querySelectorAll(`*[${countUpNumber.vars.attributes.component}]`);

        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const target = +el.getAttribute(countUpNumber.vars.attributes.component);
                        const duration = countUpNumber.vars.values.duration; // ms
                        const frameRate = 1000 / 60; // 60 fps
                        const totalFrames = Math.round(duration / frameRate);
                        let frame = 0;

                        const counter = setInterval(() => {
                            frame++;
                            const progress = frame / totalFrames;
                            const value = Math.floor(target * easeOutCubic(progress));
                            el.textContent = value.toLocaleString();

                            if (frame === totalFrames) {
                                clearInterval(counter);
                                el.textContent = target.toLocaleString();
                            }
                        }, frameRate);

                        observer.unobserve(el);
                    }
                });
            },
            { threshold: 0.3 }
        );

        counters.forEach(el => observer.observe(el));

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
    }
};