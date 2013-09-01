/**
 * Credits: Based on C Code in "Computer Graphics --
 * Principles and Practice," Foley et al, 1996, p. 593.
 */

var CLR = {

	hsv2rgb: function (h, s, v, a) {
		if (h instanceof Array) {	a = h[3];	v = h[2];	s = h[1];	h = h[0];	}
		//if (h === 360) { h = 0; }
		h = h % 360;
		var r, g, b;
		
		if (s === 0) {	// Achromatic
			r = v; g = v; b = v;
		}
		else {			// Chromatic color
			var hTemp = h / 60;				// h is now in [0,6]
			var i = Math.floor(hTemp);		// largest integer <= h
			var f = hTemp - i;				// fractional part of h
			var p = v * (1 - s);
			var q = v * (1 - (s * f));
			var t = v * (1 - (s * (1 - f)));
			
			switch (i) {
				case 0: r = v; g = t; b = p; break;
				case 1: r = q; g = v; b = p; break;
				case 2: r = p; g = v; b = t; break;
				case 3: r = p; g = q; b = v; break;
				case 4: r = t; g = p; b = v; break;
				case 5: r = v; g = p; b = q; break;
			}
		}
		
		r = Math.floor(r * 255);	// required?
		g = Math.floor(g * 255);
		b = Math.floor(b * 255);
		
		if (a !== undefined) {	return [r, g, b, a];	}
		return [r, g, b];
	},

	rgb2hsv: function(r, g, b, a) {
		if (r instanceof Array) {	a = r[3];	b = r[2];	g = r[1];	r = r[0];	}
		var h, s, v;
		var min = Math.min(r, g, b);
		
		v = Math.max(r, g, b);
		var delta = v - min;
		
		// Calculate saturation (0 if r, g and b are all 0)
		s = (v === 0) ? 0 : delta / v;
		
		if (s === 0) {	// Achromatic
			h = 0;
		}
		else {			// Chromatic
			if (r === v) {		// between yellow and magenta
				h = 60 * (g - b) / delta;
			}
			else if (g === v) {	// between cyan and yellow
				h = 120 + 60 * (b - r) / delta;
			}
			else if (b === v) {	// between magenta and cyan
				h = 240 + 60 * (r - g) / delta;
			}
			if (h < 0) { h += 360; }
		}
		v = (v / 255);
		
		//h = Math.floor(h);	// required?
		
		if (a !== undefined) {	return [h, s, v, a];	}
		return [h, s, v];
	},

	hex2rgb: function(str) {
		if (str.indexOf('#') === 0) {	str = str.substring(1);	}
		var res = [];
		var dlt = 2, c;
		if (str.length === 3) {		dlt = 1;	}
		while (str.length > 0) {
			c = str.substring(0, dlt);
			if (dlt === 1) {	c = c + c;	}
			res.push(	parseInt(c, 16)	);
			str = str.substring(dlt);
		}
		return res;
	},

	rgb2hex: function(r, g, b) {
		var conv = function(x) {
			var s = x.toString(16);
			while(s.length < 2) { s = '0' + s; }
			return s;
		};
		var hex = [];
		for (var i = 0; i < arguments.length; i++) {	hex.push(conv(arguments[i]));	}
		hex.unshift("#");
		return hex.join('');
	},

	rgb2num: function(r, g, b) {
		if (r instanceof Array) {	b = r[2];	g = r[1];	r = r[0];	}
		return (r * 65536 + g * 256 + b);
	}

};
