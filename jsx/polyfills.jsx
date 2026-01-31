// Polyfills
if (!Object.keys)
	Object.keys = function (o) {
		if (o !== Object(o))
			throw new TypeError("Object.keys called on a non-object");
		var k = [],
			p;
		for (p in o) if (Object.prototype.hasOwnProperty.call(o, p)) k.push(p);
		return k;
	};

Array.prototype.find = function (callback, thisArg) {
	if (!callback || typeof callback !== "function") throw TypeError();
	var size = this.length;
	var that = thisArg || this;
	for (var i = 0; i < size; i++) {
		try {
			if (!!callback.apply(that, [this[i], i, this])) {
				return this[i];
			}
		} catch (e) {
			return undefined;
		}
	}
	return undefined;
};

(function () {
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function forEach(callback, thisArg) {
			if (typeof callback !== "function") {
				throw new TypeError(callback + " is not a function");
			}
			var array = this;
			thisArg = thisArg || this;
			for (var i = 0, l = array.length; i !== l; ++i) {
				callback.call(thisArg, array[i], i, array);
			}
		};
	}
})();

Object.values = function (obj) {
	var res = [];
	for (var i in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, i)) {
			res.push(obj[i]);
		}
	}
	return res;
};

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (obj, start) {
		for (var i = start || 0, j = this.length; i < j; i++) {
			if (this[i] === obj) {
				return i;
			}
		}
		return -1;
	};
}
