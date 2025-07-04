function initGameScene() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const wrapper = document.getElementById('game-wrapper');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const uiContainer = document.getElementById('ui-container');
    const progressBar = document.getElementById('progress-bar');
    const scoreDisplay = document.getElementById('score-display');
    const targetLetterDisplay = document.getElementById('target-letter-display');
    const cinematicOverlay = document.getElementById('cinematic-overlay');
    const widescreenContainer = document.getElementById('widescreen-container');
    const finalScoreDisplay = document.getElementById('final-score');
    const powerupTimersContainer = document.getElementById('powerup-timers');
    const startBtn = document.getElementById('start-btn');
    const retryBtn = document.getElementById('retry-btn');
    const TARGET_WORD = 'MANAR';
    const BASE_WIDTH = 400;
    const BASE_HEIGHT = 700;

    const computedStyle = getComputedStyle(document.documentElement);
    const colors = {
        white: computedStyle.getPropertyValue('--white').trim(),
        collectible: computedStyle.getPropertyValue('--collectible-color').trim(),
        obstacle: computedStyle.getPropertyValue('--obstacle-color').trim(),
        shield: computedStyle.getPropertyValue('--shield-color').trim(),
        magnet: computedStyle.getPropertyValue('--magnet-color').trim(),
        boost: computedStyle.getPropertyValue('--boost-color').trim(),
        primary: computedStyle.getPropertyValue('--primary-color').trim()
    };

    let scaleRatio = 1;
    let gameState = 'MENU';
    let runScore = 0;
    let frame = 0;
    let keys = {};
    let spawnTimer = 100;
    let isTouchDevice = 'ontouchstart' in window;
    let effects = { isBlurActive: false, isControlsInverted: false, distortionTimer: 0 };
    let animationFrameId;
    let currentLetterIndex = 0;
    const player = { x: 0, y: 0, baseWidth: 40, baseHeight: 40, baseSpeed: 7, width: 40, height: 40, speed: 7, shootCooldown: 0, baseFireRate: 15, currentFireRate: 15, state: { isShielded: false, isMagnetActive: false, isBoostActive: false, shieldTimer: 0, magnetTimer: 0, boostTimer: 0 } };
    let items = [], bullets = [], particles = [], stars = [];

    class Particle { constructor(x, y, color) { this.x = x; this.y = y; this.color = color; this.size = Math.random() * 4 + 1; this.life = Math.random() * 50 + 50; this.initialLife = this.life; this.vx = (Math.random() - 0.5) * 6; this.vy = (Math.random() - 0.5) * 6; this.gravity = -0.05; } update() { this.life--; this.x += this.vx; this.y += this.vy; const dx = this.x - (this.canvas.width / 2); const dy = this.y - (this.canvas.height / 2); this.vx += (dx > 0 ? -1 : 1) * this.gravity; this.vy += (dy > 0 ? -1 : 1) * this.gravity; this.opacity = this.life / this.initialLife; } draw(ctx) { ctx.save(); ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
    class ParticleSystem { constructor(canvas, letterSpan) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.letterSpan = letterSpan; this.particles = []; this.animationFrameId = null; this.resize(); window.addEventListener('resize', () => this.resize()); } resize() { if(!this.letterSpan) return; this.canvas.width = this.letterSpan.clientWidth * 2; this.canvas.height = this.letterSpan.clientHeight * 2; } start(duration = 3000) { const burstColors = [colors.primary, colors.white, colors.obstacle, colors.magnet]; for (let i = 0; i < 150; i++) { const color = burstColors[Math.floor(Math.random() * burstColors.length)]; this.particles.push(new Particle(this.canvas.width / 2, this.canvas.height / 2, color)); } const startTime = Date.now(); const animate = () => { if (Date.now() - startTime > duration) { this.stop(); return; } this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.particles.forEach((p, i) => { p.canvas = this.canvas; p.update(); p.draw(this.ctx); if (p.life <= 0) { this.particles.splice(i, 1); } }); this.animationFrameId = requestAnimationFrame(animate); }; animate(); } stop() { cancelAnimationFrame(this.animationFrameId); } }

    function init() { 
        setupEventListeners(); 
        resizeCanvas(); 
        gameLoop(); 
        AudioManager.setSoundtrackPitch(1.0); 
    }
    
    function gameLoop() { 
        frame++; 
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        updateBackground(); 
        drawBackground(); 
        if (gameState === 'LETTER_MODE') { 
            update(); 
            draw(); 
        } else if (gameState === 'GAMEOVER') { 
            drawParticles(); 
        } 
        animationFrameId = requestAnimationFrame(gameLoop); 
    }
    
    function startGame() {
        if (gameState === 'LETTER_MODE') return;
        GlitchManager.trigger(200);
        AudioManager.playSound('transition');
        AudioManager.setSoundtrackPitch(1.0);
        
        // MODIFIED: Start directly in LETTER_MODE
        gameState = 'LETTER_MODE';
        resetRunState();

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        uiContainer.classList.add('visible');
    }

    function resetRunState() {
        runScore = 0;
        items = [];
        bullets = [];
        particles = [];
        currentLetterIndex = 0; 
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - (60 * scaleRatio);
        Object.keys(player.state).forEach(key => player.state[key] = key.endsWith('Timer') ? 0 : false);
        
        spawnTimer = 50; // Faster start
        effects.distortionTimer = 0;
        
        // MODIFIED: Hide fragment-related UI
        document.getElementById('progress-text').style.display = 'none';
        if (progressBar) progressBar.parentElement.style.display = 'none';
        scoreDisplay.style.display = 'block';
        targetLetterDisplay.style.display = 'block';

        updateUI();
    }
    
    function handleGameOver() {
        if (gameState === 'GAMEOVER') return; 
        gameState = 'GAMEOVER';
        AudioManager.playSound('damage');
        createBurst(player.x + player.width / 2, player.y + player.height / 2, colors.white, 50);

        uiContainer.classList.remove('visible');
        finalScoreDisplay.textContent = runScore;
        gameOverScreen.classList.remove('hidden');
    }
    
    function handleLetterModeFailure() {
        AudioManager.playSound('distort');
        GlitchManager.trigger(300);
        currentLetterIndex = 0; // Reset progress on failure
        items = [];
        bullets = [];
        spawnTimer = 50;
        runScore = 0; // Optional: reset score on failure for a tougher challenge
        updateUI();
    }

    function handleFinalWin() {
        gameState = 'CINEMATIC';
        cancelAnimationFrame(animationFrameId);
        wrapper.style.opacity = '0';
        uiContainer.classList.remove('visible');
        setTimeout(() => {
            widescreenContainer.classList.add('visible');
            cinematicOverlay.innerHTML = '';
            TARGET_WORD.split('').forEach((char, index) => {
                const wrapperEl = document.createElement('div');
                wrapperEl.className = 'cinematic-letter';
                wrapperEl.style.animationDelay = `${index * 0.4 + 1}s`;
                const textSpan = document.createElement('span');
                textSpan.textContent = char;
                const particleCanvas = document.createElement('canvas');
                particleCanvas.className = 'particle-canvas';
                wrapperEl.appendChild(textSpan);
                wrapperEl.appendChild(particleCanvas);
                cinematicOverlay.appendChild(wrapperEl);
                const ps = new ParticleSystem(particleCanvas, wrapperEl);
                ps.start(3500);
            });

            setTimeout(() => {
                AudioManager.playSound('promise');
                cinematicOverlay.querySelectorAll('.cinematic-letter').forEach(span => {
                    span.classList.add('solid');
                });
            }, 4000);
            
            setTimeout(() => {
                AudioManager.playSound('explode');
                cinematicOverlay.querySelectorAll('.cinematic-letter').forEach(span => {
                    span.style.setProperty('--tx', `${(Math.random() - 0.5) * 80}vw`);
                    span.style.setProperty('--ty', `${(Math.random() - 0.5) * 80}vh`);
                    span.style.setProperty('--r', `${(Math.random() - 0.5) * 720}deg`);
                    span.classList.add('break');
                });
            }, 7000);
            
            setTimeout(() => {
                widescreenContainer.style.opacity = '0';
                setTimeout(() => {
                    SceneManager.next();
                }, 1000);
            }, 9000);
        }, 600);
    }
    
    // MODIFIED: spawnItems logic simplified as game always starts in LETTER_MODE
    function spawnItems() { 
        spawnTimer--; 
        if (spawnTimer > 0) return; 
        
        const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
        let letterToSpawn; 
        
        // Spawn the correct letter more often
        if (Math.random() < 0.40) { // Increased chance for correct letter
            letterToSpawn = TARGET_WORD[currentLetterIndex]; 
        } else { 
            let randomChar; 
            do { 
                randomChar = ALPHABET[Math.floor(Math.random() * ALPHABET.length)]; 
            } while (randomChar === TARGET_WORD[currentLetterIndex]); 
            letterToSpawn = randomChar; 
        } 
        items.push(createLetterItem(letterToSpawn)); 
        // FASTER SPAWNING
        spawnTimer = Math.max(20, 45 - (currentLetterIndex * 5)); 
    }
    
    function createLetterItem(letter) { 
        const isCorrect = (letter === TARGET_WORD[currentLetterIndex]); 
        const item = { 
            type: isCorrect ? 'letter_correct' : 'letter_wrong', 
            letter: letter, 
            x: Math.random() * (canvas.width - 50 * scaleRatio), 
            y: -50 * scaleRatio, 
            width: 40 * scaleRatio, 
            height: 40 * scaleRatio, 
            // FASTER FALLING SPEED
            speed: (Math.random() * 2.0 + 2.5) * scaleRatio, 
        }; 
        item.draw = (ctx) => { 
            ctx.font = `bold ${item.width * 1.2}px 'Roboto Mono', monospace`; 
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
            if (isCorrect) { 
                ctx.fillStyle = colors.magnet; // Make correct letters stand out more
                ctx.shadowColor = colors.magnet; ctx.shadowBlur = 15; 
            } else { 
                ctx.fillStyle = colors.obstacle; ctx.shadowBlur = 0; 
            } 
            ctx.fillText(item.letter, item.x + item.width / 2, item.y + item.height / 2); ctx.shadowBlur = 0; 
        }; 
        return item; 
    }
    
    function update() { updateEffects(); handlePlayerInput(); updatePlayer(); updateItems(); updateBullets(); updateParticles(); checkCollisions(); spawnItems(); runScore++; updateUI(); }

    function handlePlayerItemCollision(item, idx) {
        if (item.type.startsWith('letter')) {
            items.splice(idx, 1); // Remove letter regardless of correct or wrong
            if (item.letter === TARGET_WORD[currentLetterIndex]) { 
                currentLetterIndex++;
                AudioManager.playSound('promise');
                if (currentLetterIndex >= TARGET_WORD.length) {
                    handleFinalWin();
                } else {
                    updateUI();
                }
            } else { 
                handleLetterModeFailure(); 
            }
            return;
        }

        // Obstacles (if any are ever added back) or wrong letters
        if (player.state.isShielded) {
            player.state.isShielded = false; player.state.shieldTimer = 0;
            createBurst(item.x, item.y, colors.shield); 
            AudioManager.playSound('explode');
            items.splice(idx, 1);
        } else {
            handleGameOver();
        }
    }
    
    function updateUI() { 
        if (gameState === 'LETTER_MODE') { 
            const lettersFound = TARGET_WORD.slice(0, currentLetterIndex); 
            const currentTarget = TARGET_WORD.substring(currentLetterIndex); // Show remaining letters
            const formattedTarget = `<strong style="color:${colors.magnet}">${currentTarget.charAt(0)}</strong>` + `<span style="opacity: 0.5;">${currentTarget.substring(1)}</span>`
            targetLetterDisplay.innerHTML = `Target: ${formattedTarget}`; 
            scoreDisplay.innerHTML = `Found: <span class="collect-color">${lettersFound}</span>`; 
        } 
        
        let tHTML = ''; 
        if(powerupTimersContainer) { 
            if (player.state.shieldTimer > 0) tHTML += `<div class="powerup-timer">🛡️ ${(player.state.shieldTimer / 60).toFixed(1)}s</div>`; 
            if (player.state.magnetTimer > 0) tHTML += `<div class="powerup-timer">🧲 ${(player.state.magnetTimer / 60).toFixed(1)}s</div>`; 
            if (player.state.boostTimer > 0) tHTML += `<div class="powerup-timer">🚀 ${(player.state.boostTimer / 60).toFixed(1)}s</div>`; 
            powerupTimersContainer.innerHTML = tHTML; 
        } 
    }
    function setupEventListeners() { window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true); window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false); canvas.addEventListener('mousemove', e => { if ((gameState !== 'LETTER_MODE') || isTouchDevice) return; player.x = e.clientX - wrapper.getBoundingClientRect().left - player.width / 2; }); canvas.addEventListener('touchmove', e => { e.preventDefault(); if ((gameState !== 'LETTER_MODE')) return; player.x = e.touches[0].clientX - wrapper.getBoundingClientRect().left - player.width / 2; }, { passive: false }); startBtn.addEventListener('click', startGame); retryBtn.addEventListener('click', startGame); window.addEventListener('resize', resizeCanvas); }
    function updatePlayer() { if(player.shootCooldown > 0) player.shootCooldown--; player.currentFireRate = player.state.isBoostActive ? player.baseFireRate / 2 : player.baseFireRate; Object.keys(player.state).forEach(key => { if (key.endsWith('Timer') && player.state[key] > 0) { player.state[key]--; if (player.state[key] <= 0) { const base = key.replace('Timer', ''); player.state[`is${base.charAt(0).toUpperCase() + base.slice(1)}Active`] = false; } } }); }
    function handlePlayerInput() { let moveDir = effects.isControlsInverted ? -1 : 1; if (keys['arrowleft'] || keys['a']) player.x -= player.speed * moveDir; if (keys['arrowright'] || keys['d']) player.x += player.speed * moveDir; if (player.x < 0) player.x = 0; if (player.x + player.width > canvas.width) player.x = canvas.width - player.width; if ((keys[' '] || isTouchDevice) && player.shootCooldown <= 0) { shoot(); player.shootCooldown = player.currentFireRate; } }
    function shoot() { const w = 4 * scaleRatio, h = 15 * scaleRatio; bullets.push({ x: player.x + player.width / 2 - w / 2, y: player.y, width: w, height: h, speed: 10 * scaleRatio }); AudioManager.playSound('shoot'); }
    function updateItems() { for (let i = items.length - 1; i >= 0; i--) { const item = items[i]; if (!item) continue; item.y += item.speed; if (item.y > canvas.height + 40 * scaleRatio) items.splice(i, 1); } }
    function checkCollisions() { for (let i = items.length - 1; i >= 0; i--) { if (items[i] && isColliding(player, items[i])) handlePlayerItemCollision(items[i], i); } for (let i = bullets.length - 1; i >= 0; i--) { if (!bullets[i]) continue; for (let j = items.length - 1; j >= 0; j--) { const item = items[j]; if (!item) continue; if (item.type === 'letter_wrong' && isColliding(bullets[i], item)) { item.hitTimer = 10; bullets.splice(i, 1); createBurst(item.x, item.y, colors.obstacle, 15); AudioManager.playSound('explode'); runScore += 50; items.splice(j, 1); break; } } } }
    function updateEffects() { if (effects.distortionTimer > 0) { effects.distortionTimer--; if (effects.distortionTimer <= 0) { wrapper.classList.remove('fx-blur'); effects.isControlsInverted = false; } } }
    function updateBullets() { for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= bullets[i].speed; if (bullets[i].y < -10 * scaleRatio) bullets.splice(i, 1); } }
    function updateParticles() { for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life--; p.x += p.vx; p.y += p.vy; if (p.life <= 0) particles.splice(i, 1); } }
    function updateBackground() { stars.forEach(s => { s.y += s.speed; if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; } }); }
    function isColliding(r1, r2) { const p = 5 * scaleRatio; return r1.x < r2.x + r2.width - p && r1.x + r1.width > r2.x + p && r1.y < r2.y + r2.height - p && r1.y + r1.height > r2.y + p; }
    function draw() { drawItems(); drawBullets(); drawPlayer(); drawParticles(); }
    function drawPlayer() { const x = player.x, y = player.y, w = player.width, h = player.height; ctx.fillStyle = colors.white; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); const th = (10 * scaleRatio) + Math.sin(frame * 0.5) * (5 * scaleRatio); ctx.fillStyle = colors.primary; ctx.fillRect(x + w / 2 - (5 * scaleRatio), y + h, 10 * scaleRatio, th); if (player.state.isShielded) { ctx.strokeStyle = `hsl(${frame % 360},100%,70%)`; ctx.lineWidth = 3 * scaleRatio; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 + (10 * scaleRatio), 0, 2 * Math.PI); ctx.stroke(); } }
    function drawItems() { items.forEach(item => item.draw(ctx, frame)); }
    function drawBullets() { bullets.forEach(b => { ctx.fillStyle = '#FFCC00'; ctx.fillRect(b.x, b.y, b.width, b.height); }); }
    function drawParticles() { for (const p of particles) { ctx.globalAlpha = p.life / p.initialLife; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1; } }
    function drawBackground() { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; stars.forEach(s => { ctx.globalAlpha = s.opacity; ctx.fillRect(s.x, s.y, s.size, s.size); }); ctx.globalAlpha = 1; }
    function createBurst(x, y, color, count = 20) { for (let i = 0; i < count; i++) particles.push({ x, y, size: (Math.random() * 3 + 1) * scaleRatio, color, initialLife: 40, life: 40, vx: (Math.random() - 0.5) * 8 * scaleRatio, vy: (Math.random() - 0.5) * 8 * scaleRatio }); }
    function resizeCanvas() { if (!wrapper || !canvas) return; canvas.width = wrapper.clientWidth; canvas.height = wrapper.clientHeight; scaleRatio = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT) || 1; player.width = player.baseWidth * scaleRatio; player.height = player.baseHeight * scaleRatio; player.speed = player.baseSpeed * scaleRatio; player.y = canvas.height - (60 * scaleRatio); stars = []; for (let i = 0; i < 150; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: (Math.random() * 1.5 + 0.5), size: (Math.random() * 2 + 0.5), opacity: Math.random() * 0.8 + 0.2 }); if (gameState !== 'LETTER_MODE' && gameState !=='GAMEOVER') resetRunState(); }

    init();
}