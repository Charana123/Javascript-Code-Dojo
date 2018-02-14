function Board() {

  this.c = color(50);
  this.xpos = 100;
  this.ypos = 10;
  this.squares = [];
  this.score =0;
  this.mul =0.5;
  this.linesRem = 0;

  this.present = new Array(10);
  for(var i=0; i<10; i++){
    this.present[i] =new Array(20);
  }
  for(var i=0; i<10; i++){
    for(var j=0; j<20; j++){
      this.present[i][j]=0;
    }
  }

  this.addToBoard = function(shape){
    var newSquare = {};
    for(var i=0; i< shape.squares.length; i++){
      newSquare = cloneObject(shape.squares[i]);
      newSquare.ypos = Math.round(newSquare.ypos / 10) * 10;
      this.present[((newSquare.xpos-100)/10)][(newSquare.ypos/10)-1] = 1;
      this.squares.push(newSquare);
    }
  }

  cloneObject = function(original){
    var clone = Object.create(Object.getPrototypeOf(original)) ;
    var i , keys = Object.getOwnPropertyNames(original) ;
    for ( i = 0 ; i < keys.length ; i ++ ) {
      Object.defineProperty( clone , keys[ i ] ,
        Object.getOwnPropertyDescriptor( original , keys[ i ] )
      );
    }
    return clone ;
  }

  this.updateScore = function() {
    this.score += (this.mul*this.linesRem*10);
    console.log(this.score);
    this.linesRem=0;
    this.mul =0.5;
    return this.score;
  }

  this.checkLines = function() {
    for(var i =0; i<20; i++) {
      if(this.checkLine(i)){
        this.removeLine(i);
        this.mul*2;
        this.linesRem++;
        this.checkLines();
        break;
      }
    }
    return 0;
  }

  this.checkLine = function(y) {
    for(var i=0; i< 10; i++){
      if(!this.present[i][y]) return 0;
    }
    return 1;
  }

  this.removeLine = function(y) {
    for(var i=this.squares.length-1; i >=0; i--) {
      if(this.squares[i].ypos == (y*10)+10) {
        this.squares.splice(i,1);
      }
    }
    for(var i=this.squares.length-1; i >=0; i--) {
      if(this.squares[i].ypos <(y*10+10)) this.squares[i].ypos += 10;
    }
    for(var i=0; i<10; i++) {
      this.present[i][0] == 0;
      for(var j=y; j>0; j--){
        this.present[i][j] = this.present[i][j-1];
      }
    }
  }

  this.display = function() {
    fill(this.c);
    rectMode(CORNER);
    rect(this.xpos, this.ypos, 100, 200);
    for(var i=0; i<this.squares.length; i++) {
      this.squares[i].display();
    }
  }

}
