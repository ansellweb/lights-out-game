const SIZE = 5;
const boardEl = document.querySelector('#board');
const movesEl = document.querySelector('#moves');
const bestEl = document.querySelector('#best');
const messageEl = document.querySelector('#message');
const soundToggle = document.querySelector('#soundToggle');
let board = [];
let startingBoard = [];
let moves = 0;
let muted = false;
let audio;
const bestKey = 'lights-out-neon-best';

function blankBoard() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(false)); }
function copyGrid(grid) { return grid.map(row => [...row]); }
function randomPuzzle() {
  const grid = blankBoard();
  // Generate a guaranteed-solvable board by applying random legal moves to blank.
  for (let i = 0; i < 18 + Math.floor(Math.random() * 18); i++) toggle(grid, Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE));
  return grid;
}
function toggle(grid, row, col) {
  [[0,0],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) grid[r][c] = !grid[r][c];
  });
}
function render() {
  boardEl.innerHTML = '';
  board.flatMap((row, r) => row.map((isOn, c) => {
    const cell = document.createElement('button');
    cell.className = `cell${isOn ? ' on' : ''}`;
    cell.type = 'button'; cell.role = 'gridcell';
    cell.ariaLabel = `Row ${r + 1}, column ${c + 1}, ${isOn ? 'on' : 'off'}`;
    cell.ariaPressed = String(isOn);
    cell.addEventListener('click', () => playMove(r, c, cell));
    boardEl.appendChild(cell);
  }));
  movesEl.textContent = String(moves).padStart(2, '0');
}
function playMove(row, col, cell) {
  if (isSolved()) return;
  toggle(board, row, col); moves++;
  sound('tap', moves);
  render();
  if (isSolved()) win();
}
function isSolved() { return board.every(row => row.every(value => !value)); }
function win() {
  const cells = [...document.querySelectorAll('.cell')];
  cells.forEach((cell, index) => setTimeout(() => cell.classList.add('win'), index * 28));
  const oldBest = Number(localStorage.getItem(bestKey) || 0);
  if (!oldBest || moves < oldBest) { localStorage.setItem(bestKey, String(moves)); bestEl.textContent = String(moves).padStart(2, '0'); }
  messageEl.textContent = `BLACKOUT ACHIEVED // ${moves} MOVES`;
  sound('win');
}
function startGame() { board = randomPuzzle(); startingBoard = copyGrid(board); moves = 0; messageEl.textContent = 'TAP A NODE TO BEGIN SEQUENCE'; render(); }
function resetGame() { board = copyGrid(startingBoard); moves = 0; messageEl.textContent = 'BOARD RESET // SEQUENCE READY'; render(); sound('reset'); }
function sound(kind, step = 0) {
  if (muted) return;
  audio ??= new (window.AudioContext || window.webkitAudioContext)();
  const osc = audio.createOscillator(), gain = audio.createGain();
  const now = audio.currentTime;
  const frequencies = { tap: 210 + (step % 5) * 32, reset: 120, win: 520 };
  osc.type = kind === 'win' ? 'sine' : 'square'; osc.frequency.setValueAtTime(frequencies[kind], now);
  if (kind === 'win') osc.frequency.exponentialRampToValueAtTime(1040, now + .35);
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(kind === 'win' ? .14 : .055, now + .01); gain.gain.exponentialRampToValueAtTime(.0001, now + (kind === 'win' ? .5 : .09));
  osc.connect(gain).connect(audio.destination); osc.start(now); osc.stop(now + (kind === 'win' ? .52 : .1));
}
document.querySelector('#newGame').addEventListener('click', () => { startGame(); sound('reset'); });
document.querySelector('#resetGame').addEventListener('click', resetGame);
soundToggle.addEventListener('click', () => { muted = !muted; soundToggle.textContent = muted ? '◖ ×' : '◖)))'; soundToggle.ariaPressed = String(muted); soundToggle.ariaLabel = muted ? 'Unmute sound' : 'Mute sound'; if (!muted) sound('tap'); });
const savedBest = Number(localStorage.getItem(bestKey) || 0); bestEl.textContent = savedBest ? String(savedBest).padStart(2, '0') : '--';
startGame();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
