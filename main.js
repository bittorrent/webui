/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var VERSION = "0.340.001";
var BUILD_REQUIRED = -1; // the ut build the webui requires
var lang = lang || null;
var has = function (obj, key) {
	return Object.prototype.hasOwnProperty.apply(obj, [key]);
};

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
	
	var col = function(text, type, disabled, align) {
		return {
			"text": text,
			"type": type || TYPE_STRING,
			"align": align || ALIGN_AUTO,
			"disabled": !!disabled
		};
	};
	
	var colMask = utWebUI.config.trtCols;
	utWebUI.trtTable.create("List", [
			col(lang.OV_COL_NAME, TYPE_STRING, colMask & 0x0001),
			col(lang.OV_COL_STATUS, TYPE_STRING, colMask & 0x0002),
			col(lang.OV_COL_SIZE, TYPE_NUMBER, colMask & 0x0004),
			col(lang.OV_COL_DONE, TYPE_NUMBER, colMask & 0x0008),
			col(lang.OV_COL_DOWNLOADED, TYPE_NUMBER, colMask & 0x0010),
			col(lang.OV_COL_UPPED, TYPE_NUMBER, colMask & 0x0020),
			col(lang.OV_COL_SHARED, TYPE_NUMBER, colMask & 0x0040),
			col(lang.OV_COL_DOWNSPD, TYPE_NUMBER, colMask & 0x0080),
			col(lang.OV_COL_UPSPD, TYPE_NUMBER, colMask & 0x0100),
			col(lang.OV_COL_ETA, TYPE_NUMBER, colMask & 0x0200),
			col(lang.OV_COL_LABEL, TYPE_STRING, colMask & 0x0400),
			col(lang.OV_COL_PEERS, TYPE_NUMBER, colMask & 0x0800),
			col(lang.OV_COL_SEEDS, TYPE_NUMBER, colMask & 0x1000),
			col(lang.OV_COL_AVAIL.split("||")[1], TYPE_NUMBER, colMask & 0x2000),
			col(lang.OV_COL_ORDER, TYPE_NUMBER, colMask & 0x4000, ALIGN_LEFT),
			col(lang.OV_COL_REMAINING, TYPE_NUMBER, colMask & 0x8000)
		], $extend({
		"format": function(values, index) {
			if (index == null) {
				values[2]  = values[2].toFileSize(2); // size
				var d = values[3];
				values[3] = (values[3] / 10).roundTo(1) + "%"; //new Element("div", {"class": "prbar"}).grab(new Element("span", {"html": (values[3] / 10).roundTo(1) + "%"})).grab(new Element("div", {"styles": {"width": (d / 10).toInt() + "%"}})); // done
				values[4] = values[4].toFileSize(); // downloaded
				values[5] = values[5].toFileSize(); // uploaded
				values[6] = (values[6] == -1) ? "\u221E" : (values[6] / 1000).roundTo(3); // ratio
				values[7] = (values[7] >= 103) ? (values[7].toFileSize() + "/s") : ""; // download speed
				values[8] = (values[8] >= 103) ? (values[8].toFileSize() + "/s") : ""; // upload speed
				values[9] = (values[9] == 0) ? "" :
							(values[9] <= -1) ? "\u221E" : values[9].toTimeString(); // ETA
				values[13] = (values[13] / 65535).roundTo(3); // availability
				values[14] = (values[14] <= -1) ? "*" : values[14]; // ETA
				values[15] = values[15].toFileSize(2); // remaining
			} else {
				switch (index) {
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
		"onColResize": utWebUI.trtColResize.bind(utWebUI),
		"onColMove": utWebUI.trtColMove.bind(utWebUI),
		"onColToggle": utWebUI.trtColToggle.bind(utWebUI),
		"onSort": utWebUI.trtSort.bind(utWebUI),
		"onSelect": utWebUI.trtSelect.bind(utWebUI)
	}, utWebUI.config.torrentTable));

	colMask = utWebUI.config.flsCols;
	utWebUI.flsTable.create("FileList", [
			col(lang.FI_COL_NAME, TYPE_STRING, colMask & 0x01),
			col(lang.FI_COL_SIZE, TYPE_NUMBER, colMask & 0x02),
			col(lang.FI_COL_DONE, TYPE_NUMBER, colMask & 0x04),
			col(lang.FI_COL_PCT, TYPE_NUMBER, colMask & 0x08),
			col(lang.FI_COL_PRIO, TYPE_NUMBER, colMask & 0x10)
		], $extend({
		"format": function(values, index) {
			if (index == null) {
				values[1] = values[1].toFileSize(2); //size
				values[2] = values[2].toFileSize(2); //done
				values[3] = values[3] + "%"; //%
				values[4] = (values[4] == 0) ? "skip" :
							(values[4] == 1) ? "low" :
							(values[4] == 2) ? "normal" :
							(values[4] == 3) ? "high" : "";
			} else {
				switch (index) {
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
		"onColResize": utWebUI.flsColResize.bind(utWebUI),
		"onColMove": utWebUI.flsColMove.bind(utWebUI),
		"onColToggle": utWebUI.trtColToggle.bind(utWebUI),
		"onSort": utWebUI.flsSort.bind(utWebUI),
		"onSelect": utWebUI.flsSelect.bind(utWebUI)
	}, utWebUI.config.fileTable));
	utWebUI.flsTable.loadObj.hide();
	
	resizeUI();
	
	["_all_", "_dls_", "_com_", "_act_", "_iac_", "_nlb_"].each(function(k) {
		$(k).addEvent("click", function() {
			utWebUI.switchLabel(this);
		});
	});
	
	$("query").addEvent("keydown", function(ev) {
		if (ev.code == 13)
			Search();
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
}

/*
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
*/

function checkProxySettings() {

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
		ele[state ? "addClass" : "removeClass"]("disabled");
		ele.disabled = state;
		if (ele.previousSibling && (ele.previousSibling.nodeType == 1) && (ele.previousSibling.tagName.toLowerCase() == "label")) {
			ele = ele.previousSibling;
		} else if (ele.nextSibling && (ele.nextSibling.nodeType == 1) && (ele.nextSibling.tagName.toLowerCase() == "label")) {
			ele = ele.nextSibling;
		} else {
			continue;
		}
	}
}

function redirect(url) {
	window.location.href = url;
}

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

// MooTools.Utilities.Assets.js
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

var fldNodes = [];
var LI = new Element('li');
var TreeNode = new Class({

	"Implements": [Options, Events],
	"options": {
		"text": "",
		"div": null,
		"expandable": false
	},
	"selected": null,
	"element": null,
	"children": [],
	"parent": null,
	"root": null,
	"head": false,
	"level": -1,
	"open": false,

	"initialize": function(options, parent) {
		this.setOptions(options);
		this.parent = parent;
		if (!this.parent) {
			this.element = new Element("div");
			this.parent = $(this.options.div).adopt(this.element);
			this.head = true;
		} else {
			this.level = this.parent.level + 1;
			var $me = this;
			this.element = new Element("a").set({
				"events": {
					"click": function(ev) {
						ev.stop();
						$me.setSelected();
						$me.open = !$me.open;
						var toggle = function(node) {
							if (!node.children) return;
							node.children.each(function(ch) {
								ch.element[(ch.parent.open && $me.open) ? "show" : "hide"]();
								toggle(ch);
							});
						};
						toggle($me);
						if ($me.options.expandable)
							$me.element.setStyle("backgroundImage", "url(\"" + ($me.open ? "./icons/bullet_toggle_minus.png" : "./icons/bullet_toggle_plus.png") + "\")");
						$me.fireEvent("onClick", $me);
					}
				},
				"styles": {
					"paddingLeft": this.level * 20 + 20,
					"backgroundImage": "url(\"" + (this.options.expandable ? "./icons/bullet_toggle_plus.png" : "./images/folder.png") + "\")",
					"backgroundPosition": (this.level * 20 + 2) + "px center"
				},
				"href": "#"
			}).adopt(new Element("span").set("html", this.options.text)).inject(new Element("div", {"class": "item"}));
			if (this.parent.children.length > 0) {
				this.element.parentNode.inject(this.parent.children[this.parent.children.length - 1].element, "after");
			} else {
				this.element.parentNode.inject(this.parent.element, this.parent.head ? "bottom" : "after");
			}
		}
	},
	
	"setSelected": function(node) {
		if (this.head) {
			if (this.selected)
				this.selected.element.removeClass("selected");
			this.selected = node;
			this.selected.element.addClass("selected");
		} else {
			this.parent.setSelected($pick(node, this));
		}
	},
	
	"insert": function(options) {
		this.children.push(new TreeNode(options, this));
	},
	
	"clear": function() {
		this.children.each(function(node) {
			node.element.remove();
		});
		this.children = [];
	},
	
	"getRoot": function() {
		return this.head ? this.element : this.parent.getRoot();
	}

});

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
		"DLG_PRE_ADD_04",
		"DLG_PRE_ADD_05",
		"DLG_PRE_ADD_06",
		"DLG_PRE_ADD_08",
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
		"DLG_PRE_ADD_03"
	].each(function(k) {
		$(k).set("value", lang[k]);
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
		for (var i = 0; i < 7; i++) {
			var tr = new Element("tr");
			for (var j = 0; j < 25; j++) {
				var td = new Element("td");
				if (j == 0) {
					td.set("text", days[i]);
				} else {
					td.addClass("block").addClass("mode0").addEvent("mousedown", function() {
						for (var k = 0; k <= 3; k++) {
							if (this.hasClass("mode" + k)) {
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
		$("sched_table").grab(tbody);
	})();
}

var resizing = false, resizeTimeout = null;
function resizeUI(w, h) {

	resizing = true;
	$clear(resizeTimeout);
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
	
	if (w)
		w -= (showcat) ? 5 : 13;
		
	if (h)
		h -= eh + (showdet ? 5 : 13);
		
	if (showcat) {
		if (w)
			$("CatList").setStyle("width", ww - w - 10 - (Browser.Engine.trident4 ? 2 : 0));
			
		if (h)
			$("CatList").setStyle("height", h);
	}
	
	if (showdet) {
		$("tdetails").setStyle("width", ww - (Browser.Engine.trident4 ? 14 : 12));
		if (h) {
			$("tdetails").setStyle("height", wh - h - 10);
			$("tdcont").setStyle("height", wh - h - 86);
			$("gcont").setStyle("height", wh - h - 96);
			utWebUI.flsTable.resizeTo(ww - 22, wh - h - 88);
		}
	}

	utWebUI.trtTable.resizeTo(w, h);
	var listPos = $("List").getPosition();

	$("HDivider").setStyle("left", listPos.x - 5);
	$("VDivider").setStyle("width", ww);
	
	if (h) {
		$("HDivider").setStyle("height", h + 2);
		$("VDivider").setStyle("top", listPos.y + h + 2);
		if (showdet && !winResize)
			utWebUI.config.vSplit = h / (wh - eh - 12);
	}
	
	if (w && showcat && !winResize)
		utWebUI.config.hSplit = w / ww;
		
	resizing = false;
}

window.addEvent("domready", function() {

	document.title = "\u00B5Torrent WebUI " + VERSION;
	
	document.addEvent("keydown", function(ev) {
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

	window.addEvent("unload", function() {
		utWebUI.saveConfig();
	});

	window.addEvent("resize", function() {
		if (resizing) return;
		if (Browser.Engine.trident && !resizing) { // IE is stupid
			$clear(resizeTimeout);
			resizeTimeout = resizeUI.delay(100);
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
				ev.stop();
		} else {
			ContextMenu.hide.delay(50, ContextMenu);
		}
	});

	if (Browser.Engine.trident || Browser.Engine.presto || Browser.Engine.webkit) {
		document.addEvent("contextmenu", function(ev) {
			if (!({"input": 1, "textarea": 1})[ev.target.get("tag")]) {
				ev.stop();
				return false;
			}
			return true;
		});
	}

	$("search").addEvent("click", function(ev) {
		ev.stop();
		ContextMenu.clear();
		for (var i = 0, j = searchList.length; i < j; i++) {
			if (searchList[i].length == 0) {
				ContextMenu.add([CMENU_SEP]);
			} else {
				if (i == searchActive) {
					ContextMenu.add([CMENU_SEL, searchList[i][0]]);
				} else {
					ContextMenu.add([searchList[i][0], searchSet.pass(i)]);
				}
			}
		}
		var pos = this.getPosition();
		pos.x -= 8;
		pos.y += 14;
		ContextMenu.show(pos);
	});
	
	new IFrame({
		"id": "uploadfrm",
		"src": "about:blank",
		"onload": function(doc) {
			$("torrent_file").set("value", "");
			$("add_button").disabled = false;
			var str = $(doc.body).get("html");
			if (str != "") {
				var data = JSON.decode(str);
				if (has(data, "error")) 
					alert(data.error);
			}
		}
	}).inject(document.body);
	
	$("upfrm").addEvent("submit", function() {
		return checkUpload(this);
	});

	ContextMenu.init("ContextMenu");
	
	$("add").addEvent("click", function(ev) {
		ev.stop();
		var ele = $("addlab");
		ele.options.length = 0;
		var count = 0;
		for (var key in utWebUI.customLabels)
			ele.options[count++] = new Option(key, key, false, count == 0);
		$("dlgAdd").show().centre();
	});
	$("DLG_PRE_ADD_03").addEvent("click", function() {
		utWebUI.showFolderBrowser();
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
	["dlgAdd", "dlgSettings", "dlgProps", "dlgAbout", "dlgLabel", "dlgDelTor", "dlgFolders"].each(function(id) {
		$(id).addEvent("mousedown", function(ev) {
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
			},
			"onStart": function() {
				this.element.addClass("dlg-window-dragging");
			},
			"onCancel": function() {
				this.element.removeClass("dlg-window-dragging");
			},
			"onComplete": function() {
				this.element.removeClass("dlg-window-dragging");
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
	(function() {
		var addTogg = false;
		$("optadd").addEvent("click", function(ev) {
			ev.stop();
			this.setStyle("backgroundPosition", "2px " + (addTogg ? 0 : -16) + "px");
			$("dlgAdd").setStyle("height", addTogg ? 185 : 260);
			$("optadd-cont")[addTogg ? "hide" : "show"]();
			addTogg = !addTogg;
		});
	})();
	
	fldNodes[0] = new TreeNode({
		"div": "fl-cont",
		"id": 0
	});
	var clkEv = function(node) {
		var path = "";
		while (node.level >= 0) {
			path = node.options.text + "\\" + path;
			node = node.parent;
		}
		$("brwpath").set("value", path);
	};
	var fdsg = new TreeNode({"text": "C:", "onClick": clkEv}, fldNodes[0]);
	fdsg.insert({"text": "Windows", "onClick": clkEv});
	fldNodes[0].insert({"text": "D:\\kfdsgfds", "onClick": clkEv});
	fldNodes[0].insert({"text": "F:\\fds", "onClick": clkEv});
	utWebUI.initialize();
});