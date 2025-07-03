const AudioManager = {
    sounds: {},
    soundtrack: null,
    isMuted: false, // In case you want to add a mute button later

    loadSound: function(name, path, loop = false, volume = 1) {
        const audio = new Audio(path);
        audio.loop = loop;
        audio.volume = volume;
        this.sounds[name] = audio;
    },

    loadSoundtrack: function(path, volume = 0.5) {
        this.soundtrack = new Audio(path);
        this.soundtrack.loop = true;
        this.soundtrack.volume = volume;
    },

    playSound: function(name) {
        if (this.sounds[name] && !this.isMuted) {
            this.sounds[name].currentTime = 0; // Rewind to play from start
            this.sounds[name].play().catch(e => console.error("Sound play failed:", e));
        }
    },

    startSoundtrack: function() {
        if (this.soundtrack && !this.isMuted) {
            this.soundtrack.play().catch(e => {
                console.log("Soundtrack play requires user interaction. It will start on the first click.");
                // This is a common browser policy. Audio will start on the first user click.
                const playOnFirstInteraction = () => {
                    this.soundtrack.play().catch(e => console.error("Soundtrack play failed:", e));
                    window.removeEventListener('click', playOnFirstInteraction);
                };
                window.addEventListener('click', playOnFirstInteraction);
            });
        }
    },

    stopSoundtrack: function() {
        if (this.soundtrack) {
            this.soundtrack.pause();
            this.soundtrack.currentTime = 0;
        }
    },
    
    // Example: Fade out and then stop
    fadeOutSoundtrack: function(duration = 2000) {
        if (!this.soundtrack) return;

        let startVolume = this.soundtrack.volume;
        let startTime = Date.now();

        const fade = () => {
            let elapsedTime = Date.now() - startTime;
            let newVolume = startVolume * (1 - (elapsedTime / duration));
            
            if (newVolume > 0) {
                this.soundtrack.volume = newVolume;
                requestAnimationFrame(fade);
            } else {
                this.stopSoundtrack();
                this.soundtrack.volume = startVolume; // Reset volume for next time
            }
        };
        fade();
    },
    
    // Example: Increase or decrease rhythm
    setSoundtrackPitch(rate = 1.0) {
        if(this.soundtrack) {
            this.soundtrack.playbackRate = rate;
        }
    }
};

// --- Preload All Game Sounds ---
// *** IMPORTANT: Find sound files and place them in 'assets' folder with these names ***
AudioManager.loadSoundtrack('assets/soundtrack.mp3', 0.4);
AudioManager.loadSound('typewriter', 'assets/typewriter.wav', false, 0.6);
AudioManager.loadSound('promise', 'assets/promise.wav', false, 0.7);
AudioManager.loadSound('transition', 'assets/transition.wav', false, 0.5);
AudioManager.loadSound('shoot', 'assets/shoot.wav', false, 0.3);
AudioManager.loadSound('collect', 'assets/collect.wav', false, 0.6);
AudioManager.loadSound('powerup', 'assets/powerup.wav', false, 0.7);
AudioManager.loadSound('explode', 'assets/explode.wav', false, 0.5);
AudioManager.loadSound('damage', 'assets/damage.wav', false, 0.8);
AudioManager.loadSound('distort', 'assets/distort.wav', false, 0.6);