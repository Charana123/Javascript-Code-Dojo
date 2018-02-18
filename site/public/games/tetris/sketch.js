var shapes  =[];
var square;
var board;
var current;
var gameOver=0;
var level =50;
var move=level-1;
var speed =10;
var frame =60;
var score =0;

function setup() {
    setFrameRate(frame);
    var cnv = createCanvas(300, 300);
    var x = (windowWidth - width) / 100;
    var y = (windowHeight - height) / 3;
    cnv.position(x, y);
    background(0);
    board = new Board();
    current = new ranShape();
    score = createP("Score : 0");
}

function draw() {
    board.display();
    current.display();

    move++;
    if(move ==level && !gameOver){
        current.settled = collisionFall();
        if(current.settled){
            board.addToBoard(current);
            board.checkLines();
            score.html("Score : " + board.updateScore());
            current = ranShape();
            current.settled = collisionFall();
            if(current.settled){
                gameOver=1;
                console.log("Game Over");
                score.html("Score : " + board.updateScore() + " Game Over!");
            }
        }
        current.fall();
        move =0;
    }

}

collisionFall = function() {
    if(current.bottom > 200) return 1;
    for(var i=0; i<current.squares.length; i++){
        if(board.present[((current.squares[i].xpos-100)/10)][(current.squares[i].ypos/10)]){
            return 1;
        }
    }
    return 0;
}

collisionRight = function() {
    for(var i=0; i<current.squares.length; i++){
        if(current.squares[i].xpos==190) return 1;
        if(board.present[((current.squares[i].xpos-100)/10)+1][(current.squares[i].ypos/10)-1]){
            return 1;
        }
    }
    return 0;
}

collisionLeft = function() {
    for(var i=0; i<current.squares.length; i++){
        if(current.squares[i].xpos==100) return 1;
        if(board.present[((current.squares[i].xpos-100)/10)-1][(current.squares[i].ypos/10)-1]){
            return 1;
        }
    }
    return 0;
}


function keyPressed() {
    if((key == ' ' || keyCode == UP_ARROW)  && !current.settled) {
        current.rotateClock();
    } else if (keyCode == RIGHT_ARROW && !collisionRight() && !current.settled){
        current.moveRight();
    } else if (keyCode == LEFT_ARROW && !collisionLeft()  && !current.settled){
        current.moveLeft();
    } else if(keyCode == DOWN_ARROW){
        level = 3;
        move=2;
    }
}

function keyReleased() {
    if(keyCode == DOWN_ARROW){
        level =20;
        move=9;
    }
}

function ranShape() {
    var r = Math.floor(random(6.999));
    switch(r) {
        case 0:
            return new TShape(board.xpos, board.ypos, speed);
        case 1:
            return new LineShape(board.xpos, board.ypos, speed);
        case 2:
            return new ZShape(board.xpos, board.ypos, speed);
        case 3:
            return new BoxShape(board.xpos, board.ypos, speed);
        case 4:
            return new LShape(board.xpos, board.ypos, speed);
        case 5:
            return new SShape(board.xpos, board.ypos, speed);
        case 6:
            return new LOpShape(board.xpos, board.ypos, speed);
    }
}
