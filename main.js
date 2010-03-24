/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var g_winTitle = "\u00B5Torrent WebUI v" + CONST.VERSION;

// Localized string globals ... initialized in loadLangStrings()

var g_perSec; // string representing "/s"
var g_dayCodes; // array of strings representing ["Mon", "Tue", ..., "Sun"]
var g_dayNames; // array of strings representing ["Monday", "Tuesday", ... , "Sunday"]
var g_schLgndEx; // object whose values are strings explanations of scheduler table colors


//================================================================================
// MAIN
//================================================================================

window.addEvent("domready", function() {
	$(document.body);

	setupGlobalEvents();
	setupUserInterface();

	utWebUI.init();
});


//================================================================================
// GLOBAL EVENT SETUP
//================================================================================

var __executed_setupGlobalEvents__;

function setupGlobalEvents() {

	if (__executed_setupGlobalEvents__) return;
	__executed_setupGlobalEvents__ = true;

	//--------------------------------------------------
	// WINDOW EVENTS
	//--------------------------------------------------

	window.addEvent("resize", function() { resizeUI(); });

	if (!isGuest) {
		window.addEvent("unload", function() {
			utWebUI.saveConfig(false);
		});
	}

	//--------------------------------------------------
	// MOUSE EVENTS
	//--------------------------------------------------

	var cancelRC = function(ev) {
		if (!(/^input|textarea|a$/i).test(ev.target.tagName)) {
			ev.stop();
			return false;
		}
	};
	var cancelRCWrap = function(ev) {
		if (ev.isRightClick())
			return cancelRC(ev);
	};

	ContextMenu.init("ContextMenu");

	document.addEvents({
		"mousedown": function(ev) {
			if ((ev.isRightClick() && !ContextMenu.launched) || (!ev.isRightClick() && !ContextMenu.hidden && !ContextMenu.focused))
				ContextMenu.hide();
			ContextMenu.launched = false;

			return cancelRCWrap(ev);
		},
		"contextmenu": cancelRC, // IE does not send right-click info for onContextMenu
		"mouseup": cancelRCWrap,
		"click": cancelRCWrap
	});

	if (Browser.Engine.presto && !("oncontextmenu" in document.createElement("foo"))) {

		// Prevent Opera context menu from showing
		// - http://my.opera.com/community/forums/findpost.pl?id=2112305
		// - http://dev.fckeditor.net/changeset/683

		var overrideButton;
		document.addEvents({
			"mousedown": function(ev) {
				if (!overrideButton && ev.isRightClick()) {
					var doc = ev.target.ownerDocument;
					overrideButton = doc.createElement("input");
					overrideButton.type = "button";
					overrideButton.style.cssText = "z-index:1000;position:fixed;top:" + (ev.client.y - 2) + "px;left:" + (ev.client.x - 2) + "px;width:5px;height:5px;opacity:0.01";
					(doc.body || doc.documentElement).appendChild(overrideButton);
				}
			},
			"mouseup": function(ev) {
				if (overrideButton) {
					overrideButton.destroy();
					overrideButton = undefined;
				}
			}
		});
	}

	//--------------------------------------------------
	// KEYBOARD EVENTS
	//--------------------------------------------------

	if (!isGuest) {
		var keyBindings = {
			"ctrl a": $empty,
			"ctrl e": $empty,

			"ctrl o": function() { DialogManager.show("Add"); },
			"ctrl p": function() { utWebUI.showSettings(); },
			"f2": function() { DialogManager.show("About"); },
			"f4": function() { utWebUI.toggleToolbar(); },
			"f6": function() { utWebUI.toggleDetPanel(); },
			"f7": function() { utWebUI.toggleCatPanel(); },

			"esc": function() {
				if (DialogManager.showing.length > 0) {
					DialogManager.hideTopMost(true);
				} else {
					utWebUI.restoreUI();
				}
			}
		};

		if (Browser.Platform.mac) {
			keyBindings["meta a"] = keyBindings["ctrl a"];
			keyBindings["meta e"] = keyBindings["ctrl e"];
			keyBindings["meta o"] = keyBindings["ctrl o"];
			keyBindings["meta p"] = keyBindings["ctrl p"];

			delete keyBindings["ctrl a"];
			delete keyBindings["ctrl e"];
			delete keyBindings["ctrl o"];
			delete keyBindings["ctrl p"];
		}

		document.addEvent("keydown", function(ev) {
			var key = eventToKey(ev);
			if (keyBindings[key]) {
				keyBindings[key]();
				ev.stop();
				return false;
			}
		});

		if (Browser.Engine.presto) {
			document.addEvent("keypress", function(ev) {
				var key = eventToKey(ev);
				if (keyBindings[key]) {
					ev.stop();
					return false;
				}
			});
		}
	}

}

var resizing = false;

