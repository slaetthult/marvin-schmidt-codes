export const starsEffect = {

    init(){
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.style.position = 'fixed';
        canvas.style.top = 0;
        canvas.style.left = 0;
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = -1; // keep on top if needed

        let DPR = Math.max(1, window.devicePixelRatio || 1);

        function resize() {
            DPR = Math.max(1, window.devicePixelRatio || 1);
            canvas.width = Math.floor(innerWidth * DPR);
            canvas.height = Math.floor(innerHeight * DPR);
            canvas.style.width = innerWidth + 'px';
            canvas.style.height = innerHeight + 'px';
            // draw in CSS pixels while using high-res backing store
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        window.addEventListener('resize', resize);
        resize();

        const center = () => ({ cx: innerWidth / 2, cy: innerHeight / 2 });

        // --- state -------------------------------------------------
        let particles = [];
        let stars = [];

        let mouse = { x: innerWidth / 2, y: innerHeight / 2 }; // start centered
        document.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        // NEW: scroll state
        let scroll = { x: window.scrollX || 0, y: window.scrollY || 0 };
        const initialScroll = { x: scroll.x, y: scroll.y };

        window.addEventListener(
            'scroll',
            () => {
                scroll.x = window.scrollX || 0;
                scroll.y = window.scrollY || 0;
            },
            { passive: true }
        );

        // fewer dots: throttle + probability
        let lastParticleTime = 0;
        const particleDelay = 60;        // ms between potential spawns (raise to get fewer)
        const spawnProbability = 0.7;    // chance to actually spawn when delay has passed

        // spawn particles at most every `particleDelay` ms
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastParticleTime > particleDelay && Math.random() < spawnProbability) {
                const m = mouseNorm();
                particles.push({
                    x: e.clientX,
                    y: e.clientY,
                    alpha: 1,
                    z: rand(0.4, 1), // depth: closer -> stronger parallax
                    spawnDX: m.dx,   // store mouse offset at spawn for relative parallax
                    spawnDY: m.dy,
                    // NEW: remember scroll when this particle was created
                    spawnScrollX: scroll.x,
                    spawnScrollY: scroll.y
                });
                lastParticleTime = now;
            }
        });

        // create stars (background)
        const STAR_COUNT = 100;
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * innerWidth,
                y: Math.random() * innerHeight,
                alpha: Math.random(),
                size: Math.random() * 2 + 1,
                z: rand(0.2, 1) // depth for parallax
            });
        }

        // --- constants (tweakables) -------------------------------
        const PARTICLE_RADIUS = 3;
        const PARTICLE_FADE = 0.01;       // alpha per frame
        const LINK_DIST_PARTICLES = 120;
        const LINK_DIST_STARS = 100;

        const PARALLAX_STRENGTH_STARS = 0.06;     // mouse parallax for stars (absolute)
        const PARALLAX_STRENGTH_PARTICLES = 0.10; // mouse parallax for particles (relative)

        // NEW: scroll parallax strengths
        const SCROLL_PARALLAX_STARS = 0.06;       // absolute scroll parallax for stars
        const SCROLL_PARALLAX_PARTICLES = 0.10;   // relative scroll parallax for particles

        // --- helpers ----------------------------------------------
        function rand(a, b) { return a + Math.random() * (b - a); }

        // normalized mouse offset from center in [-1, 1]
        function mouseNorm() {
            const { cx, cy } = center();
            return { dx: (mouse.x - cx) / cx, dy: (mouse.y - cy) / cy };
        }

        // absolute parallax (used for stars) with mouse + scroll
        function parallaxOffsetAbs(x, y, z, mouseStrength) {
            const { dx, dy } = mouseNorm();

            // mouse term (scales with viewport size for nice depth)
            const mx = dx * z * (mouseStrength * innerWidth);
            const my = dy * z * (mouseStrength * innerHeight);

            // scroll delta since page load (pixels) -> scaled by strength
            const sx = (scroll.x - initialScroll.x) * z * SCROLL_PARALLAX_STARS;
            const sy = (scroll.y - initialScroll.y) * z * SCROLL_PARALLAX_STARS;

            return { px: x + mx + sx, py: y + my + sy };
        }

        // relative parallax (used for particles to spawn under cursor) with mouse + scroll
        function particleDrawPos(p) {
            const m = mouseNorm();
            const ddx = m.dx - p.spawnDX; // zero at spawn time
            const ddy = m.dy - p.spawnDY;

            // mouse relative term
            const mx = ddx * p.z * (PARALLAX_STRENGTH_PARTICLES * innerWidth);
            const my = ddy * p.z * (PARALLAX_STRENGTH_PARTICLES * innerHeight);

            // scroll delta since spawn (pixels)
            const sx = (scroll.x - p.spawnScrollX) * p.z * SCROLL_PARALLAX_PARTICLES;
            const sy = (scroll.y - p.spawnScrollY) * p.z * SCROLL_PARALLAX_PARTICLES;

            return { px: p.x + mx + sx, py: p.y + my + sy };
        }

        // --- draw --------------------------------------------------
        function drawStars() {
            for (let s of stars) {
                // subtle twinkle
                s.alpha += (Math.random() - 0.5) * 0.05;
                s.alpha = Math.min(1, Math.max(0.2, s.alpha));

                const { px, py } = parallaxOffsetAbs(s.x, s.y, s.z, PARALLAX_STRENGTH_STARS);
                ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
                ctx.beginPath();
                ctx.arc(px, py, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function animate() {
            // clear in CSS pixel coords (because we setTransform to DPR)
            ctx.clearRect(0, 0, innerWidth, innerHeight);

            drawStars();

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.alpha -= PARTICLE_FADE;
                if (p.alpha <= 0) { particles.splice(i, 1); i--; continue; }

                const { px: drawX, py: drawY } = particleDrawPos(p);

                // dot
                ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
                ctx.beginPath();
                ctx.arc(drawX, drawY, PARTICLE_RADIUS, 0, Math.PI * 2);
                ctx.fill();

                // connect with other particles (use drawn positions for visual consistency)
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const B = particleDrawPos(p2);
                    const dist = Math.hypot(drawX - B.px, drawY - B.py);
                    if (dist < LINK_DIST_PARTICLES) {
                        ctx.strokeStyle = `rgba(255,255,255,${p.alpha * 0.1})`;
                        ctx.beginPath();
                        ctx.moveTo(drawX, drawY);
                        ctx.lineTo(B.px, B.py);
                        ctx.stroke();
                    }
                }

                // connect with background stars (stars use absolute parallax)
                for (let s of stars) {
                    const S = parallaxOffsetAbs(s.x, s.y, s.z, PARALLAX_STRENGTH_STARS);
                    const dist = Math.hypot(drawX - S.px, drawY - S.py);
                    if (dist < LINK_DIST_STARS) {
                        ctx.strokeStyle = `rgba(255,255,255,0.05)`;
                        ctx.beginPath();
                        ctx.moveTo(drawX, drawY);
                        ctx.lineTo(S.px, S.py);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        }

        animate();
    }
};