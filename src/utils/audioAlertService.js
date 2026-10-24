// Zero-Latency Web Audio Engine for Realtime Order Chimes (Toast / Square / UberEats Grade)

class AudioAlertService {
    constructor() {
        this.ctx = null;
        this.audioBuffer = null;
        this.isLoaded = false;
        this.isUnlocked = false;

        // Auto-unlock on first user interaction anywhere on the page
        if (typeof window !== 'undefined') {
            const unlockHandler = () => {
                this.unlock();
                window.removeEventListener('click', unlockHandler);
                window.removeEventListener('touchstart', unlockHandler);
                window.removeEventListener('keydown', unlockHandler);
            };
            window.addEventListener('click', unlockHandler, { passive: true });
            window.addEventListener('touchstart', unlockHandler, { passive: true });
            window.addEventListener('keydown', unlockHandler, { passive: true });

            // Iniciar pré-carregamento imediato do som
            this.preload();
        }
    }

    getAudioContext() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    unlock() {
        const ctx = this.getAudioContext();
        if (ctx) {
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    this.isUnlocked = true;
                }).catch(() => {});
            } else {
                this.isUnlocked = true;
            }
        }
    }

    async preload() {
        if (typeof window === 'undefined') return;
        try {
            const response = await fetch('/bell.mp3');
            if (!response.ok) throw new Error('Falha ao descarregar som');
            const arrayBuffer = await response.arrayBuffer();
            const ctx = this.getAudioContext();
            if (ctx) {
                this.audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                this.isLoaded = true;
                console.log('[AudioAlertService] Som do sino pré-carregado em RAM (Zero-Latency).');
            }
        } catch (e) {
            console.warn('[AudioAlertService] Aviso ao pré-carregar ficheiro de áudio. O sintetizador harmónico de contingência será utilizado:', e);
        }
    }

    // Tocar sino instantâneo com 0ms de latência
    play(volume = 0.9) {
        if (typeof window === 'undefined') return;

        // Vibração física em dispositivos móveis (ex: tablets e telemóveis de cozinha)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate([250, 100, 250, 100, 400]);
            } catch {}
        }

        const ctx = this.getAudioContext();
        if (!ctx) return;

        // Se o buffer do ficheiro MP3 já está decodificado na memória RAM:
        if (this.audioBuffer) {
            try {
                const source = ctx.createBufferSource();
                source.buffer = this.audioBuffer;

                const gainNode = ctx.createGain();
                gainNode.gain.setValueAtTime(Math.min(1.0, Math.max(0.1, volume)), ctx.currentTime);

                source.connect(gainNode);
                gainNode.connect(ctx.destination);

                source.start(0);
                return;
            } catch (err) {
                console.warn('[AudioAlertService] Falha ao reproduzir buffer, a usar sintetizador harmónico:', err);
            }
        }

        // Contingência Sintetizada: Sino Dourado de Restaurante de Alta Resolução (Harmonic Brass Chime)
        // Dois tons harmónicos (G5 = 783.99 Hz e C6 = 1046.50 Hz) com queda exponencial suave
        try {
            const now = ctx.currentTime;

            // Oscilador 1 (Fundamental)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(783.99, now); // G5
            osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1); // Transição para C6

            gain1.gain.setValueAtTime(volume * 0.8, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

            osc1.connect(gain1);
            gain1.connect(ctx.destination);

            // Oscilador 2 (Brilho Metálico - Harmónico Superior)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1567.98, now); // G6 (Brilho metálico)

            gain2.gain.setValueAtTime(volume * 0.4, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.7);
            osc2.stop(now + 1.3);
        } catch (synthErr) {
            console.error('[AudioAlertService] Erro no sintetizador:', synthErr);
            // Último recurso: HTML5 Audio clássico
            try {
                const fallback = new Audio('/bell.mp3');
                fallback.volume = volume;
                fallback.play().catch(() => {});
            } catch {}
        }
    }
}

export const audioAlertService = new AudioAlertService();
export default audioAlertService;
