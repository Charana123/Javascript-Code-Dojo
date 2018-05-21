var board = {
    canvas : document.getElementById("game-canvas"),
    start : function() {
        this.canvas.width = 450;
        this.canvas.height = 450;
        this.context = this.canvas.getContext("2d");
        this.frameNo = 0;
        this.interval = setInterval(updateGame, 20);
        this.context.rect(0, 0, 450, 450);
        this.context.fillStyle = "#000000";
        this.context.fill();
        },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.rect(0, 0, 450, 450);
        this.context.fillStyle = "#000000";
        this.context.fill();
    }
}

var player = new ship(450/2, 450/2, 0, 0, 0, 0, "white");
var bullets = [];
var enemys = [];
var idB = 0;
var idE = 0;
var lock = true;
var gameOver = false;


function ship(x, y, xs, ys, xa, ya, color) {
    this.x = x;
    this.y = y;
    this.speed = 3;
    this.vx = 0;
    this.vy = 0;
    this.acc = 0.95;
    this.rotationspeed = 5;
    this.rotation = 0;
    this.lives = 5;
    this.score = 0;
    this.cooloff = false;
    this.coolsec = 0;

    this.update = function() {
        this.vx *= this.acc;
        this.vy *= this.acc;
        this.x += this.vx;
        this.y -= this.vy;
        if (this.x <   0) this.x = 430;
        if (this.x > 430) this.x = 0;
        if (this.y <   0) this.y = 430;
        if (this.y > 430) this.y = 0;
        var ctx = board.context;
        ctx.strokeStyle = color;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(degToRad(this.rotation));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, 25);
        ctx.lineTo(10,  25);
        ctx.lineTo(0,   0);
        ctx.stroke();
        ctx.restore();
        if (!this.cooloff) this.checkCol();
        else if (new Date().getSeconds() -1 >= this.coolsec) this.cooloff = false;
    },

    this.checkCol = function() {
        for (var i=0; i<enemys.length; i++) {
            if (this.x >= (enemys[i].x) && this.x <= (enemys[i].x +enemys[i].size + 5) && this.y >= (enemys[i].y) && this.y <= (enemys[i].y + enemys[i].size +5)) {
                this.lives --;
                this.cooloff = true;
                this.coolsec = new Date().getSeconds();
                destroyEnem(enemys[i].id);
                if (this.lives == 0) gameOver = true;
                break;
            }
        }

    }
}


function startGame() {
    board.start();
}

function updateGame() {
    if (!gameOver) {
        board.clear();
        board.context.font = "16px Sans";
        board.context.fillStyle = "white";
        board.context.fillText("Lives : " + player.lives,1,17);
        board.context.fillText("Score : " + player.score,1,37);
        player.update();
        if (enemys.length < 4) newEnemy();
        if (new Date().getSeconds() % 5 == 0 && !lock){
            lock = true;
            newEnemy();
        } else {
            if (new Date().getSeconds() % 10 == 1) lock = false;
        }
        for (var i=0; i<bullets.length; i++) bullets[i].update();
        for (var i=0; i<enemys.length; i++) enemys[i].update();
    } else {
        board.context.clearRect(0, 0, 120, 80);
        board.context.font = "16px Sans";
        board.context.fillStyle = "white";
        board.context.fillText("Lives : " + player.lives,1,17);
        board.context.fillText("Score : " + player.score,1,37);
        board.context.fillText("Game Over!",1,55);
    }
}

onkeydown = function(event){
    switch (event.keyCode) {
        case 32:
            if (bullets.length < 6) shootBullet();
            break;

        case 37:
            player.rotation -= player.rotationspeed;
            break;

        case 38:
            player.vx += Math.sin(degToRad(player.rotation)) * player.speed;
            player.vy += Math.cos(degToRad(player.rotation)) * player.speed;
            break;

        case 39:
            player.rotation += player.rotationspeed;
            break;

        default:
            break;
    }
}


function degToRad(deg) {
    return deg * Math.PI / 180;
}

function shootBullet() {
    bullets.push(new bullet(player.x, player.y, player.rotation));
}

function bullet(x, y, rotation) {
    this.id = idB;
    idB++;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.vx = Math.sin(degToRad(this.rotation)) * 3;
    this.vy = Math.cos(degToRad(this.rotation)) * 3;

    this.update = function() {
        this.x += this.vx;
        this.y -= this.vy;
        if (this.x <   0) destroyBul(this.id); 
        if (this.x > 450) destroyBul(this.id); 
        if (this.y <   0) destroyBul(this.id); 
        if (this.y > 450) destroyBul(this.id); 
        var ctx = board.context;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, 2*Math.PI, false);
        ctx.fillStyle = "white";
        ctx.fill();
        this.checkColl();
    },

    this.checkColl = function() {
        for (var i=0; i<enemys.length; i++) {
            if (this.x >= (enemys[i].x) && this.x <= (enemys[i].x +enemys[i].size) && this.y >= (enemys[i].y) && this.y <= (enemys[i].y + enemys[i].size)) {
                destroyBul(this.id);
                destroyEnem(enemys[i].id);
                player.score++;
                break;
            }
        }
    }
}

function destroyBul(id) {
    for (var i=0; i<bullets.length; i++) {
        if (bullets[i].id == id) {
            bullets.splice(i, 1);
            break;
        }
    }
}

function destroyEnem(id) {
    for (var i=0; i<enemys.length; i++) {
        if (enemys[i].id == id) {
            var part = enemys[i].part;
            if(part < 2) {
                var x = enemys[i].x;
                var y = enemys[i].y;
                var size = enemys[i].size/2;
                var vx = (Math.random() * 1.7) * (Math.round(Math.random()) * 2 - 1);
                var vy = (Math.random() * 1.7) * (Math.round(Math.random()) * 2 - 1);
                enemys.push(new enemy(x, y, vx, vy, size, part+1));
                vx = (Math.random() * 1.7) * (Math.round(Math.random()) * 2 - 1);
                vy = (Math.random() * 1.7) * (Math.round(Math.random()) * 2 - 1);
                enemys.push(new enemy(x, y, vx, vy, size, part+1));
            }
            enemys.splice(i, 1);
            break;
        }
    }
}

function enemy(x, y, vx, vy, size, part) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.id = idE;
    idE++;
    this.part = part;
    if (this.x >= ship.x-10 && this.x <= ship.x +10  && this.y >= ship.y -10 && this.y <= ship.y + 10) {
        this.x+= 100;
        this.y+= 100;
    }

    this.update = function() {
        this.x += this.vx;
        this.y -= this.vy;
        if (this.x < -this.size) this.x = 450 - this.size;
        if (this.x > (450 - this.size)) this.x = 0;
        if (this.y < -this.size) this.y = 450 - this.size;
        if (this.y > (450-this.size)) this.y = 0;
        var ctx = board.context;
        ctx = board.context;
        ctx.strokeStyle = "white";
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x+this.size, this.y);
        ctx.lineTo(this.x+this.size,  this.y+this.size);
        ctx.lineTo(this.x, this.y+this.size);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

function newEnemy() {
    var x = Math.random() * 450;
    var y = Math.random() * 450;
    var vx = (Math.random() * 1.5) * (Math.round(Math.random()) * 2 - 1);
    var vy = (Math.random() * 1.5) * (Math.round(Math.random()) * 2 - 1);
    var size = Math.floor((Math.random() * 40)+30);
    enemys.push(new enemy(x, y, vx, vy, size, 0));
}
