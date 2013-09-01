var RND = {

	/**
	 * Generator of pseudo-random number according to a normal distribution with mean=0 and variance=1.
	 * Use the Box-Mulder (trigonometric) method and discards one of the two generated random numbers.
	 */
	normal: function() {
		var u1, u2;
		u1 = u2 = 0.;
		while (u1 * u2 == 0.) {
			u1 = Math.random();
			u2 = Math.random();
		}
		return Math.sqrt(-2. * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	},

	/**
	 * Generator of pseudo-random number according to a normal distribution with given mean and variance.
	 * Normalizes the outcome of function normal.
	 */
	gauss: function(mean, stdev) {
		return stdev * this.normal() + 1. * mean;
	}

};