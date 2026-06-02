/* ============================================
   hack_tic_tac // game.js
   Hacker vs Corporation - Tic-Tac-Toe
   ============================================ */

(function () {
    'use strict';

    // ===== State =====
    const HACKER = 'X';
    const CORP = 'O';

    const state = {
        board: Array(9).fill(null),
        current: HACKER,    // who plays now
        mode: 'pve',        // 'pve' | 'pvp'
        diff: 'easy',       // 'easy' | 'hard' (only for pve)
        running: true,      // game in progress
        scores: loadScores(),
        lang: 'en',
        isAiThinking: false,
        lastWinCombo: null, // remember combo for resize redraw
    };

    // ===== i18n =====
    const i18n = {
        en: {
            turn: 'TURN',
            hacker: 'HACKER',
            corp: 'CORP',
            draws: 'DRAWS',
            mode: 'MODE:',
            difficulty: 'DIFFICULTY:',
            vs_ai: 'VS_AI',
            vs_human: 'VS_HUMAN',
            easy: 'EASY',
            hard: 'HARD',
            reset: 'RESET.exe',
            play_again: 'PLAY_AGAIN',
            footer: 'HACK_TIC_TAC // NEON_GRID :: BUILD_2026.06',
            konami: '> RAINBOW_MATRIX_UNLOCKED // PARTY.exe',
            log_start: '> CONNECTION ESTABLISHED :: SESSION_ID 0x4D2F',
            log_x: '> HACKER injected payload :: CELL_',
            log_o_pve: '> CORP firewall responded :: CELL_',
            log_o_pvp: '> CORP-2 deployed patch :: CELL_',
            log_win_hacker: '> ROOT_ACCESS_GRANTED // HACKER WINS',
            log_win_corp: '> SYSTEM_PWNED // CORP WINS',
            log_draw: '> CONNECTION_STABLE // DRAW',
            log_reset: '> DISK_FORMATTED // SESSION_RESET',
            status: 'SYS://TICTACTOE_v2.1 :: NODE_LINK_SECURE :: 42ms ping',
            sym_hacker: '[INJECT]',
            sym_corp: '[FIREWALL]',
            win_hacker: ['> ROOT ACCESS GRANTED',
                         '> HACKER WINS',
                         '> SHUTTING DOWN CORP GRID...'],
            win_corp:   ['> SYSTEM PWNED',
                         '> CORP WINS',
                         '> ACTIVITY LOGGED // FBI NOTIFIED'],
            draw:       ['> CONNECTION STABLE',
                         '> NO VICTIM THIS TIME',
                         '> DRAW // RETRY? [Y/N]'],
        },
        ru: {
            turn: 'ХОД',
            hacker: 'ХАКЕР',
            corp: 'КОРП.',
            draws: 'НИЧЬИ',
            mode: 'РЕЖИМ:',
            difficulty: 'СЛОЖНОСТЬ:',
            vs_ai: 'ПРОТИВ_ИИ',
            vs_human: 'ПРОТИВ_ЧЕЛОВЕКА',
            easy: 'ЛЕГКО',
            hard: 'СЛОЖНО',
            reset: 'СБРОС.exe',
            play_again: 'ИГРАТЬ_СНОВА',
            footer: 'HACK_TIC_TAC // НЕОНОВАЯ_СЕТЬ :: СБОРКА_2026.06',
            konami: '> РАДУЖНАЯ_МАТРИЦА_РАЗБЛОКИРОВАНА // ТУСОВКА.exe',
            log_start: '> СОЕДИНЕНИЕ УСТАНОВЛЕНО :: SESSION_ID 0x4D2F',
            log_x: '> ХАКЕР внедрил payload :: ЯЧЕЙКА_',
            log_o_pve: '> КОРП. фаервол ответил :: ЯЧЕЙКА_',
            log_o_pvp: '> КОРП.-2 применил патч :: ЯЧЕЙКА_',
            log_win_hacker: '> ДОСТУП_ПОЛУЧЕН // ХАКЕР ПОБЕДИЛ',
            log_win_corp: '> СИСТЕМА_ВЗЛОМАНА // КОРП. ПОБЕДИЛА',
            log_draw: '> СОЕДИНЕНИЕ_СТАБИЛЬНО // НИЧЬЯ',
            log_reset: '> ДИСК_ОТФОРМАТИРОВАН // СЕССИЯ_СБРОШЕНА',
            status: 'СИС://КРЕСТИКИ_НОЛИКИ_v2.1 :: УЗЕЛ_ЗАЩИЩЁН :: 42мс пинг',
            sym_hacker: '[ВНЕДРЕНИЕ]',
            sym_corp: '[ФАЕРВОЛ]',
            win_hacker: ['> ДОСТУП ПОЛУЧЕН',
                         '> ХАКЕР ПОБЕДИЛ',
                         '> СЕТЬ КОРПОРАЦИИ ГАСИТСЯ...'],
            win_corp:   ['> СИСТЕМА ВЗЛОМАНА',
                         '> КОРПОРАЦИЯ ПОБЕДИЛА',
                         '> ЛОГ СОХРАНЁН // ФБР УВЕДОМЛЕНО'],
            draw:       ['> СОЕДИНЕНИЕ СТАБИЛЬНО',
                         '> ЖЕРТВЫ НЕТ',
                         '> НИЧЬЯ // ПОВТОРИТЬ? [Y/N]'],
        },
    };

    function t(key) { return i18n[state.lang][key] || key; }

    // ===== DOM =====
    const $board = document.getElementById('board');
    const $cells = Array.from(document.querySelectorAll('.cell'));
    const $turnSymbol = document.getElementById('turn-symbol');
    const $scoreH = document.getElementById('score-hacker');
    const $scoreC = document.getElementById('score-corp');
    const $scoreD = document.getElementById('score-draws');
    const $statusText = document.getElementById('status-text');
    const $log = document.getElementById('log');
    const $resetBtn = document.getElementById('reset-btn');
    const $overlay = document.getElementById('result-overlay');
    const $overlayText = document.getElementById('overlay-text');
    const $overlayReset = document.getElementById('overlay-reset');
    const $winLine = document.getElementById('win-line');
    const $winStroke = document.getElementById('win-line-stroke');
    const $canvas = document.getElementById('matrix-bg');
    const $ctx = $canvas.getContext('2d');
    const $konamiToast = document.getElementById('konami-toast');
    const $difficultyGroup = document.getElementById('difficulty-group');
    const $sceneHacker = document.getElementById('scene-hacker');
    const $sceneCorp = document.getElementById('scene-corp');
    const $sceneDraw = document.getElementById('scene-draw');
    const $scrollTrack = document.getElementById('scroll-track');

    // ===== Web Audio API =====
    let audioCtx = null;
    function getAudio() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                audioCtx = null;
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function beep(freq, duration, type = 'square', vol = 0.08, attack = 0.005) {
        const ctx = getAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    function sweep(f1, f2, duration, type = 'square', vol = 0.08) {
        const ctx = getAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f1, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + duration);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    function noise(duration, vol = 0.05) {
        const ctx = getAudio();
        if (!ctx) return;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = vol;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start();
    }

    const sfx = {
        placeX()    { beep(660, 0.08, 'square', 0.07); beep(880, 0.05, 'square', 0.05); },
        placeO()    { beep(330, 0.10, 'sawtooth', 0.06); },
        win()       {
            const notes = [523, 659, 784, 1046];
            notes.forEach((f, i) => setTimeout(() => beep(f, 0.15, 'square', 0.08), i * 90));
        },
        lose()      {
            const notes = [440, 370, 294, 220];
            notes.forEach((f, i) => setTimeout(() => beep(f, 0.18, 'sawtooth', 0.07), i * 110));
        },
        draw()      { beep(440, 0.15, 'triangle', 0.06); setTimeout(() => beep(440, 0.15, 'triangle', 0.06), 180); },
        glitch()    { noise(0.06, 0.05); },
        reset()     {
            sweep(800, 200, 0.25, 'square', 0.07);
            setTimeout(() => noise(0.08, 0.04), 50);
        },
        hover()     { /* too spammy, disabled */ },
    };

    // ===== Win lines =====
    const WIN_COMBOS = [
        [0,1,2], [3,4,5], [6,7,8],  // rows
        [0,3,6], [1,4,7], [2,5,8],  // cols
        [0,4,8], [2,4,6],           // diags
    ];

    function checkWinner(board) {
        for (const combo of WIN_COMBOS) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return { winner: board[a], combo };
            }
        }
        if (board.every(c => c !== null)) return { winner: 'draw', combo: null };
        return null;
    }

    // ===== AI =====
    function getEmptyCells(board) {
        return board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    }

    function aiRandomMove(board) {
        const empty = getEmptyCells(board);
        return empty[Math.floor(Math.random() * empty.length)];
    }

    function aiMinimax(board, player) {
        const opponent = player === CORP ? HACKER : CORP;
        const result = checkWinner(board);
        if (result) {
            if (result.winner === CORP) return { score: 10 };
            if (result.winner === HACKER) return { score: -10 };
            return { score: 0 };
        }
        const moves = [];
        const empty = getEmptyCells(board);
        for (const i of empty) {
            const move = { index: i };
            board[i] = player;
            const res = aiMinimax(board, opponent);
            move.score = res.score;
            board[i] = null;
            moves.push(move);
        }
        let best;
        if (player === CORP) {
            best = moves.reduce((a, b) => (a.score > b.score ? a : b));
        } else {
            best = moves.reduce((a, b) => (a.score < b.score ? a : b));
        }
        return best;
    }

    function aiHardMove(board) {
        const best = aiMinimax(board.slice(), CORP);
        return best.index;
    }

    function aiMove() {
        if (!state.running) return;
        const empty = getEmptyCells(state.board);
        if (empty.length === 0) return;
        const idx = state.diff === 'hard' ? aiHardMove(state.board) : aiRandomMove(state.board);
        // small delay for "thinking"
        state.isAiThinking = true;
        setTimeout(() => {
            state.isAiThinking = false;
            makeMove(idx, CORP, /*fromAi*/ true);
        }, 350 + Math.random() * 250);
    }

    // ===== Move =====
    function makeMove(index, player, fromAi = false) {
        if (!state.running) return;
        if (state.isAiThinking && !fromAi) return; // ignore clicks during AI
        if (state.board[index] !== null) return;

        state.board[index] = player;
        const cell = $cells[index];
        cell.textContent = player;
        cell.classList.add('taken', player === HACKER ? 'x' : 'o', 'placed');
        setTimeout(() => cell.classList.remove('placed'), 400);

        // glitch the cell
        cell.classList.add('glitch');
        setTimeout(() => cell.classList.remove('glitch'), 400);

        // SFX
        if (player === HACKER) sfx.placeX();
        else sfx.placeO();

        // Log
        const key = player === HACKER ? 'log_x' : (state.mode === 'pvp' ? 'log_o_pvp' : 'log_o_pve');
        log((t(key) || '') + (index + 1));

        // Check
        const result = checkWinner(state.board);
        if (result) {
            endGame(result);
            return;
        }

        // Switch turn
        state.current = player === HACKER ? CORP : HACKER;
        updateTurn();
        updateStatus();

        // AI turn?
        if (state.mode === 'pve' && state.current === CORP && state.running) {
            aiMove();
        }
    }

    // ===== End game =====
    function endGame(result) {
        state.running = false;
        $cells.forEach(c => c.classList.add('disabled'));

        if (result.winner === 'draw') {
            sfx.draw();
            log(t('log_draw'));
            state.scores.draws++;
            saveScores();
            renderScores();
            setTimeout(() => showOverlay('draw'), 600);
            return;
        }

        // Highlight winning cells
        result.combo.forEach(i => $cells[i].classList.add('win-cell'));
        state.lastWinCombo = result.combo;
        drawWinLine(result.combo);

        if (result.winner === HACKER) {
            sfx.win();
            log(t('log_win_hacker'));
            state.scores.hacker++;
            setTimeout(() => showOverlay('hacker'), 800);
        } else {
            sfx.lose();
            log(t('log_win_corp'));
            state.scores.corp++;
            setTimeout(() => showOverlay('corp'), 800);
        }
        saveScores();
        renderScores();
    }

    function drawWinLine(combo, animate = true) {
        const boardRect = $board.getBoundingClientRect();
        const wrapperRect = $board.parentElement.getBoundingClientRect();
        const offsetX = boardRect.left - wrapperRect.left + 6; // padding
        const offsetY = boardRect.top - wrapperRect.top + 6;
        const cellW = (boardRect.width - 12) / 3;
        const cellH = (boardRect.height - 12) / 3;

        function center(i) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return {
                x: offsetX + col * cellW + cellW / 2,
                y: offsetY + row * cellH + cellH / 2,
            };
        }
        const a = center(combo[0]);
        const b = center(combo[2]);

        $winLine.setAttribute('viewBox', `0 0 ${wrapperRect.width} ${wrapperRect.height}`);
        $winLine.setAttribute('width', wrapperRect.width);
        $winLine.setAttribute('height', wrapperRect.height);

        $winStroke.setAttribute('x1', a.x);
        $winStroke.setAttribute('y1', a.y);
        $winStroke.setAttribute('x2', b.x);
        $winStroke.setAttribute('y2', b.y);

        if (animate) {
            // Reset and trigger animation
            $winStroke.classList.remove('draw');
            // force reflow
            void $winStroke.getBoundingClientRect();
            $winStroke.classList.add('draw');
            // Glitch screen
            sfx.glitch();
        } else {
            // just keep it visible without re-animating
            $winStroke.classList.add('draw');
        }
    }

    function showOverlay(kind) {
        let lines;
        if (kind === 'hacker') lines = t('win_hacker');
        else if (kind === 'corp') lines = t('win_corp');
        else lines = t('draw');

        // Show the right pixel-art scene
        $sceneHacker.classList.remove('active');
        $sceneCorp.classList.remove('active');
        $sceneDraw.classList.remove('active');
        if (kind === 'hacker') $sceneHacker.classList.add('active');
        else if (kind === 'corp') $sceneCorp.classList.add('active');
        else if (kind === 'draw') $sceneDraw.classList.add('active');

        $overlayText.textContent = lines.join('\n');
        $overlay.classList.remove('lose', 'draw');
        if (kind === 'corp') $overlay.classList.add('lose');
        if (kind === 'draw') $overlay.classList.add('draw');
        $overlay.classList.add('active');
    }

    function hideOverlay() {
        $overlay.classList.remove('active');
        $sceneHacker.classList.remove('active');
        $sceneCorp.classList.remove('active');
        $sceneDraw.classList.remove('active');
    }

    // ===== Reset =====
    function resetGame() {
        sfx.reset();
        state.board = Array(9).fill(null);
        state.current = HACKER;
        state.running = true;
        state.isAiThinking = false;
        state.lastWinCombo = null;
        $cells.forEach(c => {
            c.textContent = '';
            c.classList.remove('taken', 'x', 'o', 'win-cell', 'placed', 'glitch', 'disabled');
        });
        $winStroke.classList.remove('draw');
        $winStroke.setAttribute('x1', 0);
        $winStroke.setAttribute('y1', 0);
        $winStroke.setAttribute('x2', 0);
        $winStroke.setAttribute('y2', 0);
        hideOverlay();
        log(t('log_reset'));
        updateTurn();
        updateStatus();
    }

    // ===== Render =====
    function updateTurn() {
        if (state.current === HACKER) {
            $turnSymbol.textContent = t('sym_hacker');
            $turnSymbol.classList.add('hacker');
            $turnSymbol.classList.remove('corp');
        } else {
            $turnSymbol.textContent = t('sym_corp');
            $turnSymbol.classList.add('corp');
            $turnSymbol.classList.remove('hacker');
        }
    }

    function updateStatus() {
        $statusText.textContent = t('status');
    }

    function renderScores() {
        $scoreH.textContent = state.scores.hacker;
        $scoreC.textContent = state.scores.corp;
        $scoreD.textContent = state.scores.draws;
    }

    function log(msg) {
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = msg;
        $log.appendChild(line);
        $log.scrollTop = $log.scrollHeight;
        // Trim
        while ($log.children.length > 30) $log.removeChild($log.firstChild);
    }

    function applyI18n() {
        document.documentElement.lang = state.lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.dataset.i18n);
        });
        updateStatus();
        updateTurn();
    }

    // ===== Scores persistence =====
    const SCORES_KEY = 'hack_tic_tac_scores';
    const SCORES_KEY_OLD = 'dedsec_ttt_scores';
    function loadScores() {
        try {
            const raw = localStorage.getItem(SCORES_KEY);
            if (raw) return JSON.parse(raw);
            const legacy = localStorage.getItem(SCORES_KEY_OLD);
            if (legacy) {
                const parsed = JSON.parse(legacy);
                try { localStorage.setItem(SCORES_KEY, legacy); } catch (e) {}
                try { localStorage.removeItem(SCORES_KEY_OLD); } catch (e) {}
                return parsed;
            }
        } catch (e) {}
        return { hacker: 0, corp: 0, draws: 0 };
    }
    function saveScores() {
        try { localStorage.setItem(SCORES_KEY, JSON.stringify(state.scores)); } catch (e) {}
    }

    // ===== Event handlers =====
    $cells.forEach((cell, idx) => {
        cell.addEventListener('click', () => {
            if (state.mode === 'pve' && state.current === CORP) return; // wait AI
            if (state.board[idx] !== null) return;
            makeMove(idx, state.current, false);
        });
    });

    $resetBtn.addEventListener('click', resetGame);
    $overlayReset.addEventListener('click', resetGame);

    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;
            $difficultyGroup.style.display = state.mode === 'pvp' ? 'none' : 'flex';
            resetGame();
        });
    });

    document.querySelectorAll('.mode-btn[data-diff]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn[data-diff]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.diff = btn.dataset.diff;
            resetGame();
        });
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.lang = btn.dataset.lang;
            applyI18n();
        });
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') resetGame();
        if (e.key === 'y' || e.key === 'Y') {
            if ($overlay.classList.contains('active')) resetGame();
        }
        konamiCheck(e);
    });

    // ===== Konami code =====
    const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiBuf = [];
    function konamiCheck(e) {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        konamiBuf.push(key);
        if (konamiBuf.length > konamiSeq.length) konamiBuf.shift();
        if (konamiSeq.every((k, i) => konamiBuf[i] === k)) {
            triggerKonami();
            konamiBuf = [];
        }
    }
    function triggerKonami() {
        document.body.classList.toggle('rainbow');
        $konamiToast.classList.add('show');
        setTimeout(() => $konamiToast.classList.remove('show'), 3000);
        // celebratory sound
        [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'square', 0.07), i * 70));
    }

    // ===== Hacker background (amber data streams + grid) =====
    function initMatrix() {
        // Code fragments that look like "leak" text
        const codeSnippets = [
            '0x4D2F::INJECT_PAYLOAD', 'BREACH:: GRID_NODE_07', '> root@operator:~# ',
            '[ACCESS GRANTED]', '192.168.1.66 :: PWNED', 'ssh -l operator',
            'deface --target=GRID', 'ENCRYPT_KEY=0xFA9B12', '>> STAGE_2_OK',
            'BRUTEFORCE :: 4.2M p/s', 'TUNNEL:: onion://x4kq.onion',
            'PACKET_INJECT :: 0.3ms', '> SCAN COMPLETE', '[FIREWALL DOWN]',
            'TRACE:: ELIMINATED', 'LOGIN AS: operator_07', 'NEON_GRID::SYS_CALL_OK',
            '>> ping 8.8.8.8 :: 12ms', '> sudo rm -rf /corps', 'ID :: 0xDEADBEEF',
        ];
        const cells = [];

        function resize() {
            $canvas.width = window.innerWidth;
            $canvas.height = window.innerHeight;
            const rows = Math.ceil($canvas.height / 28) + 2;
            const cols = Math.ceil($canvas.width / 200) + 2;
            cells.length = 0;
            for (let r = 0; r < rows; r++) {
                const rowCells = [];
                const colsInRow = Math.floor(Math.random() * 4) + 2; // denser
                for (let c = 0; c < colsInRow; c++) {
                    rowCells.push({
                        x: Math.random() * $canvas.width,
                        y: r * 28 + (Math.random() * 10 - 5),
                        text: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
                        speed: 0.4 + Math.random() * 0.8,
                        alpha: 0.35 + Math.random() * 0.4,
                    });
                }
                cells.push(rowCells);
            }
        }

        resize();
        window.addEventListener('resize', resize);

        function draw() {
            $ctx.fillStyle = 'rgba(10, 10, 10, 0.18)';
            $ctx.fillRect(0, 0, $canvas.width, $canvas.height);
            $ctx.font = '13px "Share Tech Mono", monospace';
            $ctx.textBaseline = 'middle';

            // Draw faint grid
            $ctx.strokeStyle = 'rgba(255, 176, 0, 0.12)';
            $ctx.lineWidth = 1;
            const gridSize = 40;
            for (let x = 0; x < $canvas.width; x += gridSize) {
                $ctx.beginPath();
                $ctx.moveTo(x, 0);
                $ctx.lineTo(x, $canvas.height);
                $ctx.stroke();
            }
            for (let y = 0; y < $canvas.height; y += gridSize) {
                $ctx.beginPath();
                $ctx.moveTo(0, y);
                $ctx.lineTo($canvas.width, y);
                $ctx.stroke();
            }

            // Draw data streams
            for (const row of cells) {
                for (const cell of row) {
                    $ctx.globalAlpha = cell.alpha;
                    $ctx.fillStyle = '#ffb000';
                    $ctx.fillText(cell.text, cell.x, cell.y);
                    cell.x -= cell.speed;
                    if (cell.x < -cell.text.length * 7) {
                        cell.x = $canvas.width + Math.random() * 100;
                        cell.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
                    }
                }
            }

            // Occasional bright "packet"
            if (Math.random() < 0.05) {
                const py = Math.random() * $canvas.height;
                $ctx.globalAlpha = 0.4;
                $ctx.fillStyle = '#ffd24a';
                $ctx.fillText('>> PACKET_0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase() + ' :: INJECT', 20, py);
            }

            $ctx.globalAlpha = 1;
        }

        setInterval(draw, 70);
    }

    // ===== Draw scene: clone pre for seamless infinite scroll =====
    function initDrawScroll() {
        if (!$scrollTrack) return;
        const first = $scrollTrack.querySelector('.pixel-art--draw');
        if (!first) return;
        const clone = first.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        $scrollTrack.appendChild(clone);
    }

    // ===== Boot =====
    function init() {
        applyI18n();
        renderScores();
        log(t('log_start'));
        updateTurn();
        $difficultyGroup.style.display = 'flex';
        initMatrix();
        initDrawScroll();

        // Recalculate win line on resize / orientation change
        let resizeRaf = null;
        function onResize() {
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(() => {
                if (state.lastWinCombo) {
                    drawWinLine(state.lastWinCombo, false);
                }
            });
        }
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);

        // Initial audio context unlock on first click
        const unlock = () => {
            getAudio();
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('keydown', unlock);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
