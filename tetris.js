const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(30, 30); // Each block is 30x30 px

const ROWS = 20;
const COLS = 10;
const COLORS = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // I
    '#0DFF72', // S
    '#F538FF', // Z
    '#FF8E0D', // L
    '#FFE138', // J
    '#3877FF'  // O
];

const SHAPES = [
    [],
    [ // T
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    [ // I
        [0, 0, 0, 0],
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [ // S
        [0, 3, 3],
        [3, 3, 0],
        [0, 0, 0]
    ],
    [ // Z
        [4, 4, 0],
        [0, 4, 4],
        [0, 0, 0]
    ],
    [ // L
        [0, 5, 0],
        [0, 5, 0],
        [0, 5, 5]
    ],
    [ // J
        [0, 6, 0],
        [0, 6, 0],
        [6, 6, 0]
    ],
    [ // O
        [7, 7],
        [7, 7]
    ]
];

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TJSLZOI';
    player.matrix = createPiece(pieces[(Math.random() * pieces.length) | 0]);
    player.pos.y = 0;
    player.pos.x = ((COLS / 2) | 0) - ((player.matrix[0].length / 2) | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function createPiece(type) {
    switch (type) {
        case 'T': return SHAPES[1].map(row => row.slice());
        case 'I': return SHAPES[2].map(row => row.slice());
        case 'S': return SHAPES[3].map(row => row.slice());
        case 'Z': return SHAPES[4].map(row => row.slice());
        case 'L': return SHAPES[5].map(row => row.slice());
        case 'J': return SHAPES[6].map(row => row.slice());
        case 'O': return SHAPES[7].map(row => row.slice());
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function getShadowPosition(matrix, pos, arena) {
    const shadowPos = { x: pos.x, y: pos.y };
    while (true) {
        shadowPos.y++;
        if (collide(arena, {matrix, pos: shadowPos})) {
            shadowPos.y--;
            break;
        }
    }
    return shadowPos;
}

function drawMatrix(matrix, offset, options = {}) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (options.shadow) {
                    context.save();
                    context.globalAlpha = 0.25;
                    context.strokeStyle = COLORS[value];
                    context.lineWidth = 0.12;
                    context.strokeRect(x + offset.x + 0.05, y + offset.y + 0.05, 0.9, 0.9);
                    context.restore();
                } else {
                    context.fillStyle = COLORS[value];
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                    // Outer dark border
                    context.strokeStyle = '#222';
                    context.lineWidth = 0.08;
                    context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                    // Inner highlight border
                    context.strokeStyle = '#fff8';
                    context.lineWidth = 0.05;
                    context.strokeRect(x + offset.x + 0.08, y + offset.y + 0.08, 0.84, 0.84);
                }
            }
        });
    });
}

function draw() {
    context.fillStyle = '#111';
    context.fillRect(0, 0, COLS, ROWS);
    drawMatrix(arena, {x:0, y:0});
    // Draw shadow
    const shadowPos = getShadowPosition(player.matrix, player.pos, arena);
    drawMatrix(player.matrix, shadowPos, {shadow: true});
    // Draw actual piece
    drawMatrix(player.matrix, player.pos);
}

function updateScore() {
    document.getElementById('score').innerText = 'Score: ' + player.score;
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}

const arena = createMatrix(COLS, ROWS);
const player = {
    pos: {x:0, y:0},
    matrix: null,
    score: 0
};

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'q' || event.key === 'Q') {
        playerRotate(-1);
    } else if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
        playerRotate(1);
    }
});

document.getElementById('restart').addEventListener('click', () => {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    playerReset();
});

playerReset();
updateScore();
update(); 