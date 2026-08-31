const SIZE = 5;
const boardEl = document.querySelector('#board');
const movesEl = document.querySelector('#moves');
const bestEl = document.querySelector('#best');
const levelEl = document.querySelector('#levelLabel');
const messageEl = document.querySelector('#message');
const soundToggle = document.querySelector('#soundToggle');
const installDialog = document.querySelector('#installDialog');
const installButton = document.querySelector('#installApp');
const dismissInstall = document.querySelector('#dismissInstall');
const levelDialog = document.querySelector('#levelDialog');
const levelSummary = document.querySelector('#levelSummary');
const nextLevelButton = document.querySelector('#nextLevel');
const replayLevelButton = document.querySelector('#replayLevel');
const levelContinue = document.querySelector('#levelContinue');
const inlineNextLevel = document.querySelector('#inlineNextLevel');
let board = [], startingBoard = [], moves = 0, muted = false, audio, deferredInstallPrompt;
const LEVEL_COOKIE = 'lights_out_level';
const BEST_COOKIE = 'lights_out_best_';
const INSTALL_COOKIE = 'lights_out_install_dismissed';
const MAX_LEVEL = 99;
const PATTERNS = [
  ['.X...', '...X.', '..X..', '.....', '.....'],
  ['XX...', '..X..', '...X.', '.....', '.X...'],
  ['X..X.', '.X...', '...X.', '..X..', '.....'],
  ['.XX..', '...X.', 'X....', '..X..', '....X'],
  ['X.X..', '..XX.', '.....', '.X..X', '...X.'],
  ['..X.X', 'X....', '.XX..', '...X.', '.X...'],
  ['XX..X', '...X.', '.X.X.', 'X....', '..X..'],
  ['X.X.X', '.X...', '...X.', '.XX..', '..X..'],
  ['.XXX.', 'X...X', '..X..', '.X.X.', 'X...X'],
  ['XX.XX', '.X.X.', 'X...X', '..X..', 'XX.XX'],
  ['X..XX', 'XX...', '.X.X.', '...XX', 'X....'],
  ['.XXXX', 'X...X', 'XX.XX', 'X...X', 'XXXX.']
];