function resizeUI(hDiv, vDiv) {

	if (resizing) return;
	resizing = true;

	var manualH = (typeof(hDiv) == "number"),
		manualV = (typeof(vDiv) == "number");

	var size = window.getSize(), ww = size.x, wh = size.y;

	var config = utWebUI.config || utWebUI.defConfig,
		uiLimits = utWebUI.limits,
		minHSplit = uiLimits.minHSplit,
		minVSplit = uiLimits.minVSplit,
		minTrtH = uiLimits.minTrtH,
		minTrtW = uiLimits.minTrtW;

	var badIE = (Browser.Engine.trident && Browser.Engine.version <= 4);
	var showCat = true, showDet = false, showTB = false, tallCat = false;
	if (!isGuest) {
		var confi
		showCat = config.showCategories;
		showDet = config.showDetails;
		showTB = config.showToolbar;
		tallCat = !!utWebUI.settings["gui.tall_category_list"];
	}

	var th = (showTB ? $("toolbar").getSize().y + 5 : 0);

	if (manualH) {
		hDiv -= 2;

		// Sanity check manual drag of divider
		if (hDiv < minHSplit) {
			hDiv = minHSplit;
		}
		else if (hDiv > ww - minTrtW) {
			hDiv = ww - minTrtW;
		}
	}
	else {
		hDiv = 0;
		if (showCat) {
			hDiv = config.hSplit;
			if ((typeof(hDiv) != "number") || (hDiv < minHSplit)) hDiv = uiLimits.defHSplit;
		}
	}

	if (manualV) {
		vDiv -= 2;

		// Sanity check manual drag of divider
		if (vDiv > wh - minVSplit) {
			vDiv = wh - minVSplit;
		}
		else if (vDiv < th + minTrtH) {
			vDiv = th + minTrtH;
		}
	}
	else {
		vDiv = 0;
		if (showDet) {
			vDiv = config.vSplit;
			if ((typeof(vDiv) != "number") || (vDiv < minVSplit)) vDiv = uiLimits.defVSplit;
		}
		vDiv = wh - vDiv;
	}

	// Resize torrent list
	var trtw = ww - (hDiv + 2 + (showCat ? 7 : 0)) - (badIE ? 2 : 0),
		trth = vDiv - (th + (showDet ? 0 : 2)) - (badIE ? 1 : 0);

	if (showCat) {
		$("CatList").show();

		if (trtw < minTrtW) {
			// Gracefully degrade if torrent list too small
			hDiv -= minTrtW - trtw;
			if (hDiv < minHSplit) {
				$("CatList").hide();
				showCat = false;
				trtw = ww - 2;
			}
			else {
				trtw = minTrtW;
			}
		}
	}

	if (showDet) {
		$("tdetails").show();

		if (trth < minTrtH) {
			// Gracefully degrade if torrent list too small
			vDiv += minTrtH - trth;
			if (vDiv > wh - minVSplit) {
				$("tdetails").hide();
				showDet = false;
				trth = wh - th - 2;
			}
			else {
				trth = minTrtH;
			}
		}
	}

	utWebUI.trtTable.resizeTo(trtw, trth);

	// Resize category/label list
	if (showCat) {
		if (hDiv) $("CatList").setStyle("width", hDiv - (badIE ? 2 : 0));

		if (tallCat) {
			$("CatList").setStyle("height", wh - th - 2);
		}
		else if (trth) {
			$("CatList").setStyle("height", trth);
		}
	}

	// Resize detailed info pane
	if (showDet) {
		var dw = ww - (3 + (showCat && tallCat ? hDiv + 7 : 0)) - (badIE ? 2 : 0);
		$("tdetails").setStyle("width", dw);
		if (vDiv) {
			var dh = wh - vDiv - $("tabs").getSize().y - 16;
			$("tdcont").setStyles({"width": dw - 5, "height": dh});
			$("gcont").setStyles({"width": dw - 10, "height": dh - 5});
			SpeedGraph.resize(dw - 5, dh - 12);
			$("lcont").setStyles({"width": dw - 14, "height": dh - 9});
			utWebUI.flsTable.resizeTo(dw - 7, dh - 2);
		}
	}

	// Reposition dividers
	if ($("HDivider")) {
		$("HDivider").setStyles({
			"height": tallCat ? wh - th : trth + 2,
			"left": showCat ? hDiv + 2 : -10,
			"top": th
		});
	}

	if ($("VDivider")) {
		$("VDivider").setStyles({
			"width": ww,
			"left": tallCat ? hDiv + 7 : 0,
			"top":  showDet ? vDiv + 2 : -10
		});
	}

	// Store new divider position(s)
	if (hDiv && showCat && manualH) config.hSplit = hDiv;
	if (vDiv && showDet && manualV) config.vSplit = (wh - vDiv);

	resizing = false;

}


//================================================================================
// USER INTERFACE SETUP
//================================================================================

var __executed_setupUserInterface__;

