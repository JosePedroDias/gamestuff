(function() {

    'use strict';

    var raf = window.requestAnimationFrame       ||
              window.mozRequestAnimationFrame    ||
              window.webkitRequestAnimationFrame ||
              window.msRequestAnimationFrame;

    var R360 = Math.PI * 2;
    var R180 = Math.PI;
    var R90  = Math.PI * 0.5;

    var sprites = {};
    var spriteNames = 'peugeot';
    spriteNames = spriteNames.split(' ');

    var onResourcesReady;

    var keysDown = {};



    var loadSprites = function() {
        var numSprites = spriteNames.length;
        var spritesLeft = numSprites;

        var name, imgEl, imgUri, i;

        var onImgLoaded = function(name) {
            sprites[name] = this;
            --spritesLeft;
            console.log('sprite ' + name + ' loaded');
            if (spritesLeft === 0) {
                onResourcesReady();
            }
        };

        for (i = 0; i < numSprites; ++i) {
            name = spriteNames[i];
            imgUri = name + '.png';
            imgEl = new Image();
            imgEl.onload = onImgLoaded.bind(imgEl, name);
            imgEl.src = imgUri;
        }
    };

    loadSprites();



    onResourcesReady = function() {
        console.log('resources ready');

        var screenD = [window.innerWidth, window.innerHeight];
        var zeroP = v.zero();
        var scrollP = [0, 0];
        var carS = sprites.peugeot;
        var carD = v.imgDims(carS);
        var carP = v.copy(screenD);
        var carDP = v.zero();
        var carR = 0;
        var carDR = 0; // 90deg / s
        var carSpd = 0;
        v.scale(carP, 0.5);
        var canvasIsDirty = true;

        var c = cvs(screenD, document.body);

        var hudD = [400, 50];
        var h = cvs(hudD);


        var t1 = v.zero();
        var t2 = v.zero();
        var onHudRender = function() {
            h.rect(zeroP, hudD);

            // speed bar
            h.c.fillStyle = carSpd > 0 ? '#060' : '#600';
            h.rect([60, 12.25], [carSpd * 0.25, 25], true);

            // direction wheel
            h.c.lineWidth = 4;
            h.c.strokeStyle = '#666';
            h.circle([200, 25], 25-2, true);
            
            v.set(t1, 200, 25);
            v.set(t2, 200, 25);
            v.move(t1, carDR, 25);
            v.move(t2, carDR - R180, 25);
            h.line(t1, t2);

            v.set(t1, 200, 25);
            v.move(t1, carDR + R90, 25);
            h.line(t1, [200, 25]);

            h.c.lineWidth = 1;
        };


        onHudRender();

        var onKey = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            keysDown[ev.keyCode] = (ev.type === 'keydown');
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('keyup',   onKey);
        window.addEventListener('resize', function() {
            v.set(screenD, window.innerWidth, window.innerHeight);
            c.resize(screenD);
        });

        var t = v.zero();
        var lastT = -1 / 60;
        var dSpd = 10;
        var dR = Math.PI / 60;


        var onRender = function(T) {

            // time update
            T /= 1000;
            var DT = T - lastT;


            // input processing
            var hudNeedsRepaint = false;
            if (keysDown['38']) { // up
                carSpd += dSpd; hudNeedsRepaint = true;
            }
            else if (keysDown['40']) { // down
                carSpd -= dSpd; hudNeedsRepaint = true;
            }

            if (keysDown['39']) { // left
                carDR += dR; hudNeedsRepaint = true;
            }
            else if (keysDown['37']) { // right
                carDR -= dR; hudNeedsRepaint = true;
            }


            // keep valid limits
            carSpd = v.inLimit(carSpd, -200, 400);
            var t = R90;
            carDR = v.inLimit(carDR, -t, t);


            // move
            if (carDR !== 0) {
                carR += carDR * DT * carSpd*0.01;
                //console.log('R:', carR);
            }

            if (carSpd !== 0) {
                v.move(carP, carR, carSpd * DT);
                v.inLimitWrap(carP, zeroP, screenD);
                //console.log('P:', carP);
            }


            if (hudNeedsRepaint) {
                onHudRender();
            }


            // main paint
            c.rect(zeroP, screenD);
            c.drawSprite(carS, carD, carP, carR + R90);
            c.blit(h.e, zeroP);


            // setup for next frame
            lastT = T;
            raf(onRender);
        };

        raf(onRender);
    };

})();