function getCookie(name) { return document.cookie.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1] ?? ''; }
function setCookie(name, value, days = 3650) { document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${days * 86400}; path=/; SameSite=Lax`; }
function currentLevel() { return Math.min(MAX_LEVEL, Math.max(1, Number(getCookie(LEVEL_COOKIE)) || 1)); }
function blankBoard() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(false)); }
function copyGrid(grid) { return grid.map(row => [...row]); }
function toggle(grid, row, col) { [[0,0],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => { const r = row + dr, c = col + dc; if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) grid[r][c] = !grid[r][c]; }); }
function levelPuzzle() {
  const grid = blankBoard();
  const pattern = PATTERNS[(currentLevel() - 1) % PATTERNS.length];
  pattern.forEach((row, r) => [...row].forEach((value, c) => { if (value === 'X') toggle(grid, r, c); }));
  return grid;
}
function render() {
  boardEl.innerHTML = '';
  board.flatMap((row, r) => row.map((isOn, c) => {
    const cell = document.createElement('button'); cell.className = `cell${isOn ? ' on' : ''}`; cell.type = 'button'; cell.role = 'gridcell';
    cell.ariaLabel = `Row ${r + 1}, column ${c + 1}, ${isOn ? 'on' : 'off'}`; cell.ariaPressed = String(isOn);
    cell.addEventListener('click', () => playMove(r, c)); boardEl.appendChild(cell);
  }));
  movesEl.textContent = String(moves).padStart(2, '0'); levelEl.textContent = `LEVEL ${String(currentLevel()).padStart(2, '0')}`;
}
function playMove(row, col) { if (isSolved()) return; toggle(board, row, col); moves++; sound('tap', moves); render(); if (isSolved()) win(); }
function isSolved() { return board.every(row => row.every(value => !value)); }
function win() {
  [...document.querySelectorAll('.cell')].forEach((cell, index) => setTimeout(() => cell.classList.add('win'), index * 28));
  const level = currentLevel(), best = Number(getCookie(`${BEST_COOKIE}${level}`)) || 0;
  if (!best || moves < best) { setCookie(`${BEST_COOKIE}${level}`, moves); bestEl.textContent = String(moves).padStart(2, '0'); }
  messageEl.textContent = level < MAX_LEVEL ? `BLACKOUT ACHIEVED // LEVEL ${String(level).padStart(2, '0')}` : 'ALL LEVELS COMPLETE'; sound('win');
  if (level < MAX_LEVEL) { levelSummary.textContent = `LEVEL ${String(level).padStart(2, '0')} CLEARED IN ${moves} MOVES`; levelContinue.hidden = false; setTimeout(() => { try { if (!levelDialog.open) levelDialog.showModal(); } catch { levelDialog.setAttribute('open', ''); } }, 650); }
}
function advanceLevel() { const next = Math.min(MAX_LEVEL, currentLevel() + 1); setCookie(LEVEL_COOKIE, next); if (levelDialog.open) levelDialog.close(); startGame(); messageEl.textContent = `LEVEL ${String(next).padStart(2, '0')} // SEQUENCE READY`; }
function updateBest() { const best = Number(getCookie(`${BEST_COOKIE}${currentLevel()}`)) || 0; bestEl.textContent = best ? String(best).padStart(2, '0') : '--'; }
function startGame() { board = levelPuzzle(); startingBoard = copyGrid(board); moves = 0; levelContinue.hidden = true; updateBest(); messageEl.textContent = 'MEMORY PATTERN // TAP A NODE TO BEGIN'; render(); }
function resetGame() { board = copyGrid(startingBoard); moves = 0; messageEl.textContent = 'BOARD RESET // SEQUENCE READY'; render(); sound('reset'); }
function sound(kind, step = 0) { if (muted) return; audio ??= new (window.AudioContext || window.webkitAudioContext)(); const osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime; const frequencies = { tap: 210 + (step % 5) * 32, reset: 120, win: 520 }; osc.type = kind === 'win' ? 'sine' : 'square'; osc.frequency.setValueAtTime(frequencies[kind], now); if (kind === 'win') osc.frequency.exponentialRampToValueAtTime(1040, now + .35); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(kind === 'win' ? .14 : .055, now + .01); gain.gain.exponentialRampToValueAtTime(.0001, now + (kind === 'win' ? .5 : .09)); osc.connect(gain).connect(audio.destination); osc.start(now); osc.stop(now + (kind === 'win' ? .52 : .1)); }

document.querySelector('#newGame').addEventListener('click', () => { startGame(); sound('reset'); });
document.querySelector('#resetGame').addEventListener('click', resetGame);
soundToggle.addEventListener('click', () => { muted = !muted; soundToggle.textContent = muted ? '◖ ×' : '◖)))'; soundToggle.ariaPressed = String(muted); soundToggle.ariaLabel = muted ? 'Unmute sound' : 'Mute sound'; if (!muted) sound('tap'); });

function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function maybeShowInstallPrompt() { if (!isStandalone() && !getCookie(INSTALL_COOKIE) && installDialog?.showModal) setTimeout(() => installDialog.showModal(), 1200); }
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstallPrompt = event; maybeShowInstallPrompt(); });
installButton?.addEventListener('click', async () => { if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; } setCookie(INSTALL_COOKIE, '1', 30); installDialog.close(); });
dismissInstall?.addEventListener('click', () => { setCookie(INSTALL_COOKIE, '1', 30); installDialog.close(); });
nextLevelButton?.addEventListener('click', advanceLevel);
inlineNextLevel?.addEventListener('click', advanceLevel);
replayLevelButton?.addEventListener('click', () => { levelDialog.close(); startGame(); messageEl.textContent = `LEVEL ${String(currentLevel()).padStart(2, '0')} // RETRY SEQUENCE`; });
if (!isStandalone() && isIOS()) { document.querySelector('#iosInstallHint').hidden = false; maybeShowInstallPrompt(); } else if (!isStandalone()) document.querySelector('#iosInstallHint').hidden = true;
startGame();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
