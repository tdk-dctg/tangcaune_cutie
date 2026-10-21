// ==========================================================================
// 21/10 FOR TQZ — FULL-SCREEN TULIP MEADOW & SMOOTH CURSOR TRAIL
// ==========================================================================

const TQZ_WISHES = `Chúc TQZ 21/10 luôn vui vereeee, chúc cậu sớm đạt aim, có tất cả trừ vất vả! ✨🌷`;

let openLetterPopup = null;

// Stage Switching
function goToStage(stageId) {
    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active');
    });
    const target = document.getElementById(stageId);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ==========================================================================
// ==========================================================================
// AUDIO PLAYLIST CONTROLLER (DYNAMIC ISLAND STYLE WIDGET)
// ==========================================================================
class AudioPlaylistController {
    constructor() {
        this.corner = document.getElementById('audio-player-card');
        this.titleEl = document.getElementById('audio-title');
        this.playBtn = document.getElementById('audio-play-btn');
        this.playIcon = document.getElementById('play-icon');
        this.prevBtn = document.getElementById('audio-prev-btn');
        this.nextBtn = document.getElementById('audio-next-btn');
        this.disc = document.getElementById('audio-disc');
        this.hintTag = document.getElementById('audio-card-hint');
        this.uploadInput = document.getElementById('custom-audio-file');
        this.audioEl = document.getElementById('real-audio-element');

        // Playlist Drawer Elements
        this.playlistBtn = document.getElementById('audio-playlist-btn');
        this.playlistDrawer = document.getElementById('audio-playlist-drawer');
        this.playlistListEl = document.getElementById('playlist-items-list');
        this.playlistCloseBtn = document.getElementById('playlist-close-btn');
        this.isPlaylistOpen = false;
        this.isHoveringPlaylist = false;
        this.playlistCloseTimer = null;

        // Dynamic Island Elements
        this.islandPill = document.getElementById('audio-island-pill');
        this.islandTitle = document.getElementById('island-title');
        this.islandDiscMini = document.getElementById('island-disc-mini');
        this.isHovering = false;
        this.collapseTimer = null;

        this.isPlaying = false;
        this.currentIndex = 0;
        this.isCustom = false;

        // Danh sách 4 bài hát yêu thích theo đúng thứ tự:
        // 1. Ờ Lờ Waay -> 2. Bét Pát -> 3. Ai Ngoài Em -> 4. Tay Bé
        this.tracks = [
            {
                name: "1. Ờ Lờ Waay 🌷",
                src: "track1_always.ogg"
            },
            {
                name: "2. Bét Pát 🎵",
                src: "track2_betpat.ogg"
            },
            {
                name: "3. Ai Ngoài Em 💖",
                src: "track3_aingoaiem.ogg"
            },
            {
                name: "4. Tay Bé 🌻",
                src: "track4_taybe.ogg"
            }
        ];

        this.init();
    }

