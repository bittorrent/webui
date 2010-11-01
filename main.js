/**
 * Copyright 2007 BitTorrent, Inc. All rights reserved.
 * Copyright 2008 Carsten Niebuhr
 */

var g_winTitle = "\u00B5Torrent WebUI v" + CONST.VERSION;

// Localized string globals ... initialized in loadLangStrings()

var g_perSec; // string representing "/s"
var g_dayCodes; // array of strings representing ["Mon", "Tue", ..., "Sun"]
var g_dayNames; // array of strings representing ["Monday", "Tuesday", ... , "Sunday"]
var g_schLgndEx; // object whose values are string explanations of scheduler table colors

// Pre-generated elements

var ELE_TD = new Element("td");
var ELE_TR = new Element("tr");


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

	ContextMenu.init("ContextMenu");

	//--------------------------------------------------
	// WINDOW EVENTS
	//--------------------------------------------------

	window.addEvent("resize", resizeUI);

	if (Browser.opera && Browser.version >= 9.6) {
		window.addEvent("scroll", function() {
			document.documentElement.scrollTop = 0;
		});
	}

	if (!isGuest) {
		window.addEvent("unload", function() {
			utWebUI.saveConfig(false);
		});
	}

	//--------------------------------------------------
	// MOUSE EVENTS
	//--------------------------------------------------

	var mouseWhitelist = function(ev) {
		return (
			ev.target.retrieve("mousewhitelist") ||
			(
				["INPUT", "TEXTAREA"].contains(ev.target.tagName) &&
				!["button", "checkbox", "file"].contains(ev.target.type)
			)
		);
	};
	var mouseWhitelistWrap = function(ev) {
		return !ev.isRightClick() || mouseWhitelist(ev);
	};

	// -- Select

	window.addStopEvent("mousedown", mouseWhitelist);

	// -- Right-click

	document.addStopEvents({
		"mousedown": function(ev) {
			ContextMenu.hide();
			return mouseWhitelistWrap(ev);
		},
		"contextmenu": mouseWhitelist, // IE does not send right-click info for onContextMenu
		"mouseup": mouseWhitelistWrap,
		"click": mouseWhitelistWrap
	});

	if (Browser.opera && !("oncontextmenu" in document.createElement("foo"))) {

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
			"ctrl a": Function.from(),
			"ctrl e": Function.from(),

			"ctrl o": function() { DialogManager.show("Add"); },
			"ctrl p": function() { utWebUI.showSettings(); },
			"ctrl u": function() { DialogManager.show("AddURL"); },
			"f2": function() { DialogManager.show("About"); },

			"f4": function() {
				utWebUI.toggleToolbar();

				resizeUI();
				if (Browser.opera)
					utWebUI.saveConfig(true);
			},

			"f6": function() {
				utWebUI.toggleDetPanel();

				resizeUI();
				if (Browser.opera)
					utWebUI.saveConfig(true);
			},

			"f7": function() {
				utWebUI.toggleCatPanel();

				resizeUI();
				if (Browser.opera)
					utWebUI.saveConfig(true);
			},

			"esc": function() {
				if (!ContextMenu.hidden) {
					ContextMenu.hide();
				} else if (DialogManager.showing.length > 0) {
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
			keyBindings["meta u"] = keyBindings["ctrl u"];

			delete keyBindings["ctrl a"];
			delete keyBindings["ctrl e"];
			delete keyBindings["ctrl o"];
			delete keyBindings["ctrl p"];
			delete keyBindings["ctrl u"];
		}

		document.addStopEvent("keydown", function(ev) {
			var key = eventToKey(ev);
			if (keyBindings[key]) {
				if (!DialogManager.modalIsVisible())
					keyBindings[key]();
			}
			else {
				return true;
			}
		});

		if (Browser.opera) {
			document.addEvent("keypress", function(ev) {
				return !keyBindings[eventToKey(ev)];
			});
		}
	}

}

var resizing = false;

