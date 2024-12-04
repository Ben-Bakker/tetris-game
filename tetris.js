const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const BLOCK_SIZE = 20;
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 20;

// Масштабируем canvas для четкости
context.scale(1, 1);

// Фигуры тетриса
const SHAPES = {
    'I': [[1, 1, 1, 1]],
    'O': [[1, 1], [1, 1]],
    'T': [[0, 1, 0], [1, 1, 1]],
    'S': [[0, 1, 1], [1, 1, 0]],
    'Z': [[1, 1, 0], [0, 1, 1]],
    'J': [[1, 0, 0], [1, 1, 1]],
    'L': [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
    'I': '#00f0f0',
    'O': '#f0f000',
    'T': '#a000f0',
    'S': '#00f000',
    'Z': '#f00000',
    'J': '#0000f0',
    'L': '#f0a000'
};

let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let score = 0;
let level = 1;
let gameLoop;
let isPaused = false;
let currentPiece = null;
let gameOver = false;

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.y = 0;
        this.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2);
    }

    rotate() {
        const newShape = this.shape[0].map((_, i) =>
            this.shape.map(row => row[i]).reverse()
        );
        
        const oldShape = this.shape;
        this.shape = newShape;
        
        if (this.collision()) {
            this.shape = oldShape;
        }
    }

    collision() {
        return this.shape.some((row, dy) =>
            row.some((value, dx) => {
                if (!value) return false;
                const newX = this.x + dx;
                const newY = this.y + dy;
                return newX < 0 || newX >= BOARD_WIDTH ||
                       newY >= BOARD_HEIGHT ||
                       (newY >= 0 && board[newY][newX]);
            })
        );
    }

    merge() {
        this.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    if (this.y + dy >= 0) {
                        board[this.y + dy][this.x + dx] = this.color;
                    }
                }
            });
        });
    }
}

function createPiece() {
    const pieces = Object.keys(SHAPES);
    const tetromino = pieces[Math.floor(Math.random() * pieces.length)];
    return new Piece(SHAPES[tetromino], COLORS[tetromino]);
}

function draw() {
    context.fillStyle = '#2c3e50';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем доску
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = value;
                context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });

    // Рисуем текущую фигуру
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    context.fillStyle = currentPiece.color;
                    context.fillRect(
                        (currentPiece.x + x) * BLOCK_SIZE,
                        (currentPiece.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
}

function clearLines() {
    let linesCleared = 0;
    
    for (let y = board.length - 1; y >= 0; y--) {
        if (board[y].every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        document.getElementById('score').textContent = score;
        
        // Увеличиваем уровень каждые 1000 очков
        const newLevel = Math.floor(score / 1000) + 1;
        if (newLevel !== level) {
            level = newLevel;
            document.getElementById('level').textContent = level;
        }
    }
}

function gameStep() {
    currentPiece.y++;
    
    if (currentPiece.collision()) {
        currentPiece.y--;
        currentPiece.merge();
        clearLines();
        
        currentPiece = createPiece();
        if (currentPiece.collision()) {
            gameOver = true;
            alert('Game Over! Score: ' + score);
            resetGame();
        }
    }
    
    draw();
}

function resetGame() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    gameOver = false;
    document.getElementById('score').textContent = '0';
    document.getElementById('level').textContent = '1';
    currentPiece = createPiece();
    draw();
}

function togglePause() {
    if (!gameOver) {
        isPaused = !isPaused;
        document.getElementById('pauseButton').textContent = isPaused ? 'Продолжить' : 'Пауза';
        if (isPaused) {
            clearInterval(gameLoop);
        } else {
            gameLoop = setInterval(() => !isPaused && gameStep(), 1000 / level);
        }
    }
}

document.getElementById('startButton').addEventListener('click', () => {
    if (!gameLoop || gameOver) {
        resetGame();
        gameLoop = setInterval(() => !isPaused && gameStep(), 1000);
    }
});

document.getElementById('pauseButton').addEventListener('click', togglePause);

document.addEventListener('keydown', event => {
    if (!currentPiece || isPaused || gameOver) return;

    switch (event.keyCode) {
        case 37: // Left
            currentPiece.x--;
            if (currentPiece.collision()) {
                currentPiece.x++;
            }
            break;
        case 39: // Right
            currentPiece.x++;
            if (currentPiece.collision()) {
                currentPiece.x--;
            }
            break;
        case 40: // Down
            currentPiece.y++;
            if (currentPiece.collision()) {
                currentPiece.y--;
            }
            break;
        case 38: // Up (Rotate)
            currentPiece.rotate();
            break;
        case 32: // Space (Drop)
            while (!currentPiece.collision()) {
                currentPiece.y++;
            }
            currentPiece.y--;
            break;
    }
    
    draw();
});

// Инициализация игры
resetGame();