    init() {
        if (!this.corner) return;

        this.updateUI();

        // 1. Tương tác Dynamic Island (Phóng to khi hover/tap, thu nhỏ khi rời đi)
        if (this.islandPill) {
            this.islandPill.addEventListener('click', (e) => {
                e.stopPropagation();
                this.corner.classList.add('expanded');
                clearTimeout(this.collapseTimer);
            });
        }

        this.corner.addEventListener('mouseenter', () => {
            this.isHovering = true;
            clearTimeout(this.collapseTimer);
            this.corner.classList.add('expanded');
        });

        this.corner.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.collapseTimer = setTimeout(() => {
                if (!this.isHovering && !this.isPlaylistOpen) {
                    this.corner.classList.remove('expanded');
                }
            }, 700);
        });

        // Ban đầu mới vào trang: Phóng to 4 giây để gây chú ý, sau đó thu nhỏ lại kiểu Dynamic Island
        this.collapseTimer = setTimeout(() => {
            if (!this.isHovering) {
                this.corner.classList.remove('expanded');
            }
        }, 4000);

        if (this.playBtn) {
            this.playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlay();
            });
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextTrack();
            });
        }

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevTrack();
            });
        }

        // Bấm vào đĩa quay thì bật/tắt nhạc
        if (this.disc) {
            this.disc.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlay();
            });
        }

        // Bấm vào hint badge "Bấm vào đây để chuyển nhạc các kiểu =))" -> Chuyển bài ngay!
        if (this.hintTag) {
            this.hintTag.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextTrack();
                if (!this.isPlaying) this.play();
            });
        }

        // Chọn file MP3 từ máy của người dùng
        if (this.uploadInput) {
            this.uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadCustomAudio(file);
                }
            });
        }

        // Tương tác Playlist: Rê chuột vào Playlist thì hiện menu, rê ra ngoài thì tự động ẩn
        if (this.playlistBtn && this.playlistDrawer) {
            // 1. Rê chuột vào nút Playlist -> Mở ngay lập tức
            this.playlistBtn.addEventListener('mouseenter', () => {
                this.isHoveringPlaylist = true;
                clearTimeout(this.playlistCloseTimer);
                this.togglePlaylist(true);
            });

            // 2. Rời chuột khỏi nút Playlist -> Chờ 280ms để kiểm tra nếu chuột di chuyển vào bảng playlist
            this.playlistBtn.addEventListener('mouseleave', () => {
                this.isHoveringPlaylist = false;
                this.schedulePlaylistClose();
            });

            // 3. Chuột di chuyển vào trong bảng Playlist -> Giữ mở liên tục
            this.playlistDrawer.addEventListener('mouseenter', () => {
                this.isHoveringPlaylist = true;
                clearTimeout(this.playlistCloseTimer);
            });

            // 4. Chuột rời khỏi bảng Playlist -> Tự động đóng lại mượt mà
            this.playlistDrawer.addEventListener('mouseleave', () => {
                this.isHoveringPlaylist = false;
                this.schedulePlaylistClose();
            });

            // 5. Click nút (hoặc chạm trên điện thoại) -> Vẫn toggle bình thường
            this.playlistBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlaylist();
            });
        }

        if (this.playlistCloseBtn) {
            this.playlistCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlaylist(false);
            });
        }

        // Tự động render danh sách 4 bài hát
        this.renderPlaylist();

        // Tự động chuyển sang bài tiếp theo khi bài hiện tại hát xong
        if (this.audioEl) {
            this.audioEl.addEventListener('ended', () => {
                this.nextTrack();
            });
        }

        // Gán sẵn bài 1 (Ờ Lờ Waay) vào audio element nếu chưa có
        if (this.audioEl) {
            if (!this.audioEl.src || !this.audioEl.src.includes('track1_always.ogg')) {
                this.audioEl.src = this.tracks[0].src;
            }
            this.audioEl.volume = 1.0;
        }

        // 1. Thử phát ngay bài 1 (Ờ Lờ Waay) khi vừa tải trang
        this.playTrack(0);

        // 2. Kích hoạt phát ngay khi có bất kỳ tương tác đầu tiên nào trên toàn trang (capture: true)
        const unlockAudio = () => {
            if (!this.isPlaying || (this.audioEl && this.audioEl.paused)) {
                this.playTrack(this.currentIndex);
            }
            const prompt = document.getElementById('music-start-prompt');
            if (prompt) prompt.classList.add('fade-out');
            ['pointerdown', 'mousedown', 'click', 'touchstart', 'touchend', 'keydown', 'wheel', 'scroll'].forEach(evt => {
                window.removeEventListener(evt, unlockAudio, { capture: true });
                document.removeEventListener(evt, unlockAudio, { capture: true });
            });
        };

        ['pointerdown', 'mousedown', 'click', 'touchstart', 'touchend', 'keydown', 'wheel', 'scroll'].forEach(evt => {
            window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
            document.addEventListener(evt, unlockAudio, { capture: true, passive: true });
        });

        const prompt = document.getElementById('music-start-prompt');
        if (prompt) {
            prompt.addEventListener('click', unlockAudio);
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.playTrack(this.currentIndex);
        }
    }

    play() {
        this.playTrack(this.currentIndex);
    }

    playTrack(index) {
        if (typeof index === 'number') {
            this.currentIndex = index;
        }
        if (this.currentIndex < 0 || this.currentIndex >= this.tracks.length) {
            this.currentIndex = 0;
        }

        const curTrack = this.tracks[this.currentIndex];
        if (!this.isCustom && curTrack && curTrack.src) {
            if (!this.audioEl.src || !this.audioEl.src.includes(curTrack.src)) {
                this.audioEl.src = curTrack.src;
            }
        }

        const prompt = document.getElementById('music-start-prompt');
        if (prompt) prompt.classList.add('fade-out');

        const playPromise = this.audioEl.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                if (this.corner) this.corner.classList.add('playing');
                if (this.playIcon) this.playIcon.textContent = '⏸';
                this.updateUI();
            }).catch((err) => {
                console.log('Autoplay deferred until user interaction:', err);
                this.isPlaying = false;
                if (this.corner) this.corner.classList.remove('playing');
                if (this.playIcon) this.playIcon.textContent = '▶';
                this.updateUI();
            });
        }
        this.updateUI();
    }

    pause() {
        this.isPlaying = false;
        if (this.corner) this.corner.classList.remove('playing');
        if (this.playIcon) this.playIcon.textContent = '▶';

        if (this.audioEl) {
            this.audioEl.pause();
        }
        this.renderPlaylist();
    }

    nextTrack() {
        if (this.audioEl) {
            this.audioEl.pause();
        }
        this.isCustom = false;
        this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
        this.updateUI();
        this.playTrack(this.currentIndex);
    }

    prevTrack() {
        if (this.audioEl) {
            this.audioEl.pause();
        }
        this.isCustom = false;
        this.currentIndex = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
        this.updateUI();
        this.playTrack(this.currentIndex);
    }

    loadCustomAudio(file) {
        this.isCustom = true;
        const url = URL.createObjectURL(file);
        this.audioEl.src = url;
        const songName = file.name.replace(/\.[^/.]+$/, "");
        if (this.titleEl) this.titleEl.textContent = `🎵 ${songName}`;
        if (this.islandTitle) this.islandTitle.textContent = songName;
        this.playTrack();
    }

    updateUI() {
        if (!this.isCustom) {
            const trackName = this.tracks[this.currentIndex].name;
            if (this.titleEl) this.titleEl.textContent = trackName;
            if (this.islandTitle) this.islandTitle.textContent = trackName;
        }
        this.renderPlaylist();
    }

    renderPlaylist() {
        if (!this.playlistListEl) return;
        this.playlistListEl.innerHTML = '';
        this.tracks.forEach((track, idx) => {
            const item = document.createElement('div');
            const isCurrent = idx === this.currentIndex && !this.isCustom;
            item.className = `playlist-item ${isCurrent ? 'active' : ''}`;
            item.title = `Bấm để phát bài "${track.name}"`;

            let emoji = '🎵';
            if (track.name.includes('🌷')) emoji = '🌷';
            else if (track.name.includes('💖')) emoji = '💖';
            else if (track.name.includes('🌻')) emoji = '🌻';
            else if (track.name.includes('☀️')) emoji = '☀️';

            const cleanName = track.name.replace(/[🌷💖🌻☀️🎵]/g, '').trim();

            item.innerHTML = `
                <div class="playlist-item-left">
                    <span class="playlist-item-icon">${emoji}</span>
                    <span class="playlist-item-title">${cleanName}</span>
                </div>
                ${isCurrent && this.isPlaying ? `
                    <div class="playlist-playing-indicator">
                        <span class="indicator-bar"></span>
                        <span class="indicator-bar"></span>
                        <span class="indicator-bar"></span>
                    </div>
                ` : (isCurrent ? '<span style="font-size:0.75rem; color:#b86800; font-weight:700;">▶ Sẵn sàng</span>' : '')}
            `;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectTrack(idx);
            });

            this.playlistListEl.appendChild(item);
        });
    }

    schedulePlaylistClose() {
        clearTimeout(this.playlistCloseTimer);
        this.playlistCloseTimer = setTimeout(() => {
            if (!this.isHoveringPlaylist) {
                this.togglePlaylist(false);
            }
        }, 280);
    }

    togglePlaylist(show) {
        if (!this.playlistDrawer) return;
        this.isPlaylistOpen = typeof show === 'boolean' ? show : !this.isPlaylistOpen;
        if (this.isPlaylistOpen) {
            this.playlistDrawer.classList.remove('hidden');
            if (this.playlistBtn) this.playlistBtn.classList.add('active');
            this.corner.classList.add('expanded');
            clearTimeout(this.collapseTimer);
            this.renderPlaylist();
        } else {
            this.playlistDrawer.classList.add('hidden');
            if (this.playlistBtn) this.playlistBtn.classList.remove('active');
        }
    }

    selectTrack(idx) {
        if (this.audioEl) {
            this.audioEl.pause();
        }
        this.isCustom = false;
        this.currentIndex = idx;
        this.updateUI();
        this.playTrack(idx);
        // Sau khi chọn bài, tự động đóng menu sau 250ms nếu chuột đã ra ngoài
        setTimeout(() => {
            if (!this.isHoveringPlaylist) {
                this.togglePlaylist(false);
            }
        }, 250);
    }
}

