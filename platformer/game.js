/*shint */
/*global CS:false, COL:false, AU:false, prompt:false */

 'use strict';

 var $ = function(a) {
    return document.querySelector(a);
 };

var scr = CS.createScreen({
    scale:      2,
    resize:     true,
    handleKeys: true
});

var UP    = 38,
    DOWN  = 40,
    LEFT  = 37,
    RIGHT = 39,
    SPACE = 32;

var score = 0;
var pos0;

scr.update = function() {
    var m = this.shapes[0];

    if (m.v[1] > 10) {
        score = 0;
        // reset time?
        m.pos = pos0.slice();
        m.v = [0, 0];
    }

    m.pos[0] += m.v[0];
    m.pos[1] += m.v[1];
    COL.updateShape(m);

    var ks = this.keys;

    m.collided   = false;
    m.onPlatform = false;
    for (var i = 1, f = this.shapes.length, s; i < f; ++i) {
        s = this.shapes[i];
        
        if (s.behave !== 'ghost' && COL.areShapesColliding(m, s)) {

            if (s.behave === 'destructible') {
                this.shapes.splice(i, 1);   // assumes 1 destructible per frame
                ++score;
                AU.playSample('timer');
                break;
            }

            m.collided = true;

            if (s.behave === 'stairs') {
                break;
            }

            var dst = COL.collideDirection(m, s);   // assumes 1 axis dir per collision

            if (/*!s.behave &&*/ (dst[1] > 0 || m.prevSId === s.id) ) {  // can go up
                m.collided = false;
                m.prevSId = s.id;
                continue;
            }

            var axis = dst[0] ? 0 : 1;
            m.pos[axis] += dst[axis];
            m.v[axis] *= -0.2;
            m.onPlatform = dst[1] < 0;
            
            break; // assumes 1 collision per frame
        }
    }

    var yDir = 0;
    var xDir = 0;
    if      (ks[LEFT ]) { xDir = -1; }
    else if (ks[RIGHT]) { xDir =  1; }
    if      (ks[UP   ]) { yDir = -1; }
    else if (ks[DOWN ]) { yDir =  1; }

    if (!m.collided) {
        m.v[0] = 2 * xDir;
        m.v[1] += 0.1;
    }
    else {
        //m.prevSId = s.id;

        if (s.behave === 'stairs') {
            m.v[0] = 2 * xDir;
            m.v[1] = 2 * yDir;
        }
        else if (m.onPlatform) {
            if (s.behave === 'spring') {
                m.v[1] = -s.a;
                AU.playSample('schling');
            }
            else if (ks[SPACE]) {
                m.v[1] = -3;
                AU.playSample('jump');
            }
            else if (s.behave === 'moving') {
                m.v[0] = s.v[0] + 2 * xDir;
            }
            else if (s.behave === 'conveyor') {
                m.v[0] = s.v*0.5 + 2 * xDir;
                m.pos[1] += 0.1;
            }
            else if (s.behave === 'ice') {
                if (m.lastBehave !== 'ice' || !s.xDir) {
                    s.xDir = xDir;
                }
                else {
                    m.v[0] = 2 * s.xDir;
                }
                m.pos[1] += 0.1;
            }
        }
    }
    

    m.lastBehave = s.behave;

    // move platforms
    var T;
    for (i = 1, f = this.shapes.length; i < f; ++i) {
        s = this.shapes[i];
        if (s.behave === 'moving') {
            T = this.t % s.duration / s.duration;
            s.v = s.pos.slice();
            s.pos[0] = s.from[0] * (1-T) + s.to[0] * T;
            s.pos[1] = s.from[1] * (1-T) + s.to[1] * T;
            s.pos2[0] = s.pos[0] + s.dims[0];
            s.pos2[1] = s.pos[1] + s.dims[1];
            s.v[0] = s.pos[0] - s.v[0];
            s.v[1] = s.pos[1] - s.v[1];
        }
    }
};

AU.loadSamples([
    'sfx/jump.mp3',
    'sfx/footstep.mp3',
    'sfx/schling.mp3',
    'sfx/timer.mp3'
]);

window.load = function(o) {
    o[0].v = [0, 0];

    pos0 = o[0].pos.slice();

    o.push({
        'static':1,
        draw: function(ctx, scr) {
            ctx.font = '8px uni';
            //ctx.font = '8px Silkscreen';
            ctx.fillStyle = '#000';
            ctx.fillText('time: ' + (scr.t/60).toFixed(o), 20, 20);
            ctx.fillText('score: ' + score, 20, 30);
        }
    });

    var spr1 = CS.createSprite($('img'), [
        {pos:[0, 0], dims:[16, 16]}
    ]);
    //o.push(spr1);

    scr.shapes = o;
    scr.shapes.forEach(function(s) { COL.updateShape(s); });
    scr.followShape( scr.shapes[0] );
    document.body.appendChild(scr.el);
    scr.onFrame();  // start rendering
};

(function() {
    //var l = prompt('level?', 'level1.js');
    if (!location.search) {
        var l = 'level3.js';
        var scriptEl = document.createElement('script');
        scriptEl.setAttribute('type', 'text/javascript');
        scriptEl.setAttribute('src', l);
        document.head.appendChild(scriptEl);
    } else {
        load(
            JSON.parse(decodeURIComponent(
                ('' + location.search).replace(/^\?/, ''))))
    }
})();

/*
    behaves:
        water   (best way to move up down?)

        enemy   (patrol - while floor and no obstacle, move ahead, else invert dir)

*/



