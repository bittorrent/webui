//================================================================================
// LOGGER
//================================================================================

var Logger = {

	"element": null,
	"log_date": false,

	"init": function(element) {
		this.element = $(element);
	},

	"log": function() {
		if (!this.element) return;
		var text = Array.prototype.slice.call(arguments).join(" ");
		var dt = new Date();

		var YYYY = dt.getFullYear();
		var MM = dt.getMonth() + 1; MM = (MM < 10 ? "0" + MM : MM);
		var DD = dt.getDate(); DD = (DD < 10 ? "0" + DD : DD);

		var hh = dt.getHours(); hh = (hh < 10 ? "0" + hh : hh);
		var mm = dt.getMinutes(); mm = (mm < 10 ? "0" + mm : mm);
		var ss = dt.getSeconds(); ss = (ss < 10 ? "0" + ss : ss);

		var time = (
			(this.log_date ? YYYY + "-" + MM + "-" + DD + " " : "") +
			hh + ":" + mm + ":" + ss
		);

		this.element.grab(new Element("p")
			.grab(new Element("span", {"text": "[" + time + "] ", "class": "timestamp"}))
			.appendText(text)
		);

		this.scrollBottom();
	},

	"scrollBottom": function() {
		if (!this.element) return;
		this.element.scrollTo(0, this.element.getScrollSize().y)
	},

	"setLogDate": function(log_date) {
		this.log_date = !!log_date;
	}
};

function log() {
	Logger.log.apply(Logger, arguments);
}

//================================================================================
// BROWSER CONSOLE
//================================================================================

window.onerror = function(msg, url, linenumber) {
	log("JS error: [" + url.split("/").slice(-1)[0] + ":" + linenumber + "] " + msg);
	//return true;
};

var console = console || {};

console.log = console.log || function(str) {
	if (window.opera) {
		opera.postError(str);
	} else {
		log(str);
	}
};

console.assert = console.assert || function() {
	var args = $A(arguments), expr = args.shift();
	if (!expr) {
		throw new Error(false);
	}
};

var timers = {};
console.time = console.time || function(name) {
	if (name == "") return;
	timers[name] = $time();
};

console.timeEnd = console.timeEnd || function(name) {
	if (name == "" || !timers.hasOwnProperty(name)) return;
	console.log(name + ": " + ($time() - timers[name]) + "ms");
	delete timers[name];
};
