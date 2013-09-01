window.COL = {};

COL.updateShape = function(a) {
	if (!a.pos) { return; }

	a.pos2 = [
		a.pos[0] + a.dims[0],
		a.pos[1] + a.dims[1]
	];
	
	a.ctr = [
		a.pos[0] + a.dims[0]/2,
		a.pos[1] + a.dims[1]/2
	];

	if (a.behave === 'moving') {
		a.from = a.pos.slice();
		a.to   = [
			a.pos[0] + a.delta[0],
			a.pos[1] + a.delta[1]
		];
	}
};



COL.areShapesColliding = function(a, b) {
	if (!b.pos) { return; }

	return (
		a.pos[0] < b.pos2[0] &&
		b.pos[0] < a.pos2[0] &&
		a.pos[1] < b.pos2[1] &&
		b.pos[1] < a.pos2[1]
	);
};



COL.collideDirection = function(a, b) {
	var dst = [0, 0];
	for (var i = 0; i < 2; ++i) {
		if (a.ctr[i] < b.ctr[i]) {
			dst[i] = b.pos[i] - a.pos2[i];
		}
		else {
			dst[i] = b.pos2[i] - a.pos[i];
		}
	}

	dst[ Math.abs(dst[0]) > Math.abs(dst[1]) ? 0 : 1 ] = 0;

	return dst;
};