// ==========================================================================
// 1. CURSOR TRAIL & CLICK BURST (100% GPU-Accelerated, Zero Lag)
// ==========================================================================
function initCursorTrail() {
    const layer = document.getElementById('cursor-trail-layer');
    if (!layer) return;

    let lastTime = 0;
    const symbols = ['✨', '⭐', '🌷', '💫', '🌸'];

    function createParticle(x, y, isBurst = false) {
        const p = document.createElement('span');
        p.className = 'trail-spark';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.left = x + 'px';
        p.style.top = y + 'px';

        // Random dispersion angles
        const angle = isBurst ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * 1.5 - Math.PI / 2;
        const dist = isBurst ? Math.random() * 80 + 30 : Math.random() * 25 + 10;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const rot = (Math.random() - 0.5) * 180 + 'deg';

        p.style.setProperty('--tx', tx + 'px');
        p.style.setProperty('--ty', ty + 'px');
        p.style.setProperty('--rot', rot);
        p.style.fontSize = (isBurst ? Math.random() * 8 + 14 : Math.random() * 6 + 11) + 'px';

        layer.appendChild(p);
        setTimeout(() => p.remove(), 750);
    }

    // Mouse Move (Throttled for silky zero-lag performance)
    window.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (now - lastTime > 60) {
            createParticle(e.clientX, e.clientY);
            lastTime = now;
        }
    });

    // Touch Move (Mobile)
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const t = e.touches[0];
            const now = performance.now();
            if (now - lastTime > 65) {
                createParticle(t.clientX, t.clientY);
                lastTime = now;
            }
        }
    }, { passive: true });

    // Click / Tap Burst (Gọn nhẹ 4 hạt để không giật lag)
    window.addEventListener('click', (e) => {
        for (let i = 0; i < 4; i++) {
            createParticle(e.clientX, e.clientY, true);
        }
    });
}

// ==========================================================================
// 2. CẢ VƯỜN HOA TULIP NỞ TOÀN MÀN HÌNH (FULL-SCREEN MEADOW)
// ==========================================================================

// Web Audio API Sound Effects (Nhẹ nhàng, hoàn toàn độc lập, không lo rớt mạng)
function playBloomSoundEffect() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        // 7 nốt glissando lấp lánh như chuông thần tiên khi hoa bung nở
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);

            gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
            gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + idx * 0.11 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.11 + 0.55);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.11);
            osc.stop(ctx.currentTime + idx * 0.11 + 0.6);
        });
    } catch (e) {
        // fail silently
    }
}

function playPhotoBloomChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        // 4 nốt đàn hạc cao vút trong trẻo khi bấm vào ảnh
        const notes = [880.00, 1174.66, 1396.91, 1760.00];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

            gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + idx * 0.07 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.07 + 0.45);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.07);
            osc.stop(ctx.currentTime + idx * 0.07 + 0.5);
        });
    } catch (e) {
        // fail silently
    }
}

// Bắn hạt phấn hoa lấp lánh khi thân hoa vươn tới đỉnh và nở cánh
function spawnBloomPollen(plant) {
    const bud = plant.querySelector('.flower-bud');
    if (!bud) return;
    const rect = bud.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const count = 3;
    const symbols = ['✨', '🌷', '🌟'];
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'bloom-pollen-sparkle';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.left = (rect.left + rect.width / 2 + (Math.random() * 20 - 10)) + 'px';
        p.style.top = (rect.top + rect.height / 2 + (Math.random() * 16 - 8)) + 'px';
        p.style.setProperty('--vx', (Math.random() * 40 - 20) + 'px');
        p.style.setProperty('--vy', -(Math.random() * 40 + 20) + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
    }
}

let bloomTimer = null;

