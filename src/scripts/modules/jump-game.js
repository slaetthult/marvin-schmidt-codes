export const jumpGame = {
    init(){
        (() => {
            // Auto-Init aller .jump-game Container
            document.querySelectorAll('.jump-game__wrapper').forEach(root => initJumpGame(root));

            function initJumpGame(root, opts = {}) {
                // ------------------ Template & Styles (100% des Parent) ------------------
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
          font:13px/1.2 sans-serif;
          border-radius:10px;
        }
        .jg-root canvas{
          position:absolute; inset:0; width:100%; height:100%; display:block;
          background:transparent;
          touch-action:none; /* wichtig für Mobile */
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
        <div class="jg-muted">↑/Space/Click/Touch = Sprung</div>
        <div>
          Punkte: <span class="jg-score">0</span>
          · Rekord: <span class="jg-high">0</span>
        </div>
      </div>
      <div class="jg-start" aria-live="polite">
        <button class="jg-btn" type="button">Start</button>
      </div>
    `;

                // ------------------ Elements ------------------
                const canvas = root.querySelector('canvas');
                const scoreEl = root.querySelector('.jg-score');
                const highEl  = root.querySelector('.jg-high');
                const startOverlay = root.querySelector('.jg-start');
                const startBtn = root.querySelector('.jg-btn');
                const ctx = canvas.getContext('2d', { alpha: true });

                // ------------------ State ------------------
                let scale = 1;      // DPR (für Schärfe)
                let gs    = 1;      // Gameplay-Scale (vergößert Figuren auf Mobile)
                let groundY = 0;

                const state = {
                    started:false, paused:false, alive:true,
                    score:0, high:0,
                    speed:4.8,          // Startgeschwindigkeit
                    accel:0.00020,      // sanfte Beschleunigung (px/ms)
                    maxSpeed:30,       // obere Kappe
                    coinValue:3,
                    justResized:true
                };

                // Highscore-Key (pro Seite/Instanz überschreibbar via data-key)
                const storageKey =
                    (root.dataset.key ? `jumpGameHigh_${root.dataset.key}` :
                        `jumpGameHigh_${location.pathname}`);

                function loadHigh(){ const v = Number(localStorage.getItem(storageKey)); return Number.isFinite(v)?v:0; }
                function saveHigh(v){ try{ localStorage.setItem(storageKey, String(v)); }catch{} }

                const rng = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;

                // Player (w/h werden im resize() per gs gesetzt)
                const player = { x:0, y:0, w:22, h:22, vy:0, canJump:true, runPhase:0, blinkT:0, blinkDur:0, _blink:false };

                // Entities
                const obstacles = []; // {type:'ground'|'air', x,y,w,h,vxMul,hbInset,passed}
                const coins     = []; // {x,y,r,vxMul,collected}

                // unabhängige Spawn-Timer
                let lastSpawnGround = 0, nextGapGround = 900;
                let lastSpawnAir    = 0, nextGapAir    = 1200;
                let lastCoinSpawn   = 0, nextCoinGap   = 1800;

                // Anti-Overlap (Wolke nie über Bodenblock)
                const SAFE_H_GAP_PX = 28; // CSS-Pixel (wird mit gs skaliert)
                const overlapX = (ax,aw,bx,bw,safe=0) => (ax < bx + bw + safe) && (ax + aw > bx - safe);

                // ------------------ Sizing ------------------
                function resize(){
                    const rect = root.getBoundingClientRect();
                    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
                    canvas.width  = Math.round(rect.width  * dpr);
                    canvas.height = Math.round(rect.height * dpr);

                    scale = dpr;
                    // Gameplay-Scale relativ zur sichtbaren Höhe
                    const BASE_H = 240;
                    gs = rect.height / BASE_H;
                    gs = Math.max(0.9, Math.min(gs, 2.4)); // clamp

                    groundY = Math.round(canvas.height * 0.82);

                    // Playergröße & Position
                    const PW = 22, PH = 22;
                    player.w = Math.round(PW * gs);
                    player.h = Math.round(PH * gs);
                    player.x = Math.max(32*gs, canvas.width * 0.12);
                    if (state.justResized) player.y = groundY - player.h;

                    state.justResized = false;
                }

                // ------------------ Reset/Start ------------------
                function reset(){
                    obstacles.length = 0; coins.length = 0;
                    state.started=false; state.paused=false; state.alive=true;
                    state.score=0; scoreEl.textContent='0';
                    state.high = loadHigh(); highEl.textContent = state.high;
                    state.speed=4.8;
                    player.vy=0; player.canJump=true; player.runPhase=0; player.blinkT=0; player.blinkDur=rng(1200,2600);
                    lastSpawnGround=0; nextGapGround=900;
                    lastSpawnAir=0;    nextGapAir=1200;
                    lastCoinSpawn=0;   nextCoinGap=1800;
                    state.justResized=true; resize();
                    startOverlay.style.display='grid';
                    startBtn.textContent='Start';
                }

                // ------------------ Input ------------------
                function doJump(){
                    if (!state.started || !state.alive) return;
                    if (player.canJump){ player.vy = -14 * gs; player.canJump = false; }
                }

                // Pointer: nicht klicken „weg-preventen“ bevor gestartet
                root.addEventListener('pointerdown', (e) => {
                    if (!state.started) return;
                    if (e.target && e.target.closest('.jg-start')) return;
                    e.preventDefault();
                    doJump();
                }, { passive:false });

                // Start-Button (kein focus() nötig, mobile-sicher)
                startBtn.addEventListener('click', () => {
                    if (!state.started){
                        state.started = true;
                        startOverlay.style.display = 'none';
                        // optional Desktop-Fokus:
                        // if (matchMedia('(pointer: fine)').matches) root.focus();
                    } else if (!state.alive){
                        reset();
                    }
                });

                // Keyboard (Desktop): globaler Listener, Felder ignorieren
                window.addEventListener('keydown', (e) => {
                    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
                    const inEditable = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
                    if (inEditable) return;

                    if (!state.started) return;

                    if (e.code === 'Space' || e.code === 'ArrowUp') {
                        e.preventDefault();
                        if (state.alive) doJump();
                    } else if (e.code === 'KeyP') {
                        if (state.alive) state.paused = !state.paused;
                    } else if (e.code === 'KeyR') {
                        reset();
                    }
                });

                // ------------------ Score / Highscore ------------------
                function bumpScore(by=1){
                    state.score += by;
                    scoreEl.textContent = state.score;
                    if (state.score > state.high){
                        state.high = state.score;
                        highEl.textContent = state.high;
                        saveHigh(state.high);
                    }
                }

                // ------------------ Spawner ------------------
                function spawnGroundObstacle() {
                    const isTall = Math.random() < 0.25;
                    const w = rng(14, 24) * gs;
                    const h = (isTall ? rng(36, 50) : rng(16, 28)) * gs;

                    // Falls direkt unter einer nahen Wolke -> rechts daneben setzen
                    const safe = SAFE_H_GAP_PX * gs;
                    let x = canvas.width + w;
                    for (const a of obstacles){
                        if (a.type !== 'air') continue;
                        if (overlapX(x, w, a.x, a.w, safe)) x = a.x + a.w + safe;
                    }

                    obstacles.push({ type:'ground', x, y:groundY - h, w, h, vxMul:1, hbInset:0, passed:false });
                }

                function spawnAirObstacle() {
                    // kleinere, höhere Wolken
                    const w = rng(28, 48) * gs;
                    const h = rng(14, 22) * gs;
                    const clearanceFromGround = rng(80, 140) * gs;

                    // Nie horizontal über einem Bodenblock spawnen
                    const safe = SAFE_H_GAP_PX * gs;
                    let x = canvas.width + w;
                    for (const g of obstacles){
                        if (g.type !== 'ground') continue;
                        if (overlapX(x, w, g.x, g.w, safe)) x = g.x + g.w + safe;
                    }

                    obstacles.push({
                        type:'air',
                        x,
                        y: groundY - clearanceFromGround - h,
                        w, h,
                        vxMul: 1,                 // etwas langsamer (Parallax)
                        hbInset: Math.round(5 * gs), // fluffige Hitbox
                        passed:false
                    });
                }

                function spawnCoin(){
                    const r = Math.max(3, Math.round(4 * gs));
                    coins.push({
                        x: canvas.width + r*2,
                        y: groundY - r*2 - Math.round(2*gs),
                        r, vxMul:1, collected:false
                    });
                }

                // ------------------ Loop ------------------
                window.addEventListener('resize', resize, { passive:true });
                reset();

                (function frame(now){
                    const dt = Math.min(34, now - (frame.t || now)); frame.t = now;
                    if (state.started && !state.paused && state.alive) update(dt, now);
                    draw();
                    requestAnimationFrame(frame);
                })(performance.now());

                // ------------------ Update ------------------
                function update(dt, now){
                    // Speed anheben (gedeckelt)
                    state.speed = Math.min(state.maxSpeed, state.speed + state.accel * dt);

                    // Physik Spieler
                    player.vy += 0.8 * (dt/16.67) * gs;
                    player.y  += player.vy;
                    if (player.y + player.h >= groundY){
                        player.y = groundY - player.h;
                        player.vy = 0; player.canJump = true;
                    }

                    // Animation & Blinzeln
                    player.runPhase += (state.speed * 0.16) * (dt/16.67);
                    player.blinkT += dt;
                    const blinkDur = player.blinkDur || 1800;
                    player._blink = player.blinkT % (blinkDur+120) > blinkDur;
                    if (player.blinkT > blinkDur + 400){ player.blinkT = 0; player.blinkDur = rng(1200, 2600); }

                    // ------ Spawn: Boden (unabhängig) ------
                    if (now - lastSpawnGround > nextGapGround) {
                        lastSpawnGround = now;
                        spawnGroundObstacle();

                        const minGap = 750, base = 980;
                        const randJitter = rng(-320, 520);
                        const chaos = Math.sin(now / 520 + state.score*0.35) * 160;
                        const speedBias = Math.min(180, (state.speed-4.8)*25);
                        const scoreBias = Math.min(160, state.score*2);
                        nextGapGround = Math.max(minGap, base + randJitter + chaos - speedBias - scoreBias);
                    }

                    // ------ Spawn: Luft (unabhängig) ------
                    if (now - lastSpawnAir > nextGapAir) {
                        lastSpawnAir = now;
                        spawnAirObstacle();

                        const minGapAir = 950, baseAir = 12500;
                        const randJitterAir = rng(-420, 640);
                        const chaosAir = Math.sin(now / 700 + state.score*0.25) * 180;
                        const speedBiasAir = Math.min(160, (state.speed-4.8)*20);
                        const scoreBiasAir = Math.min(140, state.score*1.5);
                        nextGapAir = Math.max(minGapAir, baseAir + randJitterAir + chaosAir - speedBiasAir - scoreBiasAir);
                    }

                    // ------ Spawn: Münzen ------
                    if (now - lastCoinSpawn > nextCoinGap) {
                        lastCoinSpawn = now;
                        if (Math.random() < 0.55) spawnCoin();
                        nextCoinGap = rng(1400, 2600);
                    }

                    // Move & Laufzeit-Anti-Overlap (falls sich Parallax später überlagert)
                    const safe = SAFE_H_GAP_PX * gs;

                    for (let i = obstacles.length - 1; i >= 0; i--){
                        const o = obstacles[i];
                        o.x -= state.speed * o.vxMul * gs;

                        // Laufzeitkorrektur: Wolke nie direkt über Bodenblock
                        if (o.type === 'air'){
                            for (let j = 0; j < obstacles.length; j++){
                                const g = obstacles[j];
                                if (g.type !== 'ground') continue;
                                if (overlapX(o.x, o.w, g.x, g.w, safe)){
                                    o.x = g.x + g.w + safe; // rechts daneben setzen
                                }
                            }
                        }

                        if (!o.passed && o.x + o.w < player.x){ o.passed = true; bumpScore(1); }
                        if (o.x + o.w < -2) obstacles.splice(i,1);
                    }

                    // Move & Collect: Coins
                    for (let i = coins.length - 1; i >= 0; i--){
                        const c = coins[i];
                        c.x -= state.speed * c.vxMul * gs;
                        if (c.x + c.r*2 < -2){ coins.splice(i,1); continue; }

                        const coinBox = { x:c.x, y:c.y, w:c.r*2, h:c.r*2 };
                        if (!c.collected && AABB({x:player.x,y:player.y,w:player.w,h:player.h}, coinBox)){
                            c.collected = true; coins.splice(i,1);
                            bumpScore(state.coinValue);
                        }
                    }

                    // Collision (Player vs Obstacles)
                    for (const o of obstacles){
                        const hb = getHitbox(o);
                        if (AABB({x:player.x,y:player.y,w:player.w,h:player.h}, hb)){
                            state.alive = false;
                            startOverlay.style.display = 'grid';
                            startBtn.textContent = 'Nochmal';
                            break;
                        }
                    }
                }

                // ------------------ Draw ------------------
                function draw(){
                    ctx.clearRect(0,0,canvas.width,canvas.height);

                    // Bodenlinie
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = Math.max(1, Math.round(1.5*scale));
                    ctx.beginPath(); ctx.moveTo(0, groundY + 0.5); ctx.lineTo(canvas.width, groundY + 0.5); ctx.stroke();

                    // Obstacles
                    for (const o of obstacles){
                        if (o.type === 'air') {
                            drawCloud(ctx, Math.round(o.x), Math.round(o.y), o.w, o.h);
                        } else {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(Math.round(o.x), Math.round(o.y), o.w, o.h);
                        }
                    }

                    // Coins (rotierende Darstellung)
                    for (const c of coins){
                        drawCoin(ctx, Math.round(c.x), Math.round(c.y), c.r, scale);
                    }

                    // Player (Geist) – mit gs & DPR
                    drawGhost(ctx, Math.round(player.x), Math.round(player.y), player, gs, scale);

                    if (state.paused && state.started && state.alive) banner('PAUSE');
                    if (!state.alive) banner('GAME OVER');

                    function banner(t){
                        ctx.save();
                        ctx.font = `${Math.round(14*scale)}px sans-serif`;
                        const pad = 10*scale, met = ctx.measureText(t), bw = met.width + pad*2, bh = 28*scale;
                        const x = (canvas.width - bw)/2, y = canvas.height*0.26;
                        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x,y,bw,bh);
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, Math.round(1.5*scale)); ctx.strokeRect(x+0.5,y+0.5,bw-1,bh-1);
                        ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
                        ctx.fillText(t, canvas.width/2, y+bh/2+0.5);
                        ctx.restore();
                    }
                }

                // ------------------ Helpers: Hitbox, Collision ------------------
                function getHitbox(o){
                    const inset = o.hbInset || 0;
                    return { x:o.x + inset, y:o.y + inset, w:o.w - inset*2, h:o.h - inset*2 };
                }
                const AABB = (a,b)=> a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

                // ------------------ Drawing: Ghost (gs & dpr) ------------------
                // Aufruf: drawGhost(ctx, x, y, player, gs, scale)
                function drawGhost(ctx, x, y, p, s, dpr=1){
                    ctx.save();
                    ctx.translate(x, y);
                    const w = p.w, h = p.h; // bereits gs-skaliert

                    // Körper
                    ctx.fillStyle = '#fff';
                    roundRect(ctx, 2*s, 1*s, w - 4*s, h - 4*s, 6*s, true);

                    // Wellenfuß
                    const baseY = h - 3*s;
                    const lobes = 4, lW = (w - 4*s) / lobes;
                    for (let i=0;i<lobes;i++){
                        const lx = 2*s + i*lW;
                        ctx.beginPath();
                        ctx.arc(lx + lW/2, baseY, lW/2, Math.PI, 0);
                        ctx.lineTo(lx + lW, baseY);
                        ctx.lineTo(lx, baseY);
                        ctx.closePath(); ctx.fill();
                    }

                    // Schweben
                    const hover = Math.sin(p.runPhase * 0.6) * 0.6 * s;
                    ctx.translate(0, hover);

                    // Gesicht
                    ctx.fillStyle = '#000';
                    const eyeW = 3*s, eyeH = p._blink ? 1*s : 3*s;
                    ctx.fillRect(6*s, 7*s, eyeW, eyeH);
                    ctx.fillRect(w - 6*s - eyeW, 7*s, eyeW, eyeH);

                    // Mund (dünner Strich, per dpr scharf)
                    const lw = Math.max(1, Math.round(1 * dpr));
                    if (!p._blink) ctx.fillRect((w/2) - 2*s, 11*s, 4*s, 1*lw);

                    ctx.restore();

                    function roundRect(ctx, x, y, w, h, r, fill){
                        ctx.beginPath();
                        ctx.moveTo(x + r, y);
                        ctx.arcTo(x + w, y, x + w, y + h, r);
                        ctx.arcTo(x + w, y + h, x, y + h, r);
                        ctx.arcTo(x, y + h, x, y, r);
                        ctx.arcTo(x, y, x + w, y, r);
                        if (fill) ctx.fill();
                    }
                }

                // ------------------ Drawing: Cloud ------------------
                function drawCloud(ctx, x, y, w, h){
                    ctx.save();
                    ctx.fillStyle = '#fff';
                    const r = h/2;
                    const puffs = [
                        { cx: x + r*0.9,  cy: y + r*1.0, cr: r*0.9 },
                        { cx: x + r*2.0,  cy: y + r*0.9, cr: r*1.05 },
                        { cx: x + r*3.0,  cy: y + r*1.0, cr: r*0.85 },
                        { cx: x + r*2.5,  cy: y + r*1.4, cr: r*0.75 }
                    ];
                    ctx.beginPath();
                    for (const c of puffs){ ctx.moveTo(c.cx + c.cr, c.cy); ctx.arc(c.cx, c.cy, c.cr, 0, Math.PI*2); }
                    ctx.fill();
                    ctx.restore();
                }

                // ------------------ Drawing: Rotating Coin ------------------
                function drawCoin(ctx, x, y, r, dpr=1){
                    ctx.save();
                    const t = performance.now() / 250;              // Drehgeschwindigkeit
                    const squash = 0.2 + 0.8 * Math.abs(Math.cos(t)); // X-Skalierung simuliert Drehung
                    const cx = x + r, cy = y + r;

                    ctx.translate(cx, cy);
                    ctx.scale(squash, 1);
                    ctx.translate(-cx, -cy);

                    ctx.lineWidth = Math.max(1, Math.round(1 * dpr));
                    ctx.strokeStyle = '#fff';
                    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();

                    if (squash > 0.3){ // Glanzlinie nur wenn „breit“ genug
                        ctx.beginPath(); ctx.moveTo(cx - r*0.5, cy); ctx.lineTo(cx + r*0.5, cy); ctx.stroke();
                    }
                    ctx.restore();
                }
            }
        })();
    }
};