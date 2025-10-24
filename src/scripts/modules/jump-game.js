export const jumpGame = {
    init(){
        (() => {
            // Auto-Init aller Instanzen
            document.querySelectorAll('.jump-game__wrapper').forEach(root => initJumpGame(root));

            function initJumpGame(root, opts = {}) {
                const W = parseInt(root.dataset.width || opts.width || 560, 10);
                const H = parseInt(root.dataset.height || opts.height || 240, 10);

                // Grundstruktur & Styles
                root.classList.add('jg-root');
                root.innerHTML = `
                  <style>
                    .jg-root{
                        width:100%;
                        height:100%;
                        position:relative;
                        overflow:hidden;
                        border:1.5px solid #fff;
                        background:transparent;
                        color:#fff;
                        font:13px/1.2 system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
                        border-radius:0;
                    }
                    .jg-root canvas{ 
                        position:absolute;
                        inset:0;
                        width:100%;
                        height:100%;
                        display:block;
                        background:transparent;
                        touch-action: none;
                     }
                    .jg-hud{
                      position:absolute; inset:auto 8px 8px 8px; display:flex; justify-content:space-between; gap:8px;
                      padding:6px 8px; pointer-events:none;
                    }
                    .jg-muted{opacity:.7; font-weight:500}
                    .jg-start{
                      position:absolute; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.55);
                    }
                    .jg-btn{
                      appearance:none; border:1.5px solid #fff; background:transparent; color:#fff; font-weight:700;
                      padding:10px 16px; border-radius:999px; cursor:pointer;
                    }
                    .jg-btn:focus{ outline:2px solid #fff; outline-offset:2px }
                  </style>
                  <canvas></canvas>
                  <div class="jg-hud">
                    <div class="jg-muted">↑/Leertaste/Klick = Sprung · P = Pause · R = Neustart</div>
                    <div>Punkte: <span class="jg-score">0</span>     · Rekord: <span class="jg-high">0</span></div>
                  </div>
                  <div class="jg-start" aria-live="polite">
                    <button class="jg-btn" type="button">Start</button>
                  </div>
                `;

                const canvas = root.querySelector('canvas');
                const scoreEl = root.querySelector('.jg-score');
                const highEl = root.querySelector('.jg-high');
                const startOverlay = root.querySelector('.jg-start');
                const startBtn = root.querySelector('.jg-btn');
                const ctx = canvas.getContext('2d', { alpha: true });

                // ---- State & Tuning ----
                let scale = 1, groundY = 0;
                const state = {
                    started:false, paused:false, alive:true, score:0,
                    speed:4.8,            // langsamer Start
                    accel:0.00018,        // sanfte Beschleunigung (px/ms)
                    maxSpeed:20,         // Deckel
                    justResized:true,
                    coinValue: 3          // Punkte pro Münze
                };

                // pro Instanz ein eigener Key (optional per data-key überschreibbar)
                const storageKey =
                    (root.dataset.key ? `jumpGameHigh_${root.dataset.key}` :
                        `jumpGameHigh_${location.pathname}_${W}x${H}`);

                function loadHigh() {
                    const v = Number(localStorage.getItem(storageKey));
                    return Number.isFinite(v) ? v : 0;
                }
                function saveHigh(v) {
                    try { localStorage.setItem(storageKey, String(v)); } catch {}
                }

                state.high = loadHigh();

                const rng = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;

                const player = { x:0, y:0, w:22, h:22, vy:0, canJump:true, runPhase:0, blinkT:0, blinkDur:0, _blink:false };

                // Entities
                const obstacles = [];     // {type:'ground'|'air', x,y,w,h,vxMul,hbInset,passed}
                const coins = [];         // {x,y,r,vxMul,collected}

                // Unabhängige Spawn-Timer (damit Wolken + Boden gleichzeitig möglich sind)
                let lastSpawnGround = 0, nextGapGround = 900;
                let lastSpawnAir = 0,    nextGapAir    = 1200;
                let lastCoinSpawn = 0,   nextCoinGap   = 1800;

                // --- Setup ---
                window.addEventListener('resize', resize, { passive:true });
                reset();
                (function frame(now){
                    const dt = Math.min(34, now - (frame.t || now)); frame.t = now;
                    if (state.started && !state.paused && state.alive) update(dt, now);
                    draw();
                    requestAnimationFrame(frame);
                })(performance.now());

                // --- Input (scoped) ---
                function doJump(){
                    if (!state.started || !state.alive) return;
                    if (player.canJump){ player.vy = -14 * scale; player.canJump = false; }
                }
                root.tabIndex = 0;
                root.addEventListener('pointerdown', e => { e.preventDefault(); doJump(); }, { passive:false });
                root.addEventListener('touchstart', e => { e.preventDefault(); doJump(); }, { passive:false });
                root.addEventListener('keydown', (e) => {
                    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump(); }
                    else if (e.code === 'KeyP') { if (state.started && state.alive) state.paused = !state.paused; }
                    else if (e.code === 'KeyR') { reset(); }
                });
                startBtn.addEventListener('click', () => {
                    if (!state.started){ state.started = true; startOverlay.style.display = 'none'; }
                    else if (!state.alive){ reset(); }
                });

                // --- Helpers / Setup ---
                function resize(){
                    const rect = root.getBoundingClientRect();
                    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
                    canvas.width = Math.round(rect.width * dpr);
                    canvas.height = Math.round(rect.height * dpr);
                    scale = dpr;
                    groundY = Math.round(canvas.height * 0.82);
                    player.x = Math.max(32*scale, canvas.width * 0.12);
                    if (state.justResized) player.y = groundY - player.h;
                    state.justResized = false;
                }
                function reset(){
                    obstacles.length = 0; coins.length = 0;
                    state.started = false; state.paused = false; state.alive = true;
                    state.score = 0; scoreEl.textContent = '0';
                    state.high = loadHigh();
                    highEl.textContent = state.high;
                    state.speed = 4.8;
                    player.vy = 0; player.canJump = true; player.runPhase = 0; player.blinkT = 0; player.blinkDur = rng(1200,2600);
                    lastSpawnGround = 0; nextGapGround = 900;
                    lastSpawnAir = 0;    nextGapAir    = 1200;
                    lastCoinSpawn = 0;   nextCoinGap   = 1800;
                    state.justResized = true; resize();
                    startOverlay.style.display = 'grid';
                    startBtn.textContent = 'Start';
                }

                // --- Spawner ---
                function spawnGroundObstacle() {
                    const isTall = Math.random() < 0.25;
                    const w = rng(14, 24) * scale;
                    const h = (isTall ? rng(36, 50) : rng(16, 28)) * scale;
                    obstacles.push({
                        type: 'ground',
                        x: canvas.width + w,
                        y: groundY - h,
                        w, h,
                        vxMul: 1,
                        hbInset: 0,
                        passed: false
                    });
                }

                function rightmost(type){
                    let best = null;
                    for (const o of obstacles){
                        if (o.type === type && (!best || o.x > best.x)) best = o;
                    }
                    return best;
                }

                const SAFE_H_GAP_PX = 50; // min. horizontaler Abstand in CSS-Pixeln (vor DPR)

                function overlapX(ax, aw, bx, bw, safe = 0){
                    return (ax < bx + bw + safe) && (ax + aw > bx - safe);
                }

                function spawnAirObstacle() {
                    const w = rng(28, 48) * scale;
                    const h = rng(14, 22) * scale;
                    const clearanceFromGround = rng(80, 140) * scale;

                    const safe = SAFE_H_GAP_PX * scale;
                    let x = canvas.width + w; // geplanter Spawnpunkt

                    // Stelle sicher, dass die Wolke rechts neben JEDEM aktuell existierenden Bodenhindernis liegt
                    for (const g of obstacles){
                        if (g.type !== 'ground') continue;
                        // solange sich's überlappt, schiebe die Wolke rechts daneben
                        if (overlapX(x, w, g.x, g.w, safe)){
                            x = g.x + g.w + safe;
                        }
                    }

                    obstacles.push({
                        type: 'air',
                        x,
                        y: groundY - clearanceFromGround - h,
                        w, h,
                        vxMul: 1,                    // kannst du beibehalten
                        hbInset: Math.round(5 * scale),
                        passed: false
                    });
                }

                function spawnCoin(){
                    // kleine Bodenmünze leicht über dem Boden
                    const r = Math.max(3, Math.round(4 * scale));
                    coins.push({
                        x: canvas.width + r*2,
                        y: groundY - r*2 - Math.round(2*scale),
                        r,
                        vxMul: 1,
                        collected: false
                    });
                }

                function bumpScore(by = 1) {
                    state.score += by;
                    scoreEl.textContent = state.score;
                    if (state.score > state.high) {
                        state.high = state.score;
                        highEl.textContent = state.high;
                        saveHigh(state.high);
                    }
                }

                // --- Update/Draw ---
                function update(dt, now){
                    // sanfte Beschleunigung mit Obergrenze
                    state.speed = Math.min(state.maxSpeed, state.speed + state.accel * dt);

                    // Physik Spieler
                    player.vy += 0.8 * (dt/16.67) * scale;
                    player.y += player.vy;
                    if (player.y + player.h >= groundY){
                        player.y = groundY - player.h;
                        player.vy = 0;
                        player.canJump = true;
                    }

                    // Animation & Blinzeln
                    player.runPhase += (state.speed * 0.16) * (dt/16.67);
                    player.blinkT += dt;
                    const blinkDur = player.blinkDur || 1800;
                    player._blink = player.blinkT % (blinkDur+120) > blinkDur;
                    if (player.blinkT > blinkDur + 400){ player.blinkT = 0; player.blinkDur = rng(1200, 2600); }

                    // ------ SPAWN: Boden unabhängig ------
                    if (now - lastSpawnGround > nextGapGround) {
                        lastSpawnGround = now;
                        spawnGroundObstacle();

                        // Unregelmäßiger Abstand für Boden
                        const minGap = 750, base = 980;
                        const randJitter = rng(-320, 520);
                        const chaos = Math.sin(now / 520 + state.score*0.35) * 160;
                        const speedBias = Math.min(180, (state.speed-4.8)*25);
                        const scoreBias = Math.min(160, state.score*2);
                        nextGapGround = Math.max(minGap, base + randJitter + chaos - speedBias - scoreBias);
                    }

                    // ------ SPAWN: Luft (Wolken) unabhängig ------
                    if (now - lastSpawnAir > nextGapAir) {
                        lastSpawnAir = now;
                        spawnAirObstacle();

                        // Wolken etwas seltener/unregelmäßiger
                        const minGapAir = 2950, baseAir = 3250;
                        const randJitterAir = rng(-400, 940);
                        const chaosAir = Math.sin(now / 700 + state.score*0.25) * 180;
                        const speedBiasAir = Math.min(160, (state.speed-4.8)*20);
                        const scoreBiasAir = Math.min(140, state.score*1.5);
                        nextGapAir = Math.max(minGapAir, baseAir + randJitterAir + chaosAir - speedBiasAir - scoreBiasAir);
                    }

                    // ------ SPAWN: Münzen (selbstständiger Timer) ------
                    if (now - lastCoinSpawn > nextCoinGap) {
                        lastCoinSpawn = now;
                        if (Math.random() < 0.55) spawnCoin(); // ~55% Chance
                        nextCoinGap = rng(1400, 2600);         // neuer, loser Abstand
                    }

                    // Move & Collide: Hindernisse
                    for (let i = obstacles.length - 1; i >= 0; i--){
                        const o = obstacles[i];
                        o.x -= state.speed * o.vxMul * scale;
                        if (!o.passed && o.x + o.w < player.x){ o.passed = true; state.score++; bumpScore(1); scoreEl.textContent = state.score; }
                        if (o.x + o.w < -2) obstacles.splice(i,1);

                        const hb = getHitbox(o);
                        if (AABB({x:player.x,y:player.y,w:player.w,h:player.h}, hb)){
                            state.alive = false;
                            startOverlay.style.display = 'grid';
                            startBtn.textContent = 'Nochmal';
                        }
                    }

                    // Move & Collect: Münzen
                    for (let i = coins.length - 1; i >= 0; i--){
                        const c = coins[i];
                        c.x -= state.speed * c.vxMul * scale;
                        if (c.x + c.r*2 < -2) { coins.splice(i,1); continue; }

                        // simple AABB für Coin <-> Player
                        const coinBox = { x: c.x, y: c.y, w: c.r*2, h: c.r*2 };
                        if (!c.collected && AABB({x:player.x,y:player.y,w:player.w,h:player.h}, coinBox)) {
                            c.collected = true;
                            coins.splice(i,1);
                            state.score += state.coinValue;
                            bumpScore(state.coinValue);
                            scoreEl.textContent = state.score;
                        }
                    }
                }

                function draw(){
                    // Transparent lassen
                    ctx.clearRect(0,0,canvas.width,canvas.height);

                    // Bodenlinie
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = Math.max(1, Math.round(1.5*scale));
                    ctx.beginPath(); ctx.moveTo(0, groundY + 0.5); ctx.lineTo(canvas.width, groundY + 0.5); ctx.stroke();

                    // Hindernisse
                    for (const o of obstacles){
                        if (o.type === 'air') {
                            drawCloud(ctx, Math.round(o.x), Math.round(o.y), o.w, o.h);
                        } else {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(Math.round(o.x), Math.round(o.y), o.w, o.h);
                        }
                    }

                    // Münzen
                    for (const c of coins){
                        drawCoin(ctx, Math.round(c.x), Math.round(c.y), c.r);
                    }

                    // Spieler (Geist ohne Arme)
                    drawGhost(ctx, Math.round(player.x), Math.round(player.y), player, scale);

                    // Overlays im Canvas
                    if (state.paused && state.started && state.alive) banner('PAUSE');
                    if (!state.alive) banner('GAME OVER · R zum Neustarten');

                    function banner(t){
                        ctx.save();
                        ctx.font = `${Math.round(14*scale)}px system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif`;
                        const pad = 10*scale, met = ctx.measureText(t), bw = met.width + pad*2, bh = 28*scale;
                        const x = (canvas.width - bw)/2, y = canvas.height*0.26;
                        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x,y,bw,bh);
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, Math.round(1.5*scale)); ctx.strokeRect(x+0.5,y+0.5,bw-1,bh-1);
                        ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
                        ctx.fillText(t, canvas.width/2, y+bh/2+0.5);
                        ctx.restore();
                    }
                }

                // --- Hitbox & Collision ---
                function getHitbox(o){
                    const inset = o.hbInset || 0;
                    return { x: o.x + inset, y: o.y + inset, w: o.w - inset*2, h: o.h - inset*2 };
                }
                const AABB = (a,b)=> a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

                // --- Zeichner: Geist (1-bit, ohne Arme) ---
                function drawGhost(ctx, x, y, p, s){
                    ctx.save();
                    ctx.translate(x, y);
                    const w = p.w, h = p.h;

                    // Körper (runde Kappe, Wellenfuß)
                    ctx.fillStyle = '#fff';
                    roundRect(ctx, 2*s, 1*s, w-4*s, h-4*s, 6*s, true);
                    const baseY = h - 3*s;
                    const lobes = 4, lW = (w-4*s)/lobes;
                    for (let i=0;i<lobes;i++){
                        const lx = 2*s + i*lW;
                        ctx.beginPath();
                        ctx.arc(lx + lW/2, baseY, lW/2, Math.PI, 0);
                        ctx.lineTo(lx + lW, baseY);
                        ctx.lineTo(lx, baseY);
                        ctx.closePath(); ctx.fill();
                    }

                    // leichtes Schweben (vertikale Welle)
                    const hover = Math.sin(p.runPhase*0.6) * 0.6*s;
                    ctx.translate(0, hover);

                    // Augen + Blinzeln
                    ctx.fillStyle = '#000';
                    const eyeW = 3*s, eyeH = p._blink ? 1*s : 3*s;
                    ctx.fillRect(6*s, 7*s, eyeW, eyeH);
                    ctx.fillRect(w-6*s-eyeW, 7*s, eyeW, eyeH);

                    // kleiner Mund
                    if (!p._blink) ctx.fillRect((w/2)-2*s, 11*s, 4*s, 1*s);

                    ctx.restore();

                    function roundRect(ctx, x, y, w, h, r, fill){
                        ctx.beginPath();
                        ctx.moveTo(x+r, y);
                        ctx.arcTo(x+w, y, x+w, y+h, r);
                        ctx.arcTo(x+w, y+h, x, y+h, r);
                        ctx.arcTo(x, y+h, x, y, r);
                        ctx.arcTo(x, y, x+w, y, r);
                        if (fill) ctx.fill();
                    }
                }

                // --- Zeichner: Wolke (kleiner, ohne Artefakt) ---
                function drawCloud(ctx, x, y, w, h){
                    ctx.save();
                    ctx.fillStyle = '#fff';
                    // 3–4 runde "Puffs", ohne zusätzliche Baseline (vermeidet Artefakte)
                    const r = h/2;
                    const puffs = [
                        { cx: x + r*0.9,  cy: y + r*1.0, cr: r*0.9 },
                        { cx: x + r*2.0,  cy: y + r*0.9, cr: r*1.05 },
                        { cx: x + r*3.0,  cy: y + r*1.0, cr: r*0.85 },
                        { cx: x + r*2.5,  cy: y + r*1.4, cr: r*0.75 } // optionaler Unterbauch
                    ];
                    ctx.beginPath();
                    for (const c of puffs){
                        ctx.moveTo(c.cx + c.cr, c.cy);
                        ctx.arc(c.cx, c.cy, c.cr, 0, Math.PI*2);
                    }
                    ctx.fill();
                    ctx.restore();
                }

                // --- Zeichner: Münze (weißes Ringchen) ---
                function drawCoin(ctx, x, y, r){
                    ctx.save();
                    const t = performance.now() / 250;  // Geschwindigkeit (je kleiner, desto schneller)
                    const phase = (Math.sin(t) + 1) / 2; // 0→1→0 für Hin-und-Her-Bewegung
                    const squash = 0.2 + 0.8 * Math.abs(Math.cos(t)); // X-Skalierung simuliert Drehung

                    // Mittelpunkt der Münze
                    const cx = x + r;
                    const cy = y + r;

                    // „Drehung“ um die Mitte (X-Skalierung)
                    ctx.translate(cx, cy);
                    ctx.scale(squash, 1);
                    ctx.translate(-cx, -cy);

                    // äußere Kontur
                    ctx.lineWidth = Math.max(1, Math.round(1*scale));
                    ctx.strokeStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.stroke();

                    // innere „Glanzlinie“
                    if (squash > 0.3) {
                        ctx.beginPath();
                        ctx.moveTo(cx - r * 0.5, cy);
                        ctx.lineTo(cx + r * 0.5, cy);
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            }
        })();
    }
};