function setupUserInterface() {

	if (__executed_setupUserInterface__) return;
	__executed_setupUserInterface__ = true;

	document.title = g_winTitle;

	//--------------------------------------------------
	// CATEGORY LIST
	//--------------------------------------------------

	["_all_", "_dls_", "_com_", "_act_", "_iac_", "_nlb_"].each(function(k) {
		$(k).addEvent("click", function() {
			utWebUI.switchLabel(this);
		});
	});

	//--------------------------------------------------
	// TORRENT JOBS LIST
	//--------------------------------------------------

	var useProgress = (isGuest || utWebUI.settings["gui.graphic_progress"]);
	utWebUI.trtTable.create("List", utWebUI.trtColDefs, $extend({
		"format": utWebUI.trtFormatRow.bind(utWebUI),
		"sortCustom": utWebUI.trtSortCustom.bind(utWebUI),
		"onDelete": utWebUI.remove.bind(utWebUI),
		"onColReset": utWebUI.trtColReset.bind(utWebUI),
		"onColResize": utWebUI.trtColResize.bind(utWebUI),
		"onColMove": utWebUI.trtColMove.bind(utWebUI),
		"onColToggle": utWebUI.trtColToggle.bind(utWebUI),
		"onSort": utWebUI.trtSort.bind(utWebUI),
		"onSelect": utWebUI.trtSelect.bind(utWebUI),
		"onDblClick": utWebUI.trtDblClk.bind(utWebUI)
	}, utWebUI.defConfig.torrentTable));

	if (isGuest) {
		resizeUI();
		return;
	}

	//--------------------------------------------------
	// DIVIDERS
	//--------------------------------------------------

	new Drag("HDivider", {
		"modifiers": {"x": "left", "y": ""},
		"onComplete": function() {
			resizeUI(this.value.now.x, null);
			if (Browser.Engine.presto)
				utWebUI.saveConfig(true);
		}
	});

	new Drag("VDivider", {
		"modifiers": {"x": "", "y": "top"},
		"onComplete": function() {
			resizeUI(null, this.value.now.y);
			if (Browser.Engine.presto)
				utWebUI.saveConfig(true);
		}
	});

	//--------------------------------------------------
	// TOOLBAR
	//--------------------------------------------------

	// -- Buttons

	["remove", "start", "pause", "stop", "queueup", "queuedown"].each(function(act) {
		$(act).addEvent("click", function(ev) {
			var arg;
			switch (act) {
				case "queueup":
				case "queuedown":
					arg = ev.shift;
					break;
			}
			utWebUI[act](arg);
			ev.stop();
			return false;
		});
	});

	$("add").addEvent("click", function(ev) {
		ev.stop();
		/*
		var ele = $("addlab");
		ele.options.length = 0;
		var count = 0;
		for (var key in utWebUI.customLabels)
			ele.options[count++] = new Option(key, key, false, count == 0);
		*/
		DialogManager.show("Add");
	});

	$("setting").addEvent("click", function(ev) {
		utWebUI.showSettings();
		ev.stop();
		return false;
	});

	// -- Search Field

	$("query").addEvent("keydown", function(ev) {
		if (ev.key == "enter") {
			utWebUI.searchExecute();
		}
	});

	$("search").addEvents({
		"click": function(ev) {
			utWebUI.searchExecute();
			ev.stop();
			return false;
		},
		"contextmenu": function(ev) {
			ev.stop();
			return false;
		}
	});

	$("searchsel").addEvents({
		"click": function(ev) {
			utWebUI.searchMenuShow(this);
			ev.stop();
			return false;
		},
		"contextmenu": function(ev) {
			ev.stop();
			return false;
		}
	});

	//--------------------------------------------------
	// DETAILED INFO PANE
	//--------------------------------------------------

	// -- Tabs

	utWebUI.tabs = new Tabs("tabs", {
		"tabs": {
			  "gcont"    : ""
			, "FileList" : ""
			, "spgraph"  : ""
			, "lcont"    : ""
		},
		"onChange": utWebUI.tabChange.bind(utWebUI)
	}).draw().show("gcont");

	// -- Files Tab

	utWebUI.flsTable.create("FileList", utWebUI.flsColDefs, $extend({
		"format": utWebUI.flsFormatRow.bind(utWebUI),
		"onColReset": utWebUI.flsColReset.bind(utWebUI),
		"onColResize": utWebUI.flsColResize.bind(utWebUI),
		"onColMove": utWebUI.flsColMove.bind(utWebUI),
		"onColToggle": utWebUI.flsColToggle.bind(utWebUI),
		"onSort": utWebUI.flsSort.bind(utWebUI),
		"onSelect": utWebUI.flsSelect.bind(utWebUI),
		"onRefresh": function() { if (this.torrentID != "") utWebUI.getFiles(utWebUI.torrentID, true); },
		"onDblClick": utWebUI.flsDblClk.bind(utWebUI),
		"refreshable": true
	}, utWebUI.defConfig.fileTable));

	// -- Speed Tab

	SpeedGraph.init("spgraph");

	//--------------------------------------------------
	// DIALOG MANAGER
	//--------------------------------------------------

	DialogManager.dragMask = $("dragmask");

	["About", "Add", "Label", "Props", "Settings"].each(function(k) {
		var isModal = (["Label", "Props"].indexOf(k) >= 0);
		DialogManager.add(k, isModal);
	});

	//--------------------------------------------------
	// ADD DIALOG
	//--------------------------------------------------

	// -- OK Button (File)

	$("ADD_FILE_OK").addEvent("click", function() {
		$("upfrm").set("action", urlBase + "?token=" + utWebUI.TOKEN + "&action=add-file");
	});

	// -- Cancel Button (File)

	$("ADD_FILE_CANCEL").addEvent("click", function(ev) {
		DialogManager.hide("Add");
	});

	// -- OK Button (URL)

	$("ADD_URL_OK").addEvent("click", function() {
		DialogManager.hide("Add");
		utWebUI.addURL();
	});

	// -- Cancel Button (URL)

	$("ADD_URL_CANCEL").addEvent("click", function(ev) {
		DialogManager.hide("Add");
	});

	// -- Upload Frame

	new IFrame({
		"id": "uploadfrm",
		"src": "about:blank",
		"styles": {
			  display: "none"
			, height: 0
			, width: 0
		},
		"onload": function(doc) {
			$("torrent_file").set("value", "");
			$("ADD_FILE_OK").disabled = false;

			var str = $(doc.body).get("text");
			if (str) {
				var data = JSON.decode(str);
				if (has(data, "error")) {
					alert(data.error);
					log("[Add Torrent File Error] " + data.error);
				}
			}
		}
	}).inject(document.body);

	$("upfrm").addEvent("submit", function() {
		var filename = $("torrent_file").get("value");
		if (!filename.test(/\.torrent$/)) {
			alert("The file has to be a torrent file.");
			return false;
		}
		$("ADD_FILE_OK").disabled = true;
		return true;
	});

	//--------------------------------------------------
	// LABEL DIALOG
	//--------------------------------------------------

	// -- OK Button

	$("LBL_OK").addEvent("click", function() {
		DialogManager.hide("Label");
		utWebUI.createLabel();
	});

	// -- Cancel Button

	$("LBL_CANCEL").addEvent("click", function(ev) {
		DialogManager.hide("Label");
	});

	//--------------------------------------------------
	// PROPERTIES DIALOG
	//--------------------------------------------------

	// -- OK Button

	$("DLG_TORRENTPROP_01").addEvent("click", function() {
		DialogManager.hide("Props");
		utWebUI.setProperties();
	});

	// -- Cancel Button

	$("DLG_TORRENTPROP_02").addEvent("click", function(ev) {
		$("dlgProps").getElement("a").fireEvent("click", ev);
			// Fire the "Close" button's click handler to make sure
			// controls are restored if necessary
	});

	// -- Close Button

	$("dlgProps").getElement("a").addEvent("click", function(ev) {
		if (utWebUI.propID == "multi") {
			[11, 17, 18, 19].each(function(v) {
				$("DLG_TORRENTPROP_1_GEN_" + v).removeEvents("click");
			});
		}
		this.propID = "";
	});

	//--------------------------------------------------
	// SETTINGS DIALOG
	//--------------------------------------------------

	// -- OK Button

	$("DLG_SETTINGS_03").addEvent("click", function() {
		DialogManager.hide("Settings");
		utWebUI.setSettings();
	});

	// -- Cancel Button

	$("DLG_SETTINGS_04").addEvent("click", function(ev) {
		$("dlgSettings").getElement("a").fireEvent("click", ev);
			// Fire the "Close" button's click handler to make sure
			// controls are restored if necessary
	});

	// -- Apply Button

	$("DLG_SETTINGS_05").addEvent("click", function(ev) {
		utWebUI.setSettings();
	});

	// -- Close Button

	$("dlgSettings").getElement("a").addEvent("click", function(ev) {
		utWebUI.loadSettings();
	});

	// -- Pane Selector

	utWebUI.stpanes = new Tabs("stgmenu", {
		"tabs": {
			  "st_webui" : ""
			, "st_gl"    : ""
			, "st_dirs"  : ""
			, "st_con"   : ""
			, "st_bw"    : ""
			, "st_bt"    : ""
			, "st_tc"    : ""
			, "st_que"   : ""
			, "st_sch"   : ""
			, "st_ao"    : ""
			, "st_dc"    : ""
		}
	}).draw().show("st_webui");

	// -- Web UI

	var langArr = [];
	$each(LANGUAGES, function(lang, code) {
		langArr.push({lang: lang, code: code});
	});
	langArr.sort(function(x, y) {
		return (x.lang < y.lang ? -1 : (x.lang > y.lang ? 1 : 0));
	});

	var langSelect = $("webui.lang");
	langSelect.options.length = langArr.length;
	$each(langArr, function(v, k) {
		langSelect.options[k] = new Option(v.lang, v.code, false, false);
	});
	langSelect.set("value", utWebUI.defConfig.lang);

	// -- Connection

	$("DLG_SETTINGS_4_CONN_04").addEvent("click", function() {
		var v = utWebUI.settings["bind_port"], rnd = 0;
		do {
			rnd = parseInt(Math.random() * 50000) + 15000;
		} while (v == rnd);
		$("bind_port").set("value", rnd);
	});

	// -- Scheduler

	$("sched_table").addEvent("change", function() {
		var sv = (utWebUI.settings["sched_table"] || "").pad(7*24, "0").substring(0, 7*24);
		var tbody = new Element("tbody");
		var active = false;
		var mode = 0;

		for (var i = 0; i < 7; i++) {
			var tr = simpleClone(TR, false);
			for (var j = 0; j < 25; j++) {
				var td = simpleClone(TD, false);
				if (j == 0) {
					if ($chk(g_dayCodes))
						td.set("text", g_dayCodes[i]).addClass("daycode");
				} else {
					(function() {
						// Closure used here to ensure that each cell gets its own copy of idx...
						// Otherwise, weird JavaScript scoping rules apply, and all cells will
						// receive references to a shared idx (a variable's scope is function-wide
						// in JavaScript, not block-wide as in most other C-styled languages)
						var idx = i*24+j-1;
						td.set("class", "block mode" + sv.substr(idx, 1)).addEvents({
							"mousedown": function() {
								if (!active && $("sched_enable").checked) {
									for (var k = 0; k <= 3; k++) {
										if (this.hasClass("mode" + k)) {
											mode = (k + 1) % 4;
											this.set("class", "block mode" + mode);
											sv = sv.substring(0, idx) + mode + sv.substring(idx+1);
											break;
										}
									}
									active = true;
								}

								return false;
							},

							"mouseup": function() {
								if ($("sched_enable").checked) {
									$("sched_table").set("value", sv);
								}
								active = false;
							},

							"mouseenter": function() {
								var day = Math.floor(idx / 24), hour = (idx % 24);
								$("sched_table_info").set("text", g_dayNames[day] + ", " + hour + ":00 - " + hour + ":59");

								if ($("sched_enable").checked && active && !this.hasClass("mode" + mode)) {
									this.set("class", "block mode" + mode);
									sv = sv.substring(0, idx) + mode + sv.substring(idx+1);
								}
							},

							"mouseleave": function() {
								$("sched_table_info").empty();
							}
						});
						if (Browser.Engine.trident) {
							// Prevent text selection in IE
							td.addEvent("selectstart", $lambda(false));
						}
					})();
				}
				tr.grab(td);
			}
			tbody.grab(tr);
		}
		$("sched_table").empty().grab(tbody);
	}).fireEvent("change");

	$$("#sched_table_lgnd ul li").addEvents({
		"mouseenter": function() {
			$("sched_table_info").set("text", g_schLgndEx[this.get("id").match(/.*_([^_]+)$/)[1]]);
		},
		"mouseleave": function() {
			$("sched_table_info").empty();
		}
	});

	// -- Linked Controls

	var linkedEvent = Browser.Engine.trident ? "click" : "change";

	$("proxy.type").addEvent("change", function() { // onchange fires in IE on <select>s
		_link(this, 0, ["proxy.proxy", "proxy.port", "proxy.auth", "proxy.resolve", "proxy.p2p"]);
	});

	$("proxy.auth").addEvent(linkedEvent, function() {
		_link(this, 0, ["proxy.username"]);
		_link(this, 0, ["proxy.password"], null, (this.checked && ($("proxy.type").get("value").toInt() == 1)));
	});

	$("cache.override").addEvent(linkedEvent, function() {
		_link(this, 0, ["cache.override_size"], ["cache.override_size"]);
	});

	$("cache.write").addEvent(linkedEvent, function() {
		_link(this, 0, ["cache.writeout", "cache.writeimm"]);
	});

	$("cache.read").addEvent(linkedEvent, function() {
		_link(this, 0, ["cache.read_turnoff", "cache.read_prune", "cache.read_thrash"]);
	});

	$("prop-seed_override").addEvent(linkedEvent, function() {
		_link(this, 0, ["prop-seed_ratio", "prop-seed_time"]);
	});

	$("webui.enable_guest").addEvent(linkedEvent, function() {
		_link(this, 0, ["webui.guest"]);
	});

	$("webui.enable_listen").addEvent(linkedEvent, function() {
		_link(this, 0, ["webui.port"]);
	});

	$("multi_day_transfer_limit_en").addEvent(linkedEvent, function() {
		_link(this, 0, ["multi_day_transfer_mode", "multi_day_transfer_limit_value", "multi_day_transfer_limit_unit", "multi_day_transfer_limit_span", "DLG_SETTINGS_7_TRANSFERCAP_06"]);
	});

	$("seed_prio_limitul_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["seed_prio_limitul"]);
	});

	$("sched_enable").addEvent(linkedEvent, function() {
		_link(this, 0, ["sched_ul_rate", "sched_dl_rate", "sched_dis_dht"]);

		// Manually disable, because we don't want to fire sched_table's "change" event, which _link() does
		["sched_table", "sched_table_lgnd", "sched_table_info"].each(
			this.checked ? function(k) { $(k).removeClass("disabled"); }
						 : function(k) { $(k).addClass("disabled"); }
		);
	});

	$("dir_active_download_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["always_show_add_dialog", "dir_active_download"]);
	});

	$("dir_completed_download_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["dir_add_label", "dir_completed_download", "move_if_defdir"]);
	});

	$("dir_torrent_files_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["dir_torrent_files"]);
	});

	$("dir_completed_torrents_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["dir_completed_torrents"]);
	});

	$("dir_autoload_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["dir_autoload_delete", "dir_autoload"]);
	});

	$("ul_auto_throttle").addEvent(linkedEvent, function() {
		_link(this, 0, ["max_ul_rate", "max_ul_rate_seed_flag"], ["max_ul_rate"], true);
	});

	$("max_ul_rate_seed_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["max_ul_rate_seed"]);
	});

	resizeUI();

}

