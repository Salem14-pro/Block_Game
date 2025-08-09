
// Block size and board dimensions
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');

// Tetromino shapes and colors
const TETROMINOS = {
    I: { shape: [[1,1,1,1]], color: '#00f0f0' },
    O: { shape: [[1,1],[1,1]], color: '#f0f000' },
    T: { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },
    S: { shape: [[0,1,1],[1,1,0]], color: '#00f000' },
    Z: { shape: [[1,1,0],[0,1,1]], color: '#f00000' },
    J: { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },
    L: { shape: [[0,0,1],[1,1,1]], color: '#f0a000' }
};

function randomTetromino() {
    const types = Object.keys(TETROMINOS);
    return types[Math.floor(Math.random() * types.length)];
}

class Piece {
    constructor(type) {
        this.type = type;
        this.shape = TETROMINOS[type].shape;
        this.color = TETROMINOS[type].color;
        this.x = Math.floor(COLS / 2) - Math.ceil(this.shape[0].length / 2);
        this.y = 0;
    }
    rotate() {
        // Clockwise rotation
        this.shape = this.shape[0].map((_, i) => this.shape.map(row => row[i]).reverse());
    }
    draw(ctx) {
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(
                        (this.x + col) * BLOCK_SIZE,
                        (this.y + row) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(
                        (this.x + col) * BLOCK_SIZE,
                        (this.y + row) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                }
            }
        }
    }
}

class Board {
    constructor() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }
    isValid(piece, offsetX = 0, offsetY = 0, testShape = null) {
        const shape = testShape || piece.shape;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = piece.x + col + offsetX;
                    const y = piece.y + row + offsetY;
                    if (
                        x < 0 || x >= COLS ||
                        y < 0 || y >= ROWS ||
                        (y >= 0 && this.grid[y][x])
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    place(piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    if (y >= 0) this.grid[y][x] = piece.color;
                }
            }
        }
    }
    clearLines() {
        let lines = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(null));
                lines++;
                y++; // Check same row again after shift
            }
        }
        return lines;
    }
    draw(ctx) {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x]) {
                    ctx.fillStyle = this.grid[y][x];
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }
}


let board = new Board();
let currentPiece = new Piece(randomTetromino());
let dropInterval = 800;
let lastDrop = 0;
let score = 0;
let level = 1;
let linesCleared = 0;
let gameOver = false;
let gameOverAnim = 0;
const restartBtn = document.getElementById('restartBtn');
const startModal = document.getElementById('startModal');
const playerForm = document.getElementById('playerForm');
const playerNameInput = document.getElementById('playerName');
const playerAgeInput = document.getElementById('playerAge');
const ageValue = document.getElementById('ageValue');
const praiseMsg = document.getElementById('praiseMsg');
let playerName = '';
let playerAge = 18;
let gameStarted = false;

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#444';
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
}


function draw() {
    drawGrid();
    board.draw(ctx);
    if (!gameStarted) {
        restartBtn.style.display = 'none';
        return;
    }
    if (!gameOver) {
        currentPiece.draw(ctx);
        restartBtn.style.display = 'none';
    } else {
        // Smooth game over animation with vibrant red 'X'
        if (gameOverAnim < 1) {
            gameOverAnim += 0.03;
        }
        ctx.save();
        ctx.globalAlpha = Math.min(gameOverAnim, 1);
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#ff0033';
        ctx.beginPath();
        ctx.moveTo(30, 30);
        ctx.lineTo(canvas.width - 30, canvas.height - 30);
        ctx.moveTo(canvas.width - 30, 30);
        ctx.lineTo(30, canvas.height - 30);
        ctx.stroke();
        ctx.globalAlpha = Math.min(gameOverAnim, 1);
        ctx.font = 'bold 48px Segoe UI, Arial';
        ctx.fillStyle = '#ff0033';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.restore();
        if (gameOverAnim >= 1) {
            restartBtn.style.display = 'block';
        }
    }
}

function showPraise() {
    const praises = ['Good Job', 'Well done', 'Great', 'Brilliant', 'Wonderful'];
    const msg = praises[Math.floor(Math.random() * praises.length)];
    praiseMsg.textContent = msg;
    praiseMsg.style.opacity = '1';
    setTimeout(() => {
        praiseMsg.style.opacity = '0';
    }, 1200);
}

function updateScore(lines) {
    if (lines > 0) {
        showPraise();
    }
    score += lines * 100;
    linesCleared += lines;
    level = Math.floor(linesCleared / 10) + 1;
    dropInterval = Math.max(100, 800 - (level - 1) * 70);
    scoreEl.textContent = score;
    levelEl.textContent = level;
}


function spawnPiece() {
    currentPiece = new Piece(randomTetromino());
    if (!board.isValid(currentPiece)) {
        gameOver = true;
        gameOverAnim = 0;
    }
}

function restartGame() {
    board = new Board();
    currentPiece = new Piece(randomTetromino());
    dropInterval = 800;
    lastDrop = 0;
    score = 0;
    level = 1;
    linesCleared = 0;
    gameOver = false;
    gameOverAnim = 0;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    restartBtn.style.display = 'none';
    draw();
}

restartBtn.addEventListener('click', restartGame);

function movePiece(dx, dy) {
    if (board.isValid(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        draw();
        return true;
    }
    return false;
}

function rotatePiece() {
    const oldShape = currentPiece.shape;
    currentPiece.rotate();
    if (!board.isValid(currentPiece)) {
        currentPiece.shape = oldShape;
    } else {
        draw();
    }
}

function dropPiece() {
    if (!movePiece(0, 1)) {
        board.place(currentPiece);
        const lines = board.clearLines();
        if (lines) updateScore(lines);
        spawnPiece();
    }
    draw();
}

// Keyboard controls
window.addEventListener('keydown', e => {
    if (!gameStarted || gameOver) return;
    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            dropPiece();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
    }
});


function gameLoop(timestamp) {
    if (!lastDrop) lastDrop = timestamp;
    if (gameStarted && !gameOver) {
        if (timestamp - lastDrop > dropInterval) {
            dropPiece();
            lastDrop = timestamp;
        }
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Modal logic
playerAgeInput.addEventListener('input', () => {
    ageValue.textContent = playerAgeInput.value;
});

playerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    playerName = playerNameInput.value.trim();
    playerAge = playerAgeInput.value;
    if (playerName.length === 0) {
        playerNameInput.focus();
        return;
    }
    startModal.style.display = 'none';
    gameStarted = true;
    draw();
});

draw();
requestAnimationFrame(gameLoop);