function replayFlowerBloom() {
    const wrap = document.getElementById('tulip-meadow-wrap');
    const subtitle = document.getElementById('garden-subtitle');
    const header = document.querySelector('.garden-header');
    if (!wrap) return;

    if (bloomTimer) clearTimeout(bloomTimer);

    // 0. Tạm ẩn bảng giới thiệu để nhường toàn bộ màn hình ngắm trọn cảnh hoa mọc
    if (header) {
        header.classList.add('hidden-during-bloom');
    }

    // 1. Áp dụng instant-reset: Thu toàn bộ thân hoa về mặt đất tức thì
    wrap.classList.add('instant-reset');
    wrap.classList.remove('bloomed');

    wrap.querySelectorAll('.stem').forEach(st => { st.style.height = '0'; });
    wrap.querySelectorAll('.stem-curved').forEach(st => { st.style.height = '0'; });

    // Force single reflow
    void wrap.offsetHeight;

    // 2. Phát âm thanh chuông hoa nở lãng mạn
    playBloomSoundEffect();

    // 3. Gỡ instant-reset và kích hoạt mọc theo trình tự tự nhiên (Thân vươn cao -> Hoa mới xòe cánh nở rộ)
    // Phân tách 2 giai đoạn để triệt tiêu hoàn toàn hiện tượng khựng giật khung hình!
    bloomTimer = setTimeout(() => {
        wrap.classList.remove('instant-reset');
        void wrap.offsetHeight;

        const layerCanopy = document.getElementById('meadow-canopy');
        const layerBack = document.getElementById('meadow-back');
        const layerMid = document.getElementById('meadow-mid');
        const layerFront = document.getElementById('meadow-front');

        // GIAI ĐOẠN 1: Thân cây vươn lên mượt mà theo 3 tầng (0ms -> 100ms -> 200ms)
        if (layerCanopy) layerCanopy.querySelectorAll('.stem-curved').forEach(st => st.style.height = st.dataset.height);
        if (layerBack) layerBack.querySelectorAll('.stem').forEach(st => st.style.height = st.dataset.height);

        setTimeout(() => {
            if (layerMid) layerMid.querySelectorAll('.stem').forEach(st => st.style.height = st.dataset.height);
        }, 100);

        setTimeout(() => {
            if (layerFront) layerFront.querySelectorAll('.stem').forEach(st => st.style.height = st.dataset.height);
        }, 200);

        // GIAI ĐOẠN 2: Khi thân cây đã vươn lên tới đỉnh (~880ms), nụ hoa mới xòe cánh nở rộ và lá vươn rộng!
        // Tách rời thay đổi chiều cao thân và xoay/phóng to cánh hoa -> 60 FPS cực mượt!
        setTimeout(() => {
            wrap.classList.add('bloomed');
        }, 880);

        // Chỉ bắn nhẹ 3 hạt phấn hoa trên 2 bông hoa tiền cảnh chính
        setTimeout(() => {
            if (layerFront) {
                const frontPlants = layerFront.querySelectorAll('.tulip-plant');
                [2, 4].forEach(idx => {
                    if (frontPlants[idx]) spawnBloomPollen(frontPlants[idx]);
                });
            }
        }, 1400);

        // GIAI ĐOẠN 3: Bảng lời chúc xuất hiện nhẹ nhàng sau khi toàn bộ hoa đã nở rộ
        setTimeout(() => {
            if (header) {
                header.classList.remove('hidden-during-bloom');
            }
            if (subtitle) {
                subtitle.textContent = 'Vườn hoa tulip rực rỡ đã nở rộ tặng TQZ from tdk ✨';
            }
        }, 2400);
    }, 60);
}

