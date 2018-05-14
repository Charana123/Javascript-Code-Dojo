for (var year = 2000; year <= 2050; year++) {
    var d = new Date(year, 0, 1);

    if ( d.getDay() === 0 ) {
        console.log(year);
    }
}
