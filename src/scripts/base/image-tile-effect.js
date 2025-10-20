export const imageTileEffect = {
    vars: {
        element: '*[data-image-tilt-effect]'
    },
    init(){

        const $elements = document.querySelectorAll(imageTileEffect.vars.element);

        for(const $element of $elements){
            const image = $element.querySelector('img');

            $element.addEventListener('mousemove', (e) => {
                const rect = $element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Increased rotation intensity (25 degrees)
                const rotateX = ((y - centerY) / centerY) * 25;
                const rotateY = ((x - centerX) / centerX) * 25;

                image.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
            });

            $element.addEventListener('mouseleave', () => {
                image.style.transform = `rotateX(0deg) rotateY(0deg)`;
            });

            $element.addEventListener('mouseleave', () => {
                image.style.transform = `rotateX(0deg) rotateY(0deg)`;
            });

            $element.addEventListener('mouseenter', () => {
                image.style.transition = 'transform 0.15s ease';
            });

            $element.addEventListener('mouseleave', () => {
                image.style.transition = 'transform 0.5s ease';
            });

            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', (event) => {
                    const beta = event.beta || 0;  // front-back tilt [-180,180]
                    const gamma = event.gamma || 0; // left-right tilt [-90,90]

                    // adjust intensity
                    const rotateX = beta / 4;
                    const rotateY = gamma / 4;

                    image.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
                });
            }
        }
        
    }
};