function initTulipMeadow() {
    const wrap = document.getElementById('tulip-meadow-wrap');
    const layerCanopy = document.getElementById('meadow-canopy');
    const layerBack = document.getElementById('meadow-back');
    const layerMid = document.getElementById('meadow-mid');
    const layerFront = document.getElementById('meadow-front');
    const btnToMailbox = document.getElementById('btn-to-mailbox');
    const btnReplay = document.getElementById('btn-replay-bloom');
    const subtitle = document.getElementById('garden-subtitle');

    if (!wrap) return;

    // Helper tạo cấu trúc 1 đóa tulip mọc từ đất lên với lá phân bổ đều dọc thân (Tối ưu hóa: Không rườm rà DOM)
    function createTulipElement(options) {
        const plant = document.createElement('div');
        plant.className = 'tulip-plant';
        plant.style.left = options.left + '%';
        if (options.bottomOffset) plant.style.bottom = options.bottomOffset + 'px';

        const delay = options.delay || 0;
        const stemHeight = typeof options.stemH === 'number' ? `${options.stemH}px` : options.stemH;
        const colorClass = options.color ? `color-${options.color}` : 'color-gold';
        const stemNum = parseInt(options.stemH) || 30;

        // Sinh các tầng lá ôm dọc thân cây gọn gàng, đẹp mắt
        let leavesHTML = `
            <div class="leaf leaf-l leaf-base" style="transition-delay: ${delay + 0.3}s;"></div>
            <div class="leaf leaf-r leaf-base" style="transition-delay: ${delay + 0.3}s;"></div>
        `;
        if (stemNum >= 30) {
            leavesHTML += `
                <div class="leaf leaf-l leaf-tier-1" style="transition-delay: ${delay + 0.55}s;"></div>
                <div class="leaf leaf-r leaf-tier-1" style="transition-delay: ${delay + 0.55}s;"></div>
            `;
        }
        if (stemNum >= 55) {
            leavesHTML += `
                <div class="leaf leaf-l leaf-tier-2" style="transition-delay: ${delay + 0.8}s;"></div>
                <div class="leaf leaf-r leaf-tier-2" style="transition-delay: ${delay + 0.8}s;"></div>
            `;
        }
        if (stemNum >= 75) {
            leavesHTML += `
                <div class="leaf leaf-l leaf-tier-3" style="transition-delay: ${delay + 1.05}s;"></div>
                <div class="leaf leaf-r leaf-tier-3" style="transition-delay: ${delay + 1.05}s;"></div>
            `;
        }

        plant.innerHTML = `
            <div class="flower-bud ${colorClass}" style="transition-delay: ${delay + 0.3}s; width: ${options.budW}px; height: ${options.budH}px;">
                <div class="petal p-back" style="transition-delay: ${delay + 0.8}s;"></div>
                <div class="petal p-left" style="transition-delay: ${delay + 0.8}s;"></div>
                <div class="petal p-right" style="transition-delay: ${delay + 0.8}s;"></div>
                <div class="petal p-front" style="transition-delay: ${delay + 0.8}s;"></div>
                ${options.glow ? `<div class="flower-glow" style="transition-delay: ${delay + 1.2}s;"></div>` : ''}
            </div>
            <div class="stem" style="height: 0; transition-delay: ${delay}s; width: ${options.stemW || 9}px;" data-height="${stemHeight}"></div>
            <div class="tulip-leaves">${leavesHTML}</div>
        `;

        plant.addEventListener('click', (e) => {
            e.stopPropagation();
            plant.style.transform = 'scale(1.18) translateY(-10px)';
            setTimeout(() => { plant.style.transform = ''; }, 450);
        });

        return plant;
    }

    // Helper tạo bông tulip lơ lửng trên tầng cao / vòm trời
    function createFloatingTulipElement(options) {
        const plant = document.createElement('div');
        plant.className = 'floating-tulip';
        plant.style.left = options.left + '%';
        plant.style.top = options.top;
        const delay = options.delay || 0;
        const colorClass = options.color ? `color-${options.color}` : 'color-gold';

        plant.innerHTML = `
            <div class="flower-bud ${colorClass}" style="transition-delay: ${delay + 0.25}s; width: ${options.budW}px; height: ${options.budH}px;">
                <div class="petal p-back" style="transition-delay: ${delay + 0.7}s;"></div>
                <div class="petal p-left" style="transition-delay: ${delay + 0.7}s;"></div>
                <div class="petal p-right" style="transition-delay: ${delay + 0.7}s;"></div>
                <div class="petal p-front" style="transition-delay: ${delay + 0.7}s;"></div>
                ${options.glow ? `<div class="flower-glow" style="transition-delay: ${delay + 1.0}s;"></div>` : ''}
            </div>
            <div class="stem-curved" style="height: 0; transition-delay: ${delay}s;" data-height="35px"></div>
        `;

        plant.addEventListener('click', (e) => {
            e.stopPropagation();
            plant.style.transform = 'scale(1.22) translateY(-8px)';
            setTimeout(() => { plant.style.transform = ''; }, 450);
        });

        return plant;
    }

    // Tầng 0: Vòm hoa trên cao lơ lửng (5 bông nhẹ nhàng)
    const canopyTulips = [
        { left: 8, top: '9%', budW: 46, budH: 58, delay: 0.6, glow: true, color: 'gold' },
        { left: 28, top: '15%', budW: 44, budH: 54, delay: 0.8, glow: true, color: 'peach' },
        { left: 50, top: '8%', budW: 48, budH: 60, delay: 0.5, glow: true, color: 'gold' },
        { left: 72, top: '14%', budW: 44, budH: 54, delay: 0.7, glow: true, color: 'sunset' },
        { left: 92, top: '10%', budW: 46, budH: 58, delay: 0.6, glow: true, color: 'gold' }
    ];

    // Tầng 1: Hoa vươn chọc trời (9 bông cao vút phân bổ đều khắp chiều ngang)
    const backTulips = [
        { left: 5, stemH: '76vh', budW: 44, budH: 56, delay: 0.2, bottomOffset: 35, glow: true, color: 'gold' },
        { left: 16, stemH: '84vh', budW: 46, budH: 58, delay: 0.3, bottomOffset: 40, glow: true, color: 'sunset' },
        { left: 27, stemH: '74vh', budW: 42, budH: 54, delay: 0.5, bottomOffset: 34, color: 'peach' },
        { left: 39, stemH: '85vh', budW: 48, budH: 60, delay: 0.2, bottomOffset: 42, glow: true, color: 'gold' },
        { left: 51, stemH: '77vh', budW: 44, budH: 56, delay: 0.4, bottomOffset: 36, color: 'cream' },
        { left: 62, stemH: '83vh', budW: 48, budH: 60, delay: 0.3, bottomOffset: 40, glow: true, color: 'gold' },
        { left: 73, stemH: '75vh', budW: 44, budH: 56, delay: 0.5, bottomOffset: 35, color: 'rose' },
        { left: 84, stemH: '86vh', budW: 48, budH: 60, delay: 0.2, bottomOffset: 40, glow: true, color: 'gold' },
        { left: 95, stemH: '78vh', budW: 44, budH: 56, delay: 0.4, bottomOffset: 36, color: 'sunset' }
    ];

    // Tầng 2: Hoa giữa (9 bông tầng trung)
    const midTulips = [
        { left: 9, stemH: '52vh', budW: 48, budH: 60, delay: 0.2, bottomOffset: 25, color: 'gold' },
        { left: 21, stemH: '58vh', budW: 52, budH: 64, delay: 0.4, bottomOffset: 28, glow: true, color: 'coral' },
        { left: 33, stemH: '49vh', budW: 48, budH: 60, delay: 0.3, bottomOffset: 24, color: 'gold' },
        { left: 45, stemH: '56vh', budW: 50, budH: 62, delay: 0.5, bottomOffset: 30, color: 'peach' },
        { left: 57, stemH: '51vh', budW: 52, budH: 64, delay: 0.2, bottomOffset: 26, glow: true, color: 'gold' },
        { left: 68, stemH: '57vh', budW: 50, budH: 62, delay: 0.4, bottomOffset: 28, color: 'sunset' },
        { left: 79, stemH: '50vh', budW: 48, budH: 60, delay: 0.3, bottomOffset: 25, color: 'cream' },
        { left: 89, stemH: '55vh', budW: 50, budH: 62, delay: 0.5, bottomOffset: 27, color: 'gold' },
        { left: 98, stemH: '52vh', budW: 48, budH: 60, delay: 0.2, bottomOffset: 25, color: 'rose' }
    ];

    // Tầng 3: Tiền cảnh (7 bông to đậm ở gốc)
    const frontTulips = [
        { left: 4, stemH: '27vh', budW: 56, budH: 70, delay: 0.3, glow: true, stemW: 10, leafW: 24, leafH: 62, bottomOffset: 15, color: 'gold' },
        { left: 19, stemH: '33vh', budW: 60, budH: 74, delay: 0.1, glow: true, stemW: 10, leafW: 26, leafH: 68, bottomOffset: 18, color: 'peach' },
        { left: 35, stemH: '28vh', budW: 58, budH: 72, delay: 0.4, glow: true, stemW: 10, leafW: 25, leafH: 66, bottomOffset: 16, color: 'gold' },
        { left: 52, stemH: '34vh', budW: 64, budH: 78, delay: 0.2, glow: true, stemW: 11, leafW: 28, leafH: 72, bottomOffset: 20, color: 'gold' },
        { left: 68, stemH: '29vh', budW: 58, budH: 72, delay: 0.4, glow: true, stemW: 10, leafW: 25, leafH: 66, bottomOffset: 17, color: 'coral' },
        { left: 84, stemH: '32vh', budW: 60, budH: 74, delay: 0.1, glow: true, stemW: 10, leafW: 26, leafH: 68, bottomOffset: 18, color: 'gold' },
        { left: 96, stemH: '26vh', budW: 54, budH: 68, delay: 0.3, glow: true, stemW: 9, leafW: 23, leafH: 60, bottomOffset: 15, color: 'sunset' }
    ];

    // Tạo các phần tử và đưa vào cây DOM
    if (layerCanopy) canopyTulips.forEach(opt => layerCanopy.appendChild(createFloatingTulipElement(opt)));
    backTulips.forEach(opt => layerBack.appendChild(createTulipElement(opt)));
    midTulips.forEach(opt => layerMid.appendChild(createTulipElement(opt)));
    frontTulips.forEach(opt => layerFront.appendChild(createTulipElement(opt)));

    // Kích hoạt chuỗi bung nở toàn vườn hoa (chờ chạm mở quà nếu có màn overlay)
    const giftOverlay = document.getElementById('gift-intro-overlay');
    if (!giftOverlay) {
        setTimeout(() => {
            replayFlowerBloom();
        }, 300);
    }

    // Nút mở bức thư (chuyển sang stage 2)
    if (btnToMailbox) {
        btnToMailbox.addEventListener('click', () => {
            goToStage('stage-mailbox');
        });
    }

    // Nút ngắm lại hoa nở
    if (btnReplay) {
        btnReplay.addEventListener('click', () => {
            replayFlowerBloom();
        });
    }
}

