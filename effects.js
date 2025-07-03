// --- Glitch Effect Manager ---
const GlitchManager = {
    glitchElement: null,
    
    init: function() {
        if (this.glitchElement) return; // Don't create twice
        this.glitchElement = document.createElement('div');
        this.glitchElement.className = 'glitch-layer';
        document.body.appendChild(this.glitchElement);
    },
    
    trigger: function(duration = 400) {
        // Init if it hasn't been already
        if (!this.glitchElement) this.init();
        
        document.body.classList.add('is-glitching');
        setTimeout(() => {
            document.body.classList.remove('is-glitching');
        }, duration);
    }
};

// --- Echo Effect Manager (for the end screen) ---
const EchoManager = {
    canvas: null,
    ctx: null,
    particle: null,

    init: function() {
        // Find existing canvas or create new one
        this.canvas = document.getElementById('bg-canvas') || document.createElement('canvas');
        if (!document.getElementById('bg-canvas')) {
             this.canvas.id = 'bg-canvas';
             document.body.prepend(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.particle = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 2,
            maxSize: 15,
            opacity: 1,
            life: 0
        };
        
        window.addEventListener('resize', () => this.resize());
        this.animate();
    },
    
    resize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.particle) {
            this.particle.x = this.canvas.width / 2;
            this.particle.y = this.canvas.height / 2;
        }
    },
    
    animate: function() {
        if(!this.particle) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particle.life++;
        const pulse = Math.sin(this.particle.life * 0.05);
        const currentSize = this.particle.size + (pulse * this.particle.maxSize);
        this.particle.opacity -= 0.002;

        if (this.particle.opacity <= 0) {
            const finalMessage = document.createElement('div');
            finalMessage.className = 'final-message';
            finalMessage.innerHTML = `
                <h1>The Story is Complete</h1>
                <p class="description">Thank you for listening.</p>`;
            document.body.appendChild(finalMessage);
            return; // Stop animation
        }

        this.ctx.beginPath();
        this.ctx.arc(this.particle.x, this.particle.y, Math.max(0, currentSize), 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(178, 59, 78, ${this.particle.opacity})`;
        this.ctx.fill();

        requestAnimationFrame(() => this.animate());
    }
}