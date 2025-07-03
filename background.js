// NEW: A global flag to control the animation loop.
// This acts as a switch to turn the background on or off.
let isBackgroundAnimationRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let particles = [];
    const particleCount = 70;
    const connectionDistance = 200;

    const mouse = {
        x: null,
        y: null,
        radius: 150
    };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });
     window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor(x, y, dirX, dirY, size, color) {
            this.x = x;
            this.y = y;
            this.dirX = dirX;
            this.dirY = dirY;
            this.size = size;
            this.color = color;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.dirX = -this.dirX;
            if (this.y > canvas.height || this.y < 0) this.dirY = -this.dirY;

            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
                if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
                if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
            }

            this.x += this.dirX;
            this.y += this.dirY;
            this.draw();
        }
    }

    function init() {
        particles = [];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        for (let i = 0; i < particleCount; i++) {
            let size = Math.random() * 2 + 1;
            let x = Math.random() * (innerWidth - size * 2);
            let y = Math.random() * (innerHeight - size * 2);
            let dirX = (Math.random() * .4) - .2;
            let dirY = (Math.random() * .4) - .2;
            particles.push(new Particle(x, y, dirX, dirY, size, 'rgba(178, 59, 78, 0.5)'));
        }
    }

    function connect() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    const opacity = 1 - (distance / connectionDistance);
                    ctx.strokeStyle = `rgba(178, 59, 78, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // MODIFIED: The animation loop now checks the global flag before continuing.
    function animate() {
        // If the flag is set to false from another script, this will stop the animation chain.
        if (!isBackgroundAnimationRunning) return;

        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        connect();
    }
    
    window.addEventListener('resize', init);
    
    // The script starts by default
    init();
    isBackgroundAnimationRunning = true;
    animate();
});

// NEW: This global function allows another script to stop the animation.
// The SceneManager in index.html will call this before starting the final "echo" scene.
function stopBackgroundAnimation() {
    isBackgroundAnimationRunning = false;
}