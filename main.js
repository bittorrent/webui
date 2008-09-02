/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var perSec = "/s";

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
			col(lang[CONST.OV_COL_NAME], TYPE_STRING, colMask & 0x0001),
			col(lang[CONST.OV_COL_STATUS], TYPE_STRING, colMask & 0x0002),
			col(lang[CONST.OV_COL_SIZE], TYPE_NUMBER, colMask & 0x0004),
			col(lang[CONST.OV_COL_DONE], TYPE_NUMBER, colMask & 0x0008),
			col(lang[CONST.OV_COL_DOWNLOADED], TYPE_NUMBER, colMask & 0x0010),
			col(lang[CONST.OV_COL_UPPED], TYPE_NUMBER, colMask & 0x0020),
			col(lang[CONST.OV_COL_SHARED], TYPE_NUMBER, colMask & 0x0040),
			col(lang[CONST.OV_COL_DOWNSPD], TYPE_NUMBER, colMask & 0x0080),
			col(lang[CONST.OV_COL_UPSPD], TYPE_NUMBER, colMask & 0x0100),
			col(lang[CONST.OV_COL_ETA], TYPE_NUMBER, colMask & 0x0200),
			col(lang[CONST.OV_COL_LABEL], TYPE_STRING, colMask & 0x0400),
			col(lang[CONST.OV_COL_PEERS], TYPE_NUMBER, colMask & 0x0800),
			col(lang[CONST.OV_COL_SEEDS], TYPE_NUMBER, colMask & 0x1000),
			col(lang[CONST.OV_COL_AVAIL].split("||")[1], TYPE_NUMBER, colMask & 0x2000),
			col(lang[CONST.OV_COL_ORDER], TYPE_NUM_ORDER, colMask & 0x4000, ALIGN_LEFT),
			col(lang[CONST.OV_COL_REMAINING], TYPE_NUMBER, colMask & 0x8000)
		], $extend({
		"format": function(values, index) {
			var len = values.length;
			if (isNaN(index))
				index = 0;
			for (var i = 0; i < len; i++) {
				switch (index) {
				case 0:
				case 1:
				case 10:
				case 11:
				case 12:
					break;
					
				case 2:	
					values[i]  = values[i].toFileSize(2); // size
					break;
				
				case 3:
					values[i] = (values[i] / 10).roundTo(1) + "%"; // done
					break;
					
				case 4:
					values[i] = values[i].toFileSize(); // downloaded
					break;
				
				case 5:
					values[i] = values[i].toFileSize(); // uploaded
					break;
				
				case 6:
					values[i] = (values[i] == -1) ? "\u221E" : (values[i] / 1000).roundTo(3); // ratio
					break;
				
				case 7:
					values[i] = (values[i] >= 103) ? (values[i].toFileSize() + perSec) : ""; // download speed
					break;
				
				case 8:
					values[i] = (values[i] >= 103) ? (values[i].toFileSize() + perSec) : ""; // upload speed
					break;
					
				case 9:
					values[i] = (values[i] == 0) ? "" :
								(values[i] <= -1) ? "\u221E" : values[i].toTimeString(); // ETA
					break;
								
				case 13:
					values[i] = (values[i] / 65535).roundTo(3); // availability
					break;
					
				case 14:
					values[i] = (values[i] <= -1) ? "*" : values[i]; // queue position
					break;
					
				case 15:
					values[i] = values[i].toFileSize(2); // remaining
					break;
				}
				index++;
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

	if (!isGuest) {
		colMask = utWebUI.config.flsCols;
		utWebUI.flsTable.create("FileList", [
				col(lang[CONST.FI_COL_NAME], TYPE_STRING, colMask & 0x01),
				col(lang[CONST.FI_COL_SIZE], TYPE_NUMBER, colMask & 0x02),
				col(lang[CONST.FI_COL_DONE], TYPE_NUMBER, colMask & 0x04),
				col(lang[CONST.FI_COL_PCT], TYPE_NUMBER, colMask & 0x08),
				col(lang[CONST.FI_COL_PRIO], TYPE_NUMBER, colMask & 0x10)
			], $extend({
			"format": function(values, index) {
				var len = values.length;
				if (isNaN(index))
					index = 0;
				for (var i = 0; i < len; i++) {
					switch (index) {
					case 0:
						break;
						
					case 1:
						values[i] = values[i].toFileSize(2); //size
						break;
						
					case 2:
						values[i] = values[i].toFileSize(2); //done
						break
					
					case 3:
						values[i] = values[i] + "%"; //%
						break;
						
					case 4:
						values[i] = lang[CONST["FI_PRI" + values[i]]];
					}
					index++;
				}
				return values;
			},
			"onColResize": utWebUI.flsColResize.bind(utWebUI),
			"onColMove": utWebUI.flsColMove.bind(utWebUI),
			"onColToggle": utWebUI.trtColToggle.bind(utWebUI),
			"onSort": utWebUI.flsSort.bind(utWebUI),
			"onSelect": utWebUI.flsSelect.bind(utWebUI),
			"onRefresh": function() { if (this.torrentID != "") utWebUI.getFiles(utWebUI.torrentID, true); },
			"refreshable": true
		}, utWebUI.config.fileTable));
		utWebUI.flsTable.loadObj.hide();
	}

	resizeUI();
	
	["_all_", "_dls_", "_com_", "_act_", "_iac_", "_nlb_"].each(function(k) {
		$(k).addEvent("click", function() {
			utWebUI.switchLabel(this);
		});
	});
	
	if (isGuest) return;
	
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
}

function checkProxySettings() {

	var auth = $("proxy.auth").checked;
	var v = $("proxy.type").get("value").toInt();
	if (v == 0) {
		$("proxy.username").disabled = $("proxy.password").disabled = true;
	} else if (v == 1) {
		if (auth) {
			$("proxy.username").disabled = false;
			$("proxy.password").disabled = true;
			$("DLG_SETTINGS_4_CONN_18").addClass("disabled");
		}
	} else if (v == 4) {
		$("proxy.p2p").disabled = true;
		$("DLG_SETTINGS_4_CONN_20").addClass("disabled");
	}
	if ((v > 1) && auth) {
		$("proxy.username").disabled = false;
		$("proxy.password").disabled = false;
		$("DLG_SETTINGS_4_CONN_16").removeClass("disabled");
		$("DLG_SETTINGS_4_CONN_18").removeClass("disabled");
	}
	
}

function checkUpload(frm) {
	var filename = $("torrent_file").get("value");
	if (!filename.test(/\.torrent$/)) {
		alert("The file has to be a torrent file.");
		return false;
	}
	$("ADD_FILE_OK").disabled = true;
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
	$("lcont").grab(new Element("br"), "top").appendText("[" + h + ":" + m + ":" + s + "] " + text, "top");
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
	$("query").focus();
}

/*
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
*/

function loadLangStrings() {
	[
		"OV_CAT_ALL",
		"OV_CAT_DL",
		"OV_CAT_COMPL",
		"OV_CAT_ACTIVE",
		"OV_CAT_INACTIVE",
		"OV_CAT_NOLABEL"
	].each(function(k) {
		$(k).set("text", lang[CONST[k]]);
	});
	if (isGuest) return;
	var tstr = lang[CONST.OV_TABS].split("||");
	utWebUI.tabs = new Tabs($("tabs"), {
		"tabs": {
			"gcont": tstr[0],
			"FileList": tstr[4],
			"lcont": tstr[6]
		},
		"onChange": utWebUI.tabChange.bind(utWebUI)
	}).draw().show("gcont");
	
	[
		"DLG_TORRENTPROP_1_GEN_01",
		"DLG_TORRENTPROP_1_GEN_03",
		"DLG_TORRENTPROP_1_GEN_04",
		"DLG_TORRENTPROP_1_GEN_06",
		"DLG_TORRENTPROP_1_GEN_08",
		"DLG_TORRENTPROP_1_GEN_10",
		"DLG_TORRENTPROP_1_GEN_11",
		"DLG_TORRENTPROP_1_GEN_12",
		"DLG_TORRENTPROP_1_GEN_14",
		"DLG_TORRENTPROP_1_GEN_16",
		"DLG_TORRENTPROP_1_GEN_17",
		"DLG_TORRENTPROP_1_GEN_18",
		"DLG_TORRENTPROP_1_GEN_19",
		"GN_TRANSFER",
		"GN_TP_01",
		"GN_TP_02",
		"GN_TP_03",
		"GN_TP_04",
		"GN_TP_05",
		"GN_TP_06",
		"GN_TP_07",
		"GN_TP_08",
		"OV_NEWLABEL_TEXT"
	].each(function(k) {
		$(k).set("text", lang[CONST[k]]);
	});
	[
		["dlgProps-header", CONST.DLG_TORRENTPROP_00],
		["dlgLabel-header", CONST.OV_NEWLABEL_CAPTION],
		["dlgSettings-header", CONST.DLG_SETTINGS_00],
		["dlgAdd-header", CONST.OV_TB_ADDTORR]
	].each(function(k) {
		$(k[0]).set("text", lang[k[1]]);
	});

	var timesListA = $("prop-seed_time"), timesListB = $("seed_time");
	timesListA.options.length = timesListB.options.length = 0;
	[0, 5400, 7200, 10800, 14400, 18000, 21600, 25200, 28800, 32400, 36000, 43200, 57600, 72000, 86400, 108000, 129600, 172800, 216000, 259200, 345600].each(function(t) {
		var text = "";
		if (t == 0) {
			text = lang[CONST.ST_SEEDTIMES_IGNORE];
		} else if (t == 5400) {
			text = lang[CONST.ST_SEEDTIMES_MINUTES].replace(/%d/, 90);
		} else {
			text = lang[CONST.ST_SEEDTIMES_HOURS].replace(/%d/, t / 3600);
		}
		timesListA.options[timesListA.options.length] = new Option(text, t, false, t == 0);
		timesListB.options[timesListB.options.length] = new Option(text, t, false, t == 0);
	});
	$("DLG_TORRENTPROP_01").set("value", lang[CONST.DLG_TORRENTPROP_01]).addEvent("click", function() {
		$("dlgProps").hide();
		utWebUI.setProperties();
	});
	$("DLG_TORRENTPROP_02").set("value", lang[CONST.DLG_TORRENTPROP_02]).addEvent("click", function() {
		$('dlgProps').hide();
	});
	$("LBL_OK").set("value", lang[CONST.DLG_SETTINGS_03]).addEvent("click", function() {
		$("dlgLabel").hide();
		utWebUI.createLabel();
	});
	$("LBL_CANCEL").set("value", lang[CONST.DLG_SETTINGS_04]).addEvent("click", function() {
		$("dlgLabel").hide();
	});
	$("ADD_FILE_OK").set("value", lang[CONST.DLG_SETTINGS_03]);
	$("ADD_FILE_CANCEL").set("value", lang[CONST.DLG_SETTINGS_04]).addEvent("click", function() {
		$("dlgAdd").hide();
	});
	$("ADD_URL_OK").set("value", lang[CONST.DLG_SETTINGS_03]).addEvent("click", function() {
		$("dlgAdd").hide();
		utWebUI.addURL();
	});
	$("ADD_URL_CANCEL").set("value", lang[CONST.DLG_SETTINGS_04]).addEvent("click", function() {
		$("dlgAdd").hide();
	});
	
	["remove", "start", "pause", "stop"].each(function(act) {
		$(act).setProperty("title", lang[CONST["OV_TB_" + act.toUpperCase()]]);
	});
	$("setting").setProperty("title", lang[CONST.OV_TB_PREF]);
	$("add").setProperty("title", lang[CONST.OV_TB_ADDTORR]);
	perSec = "/" + lang[CONST.TIME_SECS].replace(/%d/, "").trim();
}

function loadSettingStrings() {
	new Tabs($("stgmenu"), {
		"tabs": {
			"st_webui": lang[CONST.ST_CAPT_WEBUI],
			"st_gl": lang[CONST.ST_CAPT_GENERAL],
			"st_dirs": lang[CONST.ST_CAPT_FOLDER],
			"st_con": lang[CONST.ST_CAPT_CONNECTION],
			"st_bw": lang[CONST.ST_CAPT_BANDWIDTH],
			"st_bt": lang[CONST.ST_CAPT_TRANSFER],
			"st_que": lang[CONST.ST_CAPT_SEEDING],
			"st_sch": lang[CONST.ST_CAPT_SCHEDULER],
			"st_ao": lang[CONST.ST_CAPT_ADVANCED],
			"st_dc": lang[CONST.ST_CAPT_DISK_CACHE]
		}
	}).draw().show("st_webui");

	[
		"DLG_SETTINGS_1_GENERAL_02",
		"DLG_SETTINGS_1_GENERAL_10",
		"DLG_SETTINGS_1_GENERAL_11",
		"DLG_SETTINGS_1_GENERAL_12",
		"DLG_SETTINGS_1_GENERAL_13",
		"DLG_SETTINGS_1_GENERAL_17",
		"DLG_SETTINGS_1_GENERAL_18",
		"DLG_SETTINGS_1_GENERAL_19",
		"DLG_SETTINGS_1_GENERAL_20",
		"DLG_SETTINGS_2_UI_02",
		"DLG_SETTINGS_2_UI_05",
		"DLG_SETTINGS_2_UI_06",
		"DLG_SETTINGS_2_UI_15",
		"DLG_SETTINGS_2_UI_16",
		"DLG_SETTINGS_3_PATHS_01",		
		"DLG_SETTINGS_3_PATHS_02",		
		"DLG_SETTINGS_3_PATHS_06",
		"DLG_SETTINGS_3_PATHS_07",
		"DLG_SETTINGS_3_PATHS_10",
		"DLG_SETTINGS_3_PATHS_11",
		"DLG_SETTINGS_3_PATHS_12",
		"DLG_SETTINGS_3_PATHS_15",
		"DLG_SETTINGS_3_PATHS_18",
		"DLG_SETTINGS_3_PATHS_19",
		"DLG_SETTINGS_4_CONN_01",
		"DLG_SETTINGS_4_CONN_02",
		"DLG_SETTINGS_4_CONN_05",
		"DLG_SETTINGS_4_CONN_06",
		"DLG_SETTINGS_4_CONN_07",		
		"DLG_SETTINGS_4_CONN_08",
		"DLG_SETTINGS_4_CONN_09",
		"DLG_SETTINGS_4_CONN_11",
		"DLG_SETTINGS_4_CONN_13",		
		"DLG_SETTINGS_4_CONN_15",
		"DLG_SETTINGS_4_CONN_16",
		"DLG_SETTINGS_4_CONN_18",
		"DLG_SETTINGS_4_CONN_20",
		"DLG_SETTINGS_4_CONN_21",		
		"DLG_SETTINGS_5_BANDWIDTH_01",
		"DLG_SETTINGS_5_BANDWIDTH_02",
		"DLG_SETTINGS_5_BANDWIDTH_03",
		"DLG_SETTINGS_5_BANDWIDTH_05",
		"DLG_SETTINGS_5_BANDWIDTH_07",
		"DLG_SETTINGS_5_BANDWIDTH_08",
		"DLG_SETTINGS_5_BANDWIDTH_10",
		"DLG_SETTINGS_5_BANDWIDTH_11",
		"DLG_SETTINGS_5_BANDWIDTH_14",
		"DLG_SETTINGS_5_BANDWIDTH_15",
		"DLG_SETTINGS_5_BANDWIDTH_17",
		"DLG_SETTINGS_6_BITTORRENT_01",
		"DLG_SETTINGS_6_BITTORRENT_02",
		"DLG_SETTINGS_6_BITTORRENT_03",
		"DLG_SETTINGS_6_BITTORRENT_04",
		"DLG_SETTINGS_6_BITTORRENT_05",
		"DLG_SETTINGS_6_BITTORRENT_06",
		"DLG_SETTINGS_6_BITTORRENT_07",
		"DLG_SETTINGS_6_BITTORRENT_08",
		"DLG_SETTINGS_6_BITTORRENT_10",
		"DLG_SETTINGS_6_BITTORRENT_11",
		"DLG_SETTINGS_6_BITTORRENT_13",
		"DLG_SETTINGS_7_QUEUEING_01",
		"DLG_SETTINGS_7_QUEUEING_02",
		"DLG_SETTINGS_7_QUEUEING_04",
		"DLG_SETTINGS_7_QUEUEING_06",
		"DLG_SETTINGS_7_QUEUEING_07",
		"DLG_SETTINGS_7_QUEUEING_09",
		"DLG_SETTINGS_7_QUEUEING_11",
		"DLG_SETTINGS_7_QUEUEING_12",
		"DLG_SETTINGS_7_QUEUEING_13",
		"DLG_SETTINGS_8_SCHEDULER_01",
		"DLG_SETTINGS_8_SCHEDULER_04",
		"DLG_SETTINGS_8_SCHEDULER_05",
		"DLG_SETTINGS_8_SCHEDULER_07",
		"DLG_SETTINGS_8_SCHEDULER_09",
		"DLG_SETTINGS_9_WEBUI_01",
		"DLG_SETTINGS_9_WEBUI_02",
		"DLG_SETTINGS_9_WEBUI_03",
		"DLG_SETTINGS_9_WEBUI_05",
		"DLG_SETTINGS_9_WEBUI_07",
		"DLG_SETTINGS_9_WEBUI_09",
		"DLG_SETTINGS_9_WEBUI_10",
		"DLG_SETTINGS_9_WEBUI_12",
		"DLG_SETTINGS_A_ADVANCED_01",
		"DLG_SETTINGS_B_ADV_UI_07",
		"DLG_SETTINGS_C_ADV_CACHE_01",
		"DLG_SETTINGS_C_ADV_CACHE_02",
		"DLG_SETTINGS_C_ADV_CACHE_03",
		"DLG_SETTINGS_C_ADV_CACHE_05",
		"DLG_SETTINGS_C_ADV_CACHE_06",
		"DLG_SETTINGS_C_ADV_CACHE_07",
		"DLG_SETTINGS_C_ADV_CACHE_08",
		"DLG_SETTINGS_C_ADV_CACHE_09",
		"DLG_SETTINGS_C_ADV_CACHE_10",
		"DLG_SETTINGS_C_ADV_CACHE_11",
		"DLG_SETTINGS_C_ADV_CACHE_12",
		"DLG_SETTINGS_C_ADV_CACHE_13",
		"DLG_SETTINGS_C_ADV_CACHE_14",
		"DLG_SETTINGS_C_ADV_CACHE_15",
		"MENU_SHOW_CATEGORY",
		"MENU_SHOW_DETAIL",
		"ST_COL_NAME",
		"ST_COL_VALUE"
	].each(function(k) {
		$(k).set("text", lang[CONST[k]]);
	});

	$("DLG_SETTINGS_03").set("value", lang[CONST.DLG_SETTINGS_03]).addEvent("click", function() {
		$("dlgSettings").hide();
		utWebUI.setSettings();
	});
	$("DLG_SETTINGS_04").set("value", lang[CONST.DLG_SETTINGS_04]).addEvent("click", function() {
		$("dlgSettings").hide();
		utWebUI.loadSettings();
	});
	$("DLG_SETTINGS_4_CONN_04").set("value", lang[CONST.DLG_SETTINGS_4_CONN_04]).addEvent("click", function() {
		var v = utWebUI.settings["bind_port"], rnd = 0;
		do {
			rnd = parseInt(Math.random() * 50000) + 15000;
		} while (v == rnd);
		$("bind_port").set("value", rnd);
	});
	
	var encList = $("encryption_mode");
	encList.options.length = 0;
	lang[CONST.ST_CBO_ENCRYPTIONS].split("||").each(function(v, k) {
		if (v == "") return;
		encList.options[encList.options.length] = new Option(v, k, false, false);
	});
	encList.set("value", utWebUI.settings["encryption_mode"]);
	var pxyList = $("proxy.type");
	pxyList.options.length = 0;
	lang[CONST.ST_CBO_PROXY].split("||").each(function(v, k) {
		if (v == "") return;
		pxyList.options[pxyList.options.length] = new Option(v, k, false, false);
	});
	pxyList.set("value", utWebUI.settings["proxy.type"]);
	utWebUI.langLoaded = true;
	/* TODO: implement
	(function() {
		var days = lang[CONST.SETT_DAYNAMES].split("||");
		var tbody = new Element("tbody");
		var active = false;
		var mode = 0;
		for (var i = 0; i < 7; i++) {
			var tr = simpleClone(TR, false);
			for (var j = 0; j < 25; j++) {
				var td = simpleClone(TD, false);
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
	*/
}

var resizing = false, resizeTimeout = null;
function resizeUI(w, h) {

	resizing = true;
	$clear(resizeTimeout);
	
	var size = window.getSize();
	var ww = size.x, wh = size.y, winResize = false;
	var showcat = utWebUI.config.showCategories, showdet = utWebUI.config.showDetails, showtb = utWebUI.config.showToolbar, eh = 0;
	
	if (!isGuest && showtb)
		eh = $("toolbar").getSize().y;
	
	if (!w && !h) {
		w = Math.floor(ww * ((showcat) ? utWebUI.config.hSplit : 1.0));
		h = Math.floor(wh * ((!isGuest && showdet) ? utWebUI.config.vSplit : 1.0));
		winResize = true;
	}
	
	if (w)
		w -= showcat ? 10 : 2;
		
	if (h)
		h -= eh + ((showdet && showtb) ? 5 : showtb ? 8 : 2);
		
	if (showcat) {
		if (w)
			$("CatList").setStyle("width", ww - 10 - w - ((Browser.Engine.trident && !Browser.Engine.trident5) ? 4 : 0));
			
		if (h)
			$("CatList").setStyle("height", h);
	}
	
	if (!isGuest && showdet) {
		$("tdetails").setStyle("width", ww - (Browser.Engine.trident4 ? 14 : 12));
		if (h) {
			var th = wh - h, cth = th - (showtb ? 46 : 41) - eh;
			$("tdetails").setStyle("height", th - 10);
			$("tdcont").setStyle("height", cth);
			$("gcont").setStyle("height", cth - 8);
			$("lcont").setStyle("height", cth - 12);
			utWebUI.flsTable.resizeTo(ww - 22, cth - 2);
		}
	}

	utWebUI.trtTable.resizeTo(w, h);
	
	if (isGuest) return;
	var listPos = $("List").getPosition();

	$("HDivider").setStyle("left", listPos.x - ((Browser.Engine.trident && !Browser.Engine.trident5) ? 7 : 5));
	$("VDivider").setStyle("width", ww + (Browser.Engine.trident6 ? 4 : 0));
	
	
	if (h) {
		$("HDivider").setStyles({
			"height": showcat ? (h + 2) : 0,
			"top": showtb ? 43 : 0
		});

		$("VDivider").setStyle("top", showdet ? (listPos.y + h + (!Browser.Engine.trident6 ? 2 : 0)) : -10);
		if (showdet && !winResize)
			utWebUI.config.vSplit = h / (wh - eh - 12);
	}
	
	if (w && showcat && !winResize)
		utWebUI.config.hSplit = w / ww;
		
	resizing = false;
}

function linked(obj, defstate, list, ignoreLabels, reverse) {
	ignoreLabels = ignoreLabels || [];
	var disabled = true, tag = obj.get("tag");
	if (tag == "input") {
		if (obj.type == "checkbox")
			disabled = !obj.checked || obj.disabled;
			if (reverse)
				disabled = !disabled;
	} else if (tag == "select") {
		disabled = (obj.get("value") == defstate);
	} else {
		return;
	}
	var element;
	for (var i = 0, j = list.length; i < j; i++) {
		if (!(element = $(list[i]))) continue;
		if (element.type != "checkbox")
			element[(disabled ? "add" : "remove") + "Class"]("disabled");
		element.disabled = disabled;
		element.fireEvent(((tag == "input") && Browser.Engine.trident) ? "click" : "change");
		if (ignoreLabels.contains(list[i])) continue;
		var label = element.getPrevious();
		if (!label || (label.get("tag") != "label")) {
			label = element.getNext();
			if (!label || (label.get("tag") != "label")) continue;
		}
		label[(disabled ? "add" : "remove") + "Class"]("disabled");
	}
}

var winZ = 500;

window.addEvent("domready", function() {
	
	$(document.body);

	document.title = "\u00B5Torrent WebUI " + VERSION;
	
	if (isGuest) {
		utWebUI.init();
		return;
	}
	
	document.addEvent("keydown", function(ev) {
		/*
		if (ev.alt) {
			ev.stop();
			$clear(utWebUI.updateTimeout);
		}
		//*/
		switch (ev.key) {
		
		case "esc": // Esc
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
				$("dlgAdd").setStyle("zIndex", ++winZ).centre();
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
			$("dlgAbout").setStyle("zIndex", ++winZ).centre();
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
	
	if (Browser.Engine.presto) {
		document.addEvent("keypress", function(ev) {
			switch (ev.key) {
			
			case "esc": // Esc
				ev.stop();
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
				if (ev.control)
					ev.stop();
				break;
				
			case "p": // Ctrl + P
				if (ev.control)
					ev.stop();
				break;
				
			case "f2": // F2
				ev.stop();
				break;
				
			case "f4": // F4
				ev.stop();
				break;
				
			case "f6": // F6
				ev.stop();
				break;
				
			case "f7": // F7
				ev.stop();
				break;
			}
		});
	}
	
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
	
	document.addEvent("mousedown", function(ev) {
		if ((ev.rightClick && !ContextMenu.launched) || (!ev.rightClick && !ContextMenu.hidden && !ContextMenu.focused))
			ContextMenu.hide.delay(10, ContextMenu);
		ContextMenu.launched = false;
	});
	
	if (Browser.Engine.gecko) {
		document.addEvent("mousedown", function(ev) {
			if (ev.rightClick && !(/^input|textarea|a$/i).test(ev.target.tagName))
				ev.stop();
		}).addEvent("click", function(ev) {
			if (ev.rightClick && !(/^input|textarea|a$/i).test(ev.target.tagName))
				ev.stop();
		});
	}
	
	if (Browser.Engine.presto && !("oncontextmenu" in document.createElement("foo"))) {
		/*
		 * 	http://my.opera.com/community/forums/findpost.pl?id=2112305
		 * 	http://dev.fckeditor.net/changeset/683
		 */
		var overrideButton;
		document.addEvent("mousedown", function(ev) {
			if (!ev.rightClick) return;
			var element = ev.target;
			while (element) {
				if (!overrideButton) {
					var doc = ev.target.ownerDocument;
					overrideButton = doc.createElement("input");
					overrideButton.type = "button";
					(doc.body || doc.documentElement).appendChild(overrideButton);
					overrideButton.style.cssText = "z-index: 1000;position:absolute;top:" + (ev.client.y - 2) + "px;left:" + (ev.client.x - 2) + "px;width:5px;height:5px;opacity:0.01";
				}
				element = element.parentNode;
			}
		});
		document.addEvent("mouseup", function(ev) {
			if (overrideButton) {
				overrideButton.parentNode.removeChild(overrideButton);
				overrideButton = undefined;
				if (ev.rightClick && !(/^input|textarea|a$/i).test(ev.target.tagName)) {
					ev.stop();
					return false;
				}
			}
		});
	} else if (Browser.Engine.trident || Browser.Engine.webkit) {
		document.addEvent("contextmenu", function(ev) {
			if (!(/^input|textarea|a$/i).test(ev.target.tagName)) {
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
			$("ADD_FILE_OK").disabled = false;
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
		/*
		var ele = $("addlab");
		ele.options.length = 0;
		var count = 0;
		for (var key in utWebUI.customLabels)
			ele.options[count++] = new Option(key, key, false, count == 0);
		*/
		$("dlgAdd").setStyle("zIndex", ++winZ).centre();
	});
	/*
	$("DLG_PRE_ADD_03").addEvent("click", function() {
		utWebUI.showFolderBrowser();
	});
	*/
	["remove", "start", "pause", "stop"].each(function(act) {
		$(act).addEvent("click", function(ev) {
			ev.stop();
			if (act == "remove")
				utWebUI[act]((utWebUI.settings["gui.default_del_action"] <= 1) ? 0 : 1);
			else
				utWebUI[act]();
		});
	});
	$("setting").addEvent("click", function(ev) {
		ev.stop();
		utWebUI.showSettings();
	});
	var dragMask = $("dragmask");
	["dlgAdd", "dlgSettings", "dlgProps", "dlgAbout", "dlgLabel"].each(function(id) {
		$(id).addEvent("mousedown", function(ev) {
			var cls = ev.target.className;
			if(cls.contains("dlg-header", " ") || cls.contains("dlg-close", " ")) return;
			this.setStyle("zIndex", ++winZ);
		}).getElement("a").addEvent("click", function(ev) {
			ev.stop();
			$(id).hide();
		});
		var dragElement = null;
		new Drag(id, {
			"handle": id + "-header",
			"modifiers": {"x": "left", "y": "top"},
			"snap": 2,
			"onBeforeStart": function() {
				var size = this.element.getSize(), pos = this.element.getPosition();
				dragMask.setStyles({
					"width": size.x - 4,
					"height": size.y - 4,
					"left": pos.x,
					"top": pos.y,
					"zIndex": ++winZ
				});
				dragElement = this.element;
				this.element = dragMask;
			},
			"onStart": function() {
				this.element.show();
			},
			"onCancel": function() {
				this.element = dragElement;
				this.element.setStyle("zIndex", ++winZ);
				dragMask.setStyle("display", "none");
			},
			"onComplete": function() {
				this.element = dragElement;
				var pos = dragMask.getPosition();
				dragMask.setStyle("display", "none");
				this.element.setStyles({
					"left": pos.x,
					"top": pos.y,
					"zIndex": ++winZ
				});
			}
		});
	});
	
	var linkedEvent = Browser.Engine.trident ? "click" : "change";
	
	// onchange fires in IE on <select>s
	$("proxy.type").addEvent("change", function() {
		linked(this, 0, ["proxy.proxy", "proxy.port", "proxy.auth", "proxy.p2p"]);
		checkProxySettings();
	});
	$("proxy.auth").addEvent(linkedEvent, function() {
		linked(this, 0, ["proxy.username", "proxy.password"]);
		checkProxySettings();
	});
	$("cache.override").addEvent(linkedEvent, function() {
		linked(this, 0, ["cache.override_size"], ["cache.override_size"]);
	});
	$("cache.write").addEvent(linkedEvent, function() {
		linked(this, 0, ["cache.writeout", "cache.writeimm"]);
	});
	$("cache.read").addEvent(linkedEvent, function() {
		linked(this, 0, ["cache.read_turnoff", "cache.read_prune", "cache.read_trash"]);
	});
	$("prop-seed_override").addEvent(linkedEvent, function() {
		linked(this, 0, ["prop-seed_ratio", "prop-seed_time"]);
	});
	$("webui.enable_guest").addEvent(linkedEvent, function() {
		linked(this, 0, ["webui.guest"]);
	});
	$("webui.enable_listen").addEvent(linkedEvent, function() {
		linked(this, 0, ["webui.port"]);
	});
	$("seed_prio_limitul_flag").addEvent(linkedEvent, function() {
		linked(this, 0, ["seed_prio_limitul"]);
	});
	$("sched_enable").addEvent(linkedEvent, function() {
		linked(this, 0, ["sched_ul_rate", "sched_dl_rate", "sched_dis_dht"]);
		//$("sched_table").toggleClass("disabled");
	});
	$("dir_active_download_flag").addEvent(linkedEvent, function() {
		linked(this, 0, ["dir_active_download"]);
	});
	$("dir_completed_download_flag").addEvent(linkedEvent, function() {
		linked(this, 0, ["dir_add_label", "dir_completed_download", "move_if_defdir"]);
	});
	$("dir_torrent_files_flag").addEvent(linkedEvent, function() {
		linked(this, 0, ["dir_torrent_files"]);
	});
	$("dir_completed_torrents_flag").addEvent(linkedEvent, function() {
		linked(this, 0, ["dir_completed_torrents"]);
	});
	$("dir_autoload_flag").addEvent(linkedEvent, function() {
		linked(this, 0, ["dir_autoload_delete", "dir_autoload"]);
	});
	$("ul_auto_throttle").addEvent(linkedEvent, function() {
		linked(this, 0, ["max_ul_rate", "max_ul_rate_seed_flag"], ["max_ul_rate"], true);
	});
	$("max_ul_rate_seed_flag").addEvent(linkedEvent, function() {
		linked(this, 0, ["max_ul_rate_seed"]);
	});
	
	utWebUI.init();
});