//Offsets for each of the shapes
//End index hold the anchor point for the shapes to rotate about
shapes = [
    [[0, 0], [0, 1], [0, -1], [0, 2], [0, 0.5]], //Line
    [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]], //Box
    [[0, 0], [1, 0], [-1, 0], [-1, -1], [0, 0]] //L-shape
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

    constructor(shapeNum, x, y) {
        this.cells = [];//The offsets of each cell in the shape
        for (let i = 0; i < shapes[shapeNum].length - 1; i++) {
            this.cells.push(shapes[shapeNum][i]);
        }

        this.anchorX = shapes[shapeNum][shapes[shapeNum].length - 1][0];
        this.anchorY = shapes[shapeNum][shapes[shapeNum].length - 1][1];
        this.x = x;
        this.y = y;
        this.isStuck = false;
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

        $("#gameMenu").show();
        $('#gameCanvasContainer').hide();
        $('#gameControls').hide();
        $('#gameEndScreen').hide();

        this.pageWidth = $(document).width();
        this.pageHeight = $(document).height();
        let aspectRatio = this.pageWidth / this.pageHeight;
        if (aspectRatio > 0.5) {
            $('#gameCanvasContainer').html(`<canvas id="gameCanvas" width="${0.98 * this.pageHeight * 0.5}" height="${0.98 * this.pageHeight}" style="border:1px solid #000000;"></canvas>`);
        } else {
            $('#gameCanvasContainer').html(`<canvas id="gameCanvas" width="${0.98 * this.pageWidth}" height="${this.pageWidth * 0.98 * 2}" style="border:1px solid #000000;"></canvas>`);
        }

        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");//context to draw on
        this.canWidth = this.canvas.width;
        this.canHeight = this.canvas.height;

        this.board = new Board(10, 20);//Creates board with 10 by 20 cells in it
        this.shape = new Shape(Math.floor(shapes.length * Math.random()), Math.floor(this.board.width / 2) - 1, 2);//Creates falling shape

        this.lastMoveTime = Date.now();

        this.screen = -1; //-1 = build pages, 0 = menu, 1 = game screen, 2 = end game screen

    }

    handleMess(mess) {
        if (mess.data.key != undefined) {
            this.keyPressed(mess.data.key);
        }
    }

    //Carrys out actions based on the keys pressed
    keyPressed(key) {
        if (key == 0) {//Up
            this.rotate(1);
        } else if (key == 1) {//Left
            if (this.canMoveShape(-1, 0)) {
                this.removeShape();
                this.shape.x--;
                this.applyShape();
            }
        } else if (key == 2) {//Right
            if (this.canMoveShape(1, 0)) {
                this.removeShape();
                this.shape.x++;
                this.applyShape();
            }
        } else if (key == 3) {//Down
            if (this.canMoveShape(0, 1)) {
                this.removeShape();
                this.shape.y++;
                this.applyShape();
            }
        }
    }

    canRotate(dir) {
        let newX = 0;
        let newY = 0;
        for (let i = 0; i < this.shape.cells.length; i++) {
            newX = dir * (this.shape.cells[i][1] - this.shape.anchorX) + this.shape.anchorX;
            newY = -dir * (this.shape.cells[i][0] - this.shape.anchorY) + this.shape.anchorY;
            if (newX + this.shape.x < 0 || newX + this.shape.x >= this.board.width ||
                newY + this.shape.y < 0 || newY + this.shape.y >= this.board.height) {
                return false;
            } else if (this.board.board[newX + this.shape.x][newY + this.shape.y].filled == true) {
                let isSelf = false;
                for (let j = 0; j < this.shape.cells.length; j++) {
                    if (newX == this.shape.cells[j][0] &&
                        newY == this.shape.cells[j][1]) {
                        isSelf = true;
                        break;
                    }
                }
                if (!isSelf) {
                    return false;
                }
            }
        }
        return true;
    }

    rotate(dir) {//dir should either be 1 or -1 for clockwise or anticlockwise respectively
        if (this.canRotate(dir)) {
            this.removeShape();
            let newX = 0;
            let newY = 0;
            for (let i = 0; i < this.shape.cells.length; i++) {
                newX = dir * (this.shape.cells[i][1] - this.shape.anchorX);
                newY = -dir * (this.shape.cells[i][0] - this.shape.anchorY);

                this.shape.cells[i][0] = newX + this.shape.anchorX;
                this.shape.cells[i][1] = newY + this.shape.anchorY;
            }
        }

    }

    rowFull(row) {
        for (let i = 0; i < this.board.width; i++) {
            if (!this.board.board[i][row].filled) {
                return false;
            }
        }

        return true;
    }

    moveRow(row, dist) {
        for (let i = 0; i < this.board.width; i++) {
            this.board.board[i][row + dist].filled = this.board.board[i][row].filled;
            this.board.board[i][row].filled = false;
        }
    }

    removeRowsIfPossible() {
        for (let row = 0; row < this.board.height; row++) {
            if (this.rowFull(row)) {
                for (let i = row - 1; i >= 0; i--) {
                    this.moveRow(i, 1);
                }
            }
        }

    }

    canMoveShape(x, y) {
        for (let i = 0; i < this.shape.cells.length; i++) {
            //Is the shape outside the board
            if (this.shape.cells[i][0] + this.shape.x + x < 0 || this.shape.cells[i][0] + this.shape.x + x >= this.board.width ||
                this.shape.cells[i][1] + this.shape.y + y < 0 || this.shape.cells[i][1] + this.shape.y + y >= this.board.height) {
                return false;
                //Is the shape overlapping already placed blocks
            } else if (this.board.board[this.shape.cells[i][0] + this.shape.x + x][this.shape.cells[i][1] + this.shape.y + y].filled == true) {
                let isSelf = false;
                //Is this a false positive caused by the shape overlapping itself
                for (let j = 0; j < this.shape.cells.length; j++) {
                    if (this.shape.cells[i][0] + this.shape.x + x == this.shape.cells[j][0] + this.shape.x &&
                        this.shape.cells[i][1] + this.shape.y + y == this.shape.cells[j][1] + this.shape.y) {
                        isSelf = true;
                        break;
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
                this.removeRowsIfPossible();
                this.shape = new Shape(Math.floor(shapes.length * Math.random()), Math.floor(this.board.width / 2) - 1, -2);

                if (this.canMoveShape(0, 4) == false) {
                    this.switchScreen(2);
                }
                this.shape.y += 4;
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

    switchScreen(s) {
        this.screen = s;
        switch (s) {
            case 0:
                $('#gameReadyButton').html(`
                    <b>Ready?</b>
                `);
                $('#gameReadyButton').click(function () {
                    conHandler.game.switchScreen(1);
                });
                $('#gameMenu').show();
                $('#gameCanvasContainer').hide();
                $('#gameEndScreen').hide();
                break;
            case 1:
                {
                    let data = JSON.stringify({
                        purp: "pass",
                        data: { updateGameState: 1 },
                        time: Date.now(),
                        id: conHandler.id
                    });
                    conHandler.socket.send(data);
                }
                $('#gameMenu').hide();
                $('#gameCanvasContainer').show();
                $('#gameEndScreen').hide();

                break;
            case 2:
                {
                    let data = JSON.stringify({
                        purp: "pass",
                        data: { updateGameState: 2 },
                        time: Date.now(),
                        id: conHandler.id
                    });
                    conHandler.socket.send(data);
                }
                $('#gameEndScreen').html(`
                    <b>Game Over</b>
                `);
                $('#gameMenu').hide();
                $('#gameCanvasContainer').hide();
                $('#gameEndScreen').show();
                break;
        }
    }

    update() {
        if (this.screen == -1) {
            this.switchScreen(0);
        } else if (this.screen == 0) {

        } else if (this.screen == 1) {
            this.updateGameBoard();
            this.drawBoard();
        } else if (this.screen == 2) {

        }
    }

    endGame() {
        clearInterval(this.interval);
    }
};