export const imageParallax = {
    vars: {
        queries: {
            element: '*[data-parallax]'
        }
    },
    init(){
        let ticking = false;

        function handleParallax() {
            const scrollTop = window.pageYOffset;

            document.querySelectorAll("[data-parallax]").forEach((el) => {
                const speed = parseFloat(el.dataset.parallax) || 0.15;
                const img = el.querySelector("img");
                if (!img) return;

                // Move and scale the image
                const yPos = scrollTop * speed;
                let scale = 1 + Math.abs(speed) * 0.3; // zoom in slightly based on speed

                if(window.innerWidth < 768){
                    scale = 1;
                }

                img.style.transform = `translateY(${yPos}px) scale(${scale})`;
            });

            ticking = false;
        }

        window.addEventListener("scroll", () => {
            if (!ticking) {
                window.requestAnimationFrame(handleParallax);
                ticking = true;
            }
        });

        handleParallax();
    }
};