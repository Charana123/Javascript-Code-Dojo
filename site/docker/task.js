var num = 99
var a = 1, b = 0, temp;

console.log(0);
while (num > 0){
    temp = a;
    a = a + b;
    b = temp;
    console.log(b);
    num--;
}