function _link(obj, defstate, list, ignoreLabels, reverse) {
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


//================================================================================
// LANGUAGE STRING LOADING
//================================================================================

function loadLangStrings(reload) {
	if (reload) {
		Asset.javascript("lang/" + reload.lang + ".js", {
			"onload": function() {
				loadLangStrings();
				if (reload.onload) reload.onload();
			}
		});
		return;
	}

	g_perSec = "/" + lang[CONST.TIME_SECS].replace(/%d/, "").trim();
	g_dayCodes = lang[CONST.ST_SCH_DAYCODES].split("||");
	g_dayNames = lang[CONST.ST_SCH_DAYNAMES].split("||");
	g_schLgndEx = {
		  "full"    : lang[CONST.ST_SCH_LGND_FULLEX]
		, "limited" : lang[CONST.ST_SCH_LGND_LIMITEDEX]
		, "off"     : lang[CONST.ST_SCH_LGND_OFFEX]
		, "seeding" : lang[CONST.ST_SCH_LGND_SEEDINGEX]
	};

	//--------------------------------------------------
	// CATEGORY LIST
	//--------------------------------------------------

	_loadStrings("text", [
		  "OV_CAT_ALL"
		, "OV_CAT_DL"
		, "OV_CAT_COMPL"
		, "OV_CAT_ACTIVE"
		, "OV_CAT_INACTIVE"
		, "OV_CAT_NOLABEL"
	]);

	//--------------------------------------------------
	// TORRENT JOBS LIST
	//--------------------------------------------------

	utWebUI.trtTable.refreshRows();
	utWebUI.trtTable.setConfig({
		"resetText": lang[CONST.MENU_RESET],
		"colText": {
			  "name": lang[CONST.OV_COL_NAME]
			, "status": lang[CONST.OV_COL_STATUS]
			, "size": lang[CONST.OV_COL_SIZE]
			, "done": lang[CONST.OV_COL_DONE]
			, "downloaded": lang[CONST.OV_COL_DOWNLOADED]
			, "uploaded": lang[CONST.OV_COL_UPPED]
			, "ratio": lang[CONST.OV_COL_SHARED]
			, "downspeed": lang[CONST.OV_COL_DOWNSPD]
			, "upspeed": lang[CONST.OV_COL_UPSPD]
			, "eta": lang[CONST.OV_COL_ETA]
			, "label": lang[CONST.OV_COL_LABEL]
			, "peers": lang[CONST.OV_COL_PEERS]
			, "seeds": lang[CONST.OV_COL_SEEDS]
			, "seeds_peers": lang[CONST.OV_COL_SEEDS_PEERS]
			, "availability": lang[CONST.OV_COL_AVAIL].split("||")[1]
			, "order": lang[CONST.OV_COL_ORDER]
			, "remaining": lang[CONST.OV_COL_REMAINING]
		}
	});

	if (isGuest) return;

	//--------------------------------------------------
	// TOOLBAR
	//--------------------------------------------------

	_loadStrings("title", {
		  "add"       : "OV_TB_ADDTORR"
		, "remove"    : "OV_TB_REMOVE"
		, "start"     : "OV_TB_START"
		, "pause"     : "OV_TB_PAUSE"
		, "stop"      : "OV_TB_STOP"
		, "queueup"   : "OV_TB_QUEUEUP"
		, "queuedown" : "OV_TB_QUEUEDOWN"
		, "setting"   : "OV_TB_PREF"
	});

	//--------------------------------------------------
	// DETAILED INFO PANE
	//--------------------------------------------------

	// -- Tab Titles

	var tstr = lang[CONST.OV_TABS].split("||");
	utWebUI.tabs.setNames({
		  "gcont"    : tstr[0]
		, "FileList" : tstr[4]
		, "spgraph"  : tstr[5]
		, "lcont"    : tstr[6]
	});

	// -- General Tab

	_loadStrings("text", [
		  "GN_TRANSFER"
		, "GN_TP_01"
		, "GN_TP_02"
		, "GN_TP_03"
		, "GN_TP_04"
		, "GN_TP_05"
		, "GN_TP_06"
		, "GN_TP_07"
		, "GN_TP_08"
		, "GN_TP_09"
	]);

	// -- Files Tab

	utWebUI.flsTable.refreshRows();
	utWebUI.flsTable.setConfig({
		"resetText": lang[CONST.MENU_RESET],
		"colText": {
			  "name": lang[CONST.FI_COL_NAME]
			, "size": lang[CONST.FI_COL_SIZE]
			, "done": lang[CONST.FI_COL_DONE]
			, "pcnt": lang[CONST.FI_COL_PCNT]
			, "prio": lang[CONST.FI_COL_PRIO]
		}
	});

	// -- Speed Tab

	SpeedGraph.setLabels(
		  lang[CONST.OV_COL_UPSPD]
		, lang[CONST.OV_COL_DOWNSPD]
	);
	SpeedGraph.draw();

	//--------------------------------------------------
	// ALL DIALOGS
	//--------------------------------------------------

	// -- Titles

	_loadStrings("text", {
		  "dlgAdd-header"      : "OV_TB_ADDTORR"
		, "dlgLabel-header"    : "OV_NEWLABEL_CAPTION"
		, "dlgProps-header"    : "DLG_TORRENTPROP_00"
		, "dlgSettings-header" : "DLG_SETTINGS_00"
	});

	// -- [ OK | Cancel | Apply ] Buttons

	_loadStrings("value", {
		// Add
		  "ADD_FILE_OK"     : "DLG_BTN_OK"
		, "ADD_FILE_CANCEL" : "DLG_BTN_CANCEL"
		, "ADD_URL_OK"      : "DLG_BTN_OK"
		, "ADD_URL_CANCEL"  : "DLG_BTN_CANCEL"

		// Label
		, "LBL_OK"     : "DLG_BTN_OK"
		, "LBL_CANCEL" : "DLG_BTN_CANCEL"

		// Properties
		, "DLG_TORRENTPROP_01" : "DLG_BTN_OK"
		, "DLG_TORRENTPROP_02" : "DLG_BTN_CANCEL"

		// Settings
		, "DLG_SETTINGS_03" : "DLG_BTN_OK"
		, "DLG_SETTINGS_04" : "DLG_BTN_CANCEL"
		, "DLG_SETTINGS_05" : "DLG_BTN_APPLY"
	});

	//--------------------------------------------------
	// LABEL DIALOG
	//--------------------------------------------------

	_loadStrings("text", "OV_NEWLABEL_TEXT");

	//--------------------------------------------------
	// PROPERTIES DIALOG
	//--------------------------------------------------

	_loadStrings("text", [
		  "DLG_TORRENTPROP_1_GEN_01"
		, "DLG_TORRENTPROP_1_GEN_03"
		, "DLG_TORRENTPROP_1_GEN_04"
		, "DLG_TORRENTPROP_1_GEN_06"
		, "DLG_TORRENTPROP_1_GEN_08"
		, "DLG_TORRENTPROP_1_GEN_10"
		, "DLG_TORRENTPROP_1_GEN_11"
		, "DLG_TORRENTPROP_1_GEN_12"
		, "DLG_TORRENTPROP_1_GEN_14"
		, "DLG_TORRENTPROP_1_GEN_16"
		, "DLG_TORRENTPROP_1_GEN_17"
		, "DLG_TORRENTPROP_1_GEN_18"
		, "DLG_TORRENTPROP_1_GEN_19"
	]);

	//--------------------------------------------------
	// SETTINGS DIALOG
	//--------------------------------------------------

	utWebUI.stpanes.setNames({
		"st_webui" : lang[CONST.ST_CAPT_WEBUI],
		"st_gl"    : lang[CONST.ST_CAPT_GENERAL],
		"st_dirs"  : lang[CONST.ST_CAPT_FOLDER],
		"st_con"   : lang[CONST.ST_CAPT_CONNECTION],
		"st_bw"    : lang[CONST.ST_CAPT_BANDWIDTH],
		"st_bt"    : lang[CONST.ST_CAPT_BITTORRENT],
		"st_tc"    : lang[CONST.ST_CAPT_TRANSFER_CAP],
		"st_que"   : lang[CONST.ST_CAPT_SEEDING],
		"st_sch"   : lang[CONST.ST_CAPT_SCHEDULER],
		"st_ao"    : lang[CONST.ST_CAPT_ADVANCED],
		"st_dc"    : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + lang[CONST.ST_CAPT_DISK_CACHE] // TODO: Use CSS to indent instead of modifying the string directly...
	});

	_loadStrings("text", [
		// Web UI / User Interface
		  "DLG_SETTINGS_2_UI_02"
		, "DLG_SETTINGS_2_UI_05"
		, "DLG_SETTINGS_2_UI_06"
		, "DLG_SETTINGS_2_UI_15"
		, "DLG_SETTINGS_2_UI_16"
		, "DLG_SETTINGS_9_WEBUI_01"
		, "DLG_SETTINGS_9_WEBUI_02"
		, "DLG_SETTINGS_9_WEBUI_03"
		, "DLG_SETTINGS_9_WEBUI_05"
		, "DLG_SETTINGS_9_WEBUI_07"
		, "DLG_SETTINGS_9_WEBUI_09"
		, "DLG_SETTINGS_9_WEBUI_10"
		, "DLG_SETTINGS_9_WEBUI_12"

		// General
		, "DLG_SETTINGS_1_GENERAL_02"
		, "DLG_SETTINGS_1_GENERAL_10"
		, "DLG_SETTINGS_1_GENERAL_11"
		, "DLG_SETTINGS_1_GENERAL_12"
		, "DLG_SETTINGS_1_GENERAL_13"
		, "DLG_SETTINGS_1_GENERAL_17"
		, "DLG_SETTINGS_1_GENERAL_18"
		, "DLG_SETTINGS_1_GENERAL_19"
		, "DLG_SETTINGS_1_GENERAL_20"
		, "DLG_SETTINGS_B_ADV_UI_07"
		, "DLG_SETTINGS_B_ADV_UI_08"

		// Directories
		, "DLG_SETTINGS_3_PATHS_01"
		, "DLG_SETTINGS_3_PATHS_02"
		, "DLG_SETTINGS_3_PATHS_03"
		, "DLG_SETTINGS_3_PATHS_06"
		, "DLG_SETTINGS_3_PATHS_07"
		, "DLG_SETTINGS_3_PATHS_10"
		, "DLG_SETTINGS_3_PATHS_11"
		, "DLG_SETTINGS_3_PATHS_12"
		, "DLG_SETTINGS_3_PATHS_15"
		, "DLG_SETTINGS_3_PATHS_18"
		, "DLG_SETTINGS_3_PATHS_19"

		// Connection
		, "DLG_SETTINGS_4_CONN_01"
		, "DLG_SETTINGS_4_CONN_02"
		, "DLG_SETTINGS_4_CONN_05"
		, "DLG_SETTINGS_4_CONN_06"
		, "DLG_SETTINGS_4_CONN_07"
		, "DLG_SETTINGS_4_CONN_08"
		, "DLG_SETTINGS_4_CONN_09"
		, "DLG_SETTINGS_4_CONN_11"
		, "DLG_SETTINGS_4_CONN_13"
		, "DLG_SETTINGS_4_CONN_15"
		, "DLG_SETTINGS_4_CONN_16"
		, "DLG_SETTINGS_4_CONN_18"
		, "DLG_SETTINGS_4_CONN_19"
		, "DLG_SETTINGS_4_CONN_20"
		, "DLG_SETTINGS_4_CONN_21"

		// Bandwidth
		, "DLG_SETTINGS_5_BANDWIDTH_01"
		, "DLG_SETTINGS_5_BANDWIDTH_02"
		, "DLG_SETTINGS_5_BANDWIDTH_03"
		, "DLG_SETTINGS_5_BANDWIDTH_05"
		, "DLG_SETTINGS_5_BANDWIDTH_07"
		, "DLG_SETTINGS_5_BANDWIDTH_08"
		, "DLG_SETTINGS_5_BANDWIDTH_10"
		, "DLG_SETTINGS_5_BANDWIDTH_11"
		, "DLG_SETTINGS_5_BANDWIDTH_14"
		, "DLG_SETTINGS_5_BANDWIDTH_15"
		, "DLG_SETTINGS_5_BANDWIDTH_17"

		// BitTorrent
		, "DLG_SETTINGS_6_BITTORRENT_01"
		, "DLG_SETTINGS_6_BITTORRENT_02"
		, "DLG_SETTINGS_6_BITTORRENT_03"
		, "DLG_SETTINGS_6_BITTORRENT_04"
		, "DLG_SETTINGS_6_BITTORRENT_05"
		, "DLG_SETTINGS_6_BITTORRENT_06"
		, "DLG_SETTINGS_6_BITTORRENT_07"
		, "DLG_SETTINGS_6_BITTORRENT_08"
		, "DLG_SETTINGS_6_BITTORRENT_10"
		, "DLG_SETTINGS_6_BITTORRENT_11"
		, "DLG_SETTINGS_6_BITTORRENT_13"

		// Transfer Cap
		, "DLG_SETTINGS_7_TRANSFERCAP_01"
		, "DLG_SETTINGS_7_TRANSFERCAP_02"
		, "DLG_SETTINGS_7_TRANSFERCAP_03"
		, "DLG_SETTINGS_7_TRANSFERCAP_04"
		, "DLG_SETTINGS_7_TRANSFERCAP_05"
		, "DLG_SETTINGS_7_TRANSFERCAP_06"

		// Queueing
		, "DLG_SETTINGS_8_QUEUEING_01"
		, "DLG_SETTINGS_8_QUEUEING_02"
		, "DLG_SETTINGS_8_QUEUEING_04"
		, "DLG_SETTINGS_8_QUEUEING_06"
		, "DLG_SETTINGS_8_QUEUEING_07"
		, "DLG_SETTINGS_8_QUEUEING_09"
		, "DLG_SETTINGS_8_QUEUEING_11"
		, "DLG_SETTINGS_8_QUEUEING_12"
		, "DLG_SETTINGS_8_QUEUEING_13"

		// Scheduler
		, "DLG_SETTINGS_9_SCHEDULER_01"
		, "DLG_SETTINGS_9_SCHEDULER_02"
		, "DLG_SETTINGS_9_SCHEDULER_04"
		, "DLG_SETTINGS_9_SCHEDULER_05"
		, "DLG_SETTINGS_9_SCHEDULER_07"
		, "DLG_SETTINGS_9_SCHEDULER_09"

		// Advanced
		, "DLG_SETTINGS_A_ADVANCED_01"

		// Disk Cache
		, "DLG_SETTINGS_C_ADV_CACHE_01"
		, "DLG_SETTINGS_C_ADV_CACHE_02"
		, "DLG_SETTINGS_C_ADV_CACHE_03"
		, "DLG_SETTINGS_C_ADV_CACHE_05"
		, "DLG_SETTINGS_C_ADV_CACHE_06"
		, "DLG_SETTINGS_C_ADV_CACHE_07"
		, "DLG_SETTINGS_C_ADV_CACHE_08"
		, "DLG_SETTINGS_C_ADV_CACHE_09"
		, "DLG_SETTINGS_C_ADV_CACHE_10"
		, "DLG_SETTINGS_C_ADV_CACHE_11"
		, "DLG_SETTINGS_C_ADV_CACHE_12"
		, "DLG_SETTINGS_C_ADV_CACHE_13"
		, "DLG_SETTINGS_C_ADV_CACHE_14"
		, "DLG_SETTINGS_C_ADV_CACHE_15"
		, "MENU_SHOW_CATEGORY"
		, "MENU_SHOW_DETAIL"
		, "ST_COL_NAME"
		, "ST_COL_VALUE"
		, "ST_SCH_LGND_FULL"
		, "ST_SCH_LGND_LIMITED"
		, "ST_SCH_LGND_OFF"
		, "ST_SCH_LGND_SEEDING"
	]);

	_loadStrings("value", "DLG_SETTINGS_4_CONN_04");
	_loadComboboxStrings("encryption_mode", lang[CONST.ST_CBO_ENCRYPTIONS].split("||"), utWebUI.settings["encryption_mode"]);
	_loadComboboxStrings("proxy.type", lang[CONST.ST_CBO_PROXY].split("||"), utWebUI.settings["proxy.type"]);
	_loadComboboxStrings("multi_day_transfer_mode", lang[CONST.ST_CBO_TCAP_MODES].split("||"), utWebUI.settings["multi_day_transfer_mode"]);
	_loadComboboxStrings("multi_day_transfer_limit_unit", lang[CONST.ST_CBO_TCAP_UNITS].split("||"), utWebUI.settings["multi_day_transfer_limit_unit"]);
	_loadComboboxStrings("multi_day_transfer_limit_span", lang[CONST.ST_CBO_TCAP_PERIODS].split("||"), utWebUI.settings["multi_day_transfer_limit_span"]);

	$("sched_table").fireEvent("change"); // Force update scheduler related language strings

}

function _loadComboboxStrings(id, vals, def) {
	try {
		var ele = $(id);

		ele.options.length = 0;
		$each(vals, function(v, k) {
			if (v == "") return;
			ele.options[ele.options.length] = new Option(v, k, false, false);
		});

		ele.set("value", def);
	}
	catch(e) {
		console.log("Error attempting to assign values to combobox with id='" + id + "'... ");
		console.log(e.name + ": " + e.message);
	}
}

function _loadStrings(prop, strings) {
	var fnload;
	switch ($type(strings)) {
		case 'object':
			fnload = function(val, key) {
				$(key).set(prop, lang[CONST[val]]);
			};
			break;
		default:
			strings = $splat(strings);
			fnload = function(val) {
				$(val).set(prop, lang[CONST[val]]);
			};
			break;
	}

	$each(strings, function(val, key) {
		try {
			fnload(val, key);
		}
		catch(e) {
			console.log("Error attempting to assign string '" + val + "' to element...");
		}
	});
}
