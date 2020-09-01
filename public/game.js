//Offsets for each of the shapes
shapes = [
    [[0, 0], [1, 0], [0, 1], [1, 1]]
];

//Class for the squares of the game board
class Cell {
    constructor(col) {
        this.col = col;
        this.filled = false;
    }
}

//Class for the shape falling from the top of the screen
class Shape {

    constructor(shapeNum, boardWidth) {
        this.cells = shapes[shapeNum];//The offsets of each cell in the shape
        this.x = Math.floor(boardWidth / 2) - 1;//start the shape in the top middle of the screen
        this.y = 2;
        this.isStuck = false;
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

//Game board
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

//Handles all logic and drawing for the Game
class Game {
    constructor(conn) {
        this.conn = conn;//Socket connection to the server

        $('#gamePage').html(`<canvas id="gameCanvas" width="200" height="400" style="border:1px solid #000000;"></canvas>`);
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");//context to draw on
        this.canWidth = this.canvas.width;
        this.canHeight = this.canvas.height;

        this.board = new Board(10, 20);//Creates board with 10 by 20 cells in it
        this.shape = new Shape(0, this.board.width);//Creates falling shape

        this.lastMoveTime = Date.now();

    }

    keyPressed(key) {
        if (key == 0) {
            this.rotateClockwise(1);
        } else if (key == 1) {
            if (this.canMoveShape(-1, 0)) {
                this.removeShape();
                this.shape.x--;
                this.applyShape();
            }
        } else if (key == 2) {
            if (this.canMoveShape(1, 0)) {
                this.removeShape();
                this.shape.x++;
                this.applyShape();
            }
        } else if (key == 3) {
            if (this.canMoveShape(0, 1)) {
                this.removeShape();
                this.shape.y++;
                this.applyShape();
            }
        }
    }

    canMoveShape(x, y) {
        for (let i = 0; i < this.shape.cells.length; i++) {
            if (this.shape.cells[i][0] + this.shape.x + x < 0 || this.shape.cells[i][0] + this.shape.x + x >= this.board.width ||
                this.shape.cells[i][1] + this.shape.y + y < 0 || this.shape.cells[i][1] + this.shape.y + y >= this.board.height) {
                return false;
            } else if (this.board.board[this.shape.cells[i][0] + this.shape.x + x][this.shape.cells[i][1] + this.shape.y + y].filled == true) {
                let isSelf = false;
                for (let j = 0; j < this.shape.cells.length; j++) {
                    if (this.shape.cells[i][0] + this.shape.x + x == this.shape.cells[j][0] + this.shape.x &&
                        this.shape.cells[i][1] + this.shape.y + y == this.shape.cells[j][1] + this.shape.y) {
                        isSelf = true;
                    }
                }
                if (isSelf == false) {
                    return false;
                }
            }
        }

        return true;
    }


    //Removes falling shape from the board
    removeShape() {
        this.shape.cells.forEach(c => {
            if (c[0] + this.shape.x >= 0 && c[0] + this.shape.x < this.board.width && c[1] + this.shape.y >= 0 && c[1] + this.shape.y < this.board.height) {
                this.board.board[c[0] + this.shape.x][c[1] + this.shape.y].filled = false;
            }
        });
    }

    //Adds falling shape onto board
    applyShape() {
        this.shape.cells.forEach(c => {
            if (c[0] + this.shape.x >= 0 && c[0] + this.shape.x < this.board.width && c[1] + this.shape.y >= 0 && c[1] + this.shape.y < this.board.height) {
                this.board.board[c[0] + this.shape.x][c[1] + this.shape.y].filled = true;
            }
        });
    }

    updateGameBoard() {

        if (Date.now() - this.lastMoveTime > 500) {
            this.lastMoveTime = Date.now();
            if (this.shape.isStuck) {
                this.shape = new Shape(0, this.board.width);
                if (this.canMoveShape(0, 0) == false) {
                    console.log("YOU LOSE");
                }
            } else {
                this.removeShape();

                if (this.canMoveShape(0, 1)) {
                    this.shape.y++;
                } else {
                    this.shape.isStuck = true;
                }
            }
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
        this.updateGameBoard();
        this.drawBoard();
    }

    endGame() {
        clearInterval(this.interval);
    }
};