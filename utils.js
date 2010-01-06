/**
 * @author Directrix
 */

function has(obj, key) {
	return Object.prototype.hasOwnProperty.apply(obj, [key]);
}

function changePort(port) {
	if (window.location.port != port) {
		// window.location.port = port; // Does NOT work on Opera

		function isIPv6(hostname) {
			return (hostname.search(/\[.*?\]/) >= 0);
		}

		var hostname = window.location.hostname;
		if (isIPv6(window.location.host) && !isIPv6(hostname))
			hostname = "[" + hostname + "]"; // Fix for Firefox

		window.location.href = window.location.protocol + "//" + hostname + ":" + port + window.location.pathname + window.location.search;
	}
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

	// http://www.leepoint.net/notes-java/algorithms/searching/binarysearch.html
	"binarySearch": function(value, comparator, first, upto) {
		if (typeof comparator != "function") {
			comparator = function(a, b) {
				if (a === b) return 0;
				if (a < b) return -1;
				return 1;
			};
		}
		first = first || 0;
	    upto = upto || this.length;
	    while (first < upto) {
	        var mid = parseInt((first + upto) / 2);
			var cv = comparator(value, this[mid]);
	        if (cv < 0) {
	            upto = mid;
	        } else if (cv > 0) {
	            first = mid + 1;
	        } else {
	            return mid;
	        }
	    }
	    return -(first + 1);
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
		return (size.toFixed(precision) + " " + sz[pos]);
	},

	"toTimeString": function() {
		var secs = Number(this);
		if (secs > 63072000) return "\u221E"; // secs > 2 years ~= inf. :)
		var div, y, w, d, h, m, s, output = "";
		y = Math.floor(secs / 31536000);
		div = secs % 31536000;
		w = Math.floor(div / 604800);
		div = div % 604800;
		d = Math.floor(div / 86400);
		div = div % 86400;
		h = Math.floor(div / 3600);
		div = div % 3600;
		m = Math.floor(div / 60);
		s = div % 60;
		if (y > 0) {
			output = lang[CONST.TIME_YEARS_WEEKS].replace(/%d/, y).replace(/%d/, w);
		} else if (w > 0) {
			output = lang[CONST.TIME_WEEKS_DAYS].replace(/%d/, w).replace(/%d/, d);
		} else if (d > 0) {
			output = lang[CONST.TIME_DAYS_HOURS].replace(/%d/, d).replace(/%d/, h);
		} else if (h > 0) {
			output = lang[CONST.TIME_HOURS_MINS].replace(/%d/, h).replace(/%d/, m);
		} else if (m > 0) {
			output = lang[CONST.TIME_MINS_SECS].replace(/%d/, m).replace(/%d/, s);
		} else {
			output = lang[CONST.TIME_SECS].replace(/%d/, s);
		}
		return output;
	}

});

/**
 * @author Novik
 */

var SpeedGraph = {

	"plot": null,

	"init": function(element) {
		if (Browser.Engine.trident6) return;
		this.element = $(element);
		this.maxSeconds = 600;
		this.seconds = -1;
		this.startSeconds = $time() / 1000;
		this.plot = new Flotr.Plot(this.element, [{ label: lang[CONST.OV_COL_UPSPD], data: [] }, { label: lang[CONST.OV_COL_DOWNSPD], data: [] }], {
			"colors" : ["#009900", "#1C8DFF"],
			"lines" : {
				show: true
			},
			"xaxis" : {
				"max" : (this.seconds - this.startSeconds >= this.maxSeconds) ? null : this.maxSeconds + this.startSeconds,
				"tickSize" : 60,
				"tickFormatter" : function(n) {
					var dt = new Date(n * 1000);
					var h = dt.getHours();
					var m = dt.getMinutes();
					var s = dt.getSeconds();
					h = (h < 10) ? ("0" + h) : h;
					m = (m < 10) ? ("0" + m) : m;
					s = (s < 10) ? ("0" + s) : s;
					return (h + ":" + m + ":" + s);
				}
			},
			"yaxis" : {
				"min": 0,
				"minTickSize": 5 * 1024,
				"tickFormatter": function(n) { return (parseInt(n).toFileSize() + perSec); }
			},
			"grid": {
				"color": "#868686"
			},
			"shadowSize": 0
		});
	},

	"draw": function() {
		if ((utWebUI.tabs.active != "spgraph") || Browser.Engine.trident6) return;
		this.plot.repaint();
	},

	"resize": function(w, h) {
		if (!w && !h) return;
		var style = {};
		if (w)
			style.width = w;
		if (h)
			style.height = h;
		this.element.setStyles(style);
		this.draw();
	},

	"addData": function(upSpeed, downSpeed) {
		if (Browser.Engine.trident6) return;
		this.seconds = $time() / 1000;
		this.plot.series[0].data.push([this.seconds, upSpeed]);
		this.plot.series[1].data.push([this.seconds, downSpeed]);
		var data = this.plot.series[0].data;
		while ((data[data.length - 1][0] - data[0][0]) > this.maxSeconds) {
			this.plot.series[0].data.shift();
			this.plot.series[1].data.shift();
		}
		this.plot.options.xaxis.max = (this.seconds - this.startSeconds >= this.maxSeconds) ? null : this.maxSeconds + this.startSeconds;
		this.draw();
	}
};