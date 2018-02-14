var board = {
    canvas : document.querySelector("canvas"),
    start : function() {
        this.canvas.width = 450;
        this.canvas.height = 450;
        this.context = this.canvas.getContext("2d");
        this.context.rect(0, 0, 450, 450);
        this.context.fillStyle = "#CCCCCC";
        this.context.fill();
        //document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGame, 20);
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.rect(0, 0, 450, 450);
        this.context.fillStyle = "#CCCCCC";
        this.context.fill();
    }
}

var head = new box(10, 10, 20, 0, 'blue',  1);
var food = new box(Math.floor((Math.random() * 450)), Math.floor((Math.random() * 450)), 0, 0, 'green', 2);
var tail = [];
var gameOver = false;

function startGame() {
    board.start();
}

var time = 4;

function updateGame() {
    time++;
    if (time == 5 && !gameOver) {
        board.clear();
        moveSnake();
        food.update();
        for (var i=0; i<tail.length; i++) tail[i].update();
        if (head.x >= (food.x - 20) && head.x <= (food.x + 20) && head.y >= (food.y - 10) && head.y <= (food.y + 20)) {
            eatFood();
        }
        checkGameOver();
        time = 0;
    }
}


onkeydown = function(event){
    switch (event.keyCode) {
        case 37:
            head.xspeed = -20;
            head.yspeed = 0;
            break;

        case 38:
            head.xspeed = 0;
            head.yspeed = -20;
            break;

        case 39:
            head.xspeed = 20;
            head.yspeed = 0;
            break;

        case 40:
            head.xspeed = 0;
            head.yspeed = 20;
            break;

        default:
            break;
    }
}

function eatFood() {
    var onTail = true;

    addTail();
    while (onTail) {
        food.x = Math.floor((Math.random() * 450));
        food.y = Math.floor((Math.random() * 450));
        onTail = false;
        for (var i=0; i<tail.length; i++) {
            if (food.x >= (tail[i].x - 20) && food.x <= (tail[i].x + 20) && food.y >= (tail[i].y - 20) && food.y <= (tail[i].y + 20)) {
                onTail = true;
                break;
            }
        }
    }
}

function checkGameOver() {
    for (var i=0; i<tail.length; i++) {
        if (head.x >= (tail[i].x - 10) && head.x <= (tail[i].x + 10) && head.y >= (tail[i].y - 10) && head.y <= (tail[i].y + 10)) {
            gameOver = true;
            ctx.font = "30px Arial";
            ctx.fillStyle = "black";
            ctx.fillText("Game Over!",10,50);
            break;
        }
    }
}

function addTail() {
    if (tail.length == 0) {
        tail[0] = new box(head.x, head.y, 0, 0, 'blue',  0);
        head.update();
    } else {
        tail.push(new box(tail[tail.length -1].x, tail[tail.length -1].y, 0, 0, 'blue',  0));
        for(var i=tail.length-2; i>0; i--) {
            tail[i].x = tail[i-1].x;
            tail[i].y = tail[i-1].y;
        }
        tail[0].x = head.x;
        tail[0].y = head.y;
        head.update();
    }

}

function moveSnake() {
    if (tail.length > 0) {
        for (var i=tail.length-1; i>0; i--) {
            tail[i].x = tail[i-1].x;
            tail[i].y = tail[i-1].y;
        }
        tail[0].x = head.x;
        tail[0].y = head.y;
    }
    head.update();
}

function box(x, y, xspeed, yspeed, color, type) {
    this.x = x;
    this.y = y;
    this.xspeed = xspeed;
    this.yspeed = yspeed;
    this.type = type;

    this.update = function() {
        if (this.type = 1) {
            this.x += this.xspeed;
            this.y += this.yspeed;
            if (this.x <   0) this.x = 430;
            if (this.x > 430) this.x = 0;
            if (this.y <   0) this.y = 430;
            if (this.y > 430) this.y = 0;
        }
        ctx = board.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, 17, 17);
    }
}