function resizeUI(hDiv, vDiv) {

	if (resizing) return;
	resizing = true;

	if (!ContextMenu.hidden)
		ContextMenu.hide();

	var manualH = (typeOf(hDiv) == 'number'),
		manualV = (typeOf(vDiv) == 'number');

	var size = window.getZoomSize(), ww = size.x, wh = size.y;

	var config = utWebUI.config || utWebUI.defConfig,
		uiLimits = utWebUI.limits,
		minHSplit = uiLimits.minHSplit,
		minVSplit = uiLimits.minVSplit,
		minTrtH = uiLimits.minTrtH,
		minTrtW = uiLimits.minTrtW;

	var badIE = (Browser.ie && Browser.version <= 6);
	var showCat = true, showDet = true, showTB = false, tallCat = false;
	if (!isGuest) {
		showCat = config.showCategories;
		showDet = config.showDetails;
		showTB = config.showToolbar;
		tallCat = !!utWebUI.settings["gui.tall_category_list"];
	}

	var th = (showTB ? $("mainToolbar").getSize().y : 0);

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
			if ((typeOf(hDiv) != 'number') || (hDiv < minHSplit)) hDiv = uiLimits.defHSplit;
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
			if ((typeOf(vDiv) != 'number') || (vDiv < minVSplit)) vDiv = uiLimits.defVSplit;
		}
		vDiv = wh - vDiv;
	}

	// Calculate torrent list size
	var trtw = ww - (hDiv + 2 + (showCat ? 5 : 0)) - (badIE ? 1 : 0),
		trth = vDiv - (th + (showDet ? 0 : 2)) - (badIE ? 1 : 0);

	if (showCat) {
		$("mainCatList").show();

		if (trtw < minTrtW) {
			// Gracefully degrade if torrent list too small
			hDiv -= minTrtW - trtw;
			if (hDiv < minHSplit) {
				$("mainCatList").hide();
				showCat = false;
				trtw = ww - 2;
			}
			else {
				trtw = minTrtW;
			}
		}
	}

	if (showDet) {
		$("mainInfoPane").show();

		if (trth < minTrtH) {
			// Gracefully degrade if torrent list too small
			vDiv += minTrtH - trth;
			if (vDiv > wh - minVSplit) {
				$("mainInfoPane").hide();
				showDet = false;
				trth = wh - th - 2;
			}
			else {
				trth = minTrtH;
			}
		}
	}

	// Resize category/label list
	if (showCat) {
		if (hDiv) $("mainCatList").setStyle("width", hDiv - (badIE ? 2 : 0));

		if (tallCat) {
			$("mainCatList").setStyle("height", wh - th - 2);
		}
		else if (trth) {
			$("mainCatList").setStyle("height", trth);
		}
	}

	// Resize detailed info pane
	if (showDet) {
		var dw = ww - (showCat && tallCat ? hDiv + 5 : 0);
		if (vDiv) {
			var dh = wh - vDiv - $("mainInfoPane-tabs").getSize().y - 17;
			$("mainInfoPane-content").setStyles({"width": dw - 8, "height": dh});
			$("mainInfoPane-generalTab").setStyles({"width": dw - 10, "height": dh - 2});
			SpeedGraph.resize(dw - 8, dh);
			$("mainInfoPane-loggerTab").setStyles({"width": dw - 14, "height": dh - 6});
			utWebUI.prsTable.resizeTo(dw - 10, dh - 2);
			utWebUI.flsTable.resizeTo(dw - 10, dh - 2);
		}
	}

	// Reposition dividers
	if ($("mainHDivider")) {
		$("mainHDivider").setStyles({
			"height": tallCat ? wh - th : trth + 2,
			"left": showCat ? hDiv + 2 : -10,
			"top": th
		});
	}

	if ($("mainVDivider")) {
		$("mainVDivider").setStyles({
			"width": tallCat && showCat ? ww - (hDiv + 5) : ww,
			"left": tallCat && showCat ? hDiv + 5 : 0,
			"top":  showDet ? vDiv + 2 : -10
		});
	}

	// Store new divider position(s)
	if (hDiv && showCat && manualH) config.hSplit = hDiv;
	if (vDiv && showDet && manualV) config.vSplit = (wh - vDiv);

	// Resize torrent list
	utWebUI.trtTable.resizeTo(trtw, trth);
	if (!badIE) {
		// NOTE: We undefine the explicitly set width for modern browsers that have
		//       full page zoom, because if we specify an exact pixel width, the
		//       browser may not map the "virtual" pixels (the number of pixels the
		//       web application thinks it has due to zooming) to "physical" pixels
		//       in a manner such that the torrent jobs list would fit perfectly
		//       side by side with the category list.
		//
		//       An actual size is specified above in order to force the torrent
		//       list to resize when the horizontal divider is resized.

		utWebUI.trtTable.resizeTo(undefined, trth);
	}

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

	["cat_all", "cat_dls", "cat_com", "cat_act", "cat_iac", "cat_nlb"].each(function(k) {
		$(k).addEvent("mousedown", function() {
			utWebUI.switchLabel(this);
		});
	});

	//--------------------------------------------------
	// TORRENT JOBS LIST
	//--------------------------------------------------

	utWebUI.trtTable.create("mainTorList", utWebUI.trtColDefs, Object.append({
		"format": utWebUI.trtFormatRow.bind(utWebUI),
		"sortCustom": utWebUI.trtSortCustom.bind(utWebUI),
		"onDelete": function(ev) { utWebUI.remove(ev.shift ? 1 : 0); },
		"onColReset": utWebUI.trtColReset.bind(utWebUI),
		"onColResize": utWebUI.trtColResize.bind(utWebUI),
		"onColMove": utWebUI.trtColMove.bind(utWebUI),
		"onColToggle": utWebUI.trtColToggle.bind(utWebUI),
		"onSort": utWebUI.trtSort.bind(utWebUI),
		"onSelect": utWebUI.trtSelect.bind(utWebUI),
		"onDblClick": utWebUI.trtDblClk.bind(utWebUI)
	}, utWebUI.defConfig.torrentTable));

	//--------------------------------------------------
	// DETAILED INFO PANE
	//--------------------------------------------------

	// -- Main Tabs

	utWebUI.mainTabs = new Tabs("mainInfoPane-tabs", {
		"tabs": {
			  "mainInfoPane-generalTab" : ""
			, "mainInfoPane-peersTab"   : ""
			, "mainInfoPane-filesTab"   : ""
			, "mainInfoPane-speedTab"   : ""
			, "mainInfoPane-loggerTab"  : ""
		},
		"onChange": utWebUI.detPanelTabChange.bind(utWebUI)
	}).draw().show("mainInfoPane-generalTab");

	// -- General Tab

	$$("#mainInfoPane-generalTab td span").addEvent("mousedown", function(ev) {
		ev.target.store("mousewhitelist", true);
	});

	// -- Peers Tab

	utWebUI.prsTable.create("mainInfoPane-peersTab", utWebUI.prsColDefs, Object.append({
		"format": utWebUI.prsFormatRow.bind(utWebUI),
		"onColReset": utWebUI.prsColReset.bind(utWebUI),
		"onColResize": utWebUI.prsColResize.bind(utWebUI),
		"onColMove": utWebUI.prsColMove.bind(utWebUI),
		"onColToggle": utWebUI.prsColToggle.bind(utWebUI),
		"onSort": utWebUI.prsSort.bind(utWebUI),
		"onSelect": utWebUI.prsSelect.bind(utWebUI),
		"onRefresh": function() { if (this.torrentID != "") utWebUI.getPeers(utWebUI.torrentID, true); },
		"refreshable": true
	}, utWebUI.defConfig.peerTable));

	$("mainInfoPane-peersTab").addEvent("mousedown", function(ev) {
		if (ev.isRightClick() && ev.target.hasClass("stable-body")) {
			utWebUI.showPeerMenu(ev);
		}
	});

	// -- Files Tab

	utWebUI.flsTable.create("mainInfoPane-filesTab", utWebUI.flsColDefs, Object.append({
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

	SpeedGraph.init("mainInfoPane-speedTab");

	// -- Logger Tab

	Logger.init("mainInfoPane-loggerTab");
	$("mainInfoPane-loggerTab").addEvent("mousedown", function(ev) {
		ev.target.store("mousewhitelist", true);
	});

	//--------------------------------------------------
	// DIVIDERS
	//--------------------------------------------------

	new Drag("mainHDivider", {
		"modifiers": {"x": "left", "y": ""},
		"onComplete": function() {
			resizeUI(this.value.now.x, null);
			if (Browser.opera)
				utWebUI.saveConfig(true);
		}
	});

	new Drag("mainVDivider", {
		"modifiers": {"x": "", "y": "top"},
		"onComplete": function() {
			resizeUI(null, this.value.now.y);
			if (Browser.opera)
				utWebUI.saveConfig(true);
		}
	});

	//--------------------------------------------------
	// NON-GUEST SETUP
	//--------------------------------------------------

	if (isGuest) {
		resizeUI();
		return;
	}

	//--------------------------------------------------
	// TOOLBAR
	//--------------------------------------------------

	// -- Buttons

	["add", "addurl", "remove", "start", "pause", "stop", "queueup", "queuedown", "setting"].each(function(act) {
		$(act).addStopEvent("click", function(ev) {
			var arg;
			switch (act) {
				case "add": DialogManager.show("Add"); break;
				case "addurl": DialogManager.show("AddURL"); break;
				case "setting": utWebUI.showSettings(); break;

				case "queueup":
				case "queuedown":
					arg = ev.shift;
				default:
					utWebUI[act](arg);
			}
		});
	});

	// -- Search Field

	$("query").addEvent("keydown", function(ev) {
		if (ev.key == "enter") {
			utWebUI.searchExecute();
		}
	});

	$("search").addStopEvents({
		"mousedown": function(ev) {
			if (ev.isRightClick()) {
				utWebUI.searchMenuShow(this);
			}
		},
		"click": function(ev) {
			utWebUI.searchExecute();
		}
	});

	$("searchsel").addStopEvents({
		"mousedown": function(ev) {
			utWebUI.searchMenuShow(this);
		}
	});

	//--------------------------------------------------
	// DIALOG MANAGER
	//--------------------------------------------------

	["About", "Add", "AddURL", "DelTor", "Label", "Props", "Settings"].each(function(k) {
		var isModal = ["DelTor", "Label", "Props"].contains(k);
		DialogManager.add(k, isModal, {
			  "Add": function () { utWebUI.getDirectoryList(); }
			, "Settings": function () { utWebUI.stpanes.onChange(); }
		}[k]);
	});

	//--------------------------------------------------
	// ADD TORRENT DIALOG
	//--------------------------------------------------

	// -- OK Button (File)

	$("ADD_FILE_OK").addEvent("click", function() {
		this.disabled = true;

		var dir = $("dlgAdd-basePath").value || 0;
		var sub = encodeURIComponent($("dlgAdd-subPath").get("value")); // TODO: Sanitize!

		$("dlgAdd-form").set("action", guiBase
			+ "?token=" + utWebUI.TOKEN
			+ "&action=add-file"
			+ "&download_dir=" + dir
			+ "&path=" + sub
		).submit();
	});

	// -- Cancel Button (File)

	$("ADD_FILE_CANCEL").addEvent("click", function(ev) {
		DialogManager.hide("Add");
	});

	// -- Upload Frame

	var uploadfrm = new IFrame({
		"id": "uploadfrm",
		"src": "about:blank",
		"styles": {
			  display: "none"
			, height: 0
			, width: 0
		},
		"onload": function(doc) {
			$("dlgAdd-file").set("value", "");
			$("ADD_FILE_OK").disabled = false;

			if (!doc) return;

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

	$("dlgAdd-form").set("target", uploadfrm.get("id"));

	//--------------------------------------------------
	// ADD URL DIALOG
	//--------------------------------------------------

	// -- OK Button (URL)

	$("ADD_URL_OK").addEvent("click", function() {
		if ($("dlgAddURL-url").get("value").trim().length > 0) {
			DialogManager.hide("AddURL");
			utWebUI.addURL();
		}
	});

	// -- Cancel Button (URL)

	$("ADD_URL_CANCEL").addEvent("click", function(ev) {
		DialogManager.hide("AddURL");
	});

	// -- Form Submission

	$("dlgAddURL-form").addEvent("submit", Function.from(false));

	//--------------------------------------------------
	// DELETE TORRENT DIALOG
	//--------------------------------------------------

	// -- No Button

	$("DELTOR_NO").addEvent("click", function(ev) {
		$("dlgDelTor").getElement(".dlg-close").fireEvent("click", ev);
	});

	// -- Close Button

	$("dlgDelTor").getElement(".dlg-close").addEvent("click", function(ev) {
		$("DELTOR_YES").removeEvents("click");
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
		$("dlgProps").getElement(".dlg-close").fireEvent("click", ev);
			// Fire the "Close" button's click handler to make sure
			// controls are restored if necessary
	});

	// -- Close Button

	$("dlgProps").getElement(".dlg-close").addEvent("click", function(ev) {
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
		$("dlgSettings").getElement(".dlg-close").fireEvent("click", ev);
			// Fire the "Close" button's click handler to make sure
			// controls are restored if necessary
	});

	// -- Apply Button

	$("DLG_SETTINGS_05").addEvent("click", function(ev) {
		utWebUI.setSettings();
	});

	// -- Close Button

	$("dlgSettings").getElement(".dlg-close").addEvent("click", function(ev) {
		utWebUI.loadSettings();
	});

	// -- Pane Selector

	utWebUI.stpanes = new Tabs("dlgSettings-menu", {
		"tabs": {
			  "dlgSettings-General"     : ""
			, "dlgSettings-UISettings"  : ""
			, "dlgSettings-Directories" : ""
			, "dlgSettings-Connection"  : ""
			, "dlgSettings-Bandwidth"   : ""
			, "dlgSettings-BitTorrent"  : ""
			, "dlgSettings-TransferCap" : ""
			, "dlgSettings-Queueing"    : ""
			, "dlgSettings-Scheduler"   : ""
			, "dlgSettings-WebUI"       : ""
			, "dlgSettings-Advanced"    : ""
			, "dlgSettings-UIExtras"    : ""
			, "dlgSettings-DiskCache"   : ""
		},
		"onChange": utWebUI.settingsPaneChange.bind(utWebUI)
	}).draw().show("dlgSettings-WebUI");

	// -- General

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
			rnd = parseInt(Math.random() * 50000, 10) + 15000;
		} while (v == rnd);
		$("bind_port").set("value", rnd);
	});

	// -- BitTorrent

	$("enable_bw_management").addEvent("click", function() {
		utWebUI.setAdvSetting("bt.transp_disposition", (
			this.checked ? utWebUI.settings["bt.transp_disposition"] | CONST.TRANSDISP_UTP
			             : utWebUI.settings["bt.transp_disposition"] & ~CONST.TRANSDISP_UTP
		));
	});

	// -- Transfer Cap

	$("multi_day_transfer_limit_span").addEvent("change", function() {
		utWebUI.getTransferHistory();
	});

	$("DLG_SETTINGS_7_TRANSFERCAP_13").addEvent("click", function() {
		utWebUI.resetTransferHistory();
	});

	// -- Scheduler

	$("sched_table").addEvent("change", function() {
		var sv = (utWebUI.settings["sched_table"] || "").pad(7*24, "0").substring(0, 7*24);
		var tbody = new Element("tbody");
		var active = false;
		var mode = 0;

		for (var i = 0; i < 7; i++) {
			var tr = ELE_TR.clone(false);
			for (var j = 0; j < 25; j++) {
				var td = ELE_TD.clone(false);
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
						if (Browser.ie) {
							// Prevent text selection in IE
							td.addEvent("selectstart", Function.from(false));
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

	// -- Advanced Options

	utWebUI.advOptTable.create("dlgSettings-advOptList", utWebUI.advOptColDefs, Object.append({
		"format": utWebUI.advOptFormatRow.bind(utWebUI),
		"onColReset": utWebUI.advOptColReset.bind(utWebUI),
		"onSelect": utWebUI.advOptSelect.bind(utWebUI),
		"onDblClick": utWebUI.advOptDblClk.bind(utWebUI)
	}, utWebUI.defConfig.advOptTable));

	$("DLG_SETTINGS_A_ADVANCED_05").addEvent("click", utWebUI.advOptChanged.bind(utWebUI));
	$("dlgSettings-advTrue").addEvent("click", utWebUI.advOptChanged.bind(utWebUI));
	$("dlgSettings-advFalse").addEvent("click", utWebUI.advOptChanged.bind(utWebUI));

	var advSize = $("dlgSettings-Advanced").getDimensions({computeSize: true});
	utWebUI.advOptTable.resizeTo(advSize.x - 15, advSize.y - 60);

	// -- Linked Controls

	var linkedEvent = Browser.ie ? "click" : "change";

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

	$("webui.enable").addEvent(linkedEvent, function() {
		_link(this, 0, ["webui.username", "webui.password", "webui.enable_guest", "webui.enable_listen", "webui.restrict"]);
		_link(this, 0, ["webui.guest"], null, (this.checked && !$("webui.enable_guest").checked));
		_link(this, 0, ["webui.port"], null, (this.checked && !$("webui.enable_listen").checked));
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

	$("max_ul_rate_seed_flag").addEvent(linkedEvent, function() {
		_link(this, 0, ["max_ul_rate_seed"]);
	});

	$("gui.manual_ratemenu").addEvent(linkedEvent, function() {
		_link(this, 0, ["gui.ulrate_menu", "gui.dlrate_menu"]);
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
		element.fireEvent(((tag == "input") && Browser.ie) ? "click" : "change");
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
			  "name"         : lang[CONST.OV_COL_NAME]
			, "status"       : lang[CONST.OV_COL_STATUS]
			, "size"         : lang[CONST.OV_COL_SIZE]
			, "done"         : lang[CONST.OV_COL_DONE]
			, "downloaded"   : lang[CONST.OV_COL_DOWNLOADED]
			, "uploaded"     : lang[CONST.OV_COL_UPPED]
			, "ratio"        : lang[CONST.OV_COL_SHARED]
			, "downspeed"    : lang[CONST.OV_COL_DOWNSPD]
			, "upspeed"      : lang[CONST.OV_COL_UPSPD]
			, "eta"          : lang[CONST.OV_COL_ETA]
			, "label"        : lang[CONST.OV_COL_LABEL]
			, "peers"        : lang[CONST.OV_COL_PEERS]
			, "seeds"        : lang[CONST.OV_COL_SEEDS]
			, "seeds_peers"  : lang[CONST.OV_COL_SEEDS_PEERS]
			, "availability" : lang[CONST.OV_COL_AVAIL].split("||")[1]
			, "order"        : lang[CONST.OV_COL_ORDER]
			, "remaining"    : lang[CONST.OV_COL_REMAINING]
		}
	});

	//--------------------------------------------------
	// DETAILED INFO PANE
	//--------------------------------------------------

	// -- Tab Titles

	var tstr = lang[CONST.OV_TABS].split("||");
	utWebUI.mainTabs.setNames({
		  "mainInfoPane-generalTab" : tstr[0]
		, "mainInfoPane-peersTab"   : tstr[2]
		, "mainInfoPane-filesTab"   : tstr[4]
		, "mainInfoPane-speedTab"   : tstr[5]
		, "mainInfoPane-loggerTab"  : tstr[6]
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

	// -- Peers Tab

	utWebUI.prsTable.refreshRows();
	utWebUI.prsTable.setConfig({
		"resetText": lang[CONST.MENU_RESET],
		"colText": {
 			  "ip"         : lang[CONST.PRS_COL_IP]
			, "port"       : lang[CONST.PRS_COL_PORT]
			, "client"     : lang[CONST.PRS_COL_CLIENT]
			, "flags"      : lang[CONST.PRS_COL_FLAGS]
			, "pcnt"       : lang[CONST.PRS_COL_PCNT]
			, "relevance"  : lang[CONST.PRS_COL_RELEVANCE]
			, "downspeed"  : lang[CONST.PRS_COL_DOWNSPEED]
			, "upspeed"    : lang[CONST.PRS_COL_UPSPEED]
			, "reqs"       : lang[CONST.PRS_COL_REQS]
			, "waited"     : lang[CONST.PRS_COL_WAITED]
			, "uploaded"   : lang[CONST.PRS_COL_UPLOADED]
			, "downloaded" : lang[CONST.PRS_COL_DOWNLOADED]
			, "hasherr"    : lang[CONST.PRS_COL_HASHERR]
			, "peerdl"     : lang[CONST.PRS_COL_PEERDL]
			, "maxup"      : lang[CONST.PRS_COL_MAXUP]
			, "maxdown"    : lang[CONST.PRS_COL_MAXDOWN]
			, "queued"     : lang[CONST.PRS_COL_QUEUED]
			, "inactive"   : lang[CONST.PRS_COL_INACTIVE]
		}
	});

	// -- Files Tab

	utWebUI.flsTable.refreshRows();
	utWebUI.flsTable.setConfig({
		"resetText": lang[CONST.MENU_RESET],
		"colText": {
			  "name" : lang[CONST.FI_COL_NAME]
			, "size" : lang[CONST.FI_COL_SIZE]
			, "done" : lang[CONST.FI_COL_DONE]
			, "pcnt" : lang[CONST.FI_COL_PCNT]
			, "prio" : lang[CONST.FI_COL_PRIO]
		}
	});

	// -- Speed Tab

	SpeedGraph.setLabels(
		  lang[CONST.OV_COL_UPSPD]
		, lang[CONST.OV_COL_DOWNSPD]
	);
	SpeedGraph.draw();

	//--------------------------------------------------
	// NON-GUEST SETUP
	//--------------------------------------------------

	if (isGuest) return;

	//--------------------------------------------------
	// TOOLBAR
	//--------------------------------------------------

	_loadStrings("title", {
		  "add"       : "OV_TB_ADDTORR"
		, "addurl"    : "OV_TB_ADDURL"
		, "remove"    : "OV_TB_REMOVE"
		, "start"     : "OV_TB_START"
		, "pause"     : "OV_TB_PAUSE"
		, "stop"      : "OV_TB_STOP"
		, "queueup"   : "OV_TB_QUEUEUP"
		, "queuedown" : "OV_TB_QUEUEDOWN"
		, "setting"   : "OV_TB_PREF"
	});

	//--------------------------------------------------
	// ALL DIALOGS
	//--------------------------------------------------

	// -- Titles

	_loadStrings("text", {
		  "dlgAdd-head"      : "OV_TB_ADDTORR"
		, "dlgAddURL-head"   : "OV_TB_ADDURL"
		, "dlgLabel-head"    : "OV_NEWLABEL_CAPTION"
		, "dlgProps-head"    : "DLG_TORRENTPROP_00"
		, "dlgSettings-head" : "DLG_SETTINGS_00"
	});

	// -- [ OK | Cancel | Apply ] Buttons

	_loadStrings("value", {
		// Add
		  "ADD_FILE_OK"     : "DLG_BTN_OK"
		, "ADD_FILE_CANCEL" : "DLG_BTN_CANCEL"

		// Add URL
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
	// ABOUT DIALOG
	//--------------------------------------------------

	$("dlgAbout-version").set("text", "v" + CONST.VERSION + (CONST.BUILD ? " (" + CONST.BUILD + ")" : ""));

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
		  "dlgSettings-General"     : lang[CONST.ST_CAPT_GENERAL]
		, "dlgSettings-UISettings"  : lang[CONST.ST_CAPT_UI_SETTINGS]
		, "dlgSettings-Directories" : lang[CONST.ST_CAPT_FOLDER]
		, "dlgSettings-Connection"  : lang[CONST.ST_CAPT_CONNECTION]
		, "dlgSettings-Bandwidth"   : lang[CONST.ST_CAPT_BANDWIDTH]
		, "dlgSettings-BitTorrent"  : lang[CONST.ST_CAPT_BITTORRENT]
		, "dlgSettings-TransferCap" : lang[CONST.ST_CAPT_TRANSFER_CAP]
		, "dlgSettings-Queueing"    : lang[CONST.ST_CAPT_QUEUEING]
		, "dlgSettings-WebUI"       : lang[CONST.ST_CAPT_WEBUI]
		, "dlgSettings-Scheduler"   : lang[CONST.ST_CAPT_SCHEDULER]
		, "dlgSettings-Advanced"    : lang[CONST.ST_CAPT_ADVANCED]
		, "dlgSettings-UIExtras"    : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + lang[CONST.ST_CAPT_UI_EXTRAS] // TODO: Use CSS to indent instead of modifying the string directly...
		, "dlgSettings-DiskCache"   : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + lang[CONST.ST_CAPT_DISK_CACHE] // TODO: Use CSS to indent instead of modifying the string directly...
	});

	_loadStrings("text", [
		// General
		  "DLG_SETTINGS_1_GENERAL_01"
		, "DLG_SETTINGS_1_GENERAL_02"
		, "DLG_SETTINGS_1_GENERAL_10"
		, "DLG_SETTINGS_1_GENERAL_11"
		, "DLG_SETTINGS_1_GENERAL_12"
		, "DLG_SETTINGS_1_GENERAL_13"
		, "DLG_SETTINGS_1_GENERAL_17"
		, "DLG_SETTINGS_1_GENERAL_18"
		, "DLG_SETTINGS_1_GENERAL_19"
		, "DLG_SETTINGS_1_GENERAL_20"

		// UI Settings
		, "DLG_SETTINGS_2_UI_01"
		, "DLG_SETTINGS_2_UI_02"
		, "DLG_SETTINGS_2_UI_03"
		, "DLG_SETTINGS_2_UI_04"
		, "DLG_SETTINGS_2_UI_05"
		, "DLG_SETTINGS_2_UI_06"
		, "DLG_SETTINGS_2_UI_07"
		, "DLG_SETTINGS_2_UI_15"
		, "DLG_SETTINGS_2_UI_16"
		, "DLG_SETTINGS_2_UI_17"
		, "DLG_SETTINGS_2_UI_18"
		, "DLG_SETTINGS_2_UI_19"
		, "DLG_SETTINGS_2_UI_20"
		, "DLG_SETTINGS_2_UI_22"

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
		, "DLG_SETTINGS_5_BANDWIDTH_05"
		, "DLG_SETTINGS_5_BANDWIDTH_07"
		, "DLG_SETTINGS_5_BANDWIDTH_08"
		, "DLG_SETTINGS_5_BANDWIDTH_10"
		, "DLG_SETTINGS_5_BANDWIDTH_11"
		, "DLG_SETTINGS_5_BANDWIDTH_14"
		, "DLG_SETTINGS_5_BANDWIDTH_15"
		, "DLG_SETTINGS_5_BANDWIDTH_17"
		, "DLG_SETTINGS_5_BANDWIDTH_18"
		, "DLG_SETTINGS_5_BANDWIDTH_19"
		, "DLG_SETTINGS_5_BANDWIDTH_20"

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
		, "DLG_SETTINGS_6_BITTORRENT_14"
		, "DLG_SETTINGS_6_BITTORRENT_15"

		// Transfer Cap
		, "DLG_SETTINGS_7_TRANSFERCAP_01"
		, "DLG_SETTINGS_7_TRANSFERCAP_02"
		, "DLG_SETTINGS_7_TRANSFERCAP_03"
		, "DLG_SETTINGS_7_TRANSFERCAP_04"
		, "DLG_SETTINGS_7_TRANSFERCAP_05"
		, "DLG_SETTINGS_7_TRANSFERCAP_06"
		, "DLG_SETTINGS_7_TRANSFERCAP_07"
		, "DLG_SETTINGS_7_TRANSFERCAP_08"
		, "DLG_SETTINGS_7_TRANSFERCAP_09"
		, "DLG_SETTINGS_7_TRANSFERCAP_10"
		, "DLG_SETTINGS_7_TRANSFERCAP_11"

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

		// Web UI
		, "DLG_SETTINGS_9_WEBUI_01"
		, "DLG_SETTINGS_9_WEBUI_02"
		, "DLG_SETTINGS_9_WEBUI_03"
		, "DLG_SETTINGS_9_WEBUI_05"
		, "DLG_SETTINGS_9_WEBUI_07"
		, "DLG_SETTINGS_9_WEBUI_09"
		, "DLG_SETTINGS_9_WEBUI_10"
		, "DLG_SETTINGS_9_WEBUI_12"

		// Advanced
		, "DLG_SETTINGS_A_ADVANCED_01"
		, "DLG_SETTINGS_A_ADVANCED_02"
		, "DLG_SETTINGS_A_ADVANCED_03"
		, "DLG_SETTINGS_A_ADVANCED_04"

		// UI Extras
		, "DLG_SETTINGS_B_ADV_UI_01"
		, "DLG_SETTINGS_B_ADV_UI_02"
		, "DLG_SETTINGS_B_ADV_UI_03"
		, "DLG_SETTINGS_B_ADV_UI_05"
		, "DLG_SETTINGS_B_ADV_UI_07"
		, "DLG_SETTINGS_B_ADV_UI_08"

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
		, "ST_SCH_LGND_FULL"
		, "ST_SCH_LGND_LIMITED"
		, "ST_SCH_LGND_OFF"
		, "ST_SCH_LGND_SEEDING"
	]);

	// -- Advanced Options

	utWebUI.advOptTable.refreshRows();
	utWebUI.advOptTable.setConfig({
		"resetText": lang[CONST.MENU_RESET],
		"colText": {
			  "name"  : lang[CONST.ST_COL_NAME]
			, "value" : lang[CONST.ST_COL_VALUE]
		}
	});

	// -- Buttons
	_loadStrings("value", [
		  "DLG_SETTINGS_4_CONN_04" // "Random"
		, "DLG_SETTINGS_7_TRANSFERCAP_13" // "Reset History"
		, "DLG_SETTINGS_A_ADVANCED_05" // "Set"
	]);

	// -- Comboboxes
	_loadComboboxStrings("gui.dblclick_seed", lang[CONST.ST_CBO_UI_DBLCLK_TOR].split("||"), utWebUI.settings["gui.dblclick_seed"]);
	_loadComboboxStrings("gui.dblclick_dl", lang[CONST.ST_CBO_UI_DBLCLK_TOR].split("||"), utWebUI.settings["gui.dblclick_dl"]);
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

		ele.set("value", def || 0);
	}
	catch(e) {
		console.log("Error attempting to assign values to combobox with id='" + id + "'... ");
		console.log(e.name + ": " + e.message);
	}
}

function _loadStrings(prop, strings) {
	var fnload;
	switch (typeOf(strings)) {
		case 'object':
			fnload = function(val, key) {
				$(key).set(prop, lang[CONST[val]]);
			};
			break;
		default:
			strings = Array.from(strings);
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
