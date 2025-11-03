export const magneticButton = {
    vars: {
        queries: {
            component:      '*[data-magnetic-button]'
        }
    },
    init(){
        const $magneticButtons = document.querySelectorAll(magneticButton.vars.queries.component);

        $magneticButtons.forEach((btn) => {
            const maxDist = 120;
            const maxOffset = 10;
            const lerp = 0.12;
            const returnSpeed = 0.1;
            const tiltMax = 6;
            let rect = btn.getBoundingClientRect();

            let targetX = 0, targetY = 0;
            let curX = 0, curY = 0;
            let active = false;
            let rafId = null;

            const updateRect = () => rect = btn.getBoundingClientRect();
            window.addEventListener('resize', updateRect);
            window.addEventListener('scroll', updateRect, { passive: true });

            const animate = () => {
                const speed = active ? lerp : returnSpeed;
                curX += (targetX - curX) * speed;
                curY += (targetY - curY) * speed;

                const rotX = (-curY / maxOffset) * tiltMax;
                const rotY = (curX / maxOffset) * tiltMax;

                btn.style.transform = `translate3d(${curX}px, ${curY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

                if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05 || active) {
                    rafId = requestAnimationFrame(animate);
                } else {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                    btn.style.transform = 'translate3d(0,0,0)';
                }
            };

            window.addEventListener('mousemove', (e) => {
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.hypot(dx, dy);

                if (dist < maxDist) {
                    const angle = Math.atan2(dy, dx);
                    const verticalBias = 1 + Math.abs(Math.sin(angle)) * 0.4;
                    const strength = (1 - dist / maxDist) ** 0.4;

                    targetX = (dx / dist) * maxOffset * strength;
                    targetY = (dy / dist) * maxOffset * strength * verticalBias;
                    active = true;

                    if (!rafId) rafId = requestAnimationFrame(animate);
                } else {
                    active = false;
                    targetX = 0;
                    targetY = 0;
                    if (!rafId) rafId = requestAnimationFrame(animate);
                }
            });
        });
    }
};