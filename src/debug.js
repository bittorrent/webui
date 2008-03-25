/*
 *
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var console = console || {};

(function() {

	console.log = console.log || function(str) {
		if (window.opera) {
			opera.postError(str);
		} else {
			alert(str);
		}
	};

	var timers = {};
	console.time = console.time || function(name) {
		if (name == "") return;
		timers[name] = $time();
	};
	
	console.timeEnd = console.timeEnd || function(name) {
		if (name == "" || !timers[name]) return;
		console.log(name + ": " + ($time() - timers[name]) + "ms");
		delete timers[name];
	};
	
	console.assert = console.assert || function() {
		var args = $A(arguments), expr = args.shift();
		if (!expr) {
			throw new Error(false);
		}
	};
	
})();

function define(name, value) {
	window[name] = value;
}

define("TORRENT_HASH", 0);
define("TORRENT_STATUS", 1);
define("TORRENT_NAME", 2);
define("TORRENT_SIZE", 3);
define("TORRENT_PROGRESS", 4);
define("TORRENT_DOWNLOADED", 5);
define("TORRENT_UPLOADED", 6);
define("TORRENT_RATIO", 7);
define("TORRENT_UPSPEED", 8);
define("TORRENT_DOWNSPEED", 9);
define("TORRENT_ETA", 10);
define("TORRENT_LABEL", 11);
define("TORRENT_PEERS_CONNECTED", 12);
define("TORRENT_PEERS_SWARM", 13);
define("TORRENT_SEEDS_CONNECTED", 14);
define("TORRENT_SEEDS_SWARM", 15);
define("TORRENT_AVAILABILITY", 16);
define("TORRENT_QUEUE_POSITION", 17);
define("TORRENT_REMAINING", 18);
define("FILEPRIORITY_SKIP", 0);
define("FILEPRIORITY_LOW", 1);
define("FILEPRIORITY_NORMAL", 2);
define("FILEPRIORITY_HIGH", 3);
define("STATE_STARTED", 1);
define("STATE_CHECKING", 2);
define("STATE_ERROR", 16);
define("STATE_PAUSED", 32);
define("STATE_QUEUED", 64);