// ==========================================================================
// 3. BỨC THƯ TAY 3D & LỜI CHÚC TYPEWRITER & STICKER
// ==========================================================================
function initMailbox() {
    const envelope = document.getElementById('envelope-box');
    const overlay = document.getElementById('letter-overlay');
    const closeBtn = document.getElementById('letter-close-btn');
    const textEl = document.getElementById('typewriter-text');
    const cursor = document.getElementById('typewriter-cursor');
    const toPhotosBtn = document.getElementById('btn-to-photos');
    const replayLetterBtn = document.getElementById('btn-replay-from-letter');
    const stickersRow = document.getElementById('stickers-row');
    const customStickerInput = document.getElementById('input-custom-sticker');

    let isTyping = false;
    let typeTimer = null;

    // Hàm mở bức thư (có thể gọi từ hoa trên vườn hoặc nút bấm)
    openLetterPopup = function() {
        if (!overlay) return;
        overlay.classList.remove('hidden', 'closing');
        startTypewriter();
    };

    // Hàm đóng bức thư với animation mượt mà (Fade & Scale float down)
    function closeLetterPopup(callback) {
        if (!overlay || overlay.classList.contains('hidden')) {
            if (callback) callback();
            return;
        }
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('closing');
            if (callback) callback();
        }, 340);
    }

    function openEnvelope() {
        if (envelope) envelope.classList.add('opened');
        const mailboxActions = document.getElementById('mailbox-actions');
        if (mailboxActions) mailboxActions.classList.remove('hidden');

        setTimeout(() => {
            openLetterPopup();
        }, 550);
    }

    if (envelope) envelope.addEventListener('click', openEnvelope);

    const mailboxToPhotos = document.getElementById('btn-mailbox-to-photos');
    if (mailboxToPhotos) {
        mailboxToPhotos.addEventListener('click', () => {
            closeLetterPopup(() => {
                goToStage('stage-photos');
            });
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeLetterPopup();
        });
    }

    // Chuyển sang hàng ảnh đung đưa với transition mượt mà
    if (toPhotosBtn) {
        toPhotosBtn.addEventListener('click', () => {
            closeLetterPopup(() => {
                goToStage('stage-photos');
            });
        });
    }

    // Ngắm lại hoa nở từ bức thư
    if (replayLetterBtn) {
        replayLetterBtn.addEventListener('click', () => {
            closeLetterPopup(() => {
                goToStage('stage-garden');
                replayFlowerBloom();
            });
        });
    }

    // Hiệu ứng chữ máy đánh chữ
    function startTypewriter() {
        if (typeTimer) clearTimeout(typeTimer);
        isTyping = true;
        textEl.textContent = '';
        cursor.style.display = 'inline-block';
        let idx = 0;

        function type() {
            if (idx < TQZ_WISHES.length) {
                textEl.textContent += TQZ_WISHES[idx];
                idx++;
                const delay = TQZ_WISHES[idx - 1] === '\n' ? 200 : 35;
                typeTimer = setTimeout(type, delay);
            } else {
                isTyping = false;
                setTimeout(() => { cursor.style.display = 'none'; }, 2000);
            }
        }
        type();
    }

    // Nhún nhảy vui nhộn khi bấm vào bất kỳ sticker nào
    function setupStickerInteractions(el) {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            el.classList.remove('photo-blooming-bounce');
            void el.offsetHeight;
            el.classList.add('photo-blooming-bounce');
            setTimeout(() => el.classList.remove('photo-blooming-bounce'), 550);
        });
    }

    if (stickersRow) {
        stickersRow.querySelectorAll('.sticker-item').forEach(setupStickerInteractions);
    }

    // Tự động cắt ảnh tải lên thành sticker tròn viền trắng dán trực tiếp vào thư kèm tên tag
    if (customStickerInput && stickersRow) {
        customStickerInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    let tagName = file.name.replace(/\.[^/.]+$/, "");
                    const match = tagName.match(/(?:gắn với tag|ảnh với tag|ảnh gắn với tag|ảnh này gắn với tag|ảnh cà chưa gắn với tag)\s*(.+)/i);
                    if (match) tagName = match[1].trim();
                    tagName = tagName.replace(/=\)+/g, '').trim();
                    if (/^màu\s*vàng/i.test(tagName)) tagName = 'Vàng';

                    const sticker = document.createElement('div');
                    sticker.className = 'sticker-item photo-sticker';
                    sticker.title = `Sticker: ${tagName} (Bấm để nhún nhảy!)`;
                    sticker.innerHTML = `
                        <div class="sticker-photo-crop">
                            <img src="${ev.target.result}" alt="${tagName}">
                        </div>
                        <span class="st-caption">${tagName}</span>
                    `;
                    setupStickerInteractions(sticker);
                    stickersRow.appendChild(sticker);
                    sticker.classList.add('photo-blooming-bounce');
                    setTimeout(() => sticker.classList.remove('photo-blooming-bounce'), 550);
                };
                reader.readAsDataURL(file);
            });
        });
    }
}

