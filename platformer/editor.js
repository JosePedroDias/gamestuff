/*jshint browser:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/*global prompt:false */



(function() {

	'use strict';

	/**
	 * TODOs
	 * on zoom fix scroll (keep view centered)
	 * improve move behavior
	 * undo support
	 * LATER: support patterns
	 */

	// CONFIG
	var screenDims = [0, 0];
	var screenScroll = [0, 0];
	var M = 1;
	var mode = 'move';
	var grid, selectedShape;
		
	// shapes which make up the map
	var shapes = JSON.parse('[{"pos":[60,160],"dims":[20,30],"color":"red","g":0,"behave":"player","id":"id11"},{"pos":[0,339],"dims":[91.5,21.5],"color":"#373","id":"id12"},{"pos":[44,224],"dims":[42,17],"color":"#888","id":"id13"},{"pos":[85,212],"dims":[33.5,30.5],"color":"#888","id":"id14"},{"pos":[117,202],"dims":[34,42],"color":"#888","id":"id15"},{"pos":[185,182],"dims":[117,22],"color":"#888","id":"id16"},{"pos":[349,337],"dims":[40,20],"color":"#FA0","behave":"spring","acc":0.4,"id":"id17"},{"pos":[-40,340],"dims":[40,20],"color":"#444","behave":"moving","delta":[0,-100],"duration":3000,"id":"id18"},{"pos":[190,120],"dims":[20,20],"color":"#CC0","behave":"destructible","id":"id19"},{"pos":[301.5,239],"dims":[40.5,21],"color":"#FA0","behave":"spring","acc":0.4,"id":"id22"},{"pos":[0,240],"dims":[301.5,20],"color":"#373","id":"id23"},{"pos":[228,337],"dims":[121,20],"color":"#373","id":"id24"},{"pos":[75,386],"dims":[172,16],"color":"#373","id":"id25"},{"pos":[228,357],"dims":[20,29],"color":"#373","id":"id26"},{"pos":[75,360],"dims":[16.5,26.5],"color":"#373","id":"id27"},{"pos":[91.5,339],"dims":[136.5,47],"color":"rgba(0,0,255,0.25)","id":"id28","behave":"ghost"},{"pos":[233,119],"dims":[20,20],"color":"#CC0","behave":"destructible","id":"id29"},{"pos":[268,118],"dims":[20,20],"color":"#CC0","behave":"destructible","id":"id30"}]');
		

	var gridPat;
	var updateGridPattern = function() {
		if (typeof grid !== 'number' || grid < 1) {return;}
		var gridCanvas = document.createElement('canvas');
		gridCanvas.setAttribute('width',  grid);
		gridCanvas.setAttribute('height', grid);
		var gcCtx = gridCanvas.getContext('2d');
		gcCtx.fillStyle = 'black';
		gcCtx.fillRect(0, 0, 1, 1);
		gridPat = gcCtx.createPattern(gridCanvas, 'repeat');
	};
	updateGridPattern();
		
		
		
	// UUID
	var uuidAux = 1;
	var getUUID = function() {
		return 'id' + (uuidAux++);
	};
		
        // Throttling for scroll events
        var throttle = function (func, wait) {
            wait = wait || 0;
            var lastCall = 0;  // Warning: This breaks on Jan 1st 1970 0:00
            var timeout;
            var throttled = function () {
                var now = +new Date();
                var timeDiff = now - lastCall;
                if (timeDiff >= wait) {
                    lastCall = now;
                    return func.apply(this, [].slice.call(arguments));
                } else {
                    var that = this;
                    var args = [].slice.call(arguments);

                    if (timeout) {
                        clearTimeout(timeout);
                    }

                    timeout = setTimeout(function () {
                        timeout = null;
                        return throttled.apply(that, args);
                    }, wait - timeDiff);
                }
            };
            return throttled;
        }
		
	// cross-browser requestAnimationFrame
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame =
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(cb, element) {window.setTimeout(cb, 1000 / 30);};
	}
		

		
	// MISC
	var s$ = function(id) {
		return document.getElementById(id);
	};


	 
	// SHAPE-RELATED
	var ctx = s$('c').getContext('2d');

	var fixShapePos = function(o) {
		if (o.dims[0] < 0) { o.dims[0] *= -1; o.pos[0] -= o.dims[0]; --o.dims[0]; }
		if (o.dims[1] < 0) { o.dims[1] *= -1; o.pos[1] -= o.dims[1]; --o.dims[1]; }
	};

	var draw = function() {
		ctx.clearRect(0, 0, screenDims[0], screenDims[1]);
		
		if (typeof grid === 'number' && grid > 0) {
			ctx.save();
			ctx.translate(-screenScroll[0], -screenScroll[1]);
			ctx.fillStyle = gridPat;
			ctx.fillRect(screenScroll[0], screenScroll[1], screenDims[0], screenDims[1]);
			ctx.restore();
		}
		
		var s;
		for (var i = 0, f = shapes.length; i < f; ++i) {
			s = shapes[i];
			if (s.color === 'transparent') {
				ctx.strokeStyle = 'rgba(255, 0, 0, 0.25)';
				ctx.strokeWidth = 2;
				ctx.strokeRect(
					s.pos[0] - screenScroll[0],
					s.pos[1] - screenScroll[1],
					s.dims[0],
					s.dims[1]);
				continue;
			}
			
			ctx.fillStyle = s.color;
			ctx.fillRect(
				s.pos[0] - screenScroll[0],
				s.pos[1] - screenScroll[1],
				s.dims[0],
				s.dims[1]);
			
			if (s.behave === 'moving') {
				ctx.strokeStyle = s.color;
				ctx.strokeWidth = 2;
				ctx.strokeRect(
					s.pos[0] + s.delta[0] - screenScroll[0],
					s.pos[1] + s.delta[1] - screenScroll[1],
					s.dims[0],
					s.dims[1]);
				ctx.beginPath();
				ctx.moveTo(
					s.pos[0] + s.dims[0]/2 - screenScroll[0],
					s.pos[1] + s.dims[1]/2 - screenScroll[1]
				);
				ctx.lineTo(
					s.pos[0] + s.delta[0] + s.dims[0]/2 - screenScroll[0],
					s.pos[1] + s.delta[1] + s.dims[1]/2 - screenScroll[1]
				);
				ctx.stroke();
			}
		}
		
		if (selectedShape) {
			s = selectedShape;
			var D = 8, d = D/2;
			var P = [
				s.pos[0] - screenScroll[0],
				s.pos[1] - screenScroll[1]
			];
			var p = [P[0], P[1]];
			ctx.fillStyle = 'rgba(255, 0, 255, 0.25)';
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
			p = [P[0]+s.dims[0], P[1]];
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
			p = [P[0], P[1]+s.dims[1]];
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
			p = [P[0]+s.dims[0], P[1]+s.dims[1]];
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
			ctx.fillRect(p[0]-d, p[1]-d, D, D);
		}
	};


		
	// ON FRAME
        var paused;
        var pause = function () { paused = true; }
        var play = function () { paused = false; onFrame(); }
	var onFrame = function() {
                if (paused) { return; }
		draw();
		window.requestAnimationFrame(onFrame);
	};
	play();

		
		
	// RESIZE
	var onResize = function() {
		var d = [window.innerWidth, window.innerHeight];
		//M = 1;
		d = [Math.floor(d[0]/M), Math.floor(d[1]/M)];
		
		screenDims = d;
		var cEl = s$('c');
		cEl.setAttribute('width',  d[0]);
		cEl.setAttribute('height', d[1]);
		cEl.style.width  = (d[0] * M) + 'px';
		cEl.style.height = (d[1] * M) + 'px';
	};
	window.addEventListener('resize', onResize);
	onResize();



	var shapeToString = function() {
		/*jshint laxcomma:true */
		var o = this;
		return [
			o.id
			,o.color
			,o.behave ? o.behave : ''
			//,o.pos.join(',')
		].join(' ');
	};
	var isNumRegex = /^-?\d+(\.\d+)?$/;
	var shapePropFromString = function(prop, val) {
		var c = val.indexOf(',');
		if (c !== -1 && val.indexOf('rgb') === -1) {
			val = [
				parseFloat(val.substring(0, c)),
				parseFloat(val.substring(c+1))
			];
		}
		else if (isNumRegex.test(val)) {
			val = parseFloat(val);
		}
		this[prop] = val;
	};
		
	var updateSelectedShapeProperties = function(o) {
		
		var sspEl = s$('selectedShapeProperties');
		if (!o) {
			sspEl.style.display = 'none';
			return;
		}
		sspEl.style.display = '';

		sspEl.innerHTML = '';
		var props = ['id', 'color', 'pos', 'dims', 'behave'];
		if ('behave' in o && o.behave.length > 0) {
			switch (o.behave) {
				case 'spring':   props.push('a'); break;
				case 'ice':      props.push('v'); break;
				case 'conveyor': props.push('v'); break;
				case 'moving': props = props.concat(['delta', 'duration']); break;
			}
		}
		var prop, val, pEl, labelEl, inputEl;

		var onChange = function(ev) {
			var inputEl = ev.target;
			var prop = inputEl.getAttribute('name');
			var val = inputEl.value;
			//console.log(selectedShape.id, prop, val);
			shapePropFromString.call(selectedShape, prop, val);
		};

		for (var i = 0, f = props.length; i < f; ++i) {
			prop = props[i];
			val = o[prop];
			pEl     = document.createElement('p');
			labelEl = document.createElement('label');
			labelEl.appendChild(document.createTextNode(prop));
			inputEl = document.createElement('input');
			inputEl.setAttribute('type', 'text');
			inputEl.setAttribute('name', prop);
			inputEl.value = val ? val : '';
			pEl.appendChild(labelEl);
			pEl.appendChild(inputEl);
			sspEl.appendChild(pEl);
			inputEl.addEventListener('change', onChange);
		}
	};

	var updateShapesView = function(forceUpdate) {
		var selEl = s$('shapesView');
		selEl.innerHTML = '';
		var o, id, optEl;
		var selId = selectedShape ? selectedShape.id : undefined;
		for (var i = 0, f = shapes.length; i < f; ++i) {
			o = shapes[i];
			if (!o.id || forceUpdate) {o.id = getUUID();o.toString = shapeToString;}
			optEl = document.createElement('option');
			optEl.appendChild(document.createTextNode(o.toString()));
			optEl.value = o.id;
			if (o.id === selId) {optEl.selected = true;}
			selEl.appendChild(optEl);
		}
		updateSelectedShapeProperties(selectedShape);
	};
	selectedShape = shapes[0];
	selectedShape.id = getUUID();
	selectedShape.toString = shapeToString;
	updateShapesView(true);



	var pickShape = function(pos) {
		var o;
		for (var i = shapes.length - 1; i >= 0; --i) {
			o = shapes[i];
			if (pos[0] >= o.pos[0] &&
				pos[1] >= o.pos[1] &&
				pos[0] <= o.pos[0] + o.dims[0] &&
				pos[1] <= o.pos[1] + o.dims[1]) {
				return o;
			}
		}
	};

		
	// MOUSE HANDLING
	var getMousePos = function(ev, doNotSnapToGrid) {
		if (!doNotSnapToGrid && typeof grid === 'number' && grid > 0) {
			var p = [ ev.clientX/M + screenScroll[0],
					  ev.clientY/M + screenScroll[1] ];
			return [
				p[0] - p[0] % grid,
				p[1] - p[1] % grid
			];
		}
		return [ ev.clientX/M + screenScroll[0],
				 ev.clientY/M + screenScroll[1]   ];
	};

	var getMousePosNoScroll = function(ev) {
		return [ ev.clientX/M,
				 ev.clientY/M  ];
	};

	var isDown = false;
	var startPos, startScreenScroll;
	var redimAxes = [0, 0];
	var onMouse = function(ev) {
		var o, pos = getMousePos(ev);
		
		if (ev.type === 'mousedown') {
			isDown = true;
			startPos = pos;
			if (mode === 'create') {
				o = {
					pos:   pos,
					dims:  [20, 20],
					color: '#00F',
					id:    getUUID(),
					toString: shapeToString
				};
				shapes.push(o);
				selectedShape = o;
				redimAxes = [1, 1];
				updateShapesView();//TODO
			}
			else if (mode === 'pan') {
				startScreenScroll = screenScroll;
				startPos = getMousePosNoScroll(ev);
			}
			else { // move, redim
				o = pickShape( getMousePos(ev, true) );
				if (!o) { isDown = false; return;}
				selectedShape = o;
				updateShapesView();//TODO
				
				if (mode === 'redim') {
					redimAxes[0] = (Math.abs(pos[0] - o.pos[0]) < Math.abs(pos[0] - (o.pos[0] + o.dims[0]))) ? 0 : 1;
					redimAxes[1] = (Math.abs(pos[1] - o.pos[1]) < Math.abs(pos[1] - (o.pos[1] + o.dims[1]))) ? 0 : 1;
				}
				else { // move
					startPos = [
						o.dims[0]/2,
						o.dims[1]/2
					];
					if (grid) {
						startPos[0] -= startPos[0] % grid;
						startPos[1] -= startPos[1] % grid;
					}
				}
			}
		}
		
		if (ev.type === 'mousemove' && isDown) {
			o = selectedShape;
			if (mode === 'move') {
				o.pos = [
					pos[0] - startPos[0],
					pos[1] - startPos[1]
				];
			}
			else if (mode === 'pan') {
				pos = getMousePosNoScroll(ev);
				screenScroll = [
					startScreenScroll[0] -(pos[0] - startPos[0]),
					startScreenScroll[1] -(pos[1] - startPos[1])
				];
			}
			else {// redim
				if (redimAxes[0] === 0) { o.dims[0] -= pos[0] - o.pos[0]; o.pos[0] = pos[0]; }
				else { o.dims[0] = pos[0] - o.pos[0]; }
				if (redimAxes[1] === 0) { o.dims[1] -= pos[1] - o.pos[1]; o.pos[1] = pos[1]; }
				else { o.dims[1] = pos[1] - o.pos[1]; }
			}
		}
		
		if (ev.type === 'mouseup' && isDown) {
			isDown = false;
			if (mode === 'create' || mode === 'redim') {fixShapePos(selectedShape);}
			updateShapesView();//TODO
		}
	};
	s$('c').addEventListener('mousedown', onMouse);
	s$('c').addEventListener('mousemove', throttle(onMouse, 100));
	s$('c').addEventListener('mouseup',   onMouse);

		
	// BUTTON EVENTS
	var getShapeOrder = function(s) {
		for (var i = 0, f = shapes.length; i < f; ++i) {
			if (shapes[i] === s) {return i;}
		}
	};

	var getShapeFromId = function(id) {
		var s;
		for (var i = 0, f = shapes.length; i < f; ++i) {
			s = shapes[i];
			if (s.id === id) {return s;}
		}
	};

	s$('topBtn').addEventListener('click', function() {
		var s = selectedShape, i = getShapeOrder(s);
		shapes.splice(i, 1);
		shapes.unshift(s);
		updateShapesView();
	});
	s$('bottomBtn').addEventListener('click', function() {
		var s = selectedShape, i = getShapeOrder(s);
		shapes.splice(i, 1);
		shapes.push(s);
		updateShapesView();
	});
	s$('upBtn').addEventListener('click', function() {
		var s = selectedShape, i = getShapeOrder(s);
		if (i < 1) {return;}
		shapes.splice(i, 1);
		shapes.splice(i-1, 0, s);
		updateShapesView();
	});
	s$('downBtn').addEventListener('click', function() {
		var s = selectedShape, i = getShapeOrder(s);
		if (i > shapes.length-2) {return;}
		shapes.splice(i, 1);
		shapes.splice(i+1, 0, s);
		updateShapesView();
	});

        var playing = false;
        s$('playBtn').addEventListener('click', function () {
            playing = !playing;
            if (playing) {
                pause();  // Pause the editor "game"
                s$('playIframe').src = './game.html?' + encodeURIComponent(JSON.stringify(shapes));
                s$('playFrame').removeAttribute('hidden');
                s$('playIframe').focus();  // Input events, please go into the iframe
            } else {
                play();
                s$('playIframe').src = 'about:blank';
                s$('playFrame').setAttribute('hidden', 'hidden');
            }
        });
	   
	s$('importBtn').addEventListener('click', function() {
		var s = prompt('JSON?');
		try {
			selectedShape = undefined;
			shapes = JSON.parse(s);
			updateShapesView(true);
		} catch (ex){}
	});
	s$('exportBtn').addEventListener('click', function() {
		prompt('JSON:', JSON.stringify(shapes) );
	});

	s$('createBtn').addEventListener('click', function() {
		mode = 'create';
		s$('createBtn').className  = 'selected';
		s$('moveBtn').className    = '';
		s$('redimBtn').className   = '';
		s$('panBtn').className     = '';
	});
	s$('moveBtn').addEventListener('click', function() {
		mode = 'move';
		s$('createBtn').className  = '';
		s$('moveBtn').className    = 'selected';
		s$('redimBtn').className   = '';
		s$('panBtn').className     = '';
	});
	s$('redimBtn').addEventListener('click', function() {
		mode = 'redim';
		s$('createBtn').className  = '';
		s$('moveBtn').className    = '';
		s$('redimBtn').className   = 'selected';
		s$('panBtn').className     = '';
	});
	s$('panBtn').addEventListener('click', function() {
		mode = 'pan';
		s$('createBtn').className  = '';
		s$('moveBtn').className    = '';
		s$('redimBtn').className   = '';
		s$('panBtn').className     = 'selected';
	});
	s$('cloneBtn').addEventListener('click', function() {
		/*jshint forin:false */
		var o = {};
		for (var k in selectedShape) {
			o[k] = selectedShape[k] instanceof Array ?
				selectedShape[k].slice() :
				selectedShape[k];
		}
		o.id = getUUID();
		shapes.push(o);
		selectedShape = o;
		updateShapesView();
	});
	s$('deleteBtn').addEventListener('click', function() {
		var s = selectedShape, i = getShapeOrder(s);
		shapes.splice(i, 1);
		selectedShape = shapes[--i];
		updateShapesView();
	});
	s$('zoomInBtn').addEventListener('click', function() {
		++M; onResize();
	});
	s$('zoomOutBtn').addEventListener('click', function() {
		if (M < 2) {return;}
		--M; onResize();
	});

	var onMouseRedirect = function(ev) {
		onMouse({
			type:    ev.type,
			clientX: ev.clientX,
			clientY: ev.clientY
		});
		return true;
	};

	s$('ui').addEventListener('mousemove', onMouseRedirect);
	s$('ui').addEventListener('mouseup',   onMouseRedirect);

	s$('grid').addEventListener('change', function() {
		grid = parseInt(s$('grid').value, 10);
		updateGridPattern();
	});

	s$('shapesView').addEventListener('change', function(ev) {
		selectedShape = getShapeFromId(s$('shapesView').value);
	});

})();
