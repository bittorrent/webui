/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var VERSION = "0.362";
var BUILD_REQUIRED = -1; // the uT build that WebUI requires
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
	"langLoaded": false,
	"TOKEN": "",
	"delActions": ["remove", "removedata"],

	"init": function() {
		this.config = {
			"showDetails": true,
			"showCategories": true,
			"showToolbar": true,
			"showTitleSpeed": false,
			"updateInterval": 3000,
			"alternateRows": false,
			"confirmDelete": true,
			"lang": "en",
			"hSplit": this.limits.defHSplit,
			"vSplit": this.limits.defVSplit,
			"trtCols": 0x0000,
			"torrentTable": {
				"reverse": false,
				"maxRows": 50,
				"colOrder": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
				"colWidth": [220,100,80,80,100,80,60,80,80,60,80,60,60,60,30,90],
				"sIndex": -1,
				"rowsSelectable": !isGuest
			},
			"flsCols": 0x0000,
			"fileTable": {
				"reverse": false,
				"maxRows": 50,
				"colOrder": [0,1,2,3,4],
				"colWidth": [200,60,80,100,80],
				"sIndex": -1
			},
			"activeLabel": "_all_"
		};
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
			var stat = this.torrents[key][0];
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
			mode = (utWebUI.settings["gui.default_del_action"] <= 1) ? 0 : 1
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
		} else if (state & CONST.STATE_STARTED) { // started, seeding or leeching
			res = [(done == 1000) ? "Status_Up" : "Status_Down", (done == 1000) ? lang[CONST.OV_FL_SEEDING] : lang[CONST.OV_FL_DOWNLOADING]];
			if (!(state & CONST.STATE_QUEUED)) { // forced start
				res[1] = "[F] " + res[1];
			}
		} else if (state & CONST.STATE_CHECKING) { // checking
			res = ["Status_Checking", lang[CONST.OV_FL_CHECKED].replace(/%:\.1d%/, (done / 10))];
		} else if (state & CONST.STATE_ERROR) { // error
			res = ["Status_Error", lang[CONST.OV_FL_ERROR].replace(/%s/, "??")];
		} else if (state & CONST.STATE_QUEUED) { // queued
			res = [(done == 1000) ? "Status_Queued_Up" : "Status_Queued_Down", lang[CONST.OV_FL_QUEUED]];
		} else if (done == 1000) { // finished
			res = ["Status_Completed", lang[CONST.OV_FL_FINISHED]];
		} else { // stopped
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
			var tor = torrents[i];
			if (torrents[i][10] < -1)
				console.log(torrents[i]);
			var hash = tor[CONST.TORRENT_HASH];
			var done = tor[CONST.TORRENT_PROGRESS];
			var stat = this.getStatusInfo(tor[CONST.TORRENT_STATUS], done);
			this.totalDL += tor[CONST.TORRENT_DOWNSPEED];
			this.totalUL += tor[CONST.TORRENT_UPSPEED];
			tor.swap(CONST.TORRENT_UPSPEED, CONST.TORRENT_DOWNSPEED);
			tor.splice(3, 0, stat[1]);

			if (!has(this.labels, hash))
				this.labels[hash] = "";
			var labels = this.getLabels(hash, tor[12], done, tor[9], tor[10]), ret = false, activeChanged = false;
			if (!has(this.torrents, hash)) {
				this.torrents[hash] = tor.slice(1);
				this.labels[hash] = labels;
				tor.splice(0, 2); // remove the hash & status from the array
	                        // Remove the SID from the list before it goes to
                                // the table for display.
                                tor.pop(); tor.pop();
			        tor[11] = tor[11] + " (" + tor[12] + ")";
				tor[12] = tor[13] + " (" + tor[14] + ")";
				tor[13] = tor[15];
				tor.splice(13, 2);
				this.trtTable.addRow(tor, hash, stat[0], (labels.indexOf(this.config.activeLabel) == -1), this.loaded || (this.trtTable.sIndex == -1));
				ret = true;
			} else {
				if (labels != this.labels[hash]) {
					this.labels[hash] = labels;
					if (labels.indexOf(this.config.activeLabel) > -1) {
						if (this.trtTable.rowData[hash].hidden) {
							this.trtTable.rowData[hash].hidden = false;
							activeChanged = true;
						}
					} else {
						if (!this.trtTable.rowData[hash].hidden) {
							this.trtTable.rowData[hash].hidden = true;
							activeChanged = true;
						}
					}
				}
				var ln = tor.length - 7;
				var prevtor = this.torrents[hash];
				if ((prevtor[0] != tor[1]) || (this.trtTable.rowData[hash].data[1] != stat[1])) { // status/done changed?
					this.torrents[hash][0] = tor[1];
					this.trtTable.setIcon(hash, stat[0]);
					ret = this.trtTable.setValue(hash, 1, stat[1]);
				}
				if ((prevtor[12] != tor[13]) || (prevtor[13] != tor[14])) { // # of peers changed?
					this.torrents[hash][12] = tor[13];
					this.torrents[hash][13] = tor[14];
					ret = this.trtTable.setValue(hash, 11, tor[13] + " (" + tor[14] + ")");
				}
				if ((prevtor[14] != tor[15]) || (prevtor[15] != tor[16])) { // # of seeds changed?
					this.torrents[hash][14] = tor[15];
					this.torrents[hash][15] = tor[16];
					ret = this.trtTable.setValue(hash, 12, tor[15] + " (" + tor[16] + ")");
				}
				for (var j = 16; j < 20; j++) {
					if (prevtor[j] != tor[j + 1]) {
						this.torrents[hash][j] = tor[j + 1];
						ret = this.trtTable.setValue(hash, j - 3, tor[j + 1]);
					}
				}
				for (var j = 1; j < ln; j++) {
					if (prevtor[j] != tor[j + 1]) {
						this.torrents[hash][j] = tor[j + 1];
						ret = this.trtTable.setValue(hash, j - 1, tor[j + 1]);
					}
				}
				if (!ret && activeChanged)
					this.trtTable._insertRow(hash);
			}
			sortedColChanged = ret || sortedColChanged;
			tor = null;
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
		var str = lang[CONST.MAIN_TITLEBAR_SPEED].replace(/%s/, this.totalDL.toFileSize() + perSec).replace(/%s/, this.totalUL.toFileSize() + perSec);
		window.status = window.defaultStatus = str.replace(/%s/, "");
		if (this.config.showTitleSpeed)
			document.title = str.replace(/%s/, "\u00B5Torrent WebUI v" + VERSION);
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
				li = new Element("li", {"id": label})
					.addEvent("mousedown", function(){ utWebUI.switchLabel(this); })
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
			if (this.torrents[key][11] != lbl)
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
			tmpl = this.torrents[this.trtTable.selectedRows[0]][11];
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
					var oldcookie = this.config, newcookie = JSON.decode(json.settings[i][2], true);

					for (var key in oldcookie) {
						// Pull out only data from received cookie that we already know about.
						// Next best thing short of sanity checking every single value.
						if (typeof(oldcookie[key]) == typeof(newcookie[key])) {
							oldcookie[key] = newcookie[key];
						}
					}

					this.config.torrentTable.alternateRows =
					this.config.fileTable.alternateRows =
						this.config.alternateRows;

					continue;
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
			this.settings["multi_day_transfer_mode"] = tcmode;
			delete json.settings;
			this.loadSettings();
		}
		if (!this.loaded) {
			var detectLang = (navigator.language) ? navigator.language : navigator.userLanguage;
			var matches;
			if (matches = detectLang.match(/af|ar|az|be|ca|cs|de|en|eo|es|et|fr|it|ja|nl|pt|sv/i))
				detectLang = matches[0];
			if ((lang !== null) && ((lang_code == this.config.lang) || ((this.config.lang == "auto") && (lang_code == detectLang)))) {
				setupUI();
				if (isGuest)
					this.update();
				else
					this.loadTorrents(json);
			} else {
				Asset.javascript("lang/" + ((this.config.lang == "auto") ? detectLang : this.config.lang) + ".js", {"onload": isGuest ? setupUI : function() { setupUI(); utWebUI.loadTorrents(json); }});
			}
		}
	},

	"loadSettings": function() {
		for (var key in this.settings) {
			var v = this.settings[key], ele = $(key);
			if (!ele || key == "seed_time") continue;
			if (ele.type == "checkbox") {
				ele.checked = !!v;
			} else {
				if (key == "seed_ratio")
					v /= 10;
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
		].each(function(key) {
			var ele;
			if (!(ele = $("webui." + key))) return;
			var v = utWebUI.config[key];
			if (ele.type == "checkbox") {
				ele.checked = ((v == 1) || (v == true));
			} else {
				ele.set("value", v);
			}
		});
		this.config.torrentTable.maxRows = (this.config.fileTable.maxRows || 0).max(this.limits.minTableRows);
		$("webui.maxRows").set("value", this.config.torrentTable.maxRows);
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
				document.title = "\u00B5Torrent WebUI v" + VERSION;
			hasChanged = true;
		}

		value = $("webui.alternateRows").checked;
		if (this.config.alternateRows != value) {
			this.config.alternateRows = value;
			this.trtTable.options.alternateRows = this.flsTable.options.alternateRows = this.config.alternateRows;
			this.trtTable.refreshSelection();
			this.flsTable.refreshSelection();
			hasChanged = true;
		}

		value = $("webui.showCategories").checked;
		if (this.config.showCategories != value) {
			this.config.showCategories = (value) ? 1 : 0;
			$("CatList")[(!this.config.showCategories) ? "hide" : "show"]();
			resize = true;
			hasChanged = true;
		}

		value = $("webui.showDetails").checked;
		if (this.config.showDetails != value) {
			this.config.showDetails = (value) ? 1 : 0;
			$("tdetails")[(!this.config.showDetails) ? "hide" : "show"]();
			resize = true;
			hasChanged = true;
		}

		value = $("webui.maxRows").value.toInt();
		if (this.config.torrentTable.maxRows != value) {
			this.config.torrentTable.maxRows = this.config.fileTable.maxRows = value;
			//this.trtTable.setMaxRows(this.config.maxRows);
			//this.flsTable.setMaxRows(this.config.maxRows);
			reload = true;
			hasChanged = true;
		}

		value = $("webui.lang").get("value");
		if (this.config.lang != value) {
			this.config.lang = value;
			reload = true;
			hasChanged = true;
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
			if (v != nv) {
				this.settings[key] = nv;
				if (key == "multi_day_transfer_mode") {
					str +=
						"&s=multi_day_transfer_mode_ul&v=" + (nv == 0 ? 1 : 0) +
						"&s=multi_day_transfer_mode_dl&v=" + (nv == 1 ? 1 : 0) +
						"&s=multi_day_transfer_mode_uldl&v=" + (nv == 2 ? 1 : 0);
					continue;
				}
				if (key == "gui.persistent_labels") {
					nv = encodeURIComponent(nv);
				}
				str += "&s=" + key + "&v=" + nv;
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
		} else if (reload) {
			window.location.reload();
		} else if (resize) {
			resizeUI();
		}

	},

	"showSettings": function() {
		if (!this.langLoaded && !isGuest)
			loadSettingStrings();
		DialogManager.show("Settings");
	},

	"trtSelect": function(ev, id) {
		if (ev.isRightClick()) {
			if (this.config.showDetails && (this.trtTable.selectedRows.length == 1))
				this.showDetails(id);
			if (this.trtTable.selectedRows.length > 0)
				this.showMenu(ev, id);
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
			this.perform((this.torrents[id][0] & CONST.STATE_STARTED) ? "stop" : "start");
	},

	"showMenu": function(e, id) {
		var state = this.torrents[id][0];
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
		var lgroup = [], $me = this;
		$each(this.customLabels, function(_, k) {
			k = k.substr(1, k.length - 2);
			if ($me.trtTable.selectedRows.every(function(item){ return ($me.torrents[item][11] == k); })) {
				lgroup.push([CMENU_SEL, k]);
	 		} else {
				lgroup.push([k, $me.setLabel.bind($me, k)]);
			}
		});
		lgroup.push([CMENU_SEP]);
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
		$("dlgProps-header").set("text", this.torrents[this.propID][1] + " - " + lang[CONST.DLG_TORRENTPROP_00]);
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
				var a = nv.split("\n"), len = a.length;
				nv = "";
				for (var i = 0; i < len; i++) {
					nv += a[i].replace(/\s+/, "") + "\r\n";
				}
				if (nv.substr(-4, 4) == "\r\n\r\n")
					nv = nv.substr(0, nv.length - 2);
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
			var d = this.torrents[this.torrentID].slice(1);
			$("hs").set("html", this.torrentID); // hash
			$("dl").set("html", d[4].toFileSize()); // downloaded
			$("ul").set("html", d[5].toFileSize()); // uploaded
			$("ra").set("html", (d[6] == -1) ? "\u221E" : (d[6] / 1000).toFixed(3)); // ratio
			$("us").set("html", d[8].toFileSize() + perSec); // upload speed
			$("ds").set("html", d[7].toFileSize() + perSec); // download speed
			$("rm").set("html", (d[9] == 0) ? "" : (d[9] <= -1) ? "\u221E" : d[9].toTimeString()); // ETA
			$("se").set("html", lang[CONST.GN_XCONN].replace(/%d/, d[13]).replace(/%d/, d[14]).replace(/%d/, "\u00BF?")); // seeds
			$("pe").set("html", lang[CONST.GN_XCONN].replace(/%d/, d[11]).replace(/%d/, d[12]).replace(/%d/, "\u00BF?")); // peers
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
					var data = $A(file);
					data.push(data[3].toInt());
					data[3] = ((data[1] > 0) ? ((data[2] / data[1]) * 100).toFixed(1) : 100);
					this.flsTable.addRow(data, id + "_" + i);
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

	"flsSelect": function(ev, id) {
		if (this.flsTable.selectedRows.length > 0)
			this.showFileMenu(e, id.substr(41).toInt());
	},

	"showFileMenu": function(ev, ind) {
		if (!ev.isRightClick()) return;

		var id = this.torrentID;
		var p = this.files[id][ind][3];

		var high = [lang[CONST.MF_HIGH], this.setPriority.bind(this, [id, 3])];
		var normal = [lang[CONST.MF_NORMAL], this.setPriority.bind(this, [id, 2])];
		var low = [lang[CONST.MF_LOW], this.setPriority.bind(this, [id, 1])];
		var skip = [lang[CONST.MF_DONT], this.setPriority.bind(this, [id, 0])];

		ContextMenu.clear();
		if (this.flsTable.selectedRows.length > 1) {
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
			ContextMenu.add([lang[CONST.MF_DONT]]);
		} else if (p == 1) {
			// low
			ContextMenu.add(high);
			ContextMenu.add(normal);
			ContextMenu.add([lang[CONST.MF_LOW]]);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(skip);
		} else if (p == 2) {
			// normal
			ContextMenu.add(high);
			ContextMenu.add([lang[CONST.MF_NORMAL]]);
			ContextMenu.add(low);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(skip);
		} else if (p == 3) {
			// high
			ContextMenu.add([lang[CONST.MF_HIGH]]);
			ContextMenu.add(normal);
			ContextMenu.add(low);
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add(skip);
		}
		ContextMenu.show(ev.page);
	},

	"getFileIds": function(id, p) {
		var ids = [];
		var len = this.flsTable.selectedRows.length;
		while (len--) {
			var fileId = this.flsTable.selectedRows[len].substr(41).toInt();
			if (this.files[id][fileId][3] != p) {
				ids.push(fileId);
				this.files[id][fileId][3] = p;
				this.flsTable.setValue(this.flsTable.selectedRows[len], 4, p);
			}
		}
		return ids;
	},

	"setPriority": function(id, p) {
		this.request("action=setprio&hash=" + id + "&p=" + p + "&f=" + this.getFileIds(id, p).join("&f="));
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
		this.config.torrentTable.colWidth = this.trtTable.colWidth;
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"trtColToggle": function(index, enable) {
		var num = 1 << index;
		if (enable) {
			this.config.trtCols |= num;
		} else {
			this.config.trtCols &= ~num;
		}
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
		this.config.fileTable.colWidth = this.flsTable.colWidth;
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsColToggle": function(index, enable) {
		var num = 1 << index;
		if (enable) {
			this.config.flsCols |= num;
		} else {
			this.config.flsCols &= ~num;
		}
		if (Browser.Engine.presto)
			this.saveConfig(true);
	},

	"flsDblClk": function(id) {
		if (this.flsTable.selectedRows.length != 1) return;
		var hash = id.substring(0, 40);
		this.setPriority(hash, (this.files[hash][id.substr(41).toInt()][3] + 1) % 4);
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
