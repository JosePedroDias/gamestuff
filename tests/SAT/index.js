var PI2 = Math.PI * 2;

var S = function(sel) {
    return document.querySelector(sel);
};

var drawCircle = function(ctx, ctr, r) {
    ctx.beginPath();
    ctx.arc(ctr[0], ctr[1], r, 0, PI2);
    ctx.stroke();
};

var drawPolygon = function(ctx, ctr, points) {
    var needsT = (ctr[0] || ctr[1]);

    if (needsT) {
        ctx.save();
        ctx.translate(ctr[0], ctr[1]);
    }

    ctx.beginPath();

    points.forEach(function(p, i) {
        ctx[p === 0 ? 'moveTo' : 'lineTo' ](p[0], p[1]);
    });

    var p = points[0];
    ctx.lineTo(p[0], p[1]);
    ctx.stroke();

    if (needsT) { ctx.restore(); }
};

var boxPoints = function(w, h) {
    w /= 2;
    h /= 2;
    return [
        [-w, -h],
        [ w, -h],
        [ w,  h],
        [-w,  h]
    ];
};



var cvsEl = S('canvas');
var ctx = cvsEl.getContext('2d');



var response = new SAT.Response();
var collided;

if (0) { // 1) CIRCLE CIRCLE
    // canvas draw

    drawCircle(ctx, [ 0, 0], 20);
    drawCircle(ctx, [30, 0], 20);



    // sat test

    var V = SAT.Vector;
    var C = SAT.Circle;

    var c1 = new C( new V( 0, 0), 20);
    var c2 = new C( new V(30, 0), 20);

    collided = SAT.testCircleCircle(c1, c2, response);
}
else if (1) { // 2) CIRCLE POLYGON
    // canvas draw

    drawCircle(ctx, [50, 50], 20);
    drawPolygon(ctx, [0, 0], [[0, 0], [40, 0], [40, 40], [0, 40]]);



    // sat test

    var V = SAT.Vector;
    var C = SAT.Circle;
    var P = SAT.Polygon;

    var c1 = new C( new V(50, 50), 20);

    // a square
    var poly = new P(new V(0, 0), [
        new V( 0,  0),
        new V(40,  0),
        new V(40, 40),
        new V( 0, 40)
    ]);

    collided = SAT.testPolygonCircle(poly, c1, response);
}
else if (0) { // 3) TWO POLYGONS
    // canvas draw

    drawPolygon(ctx, [ 0, 0], [[0, 0], [40, 0], [40, 40], [0, 40]]);
    drawPolygon(ctx, [30, 0], [[0, 0], [30, 0], [0, 30]]);



    // sat test

    var V = SAT.Vector;
    var P = SAT.Polygon;

    // a square
    var poly1 = new P(new V(0, 0), [
        new V( 0,  0),
        new V(40,  0),
        new V(40, 40),
        new V( 0, 40)
    ]);

    // a triangle
    var poly2 = new P(new V(30, 0), [
        new V( 0,  0),
        new V(30,  0),
        new V( 0, 30)
    ]);

    collided = SAT.testPolygonPolygon(poly1, poly2, response);
}
else if (0) { // 4) BOX BOX NO COLLISION
    // canvas draw

    drawPolygon(ctx, [  0,   0], boxPoints(20, 20));
    drawPolygon(ctx, [100, 100], boxPoints(20, 20));
    //drawPolygon(ctx, [19, 2], boxPoints(20, 20));


    // sat test

    var V = SAT.Vector;
    var B = SAT.Box;

    var b1 = new B( new V(  0,   0), 20, 20).toPolygon();
    var b2 = new B( new V(100, 100), 20, 20).toPolygon();
    //var b2 = new B( new V(19, 2), 20, 20).toPolygon();

    collided = SAT.testPolygonPolygon(b1, b2, response);
}

console.log('response', response);
console.log('collided', collided);
