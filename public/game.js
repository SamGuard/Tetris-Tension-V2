shapes = [
    [[0, 0], [1, 0], [0, 1], [1, 1]]
];

class Cell {
    constructor(col) {
        this.col = col;
        this.filled = false;
    }
}

class Shape {

    constructor(shapeNum, boardWidth) {
        this.cells = shapes[shapeNum];
        this.x = Math.floor(boardWidth / 2);
        this.y = 2;
    }

    rotateClockwise(dir) {//dir should either be 1 or -1 for clockwise or anticlockwise respectively
        let tempX;
        for (let i = 0; i < this.cells.length; i++) {
            tempX = this.cells[i][0];
            this.cells[i][0] = dir * this.cells[i][1];
            this.cells[i][1] = -dir * tempX;
        }
    }
}

class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.board = [];
        this.interval = null;
        for (let x = 0; x < width; x++) {
            this.board.push([]);
            for (let y = 0; y < height; y++) {
                this.board[x].push(new Cell("#00FF00"));
            }
        }
    }
}

class Game {
    constructor(isHost, conn) {
        this.boardWidth
        this.isHost = isHost;
        this.conn = conn;
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.canWidth = this.canvas.width;
        this.canHeight = this.canvas.height;

        this.board = new Board(10, 20);
        this.shape = new Shape(0, this.board.width);

        this.lastMoveTime = Date.now();

    }

    canMoveShape(shape, x, y) {
        for (let i = 0; i < shape.cells.length; i++) {
            if (this.board.board[shape.cells[i][0] + shape.x + x][shape.cells[i][0] + shape.y + y].filled == true ||
                shape.cells[i][0] + shape.x + x < 0 || shape.cells[i][0] + shape.x + x >= this.board.width ||
                shape.cells[i][1] + shape.y + y < 0 || shape.cells[i][1] + shape.y + y >= this.board.height) {
                return false;
            }
        }
        return true;
    }

    moveShape(x, y) {
        for (let i = 0; i < this.shape.cells.length; i++) {
            this.shape.cells[i][0] += x;
            this.shape.cells[i][1] += y;
        }
    }

    removeShape(){
        this.shape.cells.forEach(c => {
            if (c[0] + this.shape.x >= 0 && c[0] + this.shape.x < this.board.width && c[1] + this.shape.y >= 0 && c[1] + this.shape.y < this.board.height) {
                this.board.board[c[0] + this.shape.x][c[1] + this.shape.y].filled = false;
            }
        });
    }

    applyShape(){
        this.shape.cells.forEach(c => {
            if (c[0] + this.shape.x >= 0 && c[0] + this.shape.x < this.board.width && c[1] + this.shape.y >= 0 && c[1] + this.shape.y < this.board.height) {
                this.board.board[c[0] + this.shape.x][c[1] + this.shape.y].filled = true;
            }
        });
    }

    updateGameBoard() {

        if (Date.now() - this.lastMoveTime > 1000) {
            this.removeShape();

            if (this.canMoveShape(this.shape, 0, 1)) {
                this.moveShape(0, 1);
            }

            this.lastMoveTime = Date.now();
        }

        this.applyShape();
           
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.canWidth, this.canHeight);
        this.ctx.strokeStyle = "#000000";
        let cellWidth = this.canWidth / this.board.width;
        let cellHeight = this.canHeight / this.board.height;
        for (let x = 0; x < this.board.width; x++) {
            for (let y = 0; y < this.board.height; y++) {
                if (this.board.board[x][y].filled == true) {
                    this.ctx.fillStyle = this.board.board[x][y].col;
                } else {
                    this.ctx.fillStyle = "#999999";
                }
                this.ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                this.ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    drawControls() {

    }

    update() {
        if (this.isHost == true) {
            this.updateGameBoard();
            this.drawBoard();
        } else {
            this.drawControls();
        }
    }

    endGame() {
        clearInterval(this.interval);
    }
};

