/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *
 *     Authors: Carsten Niebuhr (Directrix)
 *
*/

var VERSION = "0.340a";
var BUILD_REQUIRED = -1; // the ut build the webui requires
var lang = lang || null;

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

Array.implement({

	"binarySearch": function(value, comparator) {
		comparator = comparator || function(a, b) {
			if (a === b) return 0;
			if (a < b) return -1;
			return 1;
		};
		var left = 0;
		var mid = 0;
		var right = this.length - 1;
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
		var sz = [lang.SIZE_KB, lang.SIZE_MB, lang.SIZE_GB];
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

function setupUI() {
	loadLangStrings();
	var col = function(text, type, align, disabled) {
		return {
			"text": text,
			"type": type || TYPE_STRING,
			"align": align || ALIGN_AUTO,
			"disabled": !!disabled
		};
	};
	utWebUI.trtTable.create("List", [
			col(lang.OV_COL_NAME, TYPE_STRING),
			col(lang.OV_COL_STATUS, TYPE_STRING),
			col(lang.OV_COL_SIZE, TYPE_NUMBER),
			col(lang.OV_COL_DONE, TYPE_NUMBER),
			col(lang.OV_COL_DOWNLOADED, TYPE_NUMBER),
			col(lang.OV_COL_UPPED, TYPE_NUMBER),
			col(lang.OV_COL_SHARED, TYPE_NUMBER),
			col(lang.OV_COL_DOWNSPD, TYPE_NUMBER),
			col(lang.OV_COL_UPSPD, TYPE_NUMBER),
			col(lang.OV_COL_ETA, TYPE_NUMBER),
			col(lang.OV_COL_LABEL, TYPE_STRING),
			col(lang.OV_COL_PEERS, TYPE_NUMBER),
			col(lang.OV_COL_SEEDS, TYPE_NUMBER),
			col(lang.OV_COL_AVAIL.split("||")[1], TYPE_NUMBER),
			col(lang.OV_COL_ORDER, TYPE_NUMBER, ALIGN_LEFT),
			col(lang.OV_COL_REMAINING, TYPE_NUMBER)
		], $extend({
		"format": function(values, index) {
			if (index == null)
			{
				values[2]  = values[2].toFileSize(2); // size
				values[3]  = (values[3] / 10).roundTo(1) + "%"; // done
				values[4]  = values[4].toFileSize(); // downloaded
				values[5]  = values[5].toFileSize(); // uploaded
				values[6]  = (values[6] == -1) ? "\u221E" : (values[6] / 1000).roundTo(3); // ratio
				values[7]  = (values[7] >= 103) ? (values[7].toFileSize() + "/s") : ""; // download speed
				values[8]  = (values[8] >= 103) ? (values[8].toFileSize() + "/s") : ""; // upload speed
				values[9]  = (values[9] == 0) ? "" :
								(values[9] <= -1) ? "\u221E" : values[9].toTimeString(); // ETA
				values[13] = (values[13] / 65535).roundTo(3); // availability
				values[14] = (values[14] <= -1) ? "*" : values[14]; // ETA
				values[15] = values[15].toFileSize(2); // remaining
			} else
			{
				switch (index)
				{
					case 2:  values = values.toFileSize(2); break;
					case 3:  values = (values / 10).roundTo(1) + "%"; break;
					case 4:  values = values.toFileSize(); break;
					case 5:  values = values.toFileSize(); break;
					case 6:  values = (values == -1) ? "\u221E" : (values / 1000).roundTo(3); break;
					case 7:  values = (values > 103) ? (values.toFileSize() + "/s") : ""; break;
					case 8:  values = (values > 103) ? (values.toFileSize() + "/s") : ""; break;
					case 9:  values = (values <= -1) ? "\u221E" : values.toTimeString(); break;
					case 13: values = (values / 65535).roundTo(3); break;
					case 14: values = (values <= -1) ? "*" : values; break;
					case 15: values = values.toFileSize(2); break;
				}
			}
			return values;
		},
		"onDelete": utWebUI.remove.bind(utWebUI),
		"onColResize": utWebUI.trtCol.bind(utWebUI),
		"onColMove": utWebUI.trtCol.bind(utWebUI),
		"onSort": utWebUI.trtSort.bind(utWebUI),
		"onSelect": utWebUI.trtSelect.bind(utWebUI)
	}, utWebUI.config.torrentTable));

	utWebUI.flsTable.create("FileList", [
			col(lang.FI_COL_NAME, TYPE_STRING),
			col(lang.FI_COL_SIZE, TYPE_NUMBER),
			col(lang.FI_COL_DONE, TYPE_NUMBER),
			col(lang.FI_COL_PCT, TYPE_NUMBER),
			col(lang.FI_COL_PRIO, TYPE_NUMBER)
		], $extend({
		"format": function(values, index) {
			if (index == null)
			{
				values[1] = values[1].toFileSize(2); //size
				values[2] = values[2].toFileSize(2); //done
				values[3] = values[3] + "%"; //%
				values[4] = (values[4] == 0) ? "skip" :
							(values[4] == 1) ? "low" :
							(values[4] == 2) ? "normal" :
							(values[4] == 3) ? "high" : "";
			} else
			{
				switch (index)
				{
					case 1:  values = values.toFileSize(2); break;
					case 2:  values = values.toFileSize(2); break;
					case 3:  values = values + "%"; break;
					case 4:
						values = (values == 0) ? "skip" :
								 (values == 1) ? "low" :
								 (values == 2) ? "normal" :
								 (values == 3) ? "high" : "";
					break;
				}
			}
			return values;
		},
		"onColResize": utWebUI.flsCol.bind(utWebUI),
		"onColMove": utWebUI.flsCol.bind(utWebUI),
		"onSort": utWebUI.flsSort.bind(utWebUI),
		"onSelect": utWebUI.flsSelect.bind(utWebUI)
	}, utWebUI.config.fileTable));
	
	resizeUI();
	
	["_all_", "_dls_", "_com_", "_act_", "_iac_", "_nlb_"].each(function(k) {
		$(k).addEvent("click", function() {
			utWebUI.switchLabel(this);
		});
	});
	
	$("query").addEvent("keydown", function(ev) {
		if (ev.code == 13) Search();
	});
	
	new Drag("HDivider", {
		"modifiers": {"x": "left", "y": ""},
		"onComplete": function() {
			resizeUI.delay(20, null, [window.getSize().x - this.value.now.x, null]);
		}
	});
	new Drag("VDivider", {
		"modifiers": {"x": "", "y": "top"},
		"onComplete": function() {
			resizeUI.delay(20, null, [null, this.value.now.y]);
		}
	});
	
	utWebUI.update();
	//utWebUI.toggleDetPanel();
}

function selcheck(obj, val, actions)
{
	var v = obj.options[obj.selectedIndex].value;
	var b = (v == val);
	for (var i=0,l=actions.length; i<l; i++)
	{
		var o = $(actions[i][1]);
		if (o == null) continue;
		if (actions[i][0] && b)
		{
			o.disabled = false;
		} else
		{
			o.disabled = true;
		}
	}
}

function checkProxySettings(){
	var auth = $("proxy.auth").checked;
	var v = $("proxy.type").get("value").toInt();
	if (v == 0) {
		$("proxy.username").disabled = $("proxy.password").disabled = true;
	} else if (v == 1) {
		if (auth) {
			$("proxy.username").disabled = false;
			$("proxy.password").disabled = true;
			$("DLG_SETT_3_18").addClass("disabled");
		}
	} else if (v == 4) {
		$("proxy.p2p").disabled = true;
		$("DLG_SETT_3_20").addClass("disabled");
	}
	if ((v > 1) && auth) {
		$("proxy.username").disabled = false;
		$("proxy.password").disabled = false;
		$("DLG_SETT_3_16").removeClass("disabled");
		$("DLG_SETT_3_18").removeClass("disabled");
	}
	
}

function linked(obj, defstate, list) {
	var state = true, tag = obj.get("tag");
	if (tag == "input") {
		if (obj.type == "checkbox")
			state = (obj.checked == defstate);
	} else if (tag == "select") {
		state = (obj.get("value") == defstate);
	} else {
		return;
	}
	for (var i = 0, j = list.length; i < j; i++) {
		var ele = $(list[i]);
		if (!ele) continue;
		ele.disabled = state;
		if (ele.previousSibling && (ele.previousSibling.nodeType == 1) && (ele.previousSibling.tagName.toLowerCase() == "label")) {
			ele = ele.previousSibling;
		} else if (ele.nextSibling && (ele.nextSibling.nodeType == 1) && (ele.nextSibling.tagName.toLowerCase() == "label")) {
			ele = ele.nextSibling;
		} else {
			continue;
		}
		ele[state ? "addClass" : "removeClass"]("disabled");
		
	}
}

function redirect(url) {
	window.location.href = url;
}

function resizeUI(w, h) {
	window.resz = true;
	$clear(window.reszTimeout);
	var eh = 0, th = $("toolbar").getSize().y;
	
	if (!isNaN(th))
		eh += th;
	
	var size = window.getSize();
	var ww = size.x, wh = size.y, winResize = false;
	var showcat = utWebUI.config.showCategories, showdet = utWebUI.config.showDetails;
	
	if (!w && !h) { // window resize
		w = Math.floor(ww * ((showcat) ? utWebUI.config.hSplit : 1.0));
		h = Math.floor(wh * ((showdet) ? utWebUI.config.vSplit : 1.0));
		winResize = true;
	}
	
	if ($chk(w))
		w -= (showcat) ? 5 : 13;
		
	if ($chk(h))
		h -= 13 + eh;
		
	if (showcat) {
		if ($chk(w))
			$("CatList").setStyle("width", ww - w - 10 - (Browser.Engine.trident4 ? 2 : 0));
			
		if ($chk(h))
			$("CatList").setStyle("height", h);
	}
	
	if (showdet) {
		$("tdetails").setStyle("width", ww - (Browser.Engine.trident4 ? 14 : 12));
		if ($chk(h))
		{
			$("tdetails").setStyle("height", wh - h);
			$("tdcont").setStyle("height", wh - h - 80);
			$("gcont").setStyle("height", wh - h - 88);
		}
		utWebUI.flsTable.resizeTo(ww - 21, !$chk(h) ? (wh - 70) : h);
	}

	utWebUI.trtTable.resizeTo(w, h);
	var listPos = $("List").getPosition();

	$("HDivider").setStyle("left", listPos.x - 5);
	$("VDivider").setStyle("width", ww);
	
	if ($chk(h)) {
		$("HDivider").setStyle("height", h + 2);
		$("VDivider").setStyle("top", listPos.y + h + 2);
		if (showdet && !winResize)
			utWebUI.config.vSplit = (h / wh).round(3);
	}
	
	if ($chk(w) && showcat && !winResize)
		utWebUI.config.hSplit = (w / ww).round(3);
		
	window.resz = false;
};

function checkUpload(frm) {
	var filename = $("torrent_file").get("value");
	if (!filename.test(/\.torrent$/)) {
		alert("The file has to be a torrent file.");
		return false;
	}
	$("add_button").disabled = true;
	return true;
}

function Search() {
	window.open(searchList[searchActive][1] + "" + $("query").get("value"), "_blank");
}

var utWebUI = {

	"torrents": {},
	"files": {},
	"settings": {},
	"props": {},
	"labels": {
		"_all_": 0, // all
		"_dls_": 0, // downloading
		"_com_": 0, // completed
		"_act_": 0, // active
		"_iac_": 0, // inactive
		"_nlb_": 0  // no-label
	},
	"activeLabel": "_all_",
	"customLabels": {},
	"cacheID": "",
	"torrentID": "", // selected torrent
	"propID": "", // selected torrent (single)
	"trtTable": new dxSTable(),
	"flsTable": new dxSTable(),
	"timer": 0,
	"updateTimeout": null,
	"interval": -1,
	"totalDL": 0,
	"totalUL": 0,
	"loaded": false,

	"initialize": function() {
		var port = (location.host.split(":"))[1];
		if (!$defined(port))
			port = (window.location.protocol == "http:") ? 80 : 443;
		this.url = window.location.protocol + "//" + document.domain + ":" + port + "/gui/";
		
		this.config = {
			"showDetails": true,
			"showCategories": true,
			"showToolbar": true,
			"showSpeed": false,
			"hSplit": 0.88,
			"vSplit": 0.5,
			"alternateRows": false,
			"torrentTable": {
				"reverse": false,
				"maxRows": 25,
				"colOrder": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
				"colWidth": [220,100,80,80,100,80,60,80,80,60,80,60,60,60,30,90],
				"sIndex": -1,
				"alternateRows": true,
				"mode": MODE_PAGE
			},
			"fileTable": {
				"reverse": false,
				"maxRows": 50,
				"colOrder": [0,1,2,3,4],
				"colWidth": [200,60,80,100,80],
				"sIndex": -1,
				"alternateRows": true
			},
			"updateInterval": 3000,
			"lang": "en"
		};

		this.getSettings();
	},
	
	"request": function(qs, fn) {
		new Request({
			"url": this.url + qs,
			"method": "get",
			"onSuccess": ($type(fn) == "function") ? fn.bind(this) : $empty
		}).send();
	},
	
	"perform": function(action) {
		var hashes = [];
		if (action == "pause") {
			hashes = this.getHashes("unpause");
			if (hashes.length) this.request("?action=unpause&hash=" + hashes.join("&hash="));
		}
		var hs = this.getHashes(action);
		hashes.each(function(v) {
			hs.remove(v);
		});
		hashes = hs;
		if (hashes.length == 0) return;
		if ((action == "remove") && (hashes.indexOf(this.torrentID) > -1)) {
			this.torrentID = "";
			this.flsTable.clearRows();
			this.clearDetails();
		}
		this.getTorrents(action + "&hash=" + hashes.join("&hash=") + "&list=1");
	},
	
	"getHashes": function(act) {
		var hashes = [], $me = this;
		this.trtTable.rowSel.each(function(selected, key) {
			if (!selected) return;
			var stat = $me.torrents[key][0];
			switch (act) {
				case "forcestart":
					if ((stat & 1) && !(stat & 64) && !(stat & 32))
						return;
				break;

				case "start":
					if ((stat & 1) && !(stat & 32) && (stat & 64))
						return;
				break;

				case "pause":
					if (stat & 32)
						return;
				break;

				case "unpause":
					if (!(stat & 32))
						return;
				break;

				case "stop":
					if (!(stat & 1) && !(stat & 2) && !(stat & 16) && !(stat & 64))
						return;
				break;

				case "recheck":
					if (stat & 2)
						return;
				break;
				
				default:
				   return;
			}
			hashes.push(key);
		});
		return hashes;
	},
	
	"forceStart": function() {
		this.perform("forcestart");
	},
	
	"start": function() {
		this.perform("start");
	},
	
	"pause": function() {
		this.perform("pause");
	},
	
	"stop": function() {
		this.perform("stop");
	},
	
	"remove": function() {
		if (this.bConfDel) {
			this.delmode = "remove";
		} else {
			this.perform("remove");
		}
	},
	
	"removeAll": function() {
		if (this.bConfDel)
		{
			this.delmode = "removedata";
		} else
		{
			this.perform("removedata");
		}
	},
	
	"doRemove": function() {
		this.perform(this.delmode);
	},
	
	"recheck": function() {
		this.perform("recheck");
	},
	
	"getTorrents": function(qs) {
		$clear(this.updateTimeout);
		this.timer = $time();
		
		if (qs != "list=1")
			qs = "action=" + qs;
			
		this.request("?" + qs + "&cid=" + this.cacheID, this.addTorrents);
	},
	
	"getStatusInfo": function(state, done) {
		var res = ["", ""];
		if (state & STATE_STARTED) { // started
			if (state & STATE_PAUSED) { // paused
				res = ["Status_Paused", lang.OV_FL_PAUSED];
			} else { // seeding or leeching
				res = [(done == 1000) ? "Status_Up" : "Status_Down", (done == 1000) ? lang.OV_FL_SEEDING : lang.OV_FL_DOWNLOADING];
			}
		} else if (state & STATE_CHECKING) { // checking
			res = [(state & STATE_PAUSED) ? "Status_Paused" : "Status_Checking", lang.OV_FL_CHECKED.replace(/%:\.1d%/, "??")];
		} else if (state & STATE_ERROR) { // error
			res = ["Status_Error", lang.OV_FL_ERROR.replace(/%s/, "??")];
		} else if (state & STATE_QUEUED) { // queued
			res = [(done == 1000) ? "Status_Queued_Up" : "Status_Queued_Down", lang.OV_FL_QUEUED];
		}	
		if (!(state & STATE_QUEUED) && !(state & STATE_CHECKING)) // forced started
			res[1] = "[F] " + res[1];		
		if ((done == 1000) && (res[0] == ""))
			res = ["Status_Completed", lang.OV_FL_FINISHED];		
		if ((done < 1000) && (res[0] == ""))
			res = ["Status_Incompleted", lang.OV_FL_STOPPED];	
		return {"icon": res[0], "text": res[1]};
	},

	"addTorrents": function(json) {
		var dobj = JSON.decode(json), torrents = [];
		if (!$defined(dobj.torrents)) {
			if (!$defined(dobj.torrentp)) return;
			torrents = dobj.torrentp;
			delete dobj.torrentp;
		} else {
			torrents = dobj.torrents;
			delete dobj.torrents;
		}
		
		var scroll = this.trtTable.dBody.getScroll();
		if (Browser.Engine.gecko || Browser.Engine.trident) // doing offline updating slows Presto & WebKit down
			this.trtTable.detachBody();
		for (var i = 0, len = torrents.length; i < len; i++) {
			var tor = torrents[i];
			var hash = tor[TORRENT_HASH];
			var done = tor[TORRENT_PROGRESS];
			var stat = this.getStatusInfo(tor[TORRENT_STATUS], done);
			this.totalDL += tor[TORRENT_DOWNSPEED];
			this.totalUL += tor[TORRENT_UPSPEED];
			tor.swap(TORRENT_UPSPEED, TORRENT_DOWNSPEED);
			tor.insertAt(stat.text, 3);
			
			if (!$defined(this.labels[hash]))
				this.labels[hash] = "";
			var labels = this.getLabels(hash, tor[12], done, tor[9], tor[10]);
			if (!$defined(this.torrents[hash])) {
				this.torrents[hash] = tor.slice(1);
				this.labels[hash] = labels;
				tor.splice(0, 2); // remove the hash & status from the array
				tor[11] = tor[11] + " (" + tor[12] + ")";
				tor[12] = tor[13] + " (" + tor[14] + ")";
				tor[13] = tor[15];
				tor.splice(13, 2);
				this.trtTable.addRow(tor, hash, stat.icon, {"label": labels});
			} else {
				var ln = tor.length - 7;
				var prevtor = this.torrents[hash];
				if (labels != this.labels[hash]) {
					this.labels[hash] = labels;
					//this.trtTable.setAttr(hash, "label", labels);
					if (labels.indexOf(this.activeLabel) > -1) {
						this.trtTable.unhideRow(hash);
					} else {
						this.trtTable.hideRow(hash);
					}
				}
				if ((prevtor[0] != tor[1]) || (prevtor[3] != tor[4])) { // status/done changed?
					this.torrents[hash][0] = tor[1];
					this.trtTable.setIcon(hash, stat.icon);
					this.trtTable.setValue(hash, 1, stat.text);
				}
				if ((prevtor[12] != tor[13]) || (prevtor[13] != tor[14])) { // # of peers changed?
					this.torrents[hash][12] = tor[13];
					this.torrents[hash][13] = tor[14];
					this.trtTable.setValue(hash, 11, tor[13] + " (" + tor[14] + ")");
				}
				if ((prevtor[14] != tor[15]) || (prevtor[15] != tor[16])) { // # of seeds changed?
					this.torrents[hash][14] = tor[15];
					this.torrents[hash][15] = tor[16];
					this.trtTable.setValue(hash, 12, tor[15] + " (" + tor[16] + ")");
				}
				for (var j = 16; j < 20; j++) {
					if (prevtor[j] != tor[j + 1]) {
						this.torrents[hash][j] = tor[j + 1];
						this.trtTable.setValue(hash, j - 3, tor[j + 1]);
					}
				}
				for (var j = 1; j < ln; j++) {
					if (prevtor[j] != tor[j + 1]) {
						this.torrents[hash][j] = tor[j + 1];
						if ((j == 4) && (this.torrentID == hash))
							this.updateFiles(hash);
						this.trtTable.setValue(hash, j - 1, tor[j + 1]);
					}
				}
			}
			tor = null;
		}
		torrents = null;
		if (Browser.Engine.gecko || Browser.Engine.trident)
			this.trtTable.attachBody();
		
		if ($defined(dobj.torrentm)) {
			for (var i = 0, j = dobj.torrentm.length; i < j; i++) {
				var k = dobj.torrentm[i];
				delete this.torrents[k];
				
				if (this.labels[k].indexOf("_nlb_") > -1)
					this.labels["_nlb_"]--;
					
				if (this.labels[k].indexOf("_com_") > -1)
					this.labels["_com_"]--;
					
				if (this.labels[k].indexOf("_dls_") > -1)
					this.labels["_dls_"]--;
					
				if (this.labels[k].indexOf("_act_") > -1)
					this.labels["_act_"]--;
					
				if (this.labels[k].indexOf("_iac_") > -1)
					this.labels["_iac_"]--;
					
				this.labels["_all_"]--;
				delete this.labels[k];
				this.trtTable.removeRow(k);
			}
			delete dobj.torrentm;
		}
		this.trtTable.refresh();
		//this.trtTable.dBody.scrollTo(scroll.x, scroll.y);
		this.trtTable.loadObj.hide();
		
		this.cacheID = dobj.torrentc;
		this.loadLabels($A(dobj.label));
		dobj = null;
		this.updateLabels();
		this.loadTorrents();
	},
	
	"loadTorrents": function() {
		if (!this.loaded) {
			this.loaded = true;
			this.trtTable.calcSize();
			if (this.trtTable.sIndex > -1)
				this.trtTable.sort();
		}
			
		this.updateTimeout = this.update.delay(this.getInterval(), this);
		this.updateDetails();
		
		if (this.config.showSpeed > 0)
			this.updateSpeed();
	},
	
	"updateSpeed": function () {
		//MAIN_TITLEBAR_SPEED
		var str = "Download: " + this.totalDL.toFileSize() + "/s | " +
				  "Upload: " + this.totalUL.toFileSize() + "/s";
		if (this.config.showSpeed == 1) {
			window.status = str;
			window.defaultStatus = str;
		} else if (this.config.showSpeed == 2) {
			document.title = "\u00B5Torrent WebUI v" + VERSION + " - " + str;
		}
	},
	
	"update": function () {
		this.totalDL = 0;
		this.totalUL = 0;
		this.getTorrents("list=1");
	},
	
	"getInterval": function() {
		var t = $time() - this.timer;
		this.interval = (this.interval == -1) ? (this.config.updateInterval + t * 4) :  ((this.interval + this.config.updateInterval + t * 4) / 2).toInt();
		return this.interval;
	},
	
	"setUpdateInterval": function() {
		var interval = $("webui.update_interval").get("value").toInt();
		if (interval != this.config.updateInterval)
			this.config.updateInterval = interval;
	},
	
	"loadLabels": function(labels) {
		var labelList = $("lbll"), temp = {};
		for (var i = 0, len = labels.length; i < len; i++) {
			var label = labels[i][0], count = labels[i][1], li = null;
			if (!(li = $("~" + label + "~"))) {
				li = new Element("li", {"id": "~" + label + "~"})
					.addEvent("mousedown", function(){ utWebUI.switchLabel(this); })
					.appendText(label + " (")
					.grab(new Element("span", {"id": "_" + label + "_c"}).set("text", count))
					.appendText(")");
				if (i == 0) {
					labelList.grab(li);
				} else {
					var ps = $("~" + labels[i - 1][0] + "~");
					if (!ps.nextSibling) {
						labelList.grab(li);
					} else {
						li.inject("before", ps.nextSibling);
					}
				}
			} else {
				li.getFirst().set("text", count);
			}
			if ($defined(this.customLabels[label]))
				delete this.customLabels[label];
			temp[label] = count;
		}
		var resetLabel = false;
		for (var k in this.customLabels) if (this.customLabels.hasOwnProperty(k)) {
			$("label_" + k).remove();
			if (this.activeLabel == k)
				resetLabel = true;
		}
		this.customLabels = temp;
		
		if (resetLabel) {
			this.activeLabel = "";
			this.switchLabel($("_all_"));
		}
	},
	
	"getLabels": function(id, label, done, dls, uls) {
		var labels = [];
		if (label == "") {
			labels.push("_nlb_");
			if (this.labels[id].indexOf("_nlb_") == -1)
				this.labels["_nlb_"]++;
		} else {
			labels.push("~" + label + "~");
			if (this.labels[id].indexOf("_nlb_") > -1)
				this.labels["_nlb_"]--;
		}
		if (done < 1000) {
			labels.push("_dls_");
			if (this.labels[id].indexOf("_dls_") == -1)
				this.labels["_dls_"]++;
			if (this.labels[id].indexOf("_com_") > -1)
				this.labels["_com_"]--;
		} else {
			labels.push("_com_");
			if (this.labels[id].indexOf("_com_") == -1)
				this.labels["_com_"]++;
			if (this.labels[id].indexOf("_dls_") > -1)
				this.labels["_dls_"]--;
		}
		if ((dls >= 1024) || (uls >= 1024)) {
			labels.push("_act_");
			if (this.labels[id].indexOf("_act_") == -1)
				this.labels["_act_"]++;
			if (this.labels[id].indexOf("_iac_") > -1)
				this.labels["_iac_"]--;
		} else {
			labels.push("_iac_");
			if (this.labels[id].indexOf("_iac_") == -1)
				this.labels["_iac_"]++;
			if (this.labels[id].indexOf("_act_") > -1)
				this.labels["_act_"]--;
		}
		labels.push("_all_");
		
		if (this.labels[id] == "")
			this.labels["_all_"]++;
			
		return labels.join("");
	},
	
	"setLabel": function(lbl) {
		var str = "?action=setprops&s=label&v=" + lbl;
		for (var k in this.trtTable.rowSel) if (this.trtTable.rowSel.hasOwnProperty(k)) {
			if (this.trtTable.rowSel[k] && (this.torrents[k][11] != lbl))
				str += "&hash=" + k;
		}
		this.request(str);
	},
	
	"newLabel": function() {
		$("txtLabel").set("value", (this.trtTable.selCount == 1) ? this.torrents[this.trtTable.rowSel.keyOf(true)][11] : lang.OV_NEW_LABEL);
		$("dlgLabel").show();
	},
	
	"createLabel": function() {
		var label = $("txtLabel").get("value");
		if (label == "") return;
		this.setLabel(label);
	},
	
	"updateLabels": function() {
		var $me = this;
		["_all_", "_dls_", "_com_", "_act_", "_iac_", "_nlb_"].each(function(key) {
				$(key + "c").set("text", $me.labels[key]);
		});
	},
	
	"switchLabel": function(obj) {
		if (obj.id == this.activeLabel) return;
		if (this.activeLabel != "")
			$(this.activeLabel).removeClass("sel");
		obj.addClass("sel");
		this.activeLabel = obj.id;
		
		var $self = this;
		for (var k in this.torrents) if (this.torrents.hasOwnProperty(k)) {
			if (this.labels[k].indexOf(this.activeLabel) > -1) {
				this.trtTable.unhideRow(k);
			} else {
				this.trtTable.hideRow(k);
			}
		}
		
		//this.trtTable.clearSelection(false);
		
		if (this.torrentID != "") {
			this.torrentID = "";
			this.flsTable.clearRows();
			this.clearDetails();
		}
		this.trtTable.curPage = 0;
		this.trtTable.refreshRows(true);
	},
	
	"getSettings": function() {
		this.request("?action=getsettings", this.addSettings);
	},
	
	"addSettings": function(settings) {
		settings = JSON.decode(settings).settings;
		if (BUILD_REQUIRED > -1)
		{
			if (!d.hasOwnProperty("build") || (d.build < BUILD_REQUIRED)) {
				alert("The WebUI requires atleast \u00B5Torrent (build " + BUILD_REQUIRED);
				return;
			}
		}
		for (var i = 0, j = settings.length; i < j; i++) {
			if (settings[i][0] == "webui.cookie") {
				$extend(this.config, JSON.decode(settings[i][2])); // if the user corrupts the "cookie," good for him/her 
				continue;
			}
			var val = settings[i][2];
			if (val == "true")
				val = "1";	
			if (val == "false")
				val = "0";	
			this.settings[settings[i][0]] = {"t": settings[i][1], "v": val};
		}
		var detectLang = (navigator.language) ? navigator.language : navigator.userLanguage;
		detectLang = detectLang.split("-").join("");
		if (({"enUS":1,"enGB":1,"esES":1})[detectLang])
			detectLang = detectLang.substr(0, 2);
		if (!this.loaded) {
			if ((lang !== null) && ((lang.code == this.config.lang) || ((this.config.lang == "auto") && (lang.code == detectLang)))) {
				setupUI();
			} else {
				loadJS(this.url + "lang/" + ((this.config.lang == "auto") ? detectLang : this.config.lang) + ".js", {"onload": setupUI});
			}
		}
		this.loadSettings();
	},
	
	"loadSettings": function() {
		for (var key in this.settings) if (this.settings.hasOwnProperty(key)) {
			var v = this.settings[key].v, ele;
			if (!(ele = $(key))) continue;
			if (ele.type == "checkbox") {
				ele.checked = ((v == "1") || (v == "true"));
			} else {
				if (key == "seed_ratio")
					v /= 10;
				ele.set("value", v);
			}
			ele.fireEvent("change");
		}
	},
	
	"setSettings": function() {
		//TODO: make it suck less
		var t, v, nv = null, o, reload = false;
		v = $("webui.confirm_when_deleting").checked;
		if (this.bConfDel != v)
			this.bConfDel = (v) ? 1 : 0;
		v = $("webui.speed_display").get("value").toInt();
		if (this.config.showSpeed != v) {
			this.config.showSpeed = v;
			if ((v == 0) || (v == 2)) {
				window.status = "";
				window.defaultStatus = "";
			}
			if ((v == 0) || (v == 1))
				document.title = "\u00B5Torrent WebUI v" + VERSION;
		}
		v = $("webui.alternate_color").checked;
		if (this.config.alternateRows != v) {
			this.config.alternateRows = v ? 1 : 0;
			this.trtTable.options.alternateRows = (this.config.alternateRows) ? true : false;
			this.flsTable.options.alternateRows = (this.config.alternateRows) ? true : false;
			this.trtTable.refreshSelection();
			this.flsTable.refreshSelection();
		}
		v = $("webui.show_cats").checked;
		if (this.config.showCategories != v) {
			this.config.showCategories = (v) ? 1 : 0;
			$("CatList")[(!this.config.showCategories) ? "hide" : "show"]();
			resizeUI();
		}
		v = $("webui.show_dets").checked;
		if (this.config.showDetails != v) {
			this.config.showDetails = (v) ? 1 : 0;
			$("tdetails")[(!this.config.showDetails) ? "hide" : "show"]();
			resizeUI();
		}
		v = $("webui.minrows").value.toInt();
		if (this.config.maxRows != v) {
			this.config.maxRows = v;
			this.trtTable.setMaxRows(this.config.maxRows);
			this.flsTable.setMaxRows(this.config.maxRows);
		}
		v = $("webui.lang").get("value");
		if (this.config.lang != v) {
			this.config.lang = v;
			reload = true;
		}
		this.setUpdateInterval();
		var str = "";
		for (var key in this.settings) if (this.settings.hasOwnProperty(key)) {
			t = this.settings[key].t;
			v = this.settings[key].v;
			var ele = $(key);
			if (!ele) continue;
			nv = ele.get("value");
			if (key == "seed_ratio")
				nv *= 10;
			if (v != nv) {
				str += "&s=" + key + "&v=" + nv;
				this.settings[key].v = nv;
			}
		}
		//if (str != "") this.request("?action=setsetting" + str);
		if (this.settings["webui.enable"].v == "0") {
			$("msg").set("html", "Goodbye.");
			$("cover").show();
			return;
		}
		var sp = location.host.split(":");
		var port = sp[1] || sp[5];
		if (!$defined(port))
			port = (window.location.protocol == "http:") ? 80 : 443;
		if ((this.settings["webui.enable_listen"].v == "1") && (this.settings["webui.port"].v != port)) {
			redirect.delay(1000, null, window.location.protocol + "//" + document.domain + ":" + this.settings["webui.port"].v + "/gui/");
		} else if ((this.settings["webui.enable_listen"].v == "0") && (this.settings["bind_port"].v != port)) {
			redirect.delay(1000, null, window.location.protocol + "//" + document.domain + ":" + this.settings["bind_port"].v + "/gui/");
		} else if (reload) {
			this.request("?action=setsetting&s=webui.cookie&v={\"lang\":\"" + this.config.lang + "\"}", function() {
				window.location.reload();
			});
		}

	},
	
	"showSettings": function() {
		this.getSettings();
		$("dlgSettings").centre();
	},
	
	"trtSelect": function(e, id) {
		if (e.rightClick) {
			if (this.config.showDetails && (this.trtTable.selCount == 1))
				this.showDetails(id);
			this.showMenu(e, id);
		} else {
			if (this.config.showDetails) {
				if (this.trtTable.selCount == 0) {
					this.torrentID = "";
					this.flsTable.clearRows();
					this.clearDetails();
				} else if (this.trtTable.selCount == 1) {
					this.showDetails(id);
				}
			}
		}
	},
	
	"showMenu": function(e, id) {
		var state = this.torrents[id][0];
		var fstart = [lang.ML_FORCE_START, this.forceStart.bind(this)];
		var start = [lang.ML_START, this.start.bind(this)];
		var pause = [lang.ML_PAUSE, this.pause.bind(this)];
		var stop = [lang.ML_STOP,  this.stop.bind(this)];
		var recheck = [lang.ML_FORCE_RECHECK, this.recheck.bind(this)];
		ContextMenu.clear();
		if (!(state & 64)) {
			ContextMenu.add([lang.ML_FORCE_START]);
		} else {
			ContextMenu.add(fstart);
		}
		if (this.trtTable.selCount > 1) {
			ContextMenu.clear();
			ContextMenu.add(fstart);
			ContextMenu.add(start);
			ContextMenu.add(pause);
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(recheck);
		} else if ((state & 1) && !(state & 2)) {
			// started
			if (state & 32) {
				// paused
				ContextMenu.clear();
				ContextMenu.add(fstart);
				ContextMenu.add(start);
				ContextMenu.add(pause);
			} else {
				if (!(state & 64)) {
					ContextMenu.add(start);
				} else {
					ContextMenu.add([lang.ML_START]);
				}
				ContextMenu.add(pause);
			}
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add([lang.ML_FORCE_RECHECK]);
		} else if (state & 2) {
			// checking
			ContextMenu.clear();
			if ((state & 4) || (state & 32)) {
				ContextMenu.add([lang.ML_FORCE_START]);
			} else {
				ContextMenu.add(fstart);
			}
			if (state & 64) {
				ContextMenu.add([lang.ML_START]);
			} else {
				ContextMenu.add(start);
			}
			ContextMenu.add(pause);
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add([lang.ML_FORCE_RECHECK]);
		} else if (state & 16) {
			// error
			ContextMenu.clear();
			ContextMenu.add(fstart);
			ContextMenu.add([lang.ML_START]);
			ContextMenu.add([lang.ML_PAUSE]);
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(recheck);
		} else if (state & 64) {
			// queued
			ContextMenu.add([lang.ML_START]);
			ContextMenu.add(pause);
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(recheck);
		} else {
			ContextMenu.clear();
			ContextMenu.add(fstart);
			ContextMenu.add(start);
			ContextMenu.add([lang.ML_PAUSE]);
			ContextMenu.add([lang.ML_STOP]);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(recheck);
		}
		ContextMenu.add([CMENU_SEP]);
		var lbls = [];
		$each(this.customLabels, function(_, k) {
			if ((this.trtTable.selCount == 1) && (this.torrents[id][11] == k)) {
				lbls.push([CMENU_SEL, k]);
	 		} else {
				lbls.push([k, this.setLabel.bind(this, k)]);
			}
		}, this);
		lbls.push([CMENU_SEP]);
		lbls.push([lang.OV_NEW_LABEL, this.newLabel.bind(this)]);
		lbls.push([lang.OV_REMOVE_LABEL, this.setLabel.bind(this, "")]);
		ContextMenu.add([CMENU_CHILD, lang.ML_LABEL, lbls]);
		ContextMenu.add([CMENU_SEP]);
		ContextMenu.add([lang.ML_REMOVE, this.remove.bind()]);
		ContextMenu.add([CMENU_CHILD, lang.ML_REMOVE_AND,[[lang.ML_DELETE_DATA, this.removeAll.bind(this)]]]);
		ContextMenu.add([CMENU_SEP]);
		ContextMenu.add([lang.ML_PROPERTIES, (this.trtTable.selCount > 1) ? null : this.showProperties.bind(this, id)]);
		ContextMenu.show(e.page);
	},
	
	"showProperties": function(k) {
		this.propID = k;
		this.request("?action=getprops&hash=" + k, this.loadProperties);
		return true;
	},
	
	"loadProperties": function(str) {
		var d = JSON.decode(str);
		var props = d.props[0], id = this.propID;
		if (!$defined(this.props[id]))
			this.props[id] = {};
		$each(props, function(v, k) {
		   this.props[id][k] = v;
		}, this);
		this.updateProperties();
	},
	
	"updateProperties": function() {
		var props = this.props[this.propID];
		$("prop-trackers").value = props.trackers;
		$("prop-ulrate").value = (props.ulrate / 1024).toInt();
		$("prop-dlrate").value = (props.dlrate / 1024).toInt();
		$("prop-ulslots").value = props.ulslots;
		var ele = $("prop-seed_override");
		ele.checked = !!props.seed_override;
		ele.fireEvent("change");
		$("prop-seed_ratio").value = props.seed_ratio / 10;
		$("prop-seed_time").value = props.seed_time;
		$("prop-superseed").checked = props.superseed;
		ele = $("prop-dht");
		if (props.dht == -1) {
			ele.disabled = true;
			$("lbl_prop-dht").addClass("disabled");
		} else {
			ele.disabled = false;
			ele.checked = !!props.dht;
			$("lbl_prop-dht").removeClass("disabled");
		}
		o = $("prop-pex");
		if (props.pex == -1) {
			ele.disabled = true;
			$("lbl_prop-pex").addClass("disabled");
		} else {
			ele.disabled = false;
			ele.checked = !!props.pex;
			$("lbl_prop-pex").removeClass("disabled");
		}
		$("dlgProps").show().centre();
	},
	
	"setProperties": function() {
		var str = "";
		this.props[this.propID].each(function(v, k) {
			var nv = $("prop-" + k).get("value");
			if (k == "hash") return;
			if ((k == "dht") && (v == -1)) return;
			if ((k == "pex") && (v == -1)) return;
			if (k == "seed_ratio")
				nv *= 10;
			if (k == "dlrate")
				nv *= 1024;
			if (k == "ulrate")
				nv *= 1024;
			if (k == "trackers") {
				var a = nv.split("\n"), len = a.length;
				nv = "";
				for (var i = 0; i < len; i++)
				{
					nv += a[i].replace(/\s+/, "") + "%0D%0A";
				}
			}
			if (v != nv) {
				str += "&s=" + k + "&v=" + nv;
				this.props[this.propID][k] = nv;
			}
		}, this);
		if (str != "")
			this.request("?action=setprops&hash=" + this.propID + str);
	},
	
	"showDetails": function(id) {
		this.flsTable.clearRows();
		this.torrentID = id;
		this.getFiles(id);
		this.updateDetails();
	},
	
	"clearDetails": function() {
		["dl", "ul", "ra", "us", "ds", "rm", "se", "pe", "ull", "dll"].each(function(id) {
			$(id).set("html", "");
		});
	},
	
	"updateDetails": function() {
		if (this.torrentID != "")
		{
			var d = this.torrents[this.torrentID].slice(1);
			$("dl").set("html", d[4].toFileSize()); // downloaded
			$("ul").set("html", d[5].toFileSize()); // uploaded
			$("ra").set("html", (d[6] == -1) ? "&#8734;" : (d[6] / 1000).roundTo(3)); // ratio
			$("us").set("html", d[8].toFileSize() + "/s"); // upload speed
			$("ds").set("html", d[7].toFileSize() + "/s"); // download speed
			$("rm").set("html", (d[9] == -1) ? "&#8734;" : d[9].toTimeString()); // ETA
			$("se").set("html", d[13] + " of " + d[14] + " connected"); // seeds
			$("pe").set("html", d[11] + " of " + d[12] + " connected"); // peers
		}
	},
	
	"addURL": function() {
		var url = escape($("url").get("value"));
		$("url").set("value", "");
		if (url != "")
		{
			var cookie = $("cookies").get("value");
			$("cookies").set("value", "");
			if (cookie != "") url += ":COOKIE:" + cookie;
			this.request("?action=add-url&s=" + url, $empty);
		}
	},
	
	"updateFiles": function(hash) {
		if ((this.torrentID == hash) && $defined(this.files[hash])) {
			this.getFiles(hash, true);
			this.updateDetails();
		}
	},
	
	"loadFiles": function() {
		var id = this.torrentID;
		if (id != "")
		{
			if (!this.flsTable.rowData.has(id + "_0")) // don"t reload the table for no reason
			{
				this.flsTable.dBody.scrollLeft = 0;
				this.flsTable.dBody.scrollTop = 0;
				this.files[id].each(function(file, i) {
					var data = $A(file);
					data.push(data[3].toInt());
					data[3] = ((data[1] > 0) ? ((data[2] / data[1]) * 100).roundTo(1) : 100);
					this.flsTable.addRow(data, id + "_" + i);
				}, this);
				this.flsTable.calcSize();
				resizeColumn.call(utWebUI.flsTable);
				this.flsTable.refresh();
			}
			this.flsTable.loadObj.hide();
		}
	},
	
	"getFiles": function(id, update) {
		if (!Hash.has(this.files, id) || update)
		{
			this.files[id] = [];
			this.request("?action=getfiles&hash=" + id, this.addFiles);
		}
	},
	
	"addFiles": function(fd) {
		var files = JSON.decode(fd).files;
		this.files[files[0]] = files[1];
		if (this.tabs.active == "FileList") this.loadFiles();
	},
	
	"flsSelect": function(e, id) {
		utWebUI.showFileMenu(e, id.substr(41).toInt());
	},
	
	"showFileMenu": function(e, ind) {
		if (!e.rightClick) return;
			
		var id = this.torrentID;
		var p = this.files[id][ind][3];
		
		var high = ["High Priority", this.setPriority.bind(this, [id, ind])];
		var normal = ["Normal Priority", this.setPriority.bind(this, [id, ind])];
		var low = ["Low Priority", this.setPriority.bind(this, [id, ind])];
		var skip = ["Don\"t Download", this.setPriority.bind(this, [id, ind])];

		ContextMenu.clear();
		if (this.flsTable.selCount > 1) {
			ContextMenu.add(high);
			ContextMenu.add(normal);
			ContextMenu.add(low);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(skip);
		} else if (p == 0) {
			// skip
			ContextMenu.add(high);
			ContextMenu.add(normal);
			ContextMenu.add(low);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(["Don't Download"]);
		} else if (p == 1) {
			// low
			ContextMenu.add(high);
			ContextMenu.add(normal);
			ContextMenu.add(["Low Priority"]);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(skip);
		} else if (p == 2) {
			// normal
			ContextMenu.add(high);
			ContextMenu.add(["Normal Priority"]);
			ContextMenu.add(low);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(skip);
		} else if (p == 3) {
			// high
			ContextMenu.add(["High Priority"]);
			ContextMenu.add(normal);
			ContextMenu.add(low);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(skip);
		}
		ContextMenu.show(e.page);
	},
	
	"getFileIds": function(id, p) {
		var str = [];
		$each(this.flsTable.rowSel, function(sel, k) {
			if (sel == true) {
				var i = k.substr(41).toInt();
				if (this.files[id][i][3] != p) {
					str.push(i);
					this.files[id][i][3] = p;
					this.flsTable.setValue(id + "_" + i, 4, p);
				}
			}
		}, this);
		return str;
	},
	
	"setPriority": function(id, p) {
		this.request("?action=setprio&hash=" + id + "&p=" + p + "&f=" + this.getFileIds(id, p).join("&f="));
	},
	
	"trtSort": function() {
		this.config.torrentTable.sIndex = this.trtTable.sIndex;
		this.config.torrentTable.reverse = this.trtTable.reverse;
	},
	
	"trtCol": function() {
	},
	
	"flsSort": function() {
		this.config.fileTable.sIndex = this.flsTable.sIndex;
		this.config.fileTable.reverse = this.flsTable.reverse;
	},
	
	"flsCol": function() {
	},
	
	"restoreUI" : function(bc) {
		if ((bc != false) && !confirm("Are you sure that you want to restore the interface?")) return;
		$("stg").hide();
		$("msg").set("html", "Reloading...");
		$("cover").show();
		utWebUI.Request("?action=setsetting&s=webui.cookie&v={}", function(){ window.location.reload(false); });
	},
	
	"saveConfig": function() {
		this.request("?action=setsetting&s=webui.cookie&v=" + JSON.encode(this.config));
	},
	
	"toggleCatPanel": function() {
		var show = !this.config.showCategories;
		$("CatList")[show ? "show" : "hide"]();
		this.config.showCategories = show;
		resizeUI.delay(0);	
	},
	
	"toggleDetPanel": function() {
		var show = !this.config.showDetails;
		$("tdetails")[show ? "show" : "hide"]();
		this.config.showDetails = show;
		resizeUI.delay(0);
	},
	
	"toggleToolbar": function() {
		var show = !this.config.showToolbar;
		$("toolbar")[show ? "show" : "hide"]();
		this.config.showToolbar = show;
		resizeUI.delay(0);
	},
	
	"tabChange": function(id) {
		if ((id == "FileList") && (this.config.showDetails) && (this.torrentID != "")) {
			this.flsTable.loadObj.show();
			this.loadFiles.delay(20, this);
		}
	}
	
}

// ContextMenu class***

var CMENU_SEP = -1;
var CMENU_CHILD = 0;
var CMENU_SEL = 1;
var CMENU_CHECK = 2;

var ContextMenu = {

	"init": function(id) {
		this.obj = new Element("ul", {"id": id, "class": "CMenu"}).inject(document.body);
	},

	"add": function() {
		var args = $A(arguments);
		var link, ul, li;
		var ele = args[0];
		if ($type(ele) == "element")
		{
			if (!ele.hasClass("CMenu")) return;
			args.splice(0, 1);
		} else
		{
			ele = this.obj;
		}
		for (var i = 0, j = args.length; i < j; i++)
		{
			li = new Element("li");
			link = new Element("a");
			if (args[i][0] === CMENU_SEP)
			{
				li.adopt(new Element("hr"));
			} else if (args[i][0] === CMENU_CHILD)
			{
				ul = new Element("ul");
				ul.addClass("CMenu");
				link.addClass("exp");
				link.set("html", args[i][1]);
				li.adopt(link);
				for (var k = 0, len = args[i][2].length; k < len; k++)
					this.add(ul, args[i][2][k]);
				li.adopt(ul);
			} else if (args[i][0] === CMENU_SEL)
			{
				link.addClass("sel");
				link.set("html", args[i][1]);
				li.adopt(link);
			} else if (args[i][0] === CMENU_CHECK)
			{
				link.addClass("check");
				link.setProperty("href", "#");
				link.addEvent("click", function(ev, fn) {
					ev.stop();
					this.itemClick(fn);
				}.bindWithEvent(this, args[i][2]));
				link.set("html", args[i][1]);
				li.adopt(link);
			} else if (!$defined(args[i][1]))
			{
				link.addClass("dis");
				link.set("html", args[i][0]);
				li.adopt(link);
			} else
			{
				link.setProperty("href", "#");
				link.addEvent("click", function(ev, fn) {
					ev.stop();
					this.itemClick(fn);
				}.bindWithEvent(this, args[i][1]));
				link.set("html", args[i][0]);
				li.adopt(link);
			}
			ele.adopt(li);
		} 
	},
	
	"itemClick": function(fn) {
		if (fn())
			this.hide();
	},

	"clear": function() {
		this.obj.empty();
	},
	
	"show": function(p) {
		this.obj.setStyle("visibility", "hidden");
		this.obj.show();
		var x = p.x + 8;
		var size = this.obj.getSize();
		var winSize = window.getSize();
		if (x + size.x > winSize.x)
			x -= size.x;
		var y = p.y + 8;
		if (y + size.y > winSize.y)
			y -= size.y;
		this.obj.setStyles({"left": x, "top": y, "visibility": "visible"});
	},
	
	"hide": function() {
		this.obj.setStyle("visibility", "hidden");
		this.obj.hide();
		this.obj.setStyles({"left": 0, "top": 0});
		this.clear.delay(5, this);
	}

};

var Tabs = new Class({

	"tabs": {},
	
	"active": "",
	
	"initialize": function(ele, options) {
		this.element = ele;
		this.tabs = options.tabs;
		this.onChange = options.onChange || $empty;
	},
	
	"draw": function() {
		this.element.empty();
		var $me = this;
		$each(this.tabs, function(v, k) {
			
			this.element.adopt(new Element("li", {
				"id": "tab_" + k
			}).adopt(new Element("a", {
				"href": "#",
				"events": {
					"click": function(ev) {
						(new Event(ev)).stop();
						$me.show(k)
					}
				}
			}).set("html", v)));
			
		}, this);
		return this;
	},
	
	"show": function(id) {
		if (!Hash.has(this.tabs, id)) return;
		$each(this.tabs, function(v, k) {
			var tab = $("tab_" + k);
			var ele = $(k);
			if (k == id)
			{
				ele.show();
				tab.addClass("selected");
			} else
			{
				ele.hide();
				tab.removeClass("selected");
			}
		}, this);
		this.active = id;
		this.onChange(id);
		return this;
	}
	
});

function log(text) {
	var dt = new Date();
	var h = dt.getHours();
	var m = dt.getMinutes();
	var s = dt.getSeconds();
	h = (h < 10) ? ("0" + h) : h;
	m = (m < 10) ? ("0" + m) : m;
	s = (s < 10) ? ("0" + s) : s;
	$("lcont").appendText("[" + h + ":" + m + ":" + s + "] " + text);
}

var searchList = [
	["Mininova", "http://www.mininova.org/search/?utorrent&search="],
	["BitTorrent", "http://search.bittorrent.com/search.jsp?Submit2=Search&query="],
	["The Pirate Bay", "http://thepiratebay.org/search.php?q="],
	["TorrentSpy", "http://torrentspy.com/search.asp?query="],
	["IsoHunt", "http://isohunt.com/torrents.php?ext=&op=and&ihq="],
	["PointBlank", "http://bt.point-blank.cc/?search="],
	["orb_bt", "http://www.orbdesign.net/bt/results.php?sitefilter=1&query="],
	[],
	["Google", "http://google.com/search?q="]
];

var searchActive = 0;

function searchSet(index) {
	searchActive = index;
	return true;
}

// MooTools.Assets.js
function loadJS(source, properties){
	properties = $extend({
		onload: $empty,
		document: document,
		check: $lambda(true)
	}, properties);
	
	var script = new Element('script', {'src': source, 'type': 'text/javascript'});
	
	var load = properties.onload.bind(script), check = properties.check, doc = properties.document;
	delete properties.onload; delete properties.check; delete properties.document;
	
	script.addEvents({
		load: load,
		readystatechange: function(){
			if (['loaded', 'complete'].contains(this.readyState)) load();
		}
	}).setProperties(properties);
	
	
	if (Browser.Engine.webkit419) var checker = (function(){
		if (!$try(check)) return;
		$clear(checker);
		load();
	}).periodical(50);
	
	return script.inject(doc.head);
}

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

function loadLangStrings() {
	var tstr = lang.OV_TABS.split("||");
	utWebUI.tabs = new Tabs($("tabs"), {
		"tabs": {
			"gcont": tstr[0],
			"FileList": tstr[3],
			"lcont": tstr[5]
		},
		"onChange": utWebUI.tabChange.bind(utWebUI)
	}).draw().show("gcont");
	
	new Tabs($("stgmenu"), {
		"tabs": {
			"st_gl": lang.ST_CAPT_GENERAL,
			"st_dl": lang.ST_CAPT_FOLDER,
			"st_con": lang.ST_CAPT_CONNECTION,
			"st_bw": "Bandwidth",
			"st_bt": lang.ST_CAPT_TRANSFER,
			"st_que": lang.ST_CAPT_SEEDING,
			"st_sch": lang.ST_CAPT_SCHEDULER,
			"st_ao": lang.ST_CAPT_ADVANCED,
			"st_dc": lang.ST_CAPT_DISK_CACHE
		}
	}).draw().show("st_gl");

	[
		"OV_CONFIRM_DELETE",
		"OV_NEWLABEL_TEXT",
		"DLG_TORRENTPROP_GEN_01",
		"DLG_TORRENTPROP_GEN_03",
		"DLG_TORRENTPROP_GEN_04",
		"DLG_TORRENTPROP_GEN_06",
		"DLG_TORRENTPROP_GEN_08",
		"DLG_TORRENTPROP_GEN_10",
		"DLG_TORRENTPROP_GEN_11",
		"DLG_TORRENTPROP_GEN_12",
		"DLG_TORRENTPROP_GEN_14",
		"DLG_TORRENTPROP_GEN_16",
		"DLG_TORRENTPROP_GEN_17",
		"DLG_SETT_1_02",
		"DLG_SETT_1_06",
		"DLG_SETT_1_16",
		"DLG_SETT_3_01",
		"DLG_SETT_3_02",
		"DLG_SETT_3_05",
		"DLG_SETT_3_06",
		//"DLG_SETT_3_07",
		"DLG_SETT_3_08",
		"DLG_SETT_3_09",
		"DLG_SETT_3_11",
		"DLG_SETT_3_13",
		"DLG_SETT_3_15",
		"DLG_SETT_3_16",
		"DLG_SETT_3_18",
		"DLG_SETT_3_20",
		"DLG_SETT_3_21",
		"DLG_SETT_3_22",
		"DLG_SETT_3_23",
		"DLG_SETT_3_24",
		"DLG_SETT_3_25",
		"DLG_SETT_3_26",
		"DLG_SETT_3_28",
		"DLG_SETT_3_30",
		"DLG_SETT_4_01",
		"DLG_SETT_4_02",
		"DLG_SETT_4_04",
		"DLG_SETT_4_06",
		"DLG_SETT_4_08",
		"DLG_SETT_4_09",
		"DLG_SETT_4_10",
		"DLG_SETT_4_11",
		"DLG_SETT_4_12",
		"DLG_SETT_4_13",
		"DLG_SETT_4_14",
		"DLG_SETT_4_15",
		"DLG_SETT_4_16",
		"DLG_SETT_4_18",
		"DLG_SETT_4_19",
		"DLG_SETT_4_21",
		"DLG_SETT_5_01",
		"DLG_SETT_5_02",
		"DLG_SETT_5_04",
		"DLG_SETT_5_06",
		"DLG_SETT_5_07",
		"DLG_SETT_5_09",
		"DLG_SETT_5_11",
		"DLG_SETT_5_12",
		"DLG_SETT_5_13",
		"DLG_SETT_6_01",
		"DLG_SETT_6_02",
		"DLG_SETT_6_04",
		"DLG_SETT_8_01",
		"DLG_SETT_CACHE_01",
		"DLG_SETT_CACHE_02",
		"DLG_SETT_CACHE_03",
		"DLG_SETT_CACHE_06",
		"DLG_SETT_CACHE_07",
		"DLG_SETT_CACHE_08",
		"DLG_SETT_CACHE_11",
		"DLG_SETT_WEBUI_01",
		"DLG_SETT_WEBUI_02",
		"DLG_SETT_WEBUI_03",
		"DLG_SETT_WEBUI_05",
		"DLG_SETT_WEBUI_07",
		"DLG_SETT_WEBUI_09",
		"DLG_SETT_WEBUI_10",
		"DLG_SETT_WEBUI_12",
		"OV_CAT_ALL",
		"OV_CAT_DL",
		"OV_CAT_COMPL",
		"OV_CAT_ACTIVE",
		"OV_CAT_INACTIVE",
		"OV_CAT_NOLABEL",
		"ST_COL_NAME",
		"ST_COL_VALUE"
	].each(function(k) {
		$(k).set("text", lang[k]);
	});
	[
		["dlgProps-header", "DLG_TORRENTPROP_00"],
		["lbl_prop-dht", "DLG_TORRENTPROP_GEN_18"],
		["lbl_prop-pex", "DLG_TORRENTPROP_GEN_19"],
		["dlgLabel-header", "OV_NEWLABEL_CAPTION"],
		["dlgSettings-header", "DLG_SETTINGS_00"],
		["lbl_sched_ul_rate", "DLG_SETT_6_05"],
		["lbl_sched_dl_rate", "DLG_SETT_6_07"],
		["lbl_sched_dis_dht", "DLG_SETT_6_09"],
		["lbl_cache.override_size", "DLG_SETT_CACHE_05"],
		["lbl_cache.writeout", "DLG_SETT_CACHE_09"],
		["lbl_cache.writeimm", "DLG_SETT_CACHE_10"],
		["lbl_cache.read_turnoff", "DLG_SETT_CACHE_12"],
		["lbl_cache.read_prune", "DLG_SETT_CACHE_13"],
		["lbl_cache.read_trash", "DLG_SETT_CACHE_14"]
	].each(function(k) {
		$(k[0]).set("text", lang[k[1]]);
	});
	var timesListA = $("prop-seed_time"), timesListB = $("seed_time");
	[0, 5400, 7200, 10800, 14400, 18000, 21600, 25200, 28800, 32400, 36000, 43200, 57600, 72000, 86400, 108000, 129600, 172800, 216000, 259200, 345600].each(function(t) {
		var text = "";
		if (t == 0) {
			text = lang.ST_SEEDTIMES_IGNORE;
		} else if (t == 5400) {
			text = lang.ST_SEEDTIMES_MINUTES.replace(/%d/, 90);
		} else {
			text = lang.ST_SEEDTIMES_HOURS.replace(/%d/, t / 3600);
		}
		timesListA.grab(new Option(text, t, false, t == 0));
		timesListB.grab(new Option(text, t, false, t == 0));
	});
	$("DLG_TORRENTPROP_01").set("value", lang.DLG_TORRENTPROP_01).addEvent("click", function() {
		$("dlgProps").hide();
		utWebUI.setProperties();
	});
	$("DLG_TORRENTPROP_02").set("value", lang.DLG_TORRENTPROP_02).addEvent("click", function() {
		$('dlgProps').hide();
	});
	$("DLG_SETTINGS_02").set("value", lang.DLG_SETTINGS_02).addEvent("click", function() {
		$("dlgSettings").hide();
		utWebUI.setSettings();
	});
	$("DLG_SETTINGS_03").set("value", lang.DLG_SETTINGS_03).addEvent("click", function() {
		$("dlgSettings").hide();
		utWebUI.loadSettings();
	});
	$("DLG_SETT_3_04").set("value", lang.DLG_SETT_3_04).addEvent("click", function() {
		var v = utWebUI.settings["bind_port"], rnd = 0;
		do {
			rnd = (Math.random() * 45000).toInt() + 20000;
		} while (v == rnd);
		$("bind_port").set("value", rnd);
	});
	var encList = $("encryption_mode");
	lang.ST_CBO_ENCRYPTIONS.split("||").each(function(v, k) {
		if (v == "") return;
		encList.grab(new Option(v, k, false, false));
	});
	var pxyList = $("proxy.type");
	lang.ST_CBO_PROXY.split("||").each(function(v, k) {
		if (v == "") return;
		pxyList.grab(new Option(v, k, false, false));
	});
	
	(function() {
		var days = lang.SETT_DAYNAMES.split("||");
		var tbody = new Element("tbody");
		var active = false;
		var mode = 0;
		for (var i = 0; i < 7; i++)
		{
			var tr = new Element("tr");
			for (var j = 0; j < 25; j++)
			{
				var td = new Element("td");
				if (j == 0)
				{
					td.set("text", days[i]);
				} else
				{
					td.addClass("block").addClass("mode0").addEvent("mousedown", function() {
						for (var k = 0; k <= 3; k++)
						{
							if (this.hasClass("mode" + k))
							{
								mode = (k + 1) % 4;
								this.removeClass("mode" + k).addClass("mode" + mode);
								break;
							}
						}
						active = true;
					}).addEvent("mouseup", function() {
						active = false;
					}).addEvent("mouseenter", function() {
						if (active)
							this.className = "block mode" + mode;
					});
				}
				tr.grab(td);
			}
			tbody.grab(tr);
		}
		$("sched_table").addClass("disabled").grab(tbody);
	})();
}

window.addEvent("domready", function() {

	document.title = "\u00B5Torrent WebUI " + VERSION;
	
	// this is used in dxStable.sort
	window.shiftKey = false;
	
	document.addEvent("keydown", function(ev) {
		window.shiftKey = ev.shift;
		switch (ev.key) {
			case 27: // Esc
				ev.stop();
				utWebUI.restoreUI();
			break;
			
			case "a": // Ctrl + A
				if (ev.control)
					ev.stop();
			break;
			
			case "e": // Ctrl + E
				if (ev.control)
					ev.stop();
			break;
		  
			case "o": // Ctrl + O
				if (ev.control) {
					ev.stop();
					$("dlgAdd").centre().show();
				}
			break;
			
			case "p": // Ctrl + P
				if (ev.control) {
					ev.stop();
					utWebUI.showSettings();
				}
			break;
			
			case "f2": // F2
				ev.stop();
				$("dlgAbout").centre().show();
			break;
			
			case "f4": // F4
				ev.stop();
				utWebUI.toggleToolbar();
			break;
			
			case "f6": // F6
				ev.stop();
				utWebUI.toggleDetPanel();
			break;
			
			case "f7": // F7
				ev.stop();
				utWebUI.toggleCatPanel();
			break;
		}
	});

	//window.addEvent("unload", function() { utWebUI.saveConfig(); });
	
	window.resz = false;
	window.reszTimeout = null;

	window.addEvent("resize", function() {
		if (window.resz) return;
		if (Browser.Engine.trident && !window.resz) { // IE is stupid
			$clear(window.reszTimeout);
			window.reszTimeout = resizeUI.delay(100);
		} else {
			resizeUI();
		}
	});
	
	window.addEvent("error", function(msg, url, linenumber) {
		log("JS error: [" + linenumber + "] " + msg);
		return true;
	});
	
	document.addEvent("click", function(ev) {
		if (ev.rightClick) {
			if (!({"input": 1, "textarea": 1})[ev.target.get("tag")])
				ev.stop(); // prevent event
		} else {
			ContextMenu.hide.delay(50, ContextMenu);
		}
	});

	if (Browser.Engine.trident || Browser.Engine.presto) {
		document.addEvent("contextmenu", function(ev) {
			if (!({"input": 1, "textarea": 1})[ev.target.get("tag")])
				ev.stop();
			return false;
		});
	}

	$("search").addEvent("click", function(ev) {
		ev.stop();
		ContextMenu.clear();
		for (var i = 0, j = searchList.length; i < j; i++)
		{
			if (searchList[i].length == 0)
			{
				ContextMenu.add([CMENU_SEP]);
			} else
			{
				if (i == searchActive)
				{
					ContextMenu.add([CMENU_SEL, searchList[i][0]]);
				} else
				{
					ContextMenu.add([searchList[i][0], searchSet.pass(i)]);
				}
			}
		}
		var pos = this.getPosition();
		pos.x -= 8;
		pos.y += 14;
		ContextMenu.show(pos);
	});
	
	/*
	$("uploadfrm").addEvent("load", function() {
		$("torrent_file").set("value", "");
		$("add_button").disabled = false;
	});
	*/
	hgfdhgfdhgfdh

	ContextMenu.init("ContextMenu");
	
	$("add").addEvent("click", function(ev) {
		ev.stop();
		$("dlgAdd").show().centre();
	});
	["remove", "start", "pause", "stop"].each(function(act) {
		$(act).addEvent("click", function(ev) {
			ev.stop();
			utWebUI[act]();
		});
	});
	$("setting").addEvent("click", function(ev) {
		ev.stop();
		utWebUI.showSettings();
	});
	var winZ = 500;
	$("modalbg").setStyle("opacity", 0.8);
	["dlgAdd", "dlgSettings", "dlgProps", "dlgAbout", "dlgLabel", "dlgDelTor"].each(function(id) {
		$(id).addEvent("mousedown", function(ev) {
			ev.stop();
			this.setStyle("zIndex", ++winZ);
		}).getElement("a").addEvent("click", function(ev) {
			ev.stop();
			$(id).hide();
		});
		new Drag(id, {
			"handle": id + "-header",
			"modifiers": {"x": "left", "y": "top"},
			"onBeforeStart": function() {
				this.element.setStyle("zIndex", ++winZ);
			}
		});
	});
	
	$("proxy.type").addEvent("change", function() {
		linked(this, 0, ["proxy.proxy", "proxy.port", "proxy.auth", "proxy.p2p"]);
		checkProxySettings();
	});
	$("proxy.auth").addEvent("change", function() {
		linked(this, 0, ["proxy.username", "proxy.password"]);
		checkProxySettings();
	});
	$("cache.override").addEvent("change", function() {
		linked(this, 0, ["cache.override_size"]);
	});
	$("cache.write").addEvent("change", function() {
		linked(this, 0, ["cache.writeout", "cache.writeimm"]);
	});
	$("cache.read").addEvent("change", function() {
		linked(this, 0, ["cache.read_turnoff", "cache.read_prune", "cache.read_trash"]);
	});
	$("prop-seed_override").addEvent("change", function() {
		linked(this, 0, ["prop-seed_ratio", "prop-seed_time"]);
	});
	$("webui.enable_guest").addEvent("change", function() {
		linked(this, 0, ["webui.guest"]);
	});
	$("webui.enable_listen").addEvent("change", function() {
		linked(this, 0, ["webui.port"]);
	});
	$("seed_prio_limitul_flag").addEvent("change", function() {
		linked(this, 0, ["seed_prio_limitul"]);
	});
	$("sched_enable").addEvent("change", function() {
		linked(this, 0, ["sched_ul_rate", "sched_dl_rate", "sched_dis_dht"]);
		$("sched_table").toggleClass("disabled");
	});
	$("ul_auto_throttle").addEvent("change", function() {
		linked(this, 1, ["max_ul_rate", "max_ul_rate_seed_flag"]);
	});
	$("max_ul_rate_seed_flag").addEvent("change", function() {
		linked(this, 0, ["max_ul_rate_seed"]);
	});

	utWebUI.initialize();
});