// ==========================================================================
// 4. HÀNG ẢNH ĐUNG ĐƯA & LIGHTBOX
// ==========================================================================
function initPhotos() {
    const items = document.querySelectorAll('.polaroid-item');
    const modal = document.getElementById('image-modal');
    const modalBg = document.getElementById('image-modal-bg');
    const modalClose = document.getElementById('modal-close-btn');
    const modalWrap = document.getElementById('modal-img-wrap');
    const modalCaption = document.getElementById('modal-caption');
    const uploadInput = document.getElementById('input-custom-photos');
    const btnBackGarden = document.getElementById('btn-back-to-garden');
    const btnBackMailbox = document.getElementById('btn-back-to-mailbox');

    // Hiệu ứng hoa mọc theo từng vòng tròn lan tỏa từ ảnh ra khắp toàn màn hình
    function triggerConcentricPhotoFlowerWave(item, e) {
        // 1. Nhún nhảy khung ảnh vui vẻ
        item.classList.remove('photo-blooming-bounce');
        void item.offsetHeight;
        item.classList.add('photo-blooming-bounce');
        setTimeout(() => item.classList.remove('photo-blooming-bounce'), 600);

        // 2. Tọa độ tâm vụ nổ hoa
        const rect = item.getBoundingClientRect();
        const centerX = e && e.clientX ? e.clientX : (rect.left + rect.width / 2);
        const centerY = e && e.clientY ? e.clientY : (rect.top + rect.height / 2);

        // 3. Chuỗi 2 vòng tròn hoa bung nở lan tỏa khắp màn hình (Tối ưu 60fps tuyệt đối, không lag)
        const flowerRings = [
            { radius: 120, count: 8,  delay: 0,   scale: 1.3 },
            { radius: 320, count: 12, delay: 150, scale: 1.55 }
        ];

        const flowerSymbols = ['🌷', '🌸', '🌼', '✨', '💐', '🌻'];

        flowerRings.forEach(ring => {
            setTimeout(() => {
                // Tạo vòng sóng phát sáng
                const waveRing = document.createElement('div');
                waveRing.className = 'photo-shockwave-ring';
                waveRing.style.left = centerX + 'px';
                waveRing.style.top = centerY + 'px';
                waveRing.style.width = (ring.radius * 2) + 'px';
                waveRing.style.height = (ring.radius * 2) + 'px';
                waveRing.style.setProperty('--ring-scale', (1.05 + ring.scale * 0.08));
                document.body.appendChild(waveRing);
                setTimeout(() => waveRing.remove(), 1100);

                // Tạo các bông hoa nở rộ theo chu vi vòng tròn lan tỏa
                for (let i = 0; i < ring.count; i++) {
                    const angle = (i / ring.count) * Math.PI * 2;
                    const fx = centerX + Math.cos(angle) * ring.radius;
                    const fy = centerY + Math.sin(angle) * ring.radius;

                    const flower = document.createElement('div');
                    flower.className = 'concentric-bloom-flower';
                    flower.textContent = flowerSymbols[i % flowerSymbols.length];
                    flower.style.left = fx + 'px';
                    flower.style.top = fy + 'px';
                    flower.style.fontSize = (1.4 * ring.scale) + 'rem';
                    flower.style.setProperty('--target-scale', ring.scale);

                    document.body.appendChild(flower);
                    setTimeout(() => flower.remove(), 1300);
                }
            }, ring.delay);
        });

        // 4. Chuông đàn hạc thanh thoát lan tỏa
        playPhotoBloomChime();
    }

    // Mở modal khi bấm vào ảnh và kích hoạt hoa nở bừng theo vòng tròn khắp màn hình
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            triggerConcentricPhotoFlowerWave(item, e);

            const img = item.querySelector('.polaroid-img img');
            const caption = item.querySelector('.p-caption');
            const tag = item.querySelector('.p-tag');

            modalWrap.innerHTML = '';
            if (img) {
                const fullImg = document.createElement('img');
                fullImg.src = img.src;
                fullImg.alt = caption ? caption.textContent : 'Ảnh TQZ';
                modalWrap.appendChild(fullImg);
            }
            modalCaption.textContent = caption ? caption.textContent : (tag ? tag.textContent : 'TQZ ✨');

            // Mở modal sau 720ms để người dùng thưởng thức trọn vẹn các đợt sóng hoa lan tỏa
            setTimeout(() => {
                modal.classList.remove('hidden');
            }, 720);
        });
    });

    const closeModal = () => modal.classList.add('hidden');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBg) modalBg.addEventListener('click', closeModal);

    // Upload ảnh thật
    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach((file, i) => {
                if (i >= items.length) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgBox = items[i].querySelector('.polaroid-img');
                    let photoName = file.name.replace(/\.[^/.]+$/, "");
                    const match = photoName.match(/(?:gắn với tag|ảnh với tag|ảnh gắn với tag)\s*(.+)/i);
                    if (match) photoName = match[1].trim();
                    photoName = photoName.replace(/=\)+/g, '').trim();
                    if (/^màu\s*vàng/i.test(photoName)) photoName = 'Vàng';

                    if (imgBox) {
                        imgBox.innerHTML = `
                            <img src="${event.target.result}" alt="${photoName}">
                            <span class="p-tag">${photoName}</span>
                        `;
                    }
                    const caption = items[i].querySelector('.p-caption');
                    if (caption) caption.textContent = photoName;
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Tạo dải hoa nguyệt quế và dải đèn đom đóm fairy lights trên dây treo
    const garland = document.getElementById('laurel-garland');
    if (garland && garland.children.length === 0) {
        const leaves = ['🌿', '🌱', '🍃', '🌿', '🌱', '🌿', '🍃', '🌿', '🌱', '🌿', '🍃', '🌿'];
        leaves.forEach(leaf => {
            const span = document.createElement('span');
            span.className = 'garland-leaf';
            span.textContent = leaf;
            garland.appendChild(span);
        });
    }

    const fairyLightsRow = document.getElementById('fairy-lights-row');
    if (fairyLightsRow && fairyLightsRow.children.length === 0) {
        for (let i = 0; i < 16; i++) {
            const light = document.createElement('div');
            light.className = 'fairy-light';
            fairyLightsRow.appendChild(light);
        }
    }

    // Nút quay lại
    if (btnBackGarden) {
        btnBackGarden.addEventListener('click', () => {
            goToStage('stage-garden');
            replayFlowerBloom();
        });
    }
    if (btnBackMailbox) {
        btnBackMailbox.addEventListener('click', () => goToStage('stage-mailbox'));
    }
}

