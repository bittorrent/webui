/**
 * @author Directrix
 */

function has(obj, key) {
	return Object.prototype.hasOwnProperty.apply(obj, [key]);
}

function redirect(url) {
	window.location.href = url;
}

window.onerror = function(msg, url, linenumber) {
	log("JS error: [" + linenumber + "] " + msg);
	return true;
};

// MooTools.Utilities.Assets.js
function loadJS(source, properties) {
	properties = $extend({
		onload: $empty,
		document: document,
		check: $lambda(true)
	}, properties);
	
	var script = new Element('script', {'src': source, 'type': 'text/javascript', 'charset': 'utf-8'});
	
	var load = properties.onload.bind(script), check = properties.check, doc = properties.document;
	delete properties.onload; delete properties.check; delete properties.document;
	
	script.addEvents({
		load: load,
		readystatechange: function(){
			if (Browser.Engine.trident && ['loaded', 'complete'].contains(this.readyState)) load(); 
		}
	}).setProperties(properties);
	
	
	if (Browser.Engine.webkit419) var checker = (function(){
		if (!$try(check)) return;
		$clear(checker);
		load();
	}).periodical(50);
	
	return script.inject(doc.head);
}

Array.implement({

	"binarySearch": function(value, comparator, left, right) {
		comparator = comparator || function(a, b) {
			if (a === b) return 0;
			if (a < b) return -1;
			return 1;
		};
		left = left || 0;
		right = right || (this.length - 1);
		var mid = 0;
		var found = false;
		while (left <= right) {
			mid = ((left + right) / 2).toInt();
			var cv = comparator(value, this[mid]);
			if (cv > 0) {
				left = mid + 1;
			} else if (cv < 0) {
				right = mid - 1;
			} else {
				found = true;
				break;
			}
		}
		return found ? mid : (-mid + ((mid == left) ? -1 : -2));
	},
	
	"insertAt": function(value, index) {
		this.splice(index, 0, value);
		return this;
	},
	
	"swap": function(indexA, indexB) {
		var temp = this[indexA];
		this[indexA] = this[indexB];
		this[indexB] = temp;
		return this;
	},
	
	"remove": function(item) { 
		for (var i = this.length; i--;) {
			if (this[i] === item) {
				this.splice(i, 1);
				return i;
			}
		}
		return -1;
	}

});

String.implement({
	
	"pad": function(len, str, type) {
		var inp = this;
		str = str || " ";
		type = type || "right";
		len -= inp.length;
		if (len < 0) return inp;
		str = (new Array(Math.ceil(len / str.length) + 1)).join(str).substr(0, len);
		return ((type == "left") ? (str + inp) : (inp + str));
	}

});

Number.implement({

	"toFileSize": function(precision) {
		precision = precision || 1;
		var sz = [lang[CONST.SIZE_KB], lang[CONST.SIZE_MB], lang[CONST.SIZE_GB]];
		var size = this;
		var pos = 0;
		size /= 1024;
		while ((size >= 1024) && (pos < 2)) {
			size /= 1024;
			pos++;
		}
		return (size.roundTo(precision) + " " + sz[pos]);
	},

	"toTimeString": function() {
		var secs = this;
		if (secs >= 2419200) return "\u221E"; // secs >= 4 weeks ~= inf. :)
		var div, w, d, h, m, s, output = [];
		div = secs % (604800 * 52);
		w = (div / 604800).toInt();
		div = div % 604800;
		d = (div / 86400).toInt();
		div = div % 86400;
		h = (div / 3600).toInt();
		div = div % 3600;
		m = (div / 60).toInt();
		s = div % 60;
		if (w > 0)
			output.push(w + "w");
		if (d > 0)
			output.push(d + "d");
		if ((h > 0) && (output.length < 2))
			output.push(h + "h");
		if ((m > 0) && (output.length < 2))
			output.push(m + "m");
		if (output.length < 2)
			output.push(s + "s");
		return output.join(" ");
	},

	"roundTo": function(precision) {
		var num = "" + this.round(precision);
		var offset = num.indexOf(".");
		if (offset == -1) {
			offset = num.length;
			num += ".";
		}
		return num.pad(precision + ++offset, "0");
	}

});