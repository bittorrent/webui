/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var BUILD_REQUIRED = -1; // the uT build that WebUI requires
var LANGUAGES = LANGUAGES || {};
var lang = lang || null;
var urlBase = window.location.pathname.substr(0, window.location.pathname.indexOf("/gui")) + "/gui/";
var isGuest = window.location.pathname.test(/.*guest.html$/);

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
	"customLabels": {},
	"cacheID": 0,
	"limits": {
		"reqRetryDelayBase": 2, // seconds
		"reqRetryMaxAttempts": 5,
		"minTableRows": 5,
		"minUpdateInterval": 500,
		"defHSplit": 125,
		"defVSplit": 225,
		"minHSplit": 25,
		"minVSplit": 150,
		"minTrtH": 100,
		"minTrtW": 150
	},
	"defConfig": {
		"showDetails": true,
		"showCategories": true,
		"showToolbar": true,
		"showTitleSpeed": false,
		"updateInterval": 3000,
		"alternateRows": false,
		"maxRows": 50,
		"confirmDelete": true,
		"lang": "en",
		"hSplit": -1,
		"vSplit": -1,
		"torrentTable": {
			"rowsSelectable": !isGuest,
			"colMask": 0x0000, // automatically calculated based on this.flsColDefs
			"colOrder": [], // automatically calculated based on this.trtColDefs
			"colWidth": [], // automatically calculated based on this.trtColDefs
			"reverse": false,
			"sIndex": -1
		},
		"fileTable": {
			"colMask": 0x0000, // automatically calculated based on this.flsColDefs
			"colOrder": [], // automatically calculated based on this.flsColDefs
			"colWidth": [], // automatically calculated based on this.flsColDefs
			"reverse": false,
			"sIndex": -1
		},
		"activeLabel": "_all_"
	},
	"torrentID": "", // selected torrent
	"propID": "", // selected torrent (single)
	"trtTable": new dxSTable(),
	"flsTable": new dxSTable(),
	"trtColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 220, TYPE_STRING]
		, ["order", 30, TYPE_NUM_ORDER]
		, ["size", 90, TYPE_NUMBER]
		, ["remaining", 90, TYPE_NUMBER, true]
		, ["done", 80, TYPE_NUM_PROGRESS]
		, ["status", 100, TYPE_CUSTOM]
		, ["seeds", 60, TYPE_NUMBER]
		, ["peers", 60, TYPE_NUMBER]
		, ["seeds_peers", 80, TYPE_NUMBER, true]
		, ["downspeed", 80, TYPE_NUMBER]
		, ["upspeed", 80, TYPE_NUMBER]
		, ["eta", 60, TYPE_NUM_ORDER]
		, ["uploaded", 90, TYPE_NUMBER, true]
		, ["downloaded", 90, TYPE_NUMBER, true]
		, ["ratio", 60, TYPE_NUMBER]
		, ["availability", 60, TYPE_NUMBER]
		, ["label", 80, TYPE_STRING, true]
	],
	"flsColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 300, TYPE_STRING]
		, ["size", 90, TYPE_NUMBER]
		, ["done", 90, TYPE_NUMBER]
		, ["pcnt", 80, TYPE_NUM_PROGRESS]
		, ["prio", 80, TYPE_NUMBER]
	],
	"flsColPrioIdx": -1, // automatically calculated based on this.flsColDefs
	"timer": 0,
	"updateTimeout": null,
	"interval": -1,
	"totalDL": 0,
	"totalUL": 0,
	"loaded": false,
	"TOKEN": "",
	"delActions": ["remove", "removedata"],

	"init": function() {
		this.config = $merge(this.defConfig, {"lang": ""}); // deep copy default config

		// Calculate index of some columns for ease of reference elsewhere
		this.trtColDoneIdx = this.trtColDefs.map(function(item) { return (item[0] == "done"); }).indexOf(true);
		this.trtColStatusIdx = this.trtColDefs.map(function(item) { return (item[0] == "status"); }).indexOf(true);
		this.flsColPrioIdx = this.flsColDefs.map(function(item) { return (item[0] == "prio"); }).indexOf(true);

		// Set default colMask values based on colDefs
		this.trtColDefs.each(function(item, index) { this.trtColToggle(index, item[3], true); }, this);
		this.flsColDefs.each(function(item, index) { this.flsColToggle(index, item[3], true); }, this);

		if (isGuest) {
			this.addSettings();
			return;
		}
		this.getSettings();
	},

	"request": function(qs, fn, async, fails) {
		if ($type(fails) != "array") fails = [0]; // array so to pass by reference

		var self = this;

		var req = function() {
			try {
				new Request.JSON({
					"url": urlBase + "?token=" + self.TOKEN + "&" + qs + "&t=" + $time(),
					"method": "get",
					"async": !!async,
					"onFailure": function() {
						// TODO: Need to be able to distinguish between recoverable and unrecoverable errors...
						//       Recoverable errors should be retried, unrecoverable errors should not.
						//       This is not possible without backend cooperation, because as of uTorrent 2.1,
						//       the backend returns the same error code/message whether or not the error is
						//       recoverable. Examples:
						//       - Recoverable: Bad token (just get a new token)
						//       - Unrecoverable: "/gui/?action=setsetting&s=webui.cookie&v=..." failing

						$clear(self.updateTimeout);

						fails[0]++;
						var delay = Math.pow(self.limits.reqRetryDelayBase, fails[0]);
						if (fails[0] <= self.limits.reqRetryMaxAttempts) {
							log("Request failure #" + fails[0] + " (will retry in " + delay + " seconds): " + qs);
						}
						else {
							window.removeEvents("unload");
							$("msg").set("html", "WebUI is having trouble contacting &micro;Torrent. Try <a href='#' onclick='window.location.reload()'>reloading</a> the page.");
							$("cover").show();
							return;
						}

						self.TOKEN = "";
						self.request.delay(delay * 1000, self, [qs, function(json) {
							if (fails[0]) {
								fails[0] = 0;
									// Make sure callback gets called only once. Otherwise, WebUI may
									// hammer the backend with tons of requests after failure recovery (to
									// be exact, it may spam as many requests as there have been failures)

								if (fn) fn.delay(0, self, json);
								self.updateTimeout = self.update.delay(self.config.updateInterval, self);
							}
						}, async, fails]);
					},
					"onSuccess": (fn) ? fn.bind(self) : $empty
				}).send();
			} catch(e){}
		};

		if (!self.TOKEN)
			self.requestToken(req, true);
		else
			req();
	},

	"requestToken": function(fn, async) {
		var self = this;
		try {
			new Request({
				"url": urlBase + "token.html?t=" + $time(),
				"method": "get",
				"async": !!async,
				"onFailure": (fn) ? fn.bind(self) : $empty,
				"onSuccess": function(str) {
					self.TOKEN = str.substring(str.indexOf("none;'>") + 7, str.indexOf("</div>"));
					if (fn) fn.delay(0);
				}
			}).send();
		} catch(e){}
	},

	"perform": function(action) {
		var hashes = this.getHashes(action);
		if (action == "pause") {
			var temp = this.getHashes("unpause");
			if (temp.length)
				this.request("action=unpause&hash=" + temp.join("&hash="));
		}
		if (hashes.length == 0) return;
		if (action.test(/^remove/) && (hashes.indexOf(this.torrentID) > -1)) {
			this.torrentID = "";
			this.clearDetails();
		}
		this.getTorrents("action=" + action + "&hash=" + hashes.join("&hash="));
	},

	"getHashes": function(act) {
		var hashes = [];
		var len = this.trtTable.selectedRows.length;
		while (len--) {
			var key = this.trtTable.selectedRows[len];
			var stat = this.torrents[key][CONST.TORRENT_STATUS];
			switch (act) {
				case "forcestart":
					if ((stat & 1) && !(stat & 64) && !(stat & 32)) continue;
					break;

				case "start":
					if ((stat & 1) && !(stat & 32) && (stat & 64)) continue;
					break;

				case "pause":
					if (stat & 32) continue;
					break;

				case "unpause":
					if (!(stat & 32)) continue;
					break;

				case "stop":
					if (!(stat & 1) && !(stat & 2) && !(stat & 16) && !(stat & 64)) continue;
					break;

				case "recheck":
					if (stat & 2) continue;
					break;

				case "remove":
				case "removedata":
					break;

				default:
					continue;
			}
			hashes.push(key);
		}
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

	"remove": function(mode) {
		var count = this.trtTable.selectedRows.length;
		if (count == 0) return;
		mode = parseInt(mode);
		if (isNaN(mode))
			mode = (this.settings["gui.default_del_action"] <= 1) ? 0 : 1
		var ok = !this.config.confirmDelete;
		if (!ok) {
			var multiple = (count != 1);
			var ask = (mode == 0) ? ((multiple) ? CONST.OV_CONFIRM_DELETE_MULTIPLE : CONST.OV_CONFIRM_DELETE_ONE) : ((multiple) ? CONST.OV_CONFIRM_DELETEDATA_MULTIPLE : CONST.OV_CONFIRM_DELETEDATA_ONE);
			ok = confirm(lang[ask].replace(/%d/, count));
		}
		if (!ok) return;
		this.perform(this.delActions[mode]);
	},

	"recheck": function() {
		this.perform("recheck");
	},

	"getTorrents": function(qs) {
		$clear(this.updateTimeout);
		this.timer = $time();
		qs = qs || "";
		if (qs != "")
			qs += "&";
		this.request(qs + "list=1&cid=" + this.cacheID + "&getmsg=1", this.loadTorrents);
	},

	"getStatusInfo": function(state, done) {
		var res = ["", ""];

		if (state & CONST.STATE_PAUSED) { // paused
			res = ["Status_Paused", (state & CONST.STATE_CHECKING) ? lang[CONST.OV_FL_CHECKED].replace(/%:\.1d%/, (done / 10)) : lang[CONST.OV_FL_PAUSED]];
		}
		else if (state & CONST.STATE_STARTED) { // started, seeding or leeching
			res = (done == 1000) ? ["Status_Up", lang[CONST.OV_FL_SEEDING]] : ["Status_Down", lang[CONST.OV_FL_DOWNLOADING]];
			if (!(state & CONST.STATE_QUEUED)) { // forced start
				res[1] = "[F] " + res[1];
			}
		}
		else if (state & CONST.STATE_CHECKING) { // checking
			res = ["Status_Checking", lang[CONST.OV_FL_CHECKED].replace(/%:\.1d%/, (done / 10))];
		}
		else if (state & CONST.STATE_ERROR) { // error
			res = ["Status_Error", lang[CONST.OV_FL_ERROR].replace(/%s/, "??")];
		}
		else if (state & CONST.STATE_QUEUED) { // queued
			res = (done == 1000) ? ["Status_Queued_Up", lang[CONST.OV_FL_QUEUED_SEED]] : ["Status_Queued_Down", lang[CONST.OV_FL_QUEUED]];
		}
		else if (done == 1000) { // finished
			res = ["Status_Completed", lang[CONST.OV_FL_FINISHED]];
		}
		else { // stopped
			res = ["Status_Incompleted", lang[CONST.OV_FL_STOPPED]];
		}

		return res;
	},

	"loadTorrents": function(json) {
		var torrents = [];
		if (!has(json, "torrents")) {
			torrents = json.torrentp;
			delete json.torrentp;
		} else {
			torrents = json.torrents;
			delete json.torrents;

			// What:
			//   Remove torrents that no longer exist, for the situation in which
			//   the backend sends 'torrents' even though a cid was sent with the
			//   list=1 request.
			// When:
			//   This happens when the sent cid is not valid, which happens when
			//   multiple sessions of WebUI are sending interleaved list=1&cid=...
			//   requests.
			// Why:
			//   When this happens, WebUI no longer has a proper 'torrentm' list
			//   by which it can remove torrents that have been removed.
			// How:
			//   This fixes it by comparing the received 'torrents' list with the
			//   list of existing torrents to see which hashes no longer exist,
			//   and manually generating a 'torrentm' list from that.
			// Note:
			//   The alternative, instead of comparing, would be to clear the
			//   list completely and replace it with this list instead, but that
			//   is likely to be slower because DOM manipulations are slow.

			json.torrentm = [];
			var exhashes = {};
			for (var k in this.torrents) {
				exhashes[k] = 1;
			}
			for (var i = 0, len = torrents.length; i < len; i++) {
				if (has(exhashes, torrents[i][CONST.TORRENT_HASH]))
					delete exhashes[torrents[i][CONST.TORRENT_HASH]];
			}
			for (var k in exhashes) {
				json.torrentm.push(k);
			}
		}
		this.loadLabels($A(json.label));
		delete json.label;
		if (!this.loaded) {
			if (!has(this.labels, this.config.activeLabel) && !has(this.customLabels, this.config.activeLabel)) {
				this.config.activeLabel = "_all_";
				$("_all_").addClass("sel");
				$(this.config.activeLabel).removeClass("sel");
			} else {
				$("_all_").removeClass("sel");
				$(this.config.activeLabel).addClass("sel");
			}
		}

		var scroll = this.trtTable.dBody.getScroll(), sortedColChanged = false;
		for (var i = 0, len = torrents.length; i < len; i++) {
			var tor = torrents[i], row = this.trtDataToRow(tor);

//			if (tor[CONST.TORRENT_ETA] < -1) console.log(tor);

			var hash = tor[CONST.TORRENT_HASH];
			var done = tor[CONST.TORRENT_PROGRESS];
			var dlsp = tor[CONST.TORRENT_DOWNSPEED];
			var ulsp = tor[CONST.TORRENT_UPSPEED];
			var stat = tor[CONST.TORRENT_STATUS];
			var statinfo = this.getStatusInfo(stat, done);

			this.totalDL += dlsp;
			this.totalUL += ulsp;

			if (!has(this.labels, hash))
				this.labels[hash] = "";

			var labels = this.labels[hash] = this.getLabels(hash, tor[CONST.TORRENT_LABEL], done, dlsp, ulsp);
			var ret = false, activeChanged = false;

			if (has(this.torrents, hash)) {
				// Old torrent found... update list
				var rdata = this.trtTable.rowData[hash];
				activeChanged = (rdata.hidden != (labels.indexOf(this.config.activeLabel) < 0));
				if (activeChanged) rdata.hidden = !rdata.hidden;

				this.trtTable.setIcon(hash, statinfo[0]);

				row.each(function(v, k) {
					if (v != rdata.data[k]) {
						ret = this.trtTable.updateCell(hash, k, row) || ret;
					}
				}, this);

				if (!ret && activeChanged) {
					this.trtTable._insertRow(hash);
				}
			}
			else {
				// New torrent found... add to list
				this.trtTable.addRow(row, hash, statinfo[0], (labels.indexOf(this.config.activeLabel) < 0), this.loaded || (this.trtTable.sIndex == -1));
				ret = true;
			}

			this.torrents[hash] = tor;
			sortedColChanged = sortedColChanged || ret;
		}
		torrents.length = 0;
		if (has(json, "torrentm")) {
			var clear = false;
			for (var i = 0, j = json.torrentm.length; i < j; i++) {
				var k = json.torrentm[i];
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
				if (this.torrentID == k)
					clear = true;
			}
			delete json.torrentm;
			if (clear) {
				this.torrentID = "";
				this.clearDetails();
			}
		}

		if (!this.loaded && (this.trtTable.sIndex >= 0))
			this.trtTable.sort();
		else if (this.trtTable.requiresRefresh || sortedColChanged)
			this.trtTable.refreshRows();

		this.trtTable.dBody.scrollTo(scroll.x, scroll.y);
		this.trtTable.loadObj.hide();

		this.cacheID = json.torrentc;
		json = null;
		this.updateLabels();

		if (!this.loaded) {
			this.loaded = true;
			this.trtTable.calcSize();
			$("cover").hide();
		}
		this.trtTable.refresh();

		this.updateTimeout = this.update.delay(this.getInterval(), this);
		this.updateDetails();
		if (!isGuest) {
			SpeedGraph.addData(this.totalUL, this.totalDL);
		}

		this.updateSpeed();
	},

	"updateSpeed": function() {
		var str = lang[CONST.MAIN_TITLEBAR_SPEED].replace(/%s/, this.totalDL.toFileSize() + g_perSec).replace(/%s/, this.totalUL.toFileSize() + g_perSec);
		window.status = window.defaultStatus = str.replace(/%s/, "");
		if (this.config.showTitleSpeed)
			document.title = str.replace(/%s/, g_winTitle);
	},

	"update": function() {
		this.totalDL = 0;
		this.totalUL = 0;
		this.getTorrents();
	},

	"getInterval": function() {
		var t = $time() - this.timer;
		this.interval = (this.interval == -1) ? (this.config.updateInterval + t * 4) : ((this.interval + this.config.updateInterval + t * 4) / 2).toInt();
		return this.interval;
	},

	"loadLabels": function(labels) {
		var labelList = $("lbll"), temp = {};
		for (var i = 0, len = labels.length; i < len; i++) {
			var labeltxt = labels[i][0], label = "~" + labeltxt + "~", count = labels[i][1], li = null;
			if (!(li = $(label))) {
				$me = this;
				li = new Element("li", {"id": label})
					.addEvent("mousedown", function(){ $me.switchLabel(this); })
					.appendText(labeltxt + " (")
					.grab(new Element("span", {"id": "_" + label + "_c"}).set("text", count))
					.appendText(")");
				if (i == 0) {
					labelList.grab(li);
				} else {
					li.inject("~" + labels[i - 1][0] + "~", "after");
				}
			} else {
				li.getFirst().set("text", count);
			}
			if (has(this.customLabels, label))
				delete this.customLabels[label];
			temp[label] = count;
		}
		var resetLabel = false;
		for (var k in this.customLabels) {
			$(k).destroy();
			if (this.config.activeLabel == k)
				resetLabel = true;
		}
		this.customLabels = temp;

		if (resetLabel) {
			this.config.activeLabel = "";
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
		if ((dls > 103) || (uls > 103)) {
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

		return labels;
	},

	"setLabel": function(lbl) {
		var hashes = [];
		for (var i = 0, j = this.trtTable.selectedRows.length; i < j; i++) {
			var key = this.trtTable.selectedRows[i];
			if (this.torrents[key][CONST.TORRENT_LABEL] != lbl)
				hashes.push(key);
		}
		if (hashes.length > 0) {
			var sep = "&v=" + encodeURIComponent(lbl) + "&s=label&hash=";
			this.request("action=setprops&s=label&hash=" + hashes.join(sep) + "&v=" + encodeURIComponent(lbl));
		}
	},

	"newLabel": function() {
		var tmpl = "";
		if (this.trtTable.selectedRows.length == 1)
			tmpl = this.torrents[this.trtTable.selectedRows[0]][CONST.TORRENT_LABEL];
		DialogManager.show("Label");
		var ele = $("txtLabel");
		ele.set("value", (tmpl == "") ? lang[CONST.OV_NEW_LABEL] : tmpl).focus();
		ele.select();
	},

	"createLabel": function() {
		this.setLabel($("txtLabel").get("value"));
	},

	"updateLabels": function() {
		var $me = this;
		["_all_", "_dls_", "_com_", "_act_", "_iac_", "_nlb_"].each(function(key) {
				$(key + "c").set("text", $me.labels[key]);
		});
	},

	"switchLabel": function(element) {
		if (element.id == this.config.activeLabel) return;
		if (this.config.activeLabel != "")
			$(this.config.activeLabel).removeClass("sel");
		element.addClass("sel");
		this.config.activeLabel = element.id;

		if (this.torrentID != "") {
			this.torrentID = "";
			this.clearDetails();
		}

		var activeChanged = false;
		for (var k in this.torrents) {
			if (this.labels[k].indexOf(this.config.activeLabel) > -1) {
				if (this.trtTable.rowData[k].hidden) {
					this.trtTable.unhideRow(k);
					activeChanged = true;
				}
			} else {
				if (!this.trtTable.rowData[k].hidden) {
					this.trtTable.hideRow(k);
					activeChanged = true;
				}
			}
		}

		this.trtTable.clearSelection(activeChanged);
		this.trtTable.curPage = 0;

		if (activeChanged)
			this.trtTable.refreshRows();
	},

	"getSettings": function() {
		var qs = "action=getsettings";
		if (!this.loaded) {
			qs += "&list=1";
			$clear(this.updateTimeout);
			this.timer = $time();
		}
		this.request(qs, this.addSettings);
	},

	"addSettings": function(json) {
		if (!isGuest) {
			if (BUILD_REQUIRED > -1) {
				if (!has(json.settings, "build") || (json.settings.build < BUILD_REQUIRED)) {
					alert("The WebUI requires atleast \u00B5Torrent (build " + BUILD_REQUIRED + ")");
					return;
				}
			}
			var ignored = {
				"activate_on_file": 1,
				"ascon": 1,
				"asdl": 1,
				"asdns": 1,
				"asip": 1,
				"autostart": 1,
				"boss_key": 1,
				"check_assoc_on_start": 1,
				"close_to_tray": 1,
				"confirm_exit": 1,
				"confirm_remove_tracker": 1,
				"confirm_when_deleting": 1,
				"ct_hist_comm": 1,
				"ct_hist_flags": 1,
				"ct_hist_skip": 1,
				"extras": 1,
				"gui.alternate_color": 1,
				"gui.dblclick_dl": 1,
				"gui.dblclick_seed": 1,
				"gui.dlrate_menu": 1,
				"gui.last_overview_tab-1.8": 1,
				"gui.last_preference_tab-1.8": 1,
				"gui.limits_in_statusbar": 1,
				"gui.manual_ratemenu": 1,
				"gui.sg_mode": 1,
				"gui.speed_in_title": 1,
				"gui.ulrate_menu": 1,
				"gui.update_rate": 1,
				"k": 1,
				"language": 1,
				"logger_mask": 1,
				"mainwnd_split": 1,
				"mainwnd_split_x": 1,
				"minimize_to_tray": 1,
				"notify_complete": 1,
				"pd": 1,
				"peer.resolve_country": 1,
				"pu": 1,
				"reload_freq": 1,
				"resolve_peerips": 1,
				"score": 1,
				"show_add_dialog": 1,
				"show_category": 1,
				"show_details": 1,
				"show_status": 1,
				"show_tabicons": 1,
				"show_toolbar": 1,
				"tray.show": 1,
				"tray.single_click": 1,
				"tray_activate": 1,
				"v": 1
			};

			var tcmode = 0;
			for (var i = 0, j = json.settings.length; i < j; i++) {
				var key = json.settings[i][0], typ = json.settings[i][1], val = json.settings[i][2];
				if (key in ignored) continue;
				if ((key == "webui.cookie") && !this.loaded) { // only load webui.cookie on startup
					function safeCopy(objOrig, objNew) {
						$each(objOrig, function (v, k) {
							var tOrig = $type(objOrig[k]),
								tNew = $type(objNew[k]);

							if (tOrig == tNew) {
								if (tOrig == "object") {
									safeCopy(objOrig[k], objNew[k]);
								}
								else {
									objOrig[k] = objNew[k];
								}
							}
						});
					}

					var cookie = this.config, newcookie = JSON.decode(val, true);

					// Pull out only data from received cookie that we already know about.
					// Next best thing short of sanity checking every single value.
					safeCopy(cookie, newcookie);

					this.trtTable.setConfig({
						  "colSort": [cookie.torrentTable.sIndex, cookie.torrentTable.reverse]
						, "colMask": cookie.torrentTable.colMask
						, "colOrder": cookie.torrentTable.colOrder
						, "colWidth": this.config.torrentTable.colWidth
					});

					this.flsTable.setConfig({
						  "colSort": [cookie.fileTable.sIndex, cookie.fileTable.reverse]
						, "colMask": cookie.fileTable.colMask
						, "colOrder": cookie.fileTable.colOrder
						, "colWidth": cookie.fileTable.colWidth
					});

					this.tableUseAltColor(cookie.alternateRows);
					this.tableSetMaxRows(cookie.maxRows);

					resizeUI();

					continue;
				}
				if (key == "gui.graphic_progress") {
					this.tableUseProgressBar(val == "true");
				}
				if ((key != "proxy.proxy") && (key != "webui.username") && (key != "webui.password")) {
					if (typ == 0)
						val = parseInt(val);
					if (typ == 1)
						val = (val == "true");
				}
				switch (key) {
					case "multi_day_transfer_mode_ul": if (val) tcmode = 0; break;
					case "multi_day_transfer_mode_dl": if (val) tcmode = 1; break;
					case "multi_day_transfer_mode_uldl": if (val) tcmode = 2; break;
				}
				this.settings[key] = val;
			}

			// Insert custom keys...
			this.settings["multi_day_transfer_mode"] = tcmode;

{ // TODO: Remove this once backend support is stable
	this.settings["sched_table"] = $pick(this.settings["sched_table"], "033000030000000000000000300300030111010010100101000300030101011010100111033000030101010110100001300000030111010010110111333303030000000000000000000000000000000000000000");
	this.settings["search_list_sel"] = $pick(this.settings["search_list_sel"], 0);
	this.settings["search_list"] = $pick(this.settings["search_list"], "Google|http://google.com/search?q=\r\nBitTorrent|http://www.bittorrent.com/search?client=%v&search=");
}

			// Cleanup
			delete json.settings;
			this.loadSettings();
		}
		if (!this.loaded) {
			if (!(this.config.lang in LANGUAGES)) {
				var langList = "";
				for (var lang in LANGUAGES) {
					langList += "|" + lang;
				}

				var useLang = (navigator.language ? navigator.language : navigator.userLanguage || "").replace("-", "");
				if (useLang = useLang.match(new RegExp(langList.substr(1), "i")))
					useLang = useLang[0];

				if (useLang && (useLang in LANGUAGES))
					this.config.lang = useLang;
				else
					this.config.lang = (this.defConfig.lang || "en");
			}

			loadLangStrings({
				"lang": this.config.lang,
				"onload": (function() {
					if (isGuest) this.update();
					else this.loadTorrents(json);
				}).bind(this)
			});
		}
	},

	"loadSettings": function() {
		for (var key in this.settings) {
			var v = this.settings[key], ele = $(key);
			if (!ele) continue;
			if (ele.type == "checkbox") {
				ele.checked = !!v;
			} else {
				if (key == "seed_ratio")
					v /= 10;
				else if (key == "seed_time")
					v /= 60;
				ele.set("value", v);
			}
			ele.fireEvent("change");
			if (Browser.Engine.trident) ele.fireEvent("click");
		}
		[
			"showDetails",
			"showCategories",
			"showToolbar",
			"showTitleSpeed",
			"updateInterval",
			"alternateRows",
			"confirmDelete",
			"lang"
		].each((function(key) {
			var ele;
			if (!(ele = $("webui." + key))) return;
			var v = this.config[key];
			if (ele.type == "checkbox") {
				ele.checked = ((v == 1) || (v == true));
			} else {
				ele.set("value", v);
			}
		}).bind(this));
		this.config.maxRows = this.config.maxRows.max(this.limits.minTableRows);
		$("webui.maxRows").set("value", this.config.maxRows);
		this.props.multi = {
			"trackers": 0,
			"ulrate": 0,
			"dlrate": 0,
			"superseed": 0,
			"dht": 0,
			"pex": 0,
			"seed_override": 0,
			"seed_ratio": 0,
			"seed_time": 0,
			"ulslots": 0
		};
		if (!this.config.showCategories)
			$("CatList").hide();
		if (!this.config.showDetails && !isGuest)
			$("tdetails").hide();
		if (!this.config.showToolbar && !isGuest)
			$("toolbar").hide();
	},

	"setSettings": function() {
		var value = null, resize = false, reload = false, hasChanged = false;

		value = $("webui.confirmDelete").checked;
		if (this.config.confirmDelete != value) {
			this.config.confirmDelete = value & 1;
			hasChanged = true;
		}

		value = ($("webui.updateInterval").get("value").toInt() || 0);
		if (value < this.limits.minUpdateInterval) {
			value = this.limits.minUpdateInterval;
			$("webui.updateInterval").set("value", value);
		}
		if (this.config.updateInterval != value) {
			this.config.updateInterval = value;
			$clear(this.updateTimeout);
			this.updateTimeout = this.update.delay(value, this);
			hasChanged = true;
		}

		value = $("webui.showTitleSpeed").checked;
		if (this.config.showTitleSpeed != value) {
			this.config.showTitleSpeed = value;
			if (!this.config.showTitleSpeed)
				document.title = g_winTitle;
			hasChanged = true;
		}

		value = $("webui.showCategories").checked;
		if (this.config.showCategories != value) {
			this.toggleCatPanel(value, true);
			resize = true;
			hasChanged = true;
		}

		value = $("webui.showDetails").checked;
		if (this.config.showDetails != value) {
			this.toggleDetPanel(value, true);
			resize = true;
			hasChanged = true;
		}

		value = $("webui.lang").get("value");
		if (this.config.lang != value) {
			this.config.lang = value;
			loadLangStrings({"lang": value});
			hasChanged = true;
		}

		value = ($("webui.maxRows").get("value").toInt() || 0);
		if (value < this.limits.minTableRows) {
			value = this.limits.minTableRows;
			$("webui.maxRows").set("value", value);
		}
		if (this.config.maxRows != value) {
			this.tableSetMaxRows(value);
			hasChanged = true;
		}

		value = $("webui.alternateRows").checked;
		if (this.config.alternateRows != value) {
			this.tableUseAltColor(value);
			hasChanged = true;
		}

		value = $("gui.graphic_progress").checked;
		if (!!this.settings["gui.graphic_progress"] != value) {
			this.tableUseProgressBar(value);
		}

		var str = "";

		if (Browser.Engine.presto && hasChanged)
			str = "&s=webui.cookie&v=" + JSON.encode(this.config);

		resize = resize || (!!this.settings["gui.tall_category_list"] != $("gui.tall_category_list").checked);

		for (var key in this.settings) {
			var ele = $(key);
			if (!ele) continue;
			v = this.settings[key];
			if (ele.type && (ele.type == "checkbox")) {
				nv = ele.checked ? 1 : 0;
			} else {
				nv = ele.get("value");
			}
			if (key == "seed_ratio")
				nv *= 10;
			else if (key == "seed_time")
				nv *= 60;
			else if (key == "search_list")
				nv = nv.split("\n").map(function(item) {
					return item.replace(/[\r\n]+/g, '');
				}).join("\r\n");
			if (v != nv) {
				this.settings[key] = nv;
				if (key == "multi_day_transfer_mode") {
					str +=
						"&s=multi_day_transfer_mode_ul&v=" + (nv == 0 ? 1 : 0) +
						"&s=multi_day_transfer_mode_dl&v=" + (nv == 1 ? 1 : 0) +
						"&s=multi_day_transfer_mode_uldl&v=" + (nv == 2 ? 1 : 0);
					continue;
				}
				str += "&s=" + key + "&v=" + encodeURIComponent(nv);
			}
		}

		if (str != "")
			this.request("action=setsetting" + str, $empty, !reload); // if the page is going to reload make it a synchronous request

		if (this.settings["webui.enable"] == 0) {
			$("msg").set("html", "Goodbye.");
			$("cover").show();
			return;
		}

		var port = (window.location.port ? window.location.port : (window.location.protocol == "http:" ? 80 : 443)),
			new_port = (this.settings["webui.enable_listen"] ? this.settings["webui.port"] : this.settings["bind_port"]);
		if (port != new_port) {
			$("msg").set("html", "Redirecting...");
			$("cover").show();
			changePort.delay(500, null, new_port);
		}
		else if (reload) {
			window.location.reload();
		}
		else if (resize) {
			resizeUI();
		}

	},

	"showSettings": function() {
		DialogManager.show("Settings");
	},

	"searchExecute": function() {
		var searchQuery = $("query").get("value");
		var searchActive = (this.settings["search_list_sel"] || 0);
		var searchURLs = (this.settings["search_list"] || "").split("\r\n");

		searchURLs = searchURLs.map(function(item) {
			if (item) {
				item = (item.split("|")[1] || "");
				if (!item.test(/%s/)) item += "%s";
				return item.replace(/%v/, "utWebUI").replace(/%s/, searchQuery);
			}
		}).filter($chk);

		if (searchURLs[searchActive])
			window.open(searchURLs[searchActive], "_blank");
	},

	"searchMenuSet": function(index) {
		this.request("action=setsetting&s=search_list_sel&v=" + index); // TODO: Generalize settings storage requests

		this.settings["search_list_sel"] = index;
		$("query").focus();
	},

	"searchMenuShow": function(ele) {
		var searchActive = (this.settings["search_list_sel"] || 0);
		var searchURLs = (this.settings["search_list"] || "").split("\r\n");

		searchURLs = searchURLs.map(function(item) {
			if (item)
				return (item.split("|")[0] || "").replace(/ /g, "&nbsp;");
			else
				return "";
		});

		ContextMenu.clear();
		var index = 0
		$each(searchURLs, (function(item) {
			if (!item) {
				ContextMenu.add([CMENU_SEP]);
			}
			else {
				if (index == searchActive)
					ContextMenu.add([CMENU_SEL, item]);
				else
					ContextMenu.add([item, this.searchMenuSet.pass(index, this)]);

				++index;
			}
		}).bind(this));
		var pos = ele.getPosition(), size = ele.getSize();
		pos.x += size.x / 2;
		pos.y += size.y / 2;
		ContextMenu.show(pos);
	},

	"trtDataToRow": function(data) {
		return this.trtColDefs.map(function(item) {
			switch (item[0]) {
				case "availability":
					return data[CONST.TORRENT_AVAILABILITY];

				case "done":
					return data[CONST.TORRENT_PROGRESS];

				case "downloaded":
					return data[CONST.TORRENT_DOWNLOADED];

				case "downspeed":
					return data[CONST.TORRENT_DOWNSPEED];

				case "eta":
					return data[CONST.TORRENT_ETA];

				case "label":
					return data[CONST.TORRENT_LABEL];

				case "name":
					return data[CONST.TORRENT_NAME];

				case "order":
					return data[CONST.TORRENT_QUEUE_POSITION];

				case "peers":
					return data[CONST.TORRENT_PEERS_CONNECTED] + " (" + data[CONST.TORRENT_PEERS_SWARM] + ")";

				case "ratio":
					return data[CONST.TORRENT_RATIO];

				case "remaining":
					return data[CONST.TORRENT_REMAINING];

				case "seeds":
					return data[CONST.TORRENT_SEEDS_CONNECTED] + " (" + data[CONST.TORRENT_SEEDS_SWARM] + ")";

				case "seeds_peers":
					return (data[CONST.TORRENT_PEERS_SWARM]) ? data[CONST.TORRENT_SEEDS_SWARM] / data[CONST.TORRENT_PEERS_SWARM] : Number.MAX_VALUE;

				case "size":
					return data[CONST.TORRENT_SIZE];

				case "status":
					return data[CONST.TORRENT_STATUS];

				case "uploaded":
					return data[CONST.TORRENT_UPLOADED];

				case "upspeed":
					return data[CONST.TORRENT_UPSPEED];
			}
		}, this);
	},

	"trtFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

		var doneIdx = this.trtColDoneIdx, statIdx = this.trtColStatusIdx;
		if (!useidx || index == statIdx) {
			values[statIdx] = this.getStatusInfo(values[statIdx], values[doneIdx])[1]
		}

		for (var i = (index || 0); i < len; i++) {
			switch (this.trtColDefs[i][0]) {
				case "label":
				case "name":
				case "peers":
				case "seeds":
				case "status":
					break;

				case "availability":
					values[i] = (values[i] / 65536).toFixed(3);
					break;

				case "done":
					values[i] = (values[i] / 10).toFixed(1) + "%";
					break;

				case "downloaded":
					values[i] = values[i].toFileSize();
					break;

				case "downspeed":
					values[i] = (values[i] >= 103) ? (values[i].toFileSize() + g_perSec) : "";
					break;

				case "eta":
					values[i] = (values[i] == 0) ? "" :
								(values[i] == -1) ? "\u221E" : values[i].toTimeString();
					break;

				case "ratio":
					values[i] = (values[i] == -1) ? "\u221E" : (values[i] / 1000).toFixed(3);
					break;

				case "order":
					// NOTE: It is known that this displays "*" for all torrents that are finished
					//       downloading, even those that have reached their seeding goal. This
					//       cannot be fixed perfectly unless we always know a torrent's seeding
					//       goal, which we might not if the torrent's goal overrides the global
					//       defaults. We can't know for sure unless we request getprop for each
					//       and every torrent job, which is expensive.
					values[i] = (values[i] <= -1) ? "*" : values[i];
					break;

				case "remaining":
					values[i] = values[i].toFileSize(2);
					break;

				case "seeds_peers":
					values[i] = ($chk(values[i]) && (values[i] != Number.MAX_VALUE)) ? values[i].toFixed(3) : "\u221E";
					break;

				case "size":
					values[i]  = values[i].toFileSize(2);
					break;

				case "uploaded":
					values[i] = values[i].toFileSize();
					break;

				case "upspeed":
					values[i] = (values[i] >= 103) ? (values[i].toFileSize() + g_perSec) : "";
					break;
			}
		}

		if (useidx)
			return values[index];
		else
			return values;
	},

	"trtSortCustom": function(col, datax, datay) {
		var ret = 0;

		switch (this.trtColDefs[col][0]) {
			case "status":
				ret = datax[col] - datay[col];
				if (!ret) {
					var doneIdx = this.trtColDoneIdx;
					ret = datax[doneIdx] - datay[doneIdx];
				}
				break;
		}

		return ret;
	},

	"trtSelect": function(ev, id) {
		if (ev.isRightClick()) {
			if (this.trtTable.selectedRows.length > 0)
				this.showMenu.delay(0, this, [ev, id]);
			if (this.config.showDetails && (this.trtTable.selectedRows.length == 1))
				this.showDetails(id);
		} else {
			if (this.config.showDetails) {
				if (this.trtTable.selectedRows.length == 0) {
					this.torrentID = "";
					this.clearDetails();
				} else if (this.trtTable.selectedRows.length == 1) {
					this.showDetails(id);
				}
			}
		}
	},

	"trtDblClk": function(id) {
		if (this.trtTable.selectedRows.length == 1)
			this.perform((this.torrents[id][CONST.TORRENT_STATUS] & (CONST.STATE_STARTED | CONST.STATE_QUEUED)) ? "stop" : "start");
	},

	"showMenu": function(e, id) {
		var state = this.torrents[id][CONST.TORRENT_STATUS];
		var fstart = [lang[CONST.ML_FORCE_START], this.forceStart.bind(this)];
		var start = [lang[CONST.ML_START], this.start.bind(this)];
		var pause = [lang[CONST.ML_PAUSE], this.pause.bind(this)];
		var stop = [lang[CONST.ML_STOP],  this.stop.bind(this)];
		var recheck = [lang[CONST.ML_FORCE_RECHECK], this.recheck.bind(this)];
		ContextMenu.clear();
		if (!(state & 64)) {
			ContextMenu.add([lang[CONST.ML_FORCE_START]]);
		} else {
			ContextMenu.add(fstart);
		}
		if (this.trtTable.selectedRows.length > 1) {
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
					ContextMenu.add([lang[CONST.ML_START]]);
				}
				ContextMenu.add(pause);
			}
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add([lang[CONST.ML_FORCE_RECHECK]]);
		} else if (state & 2) {
			// checking
			ContextMenu.clear();
			if ((state & 4) || (state & 32)) {
				ContextMenu.add([lang[CONST.ML_FORCE_START]]);
			} else {
				ContextMenu.add(fstart);
			}
			if (state & 64) {
				ContextMenu.add([lang[CONST.ML_START]]);
			} else {
				ContextMenu.add(start);
			}
			ContextMenu.add(pause);
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add([lang[CONST.ML_FORCE_RECHECK]]);
		} else if (state & 16) {
			// error
			ContextMenu.clear();
			ContextMenu.add(fstart);
			ContextMenu.add([lang[CONST.ML_START]]);
			ContextMenu.add([lang[CONST.ML_PAUSE]]);
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(recheck);
		} else if (state & 64) {
			// queued
			ContextMenu.add([lang[CONST.ML_START]]);
			ContextMenu.add(pause);
			ContextMenu.add(stop);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(recheck);
		} else {
			ContextMenu.clear();
			ContextMenu.add(fstart);
			ContextMenu.add(start);
			ContextMenu.add([lang[CONST.ML_PAUSE]]);
			ContextMenu.add([lang[CONST.ML_STOP]]);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(recheck);
		}
		ContextMenu.add([CMENU_SEP]);
		var lgroup = [], $me = this, labelcount = 0;
		$each(this.customLabels, function(_, k) {
			++labelcount;
			k = k.substr(1, k.length - 2);
			if ($me.trtTable.selectedRows.every(function(item){ return ($me.torrents[item][11] == k); })) {
				lgroup.push([CMENU_SEL, k]);
	 		} else {
				lgroup.push([k, $me.setLabel.bind($me, k)]);
			}
		});
		if (labelcount) lgroup.push([CMENU_SEP]);
		lgroup.push([lang[CONST.OV_NEW_LABEL], this.newLabel.bind(this)]);
		lgroup.push([lang[CONST.OV_REMOVE_LABEL], this.setLabel.bind(this, "")]);
		if (lgroup.length > 0) {
			ContextMenu.add([CMENU_CHILD, lang[CONST.ML_LABEL], lgroup]);
			ContextMenu.add([CMENU_SEP]);
		}
		ContextMenu.add([lang[CONST.ML_REMOVE], this.remove.bind(this, 0)]);
		ContextMenu.add([CMENU_CHILD, lang[CONST.ML_REMOVE_AND], [[lang[CONST.ML_DELETE_DATA], this.remove.bind(this, 1)]]]);
		ContextMenu.add([CMENU_SEP]);
		ContextMenu.add([lang[CONST.ML_PROPERTIES], this.showProperties.bind(this)]);
		ContextMenu.show(e.page);
	},

	"showProperties": function(k) {
		this.propID = (this.trtTable.selectedRows.length != 1) ? "multi" : this.trtTable.selectedRows[0];
		if (this.propID != "multi")
			this.request("action=getprops&hash=" + this.propID, this.loadProperties);
		else
			this.updateMultiProperties();
	},

	"loadProperties": function(json) {
		var props = json.props[0], id = this.propID;
		if (!has(this.props, id))
			this.props[id] = {};
		for (var k in props)
			this.props[id][k] = props[k];
		this.updateProperties();
	},

	"updateMultiProperties": function() {
		$("prop-trackers").value = "";
		$("prop-ulrate").value = "";
		$("prop-dlrate").value = "";
		$("prop-ulslots").value = "";
		$("prop-seed_ratio").value = "";
		$("prop-seed_time").value = "";
		$("prop-superseed").checked = "";
		var ele = $("prop-seed_override");
		ele.checked = false;
		ele.disabled = true;
		ele.fireEvent(Browser.Engine.trident ? "click" : "change");
		$("DLG_TORRENTPROP_1_GEN_11").addEvent("click", function(ev) {
			ev.stop();
			ele.disabled = !ele.disabled;
		});
		var ids = {
			"superseed": 17,
			"dht": 18,
			"pex": 19
		};
		Hash.each(ids, function(v, k) {
			var e = $("prop-" + k);
			e.disabled = true;
			e.checked = false;
			$("DLG_TORRENTPROP_1_GEN_" + v).removeClass("disabled").addEvent("click", function(ev) {
				ev.stop();
				e.disabled = !e.disabled;
			});
		});
		$("dlgProps-header").set("text", "|[" + this.trtTable.selectedRows.length + " Torrents]| - " + lang[CONST.DLG_TORRENTPROP_00]);
		DialogManager.show("Props");
	},

	"updateProperties": function() {
		var props = this.props[this.propID];
		$("prop-trackers").value = props.trackers;
		$("prop-ulrate").value = (props.ulrate / 1024).toInt();
		$("prop-dlrate").value = (props.dlrate / 1024).toInt();
		$("prop-ulslots").value = props.ulslots;
		var ele = $("prop-seed_override");
		ele.disabled = false;
		ele.checked = !!props.seed_override;
		ele.fireEvent(Browser.Engine.trident ? "click" : "change");
		$("prop-seed_ratio").value = props.seed_ratio / 10;
		$("prop-seed_time").value = props.seed_time / 60;
		$("prop-superseed").checked = props.superseed;
		var ids = {
			"superseed": 17,
			"dht": 18,
			"pex": 19
		};
		for (var k in ids) {
			var dis = (props[k] == -1);
			if (k == "dht")
				dis = !this.settings.dht_per_torrent;
			ele = $("prop-" + k);
			ele.disabled = dis;
			ele.checked = (props[k] == 1);
			$("DLG_TORRENTPROP_1_GEN_" + ids[k])[dis ? "addClass" : "removeClass"]("disabled");
		}
		$("dlgProps-header").set("text", this.torrents[this.propID][CONST.TORRENT_NAME] + " - " + lang[CONST.DLG_TORRENTPROP_00]);
		DialogManager.show("Props");
	},

	"setProperties": function() {
		var str = "";
		for (var k in this.props[this.propID]) {
			if (k == "hash") continue;
			var v = this.props[this.propID][k], nv, ele = $("prop-" + k);
			if (ele.type == "checkbox") {
				if ((this.propID == "multi") && ele.disabled) continue;
				nv = ele.checked ? 1 : 0;
			} else {
				nv = ele.get("value");
				if ((this.propID == "multi") && (nv == "")) continue;
			}
			if ((this.propID != "multi") && (((k == "dht") && (v == -1)) || ((k == "pex") && (v == -1)))) continue;
			if (k == "seed_ratio")
				nv *= 10;
			else if (k == "seed_time")
				nv *= 60;
			else if (k == "dlrate")
				nv *= 1024;
			else if (k == "ulrate")
				nv *= 1024;
			else if (k == "trackers") {
				nv = nv.split("\n").map(function(item) {
					return item.replace(/[\r\n]+/g, '');
				}).join("\r\n");
			}
			if ((v != nv) || (this.propID == "multi")) {
				str += "&s=" + k + "&v=" + encodeURIComponent(nv);
				if (this.propID != "multi")
					this.props[this.propID][k] = nv;
			}
		}
		if (this.propID == "multi") {
			[11, 17, 18, 19].each(function(v) {
				$("DLG_TORRENTPROP_1_GEN_" + v).removeEvents("click");
			});
		}
		this.propID = "";
		if (str != "")
			this.request("action=setprops&hash=" + this.trtTable.selectedRows.join(str + "&hash=") + str);
	},

	"showDetails": function(id) {
		this.flsTable.clearRows();
		this.torrentID = id;
		this.getFiles(id);
		this.updateDetails();
	},

	"clearDetails": function() {
		this.flsTable.clearRows();
		["rm", "dl", "ul", "ra", "us", "ds", "se", "pe", "hs"].each(function(id) {
			$(id).set("html", "");
		});
	},

	"updateDetails": function() {
		if (this.torrentID != "") {
			var d = this.torrents[this.torrentID];
			$("hs").set("html", this.torrentID);
			$("dl").set("html", d[CONST.TORRENT_DOWNLOADED].toFileSize());
			$("ul").set("html", d[CONST.TORRENT_UPLOADED].toFileSize());
			$("ra").set("html", (d[CONST.TORRENT_RATIO] == -1) ? "\u221E" : (d[CONST.TORRENT_RATIO] / 1000).toFixed(3));
			$("us").set("html", d[CONST.TORRENT_UPSPEED].toFileSize() + g_perSec);
			$("ds").set("html", d[CONST.TORRENT_DOWNSPEED].toFileSize() + g_perSec);
			$("rm").set("html", (d[CONST.TORRENT_ETA] == 0) ? "" : (d[CONST.TORRENT_ETA] <= -1) ? "\u221E" : d[CONST.TORRENT_ETA].toTimeString());
			$("se").set("html", lang[CONST.GN_XCONN].replace(/%d/, d[CONST.TORRENT_SEEDS_CONNECTED]).replace(/%d/, d[CONST.TORRENT_SEEDS_SWARM]).replace(/%d/, "\u00BF?"));
			$("pe").set("html", lang[CONST.GN_XCONN].replace(/%d/, d[CONST.TORRENT_PEERS_CONNECTED]).replace(/%d/, d[CONST.TORRENT_PEERS_SWARM]).replace(/%d/, "\u00BF?"));
		}
	},

	"addURL": function() {
		var url = escape($("url").get("value"));
		$("url").set("value", "");
		if (url != "") {
			var cookie = $("cookies").get("value");
			$("cookies").set("value", "");
			if (cookie != "")
				url += ":COOKIE:" + cookie;
			this.request("action=add-url&s=" + url, $empty);
		}
	},

	"updateFiles": function(hash) {
		if ((this.torrentID == hash) && has(this.files, hash)) {
			this.getFiles(hash, true);
			this.updateDetails();
		}
	},

	"loadFiles": function() {
		var id = this.torrentID;
		if (id != "") {
			if (!has(this.flsTable.rowData, id + "_0")) { // don't unnecessarily reload the table
				this.flsTable.dBody.scrollLeft = 0;
				this.flsTable.dBody.scrollTop = 0;
				this.files[id].each(function(file, i) {
					this.flsTable.addRow(this.flsDataToRow(file), id + "_" + i);
				}, this);
				this.flsTable.calcSize();
				this.flsTable.refreshRows();
			}
			this.flsTable.loadObj.hide.delay(200, this.flsTable.loadObj);
		}
	},

	"getFiles": function(id, update) {
		if (!has(this.files, id) || update) {
			this.files[id] = [];
			if (update)
				this.flsTable.clearRows();
			if (this.tabs.active == "FileList")
				this.flsTable.loadObj.show();
			this.request("action=getfiles&hash=" + id, this.addFiles);
		} else {
			if (this.tabs.active == "FileList") {
				this.flsTable.loadObj.show();
				this.loadFiles.delay(20, this);
			}
		}
	},

	"addFiles": function(json) {
		var files = json.files;
		if (files == undefined) return;
		this.files[files[0]] = files[1];
		if (this.tabs.active == "FileList")
			this.loadFiles();
	},

	"flsDataToRow": function(data) {
		return this.flsColDefs.map(function(item) {
			switch (item[0]) {
				case "done":
					return data[CONST.FILE_DOWNLOADED];

				case "name":
					return data[CONST.FILE_NAME];

				case "pcnt":
					return data[CONST.FILE_DOWNLOADED] / data[CONST.FILE_SIZE] * 1000;

				case "prio":
					return data[CONST.FILE_PRIORITY];

				case "size":
					return data[CONST.FILE_SIZE];
			}
		}, this);
	},

	"flsFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

		for (var i = (index || 0); i < len; i++) {
			switch (this.flsColDefs[i][0]) {
				case "name":
					break;

				case "done":
				case "size":
					values[i] = values[i].toFileSize(2);
					break;

				case "pcnt":
					values[i] = (values[i] / 10).toFixed(1) + "%";
					break;

				case "prio":
					values[i] = lang[CONST["FI_PRI" + values[i]]];
			}
		}


		if (useidx)
			return values[index];
		else
			return values;
	},

	"flsSelect": function(ev, id) {
		if (this.flsTable.selectedRows.length > 0)
			this.showFileMenu.delay(0, this, ev);
	},

	"showFileMenu": function(ev) {
		if (!ev.isRightClick()) return;

		var id = this.torrentID;
		var menuItems = [];

		//--------------------------------------------------
		// Priority Selection
		//--------------------------------------------------

		var prioItems = [
			  [lang[CONST.MF_DONT], this.setPriority.bind(this, [id, CONST.FILEPRIORITY_SKIP])]
			, [CMENU_SEP]
			, [lang[CONST.MF_LOW], this.setPriority.bind(this, [id, CONST.FILEPRIORITY_LOW])]
			, [lang[CONST.MF_NORMAL], this.setPriority.bind(this, [id, CONST.FILEPRIORITY_NORMAL])]
			, [lang[CONST.MF_HIGH], this.setPriority.bind(this, [id, CONST.FILEPRIORITY_HIGH])]
		];

		// Gray out items based on priorities of selected files
		var fileIds = this.getSelFileIds(id, -1);
		if (fileIds.length <= 0) return;

		var p = this.files[id][fileIds[0]][CONST.FILE_PRIORITY];
		for (var i = 1, l = fileIds.length; i < l; ++i) {
			if (p != this.files[id][fileIds[i]][CONST.FILE_PRIORITY]) {
				p = -1;
				break;
			}
		}
		if (p >= 0) {
			if (p > 0) ++p;
			delete prioItems[p][1];
		}

		menuItems = menuItems.concat(prioItems.reverse());

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		for (var i = 0, l = menuItems.length; i < l; ++i) {
			ContextMenu.add(menuItems[i]);
		}
		ContextMenu.show(ev.page);
	},

	"getSelFileIds": function(id, p) {
		var ids = [];
		var len = this.flsTable.selectedRows.length;
		while (len--) {
			var rowId = this.flsTable.selectedRows[len]
			var fileId = rowId.match(/.*_([0-9]+)$/)[1].toInt();
			if (this.files[id][fileId][CONST.FILE_PRIORITY] != p) {
				ids.push(fileId);
			}
		}
		return ids;
	},

	"setPriority": function(id, p) {
		var fileIds = this.getSelFileIds(id, p);
		if (fileIds.length <= 0) return;

		this.request("action=setprio&hash=" + id + "&p=" + p + "&f=" + fileIds.join("&f="), (function() {
			$each(fileIds, function(v) {
				var rowId = id + "_" + v;
				this.files[id][v][CONST.FILE_PRIORITY] = p;

				this.flsTable.rowData[rowId].data[this.flsColPrioIdx] = p;
				this.flsTable.updateCell(rowId, this.flsColPrioIdx);
			}, this);
		}).bind(this));
	},

	"trtColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.trtColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.trtColDefs.map(function(item, idx) { return item[1]; })
		};

		this.trtColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.trtTable.setConfig(config);
		$extend(this.config.torrentTable, config);
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"trtSort": function(index, reverse) {
		this.config.torrentTable.sIndex = index;
		this.config.torrentTable.reverse = reverse;
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"trtColMove": function() {
		this.config.torrentTable.colOrder = this.trtTable.colOrder;
		this.config.torrentTable.sIndex = this.trtTable.sIndex;
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"trtColResize": function() {
		this.config.torrentTable.colWidth = this.trtTable.getColumnWidths();
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"trtColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.torrentTable.colMask |= num;
		} else {
			this.config.torrentTable.colMask &= ~num;
		}
		if (!nosave && Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.flsColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.flsColDefs.map(function(item, idx) { return item[1]; })
		};

		this.flsColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.flsTable.setConfig(config);
		$extend(this.config.fileTable, config);
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsSort": function(index, reverse) {
		this.config.fileTable.sIndex = index;
		this.config.fileTable.reverse = reverse;
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsColMove": function() {
		this.config.fileTable.colOrder = this.flsTable.colOrder;
		this.config.fileTable.sIndex = this.flsTable.sIndex;
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsColResize": function() {
		this.config.fileTable.colWidth = this.flsTable.getColumnWidths();
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.fileTable.colMask |= num;
		} else {
			this.config.fileTable.colMask &= ~num;
		}
		if (!nosave && Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsDblClk": function(id) {
		if (this.flsTable.selectedRows.length != 1) return;
		var hash = id.match(/(.*)_[0-9]+$/)[1];
		var fid = id.match(/.*_([0-9]+)$/)[1].toInt();
		this.setPriority(hash, (this.files[hash][fid][CONST.FILE_PRIORITY] + 1) % 4);
	},

	"restoreUI" : function(bc) {
		if ((bc != false) && !confirm("Are you sure that you want to restore the interface?")) return;
		//$("stg").hide();
		$("msg").set("html", "Reloading...");
		$("cover").show();
		window.removeEvents("unload");
		this.config = {};
		this.saveConfig(false, function(){ window.location.reload(false); });
	},

	"saveConfig": function(async, callback) {
		this.request("action=setsetting&s=webui.cookie&v=" + JSON.encode(this.config), callback || null, async || false);
	},

	"toggleCatPanel": function(show, noresize) {
		if (!$defined(show)) {
			show = !this.config.showDetails;
		}

		$("CatList")[show ? "show" : "hide"]();
		this.config.showCategories = show;

		if (!noresize) {
			resizeUI();
		}
	},

	"toggleDetPanel": function(show, noresize) {
		if (!$defined(show)) {
			show = !this.config.showDetails;
		}

		$("tdetails")[show ? "show" : "hide"]();
		this.config.showDetails = show;

		if (!noresize) {
			resizeUI();
		}
	},

	"toggleToolbar": function(show, noresize) {
		if (!$defined(show)) {
			show = !this.config.showToolbar;
		}

		$("toolbar")[show ? "show" : "hide"]();
		this.config.showToolbar = show;

		if (!noresize) {
			resizeUI();
		}
	},

	"tableSetMaxRows": function(max) {
		max = (max || 0).max(this.limits.minTableRows);
		this.config.maxRows = max;
		this.trtTable.setConfig({"rowMaxCount": max});
		this.flsTable.setConfig({"rowMaxCount": max});
	},

	"tableUseAltColor": function(enable) {
		this.config.alternateRows = enable;
		this.trtTable.setConfig({"rowAlternate": enable});
		this.flsTable.setConfig({"rowAlternate": enable});
	},

	"tableUseProgressBar": function(enable) {
		var progFunc = $lambda(enable ? TYPE_NUM_PROGRESS : TYPE_NUMBER);
		var trtProgCols = this.trtColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		var flsProgCols = this.flsColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		this.trtTable.setConfig({"colType": trtProgCols.map(progFunc).associate(trtProgCols)});
		this.flsTable.setConfig({"colType": flsProgCols.map(progFunc).associate(flsProgCols)});
	},

	"tabChange": function(id) {
		if (id == "FileList") {
			if (this.torrentID == "") {
				this.flsTable.calcSize();
				return;
			}
			if (has(this.flsTable.rowData, this.torrentID + "_0")) return;
			this.flsTable.loadObj.show();
			this.loadFiles.delay(20, this);
		} else if (id == "spgraph") {
			SpeedGraph.draw();
		}
	}/*,

	"showFolderBrowser": function() {
		$("dlgFolders").centre().show();
	}*/

}