// ==========================================================================
// 5. CÁNH HOA BAY NHẸ NHÀNG (ĐÃ TỐI ƯU HÓA: KHÔNG TẠO CHU KỲ BỐ CỤC NỀN)
// ==========================================================================
function initGentlePetals() {
    // Để giữ cho toàn bộ hiệu ứng hoa nở và đung đưa đạt chuẩn 60 FPS mượt mà nhất,
    // background giữ tĩnh thanh lịch, tập trung 100% ánh nhìn vào vẻ đẹp vườn hoa tulip!
}

// ==========================================================================
// 0. MÀN MỞ QUÀ BÍ MẬT 21/10 (GIFT INTRO CONTROLLER)
// ==========================================================================
function initGiftIntro(audioCtrl) {
    const overlay = document.getElementById('gift-intro-overlay');
    const openBtn = document.getElementById('btn-open-gift');
    const boxVisual = document.getElementById('gift-box-visual');
    const card = document.getElementById('gift-intro-card');

    if (!overlay) return;

    let isOpened = false;

    function handleOpenGift() {
        if (isOpened) return;
        isOpened = true;

        // 1. Kích hoạt phát nhạc bài 1 ngay lập tức qua user gesture
        if (audioCtrl) {
            audioCtrl.playTrack(0);
        }

        // 2. Kích hoạt toàn bộ vườn hoa tulip bung nở từ đất lên trời
        replayFlowerBloom();

        // 3. Hiệu ứng mở bung hộp quà & fade-out màn che phủ
        overlay.classList.add('opened');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 700);
    }

    if (openBtn) openBtn.addEventListener('click', handleOpenGift);
    if (boxVisual) boxVisual.addEventListener('click', handleOpenGift);
    if (card) card.addEventListener('click', handleOpenGift);
    overlay.addEventListener('click', handleOpenGift);
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    const audioCtrl = new AudioPlaylistController();
    initGiftIntro(audioCtrl);
    initCursorTrail();
    initTulipMeadow();
    initMailbox();
    initPhotos();
    initGentlePetals();
});
