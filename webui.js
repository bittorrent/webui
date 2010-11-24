/**
 * Copyright 2007 BitTorrent, Inc. All rights reserved.
 * Copyright 2008 Carsten Niebuhr
 */

var LANGUAGES = LANGUAGES || {};
var lang = lang || null;
var urlBase = window.location.pathname.substr(0, window.location.pathname.indexOf("/gui"));
var guiBase = urlBase + "/gui/";
var proxyBase = urlBase + "/proxy";
var isGuest = window.location.pathname.test(/.*guest.html$/);

var utWebUI = {

	"torrents": {},
	"peers": {},
	"files": {},
	"settings": {},
	"props": {},
	"xferhist": {},
	"dirlist": [],
	"labels": {
		"cat_all": 0, // all
		"cat_dls": 0, // downloading
		"cat_com": 0, // completed
		"cat_act": 0, // active
		"cat_iac": 0, // inactive
		"cat_nlb": 0  // no-label
	},
	"customLabels": {},
	"torQueueMax": -1,
	"cacheID": 0,
	"limits": {
		"reqRetryDelayBase": 2, // seconds
		"reqRetryMaxAttempts": 5,
		"minTableRows": 5,
		"maxVirtTableRows": Math.ceil(screen.height / 16) || 100,
		"minUpdateInterval": 500,
		"minDirListCache": 30, // seconds
		"minXferHistCache": 60, // seconds
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
		"showStatusBar": true,
		"updateInterval": 3000,
		"maxRows": 0,
		"lang": "en",
		"hSplit": -1,
		"vSplit": -1,
		"torrentTable": {
			"colMask": 0x0000, // automatically calculated based on this.trtColDefs
			"colOrder": [], // automatically calculated based on this.trtColDefs
			"colWidth": [], // automatically calculated based on this.trtColDefs
//			"mode": MODE_VIRTUAL,
			"reverse": false,
			"sIndex": -1
		},
		"peerTable": {
			"colMask": 0x0000, // automatically calculated based on this.prsColDefs
			"colOrder": [], // automatically calculated based on this.prsColDefs
			"colWidth": [], // automatically calculated based on this.prsColDefs
//			"mode": MODE_VIRTUAL,
			"reverse": false,
			"sIndex": -1
		},
		"fileTable": {
			"colMask": 0x0000, // automatically calculated based on this.flsColDefs
			"colOrder": [], // automatically calculated based on this.flsColDefs
			"colWidth": [], // automatically calculated based on this.flsColDefs
//			"mode": MODE_VIRTUAL,
			"reverse": false,
			"sIndex": -1
		},
		"advOptTable": {
//			"mode": MODE_VIRTUAL,
			"rowMultiSelect": false
		},
		"activeLabelID": "cat_all"
	},
	"torrentID": "", // selected torrent
	"propID": "", // selected torrent (single)
	"trtTable": new dxSTable(),
	"prsTable": new dxSTable(),
	"flsTable": new dxSTable(),
	"advOptTable": new dxSTable(),
	"trtColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 220, TYPE_STRING]
		, ["order", 35, TYPE_NUM_ORDER]
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
	"prsColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["ip", 200, TYPE_STRING] // TODO: See if this should use TYPE_CUSTOM
		, ["port", 60, TYPE_NUMBER, true]
		, ["client", 125, TYPE_STRING]
		, ["flags", 60, TYPE_STRING]
		, ["pcnt", 80, TYPE_NUM_PROGRESS]
		, ["relevance", 70, TYPE_NUMBER, true]
		, ["downspeed", 80, TYPE_NUMBER]
		, ["upspeed", 80, TYPE_NUMBER]
		, ["reqs", 40, TYPE_STRING]
		, ["waited", 60, TYPE_NUMBER, true]
		, ["uploaded", 70, TYPE_NUMBER]
		, ["downloaded", 70, TYPE_NUMBER]
		, ["hasherr", 70, TYPE_NUMBER, true]
		, ["peerdl", 70, TYPE_NUMBER]
		, ["maxup", 70, TYPE_NUMBER, true]
		, ["maxdown", 70, TYPE_NUMBER, true]
		, ["queued", 70, TYPE_NUMBER, true]
		, ["inactive", 60, TYPE_NUMBER, true]
	],
	"flsColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 300, TYPE_STRING]
		, ["size", 90, TYPE_NUMBER]
		, ["done", 90, TYPE_NUMBER]
		, ["pcnt", 80, TYPE_NUM_PROGRESS]
		, ["prio", 80, TYPE_NUMBER]
	],
	"advOptColDefs": [
		//[ colID, colWidth, colType, colDisabled = false, colAlign = ALIGN_AUTO, colText = "" ]
		  ["name", 215, TYPE_STRING]
		, ["value", 210, TYPE_STRING]
	],
	"flsColPrioIdx": -1, // automatically calculated based on this.flsColDefs
	"updateTimeout": null,
	"totalDL": 0,
	"totalUL": 0,
	"loaded": false,
	"TOKEN": "",
	"delActions": ["remove", "removetorrent", "removedata", "removedatatorrent"],

	"advSettings": {
		  "bt.allow_same_ip": ""
		, "bt.auto_dl_enable": ""
		, "bt.auto_dl_factor": ""
		, "bt.auto_dl_interval": ""
		, "bt.auto_dl_qos_min": ""
		, "bt.auto_dl_sample_average": ""
		, "bt.auto_dl_sample_window": ""
		, "bt.ban_ratio": ""
		, "bt.ban_threshold": ""
		, "bt.compact_allocation": ""
		, "bt.connect_speed": ""
		, "bt.determine_encoded_rate_for_streamables": ""
		, "bt.enable_pulse": ""
		, "bt.enable_tracker": ""
		, "bt.failover_peer_speed_threshold": ""
		, "bt.graceful_shutdown": ""
		, "bt.multiscrape": ""
		, "bt.no_connect_to_services": ""
		, "bt.no_connect_to_services_list": ""
		, "bt.prio_first_last_piece": ""
		, "bt.prioritize_partial_pieces": ""
		, "bt.pulse_interval": ""
		, "bt.pulse_weight": ""
		, "bt.ratelimit_tcp_only": ""
		, "bt.scrape_stopped": ""
		, "bt.send_have_to_seed": ""
		, "bt.set_sockbuf": ""
		, "bt.shutdown_tracker_timeout": ""
		, "bt.shutdown_upnp_timeout": ""
		, "bt.tcp_rate_control": ""
		, "bt.transp_disposition": ""
		, "bt.use_ban_ratio": ""
		, "bt.use_rangeblock": ""
		, "btapps.auto_update_btapps": ""
		, "btapps.auto_update_btinstalls": ""
		, "btapps.install_unsigned_apps": ""
		, "dht.rate": ""
		, "diskio.coalesce_write_size": ""
		, "diskio.coalesce_writes": ""
		, "diskio.flush_files": ""
		, "diskio.no_zero": ""
		, "diskio.resume_min": ""
		, "diskio.smart_hash": ""
		, "diskio.smart_sparse_hash": ""
		, "diskio.sparse_files": ""
		, "diskio.use_partfile": ""
		, "gui.auto_restart": ""
		, "gui.bypass_search_redirect": ""
		, "gui.color_progress_bars": ""
		, "gui.combine_listview_status_done": ""
		, "gui.compat_diropen": ""
		, "gui.default_del_action": ""
		, "gui.delete_to_trash": ""
		, "gui.graph_legend": ""
		, "gui.graph_overhead": ""
		, "gui.graph_tcp_rate_control": ""
		, "gui.graphic_progress": ""
		, "gui.log_date": ""
		, "gui.piecebar_progress": ""
		, "gui.report_problems": ""
		, "gui.show_av_icon": ""
		, "gui.show_dropzone": ""
		, "gui.show_rss_favicons": ""
		, "gui.tall_category_list": ""
		, "gui.toolbar_labels": ""
		, "gui.transparent_graph_legend": ""
		, "gui.update_rate": ""
		, "ipfilter.enable": ""
		, "isp.bep22": ""
		, "isp.fqdn": ""
		, "isp.peer_policy_enable": ""
		, "isp.peer_policy_url": ""
		, "isp.primary_dns": ""
		, "isp.secondary_dns": ""
		, "net.bind_ip": ""
		, "net.calc_rss_overhead": ""
		, "net.calc_tracker_overhead": ""
		, "net.disable_ipv6": ""
		, "net.disable_incoming_ipv6": ""
		, "net.discoverable": ""
		, "net.limit_excludeslocal": ""
		, "net.low_cpu": ""
		, "net.max_halfopen": ""
		, "net.outgoing_ip": ""
		, "net.outgoing_max_port": ""
		, "net.outgoing_port": ""
		, "net.upnp_tcp_only": ""
		, "net.utp_dynamic_packet_size": ""
		, "net.utp_initial_packet_size": ""
		, "net.utp_packet_size_interval": ""
		, "net.utp_receive_target_delay": ""
		, "net.utp_target_delay": ""
		, "net.wsaevents": ""
		, "peer.disconnect_inactive": ""
		, "peer.disconnect_inactive_interval": ""
		, "peer.lazy_bitfield": ""
		, "peer.resolve_country": ""
		, "queue.dont_count_slow_dl": ""
		, "queue.dont_count_slow_ul": ""
		, "queue.prio_no_seeds": ""
		, "queue.slow_dl_threshold": ""
		, "queue.slow_ul_threshold": ""
		, "queue.use_seed_peer_ratio": ""
		, "rss.feed_as_default_label": ""
		, "rss.smart_repack_filter": ""
		, "rss.update_interval": ""
		, "streaming.failover_rate_factor": ""
		, "streaming.failover_rate_factor": ""
		, "streaming.failover_set_percentage": ""
		, "streaming.min_buffer_piece": ""
		, "streaming.safety_factor": ""
		, "sys.enable_wine_hacks": ""
		, "webui.allow_pairing": ""
		, "webui.token_auth": ""
	},

	"init": function() {
		this.config = Object.merge(this.defConfig, {"lang": ""}); // deep copy default config

		// Calculate index of some columns for ease of reference elsewhere
		this.trtColDoneIdx = this.trtColDefs.map(function(item) { return (item[0] == "done"); }).indexOf(true);
		this.trtColStatusIdx = this.trtColDefs.map(function(item) { return (item[0] == "status"); }).indexOf(true);
		this.flsColPrioIdx = this.flsColDefs.map(function(item) { return (item[0] == "prio"); }).indexOf(true);

		// Set default colMask values based on colDefs
		this.trtColDefs.each(function(item, index) { this.trtColToggle(index, item[3], true); }, this);
		this.prsColDefs.each(function(item, index) { this.prsColToggle(index, item[3], true); }, this);
		this.flsColDefs.each(function(item, index) { this.flsColToggle(index, item[3], true); }, this);

		this.getSettings();
	},

	"showMsg": function(html) {
		if (typeOf(html) === 'element') {
			$("msg").clear().grab(html);
		}
		else {
			$("msg").set("html", html);
		}
		$("cover").show();
	},

	"hideMsg": function() {
		$("cover").hide();
	},

	"beginPeriodicUpdate": function(delay) {
		this.endPeriodicUpdate();

		delay = parseInt(delay, 10);
		if (isNaN(delay)) delay = this.config.updateInterval;

		this.config.updateInterval = delay = delay.max(this.limits.minUpdateInterval);
		this.updateTimeout = this.update.delay(delay, this);
	},

	"endPeriodicUpdate": function() {
		clearTimeout(this.updateTimeout);
		clearInterval(this.updateTimeout);
	},

	"proxyFiles": function(sid, fids, streaming) {

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) return;
}

		$each($$(".downloadfrm"), function(frm) {
			frm.dispose().destroy();
		}, this);

		$each(fids, function(fid) {
			new IFrame({
				"class": "downloadfrm",
				"src": proxyBase + "?sid=" + sid + "&file=" + fid + "&disposition=" + (streaming ? "INLINE" : "ATTACHMENT") + "&service=DOWNLOAD&qos=0",
				"styles": {
					  display: "none"
					, height: 0
					, width: 0
				}
			}).inject(document.body);
		}, this);
	},

	"request": function(qs, fn, async, fails) {
		if (typeOf(fails) != 'array') fails = [0]; // array so to pass by reference

		var self = this;

		var req = function() {
			try {
				new Request.JSON({
					"url": guiBase + "?token=" + self.TOKEN + "&" + qs + "&t=" + Date.now(),
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

						self.endPeriodicUpdate();

						fails[0]++;
						var delay = Math.pow(self.limits.reqRetryDelayBase, fails[0]);
						if (fails[0] <= self.limits.reqRetryMaxAttempts) {
							log("Request failure #" + fails[0] + " (will retry in " + delay + " seconds): " + qs);
						}
						else {
							window.removeEvents("unload");
							self.showMsg(
								'WebUI is having trouble contacting &micro;Torrent.<br />' +
								'Try <a href="#" onclick="window.location.reload(true);">reloading</a> the page.'
							);
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
								self.beginPeriodicUpdate();
							}
						}, async, fails]);
					},
					"onSuccess": (fn) ? fn.bind(self) : Function.from()
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
				"url": guiBase + "token.html?t=" + Date.now(),
				"method": "get",
				"async": !!async,
				"onFailure": (fn) ? fn.bind(self) : Function.from(),
				"onSuccess": function(str) {
					var match = str.match(/>([^<]+)</);
					if (match) self.TOKEN = match[match.length - 1];
					if (fn) fn.delay(0);
				}
			}).send();
		} catch(e){}
	},

	"perform": function(action) {
		var hashes = this.getHashes(action);

		if (hashes.length == 0) {
			if (action == "pause") {
				action = "unpause";
				hashes = this.getHashes("unpause");
			}
		}

		if (hashes.length == 0) return;

		if (action.test(/^remove/) && hashes.contains(this.torrentID)) {
			this.torrentID = "";
			this.clearDetails();
		}

		this.getList("action=" + action + "&hash=" + hashes.join("&hash="), (function() {
			this.updateToolbar();
		}).bind(this));
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
					if ((stat & 32) || (!(stat & 64) && !(stat & 1))) continue;
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

				case "queueup":
				case "queuedown":
				case "queuetop":
				case "queuebottom":
					key = { qnum: this.torrents[key][CONST.TORRENT_QUEUE_POSITION], hash: key };
					if (key.qnum <= 0) continue;
					break;

				case "remove":
				case "removetorrent":
				case "removedata":
				case "removedatatorrent":
					break;

				default:
					continue;
			}

			hashes.push(key);
		}

		// Sort hash list for queue reordering, since the backend executes
		// actions sequentially in the order that the hashes are passed in the
		// GET argument list.
		var hashcount = hashes.length;
		if (hashcount > 0 && act.test(/^queue/)) {
			var queueLimMin = 1,
				queueLimMax = this.torQueueMax;

			// Filter setup
			var sortdir;
			switch (act) {
				case "queuedown":
				case "queuetop":
					sortdir = -1;
					break;

				case "queueup":
				case "queuebottom":
					sortdir = 1;
					break;
			}

			var limsetter, qfilter;
			switch (act) {
				case "queuedown":
					limsetter = function(item) {
						if (item.qnum == queueLimMax)
							--queueLimMax;
					};
					qfilter = function(item) {
						return (item.qnum <= queueLimMax);
					};
					break;

				case "queueup":
					limsetter = function(item) {
						if (item.qnum == queueLimMin)
							++queueLimMin;
					};
					qfilter = function(item) {
						return (queueLimMin <= item.qnum);
					};
					break;

				case "queuebottom":
					var qmin = Number.MAX_VALUE;
					limsetter = function(_, i, list) {
						var qnum = list[hashcount-i-1].qnum;
						if (qnum == queueLimMax)
							--queueLimMax;
						if (qnum < qmin)
							qmin = qnum;
					};
					qfilter = function(item) {
						return (qmin < queueLimMax);
					};
					break;

				case "queuetop":
					var qmax = -Number.MAX_VALUE;
					limsetter = function(_, i, list) {
						var qnum = list[hashcount-i-1].qnum;
						if (qnum == queueLimMin)
							++queueLimMin;
						if (qmax < qnum)
							qmax = qnum;
					};
					qfilter = function(item) {
						return (queueLimMin < qmax);
					};
					break;

				default:
					limsetter = Function.from();
					qfilter = Function.from(true);
			}

			// Process hash list
			hashes = hashes.sort(function(x, y) {
				return sortdir * (x.qnum < y.qnum ? -1 : (x.qnum > y.qnum ? 1 : 0));
			}).each(limsetter).filter(qfilter).map(function(item) {
				return item.hash;
			});
		}

		return hashes;
	},

	"forcestart": function() {
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

	"queueup": function(top) {
		this.perform(!!top ? "queuetop" : "queueup");
	},

	"queuedown": function(bot) {
		this.perform(!!bot ? "queuebottom" : "queuedown");
	},

	"removeDefault": function(shift) {
		this.remove((this.settings["gui.default_del_action"] || 0) | (shift ? 2 : 0));
	},

	"remove": function(mode) {
		if (DialogManager.modalIsVisible()) return;

		var count = this.trtTable.selectedRows.length;
		if (count == 0) return;

		mode = parseInt(mode, 10);
		if (isNaN(mode) || mode < 0 || this.delActions.length <= mode)
			mode = this.settings["gui.default_del_action"] || 0;

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) mode &= ~1; // force non-.torrent removal mode
}

		var act = this.perform.bind(this, this.delActions[mode]);

		if (this.settings["confirm_when_deleting"]) {
			var ask;
			switch (mode) {
				case CONST.TOR_REMOVE:
				case CONST.TOR_REMOVE_TORRENT:
					ask = ((count == 1) ? CONST.OV_CONFIRM_DELETE_ONE : CONST.OV_CONFIRM_DELETE_MULTIPLE);
					break;
				case CONST.TOR_REMOVE_DATA:
				case CONST.TOR_REMOVE_DATATORRENT:
					ask = ((count == 1) ? CONST.OV_CONFIRM_DELETEDATA_ONE : CONST.OV_CONFIRM_DELETEDATA_MULTIPLE);
			}

			$("dlgDelTor-message").set("text", lang[ask].replace(/%d/, count));
			$("DELTOR_YES").addEvent("click", function(ev) {
				$("DELTOR_NO").fireEvent("click", ev);
				act();
			});

			DialogManager.show("DelTor");
			$("DELTOR_YES").focus();
		}
		else {
			act();
		}
	},

	"recheck": function() {
		this.perform("recheck");
	},

	"getList": function(qs, fn) {
		this.endPeriodicUpdate();
		qs = qs || "";
		if (qs != "")
			qs += "&";
		this.request(qs + "list=1&cid=" + this.cacheID + "&getmsg=1", (function(json) {
			this.loadList(json);
			if (fn) fn(json);
		}).bind(this));
	},

	"getStatusInfo": function(state, done) {
		var res = ["", ""];

		if (state & CONST.STATE_PAUSED) { // paused
			res = ["Status_Paused", (state & CONST.STATE_CHECKING) ? lang[CONST.OV_FL_CHECKED].replace(/%:\.1d%/, (done / 10).toFixedNR(1)) : lang[CONST.OV_FL_PAUSED]];
		}
		else if (state & CONST.STATE_STARTED) { // started, seeding or leeching
			res = (done == 1000) ? ["Status_Up", lang[CONST.OV_FL_SEEDING]] : ["Status_Down", lang[CONST.OV_FL_DOWNLOADING]];
			if (!(state & CONST.STATE_QUEUED)) { // forced start
				res[1] = "[F] " + res[1];
			}
		}
		else if (state & CONST.STATE_CHECKING) { // checking
			res = ["Status_Checking", lang[CONST.OV_FL_CHECKED].replace(/%:\.1d%/, (done / 10).toFixedNR(1))];
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
			res = ["Status_Incomplete", lang[CONST.OV_FL_STOPPED]];
		}

		return res;
	},

	"loadList": function(json) {
		function extractLists(fullListName, changedListName, removedListName, key, exList) {
			var extracted = {};

			if (!has(json, fullListName)) {
				extracted[fullListName] = json[changedListName];
				delete json[changedListName];

				extracted[removedListName] = json[removedListName];
				delete json[removedListName];
			}
			else {
				var list = extracted[fullListName] = json[fullListName];
				delete json[fullListName];

				// What:
				//   Remove items that no longer exist, for the situation in which
				//   the backend sends the full items list ('torrents', for example)
				//   even though a cid was sent with the list=1 request.
				// When:
				//   This happens when the sent cid is not valid, which happens when
				//   multiple sessions of WebUI are sending interleaved list=1&cid=...
				//   requests.
				// Why:
				//   When this happens, WebUI no longer has a proper removed items
				//   list ('torrentm', for example) by which it can actually remove
				//   those items that have been removed from the backend.
				// How:
				//   This fixes it by comparing the received full items list with the
				//   list of existing items to see which keys no longer exist, and
				//   manually generating a removed items list from that.
				// Note:
				//   The alternative, instead of comparing, would be to clear the
				//   list completely and replace it with this list instead, but that
				//   is likely to be less efficient when taking into account the fact
				//   that more DOM manipulations would have to be used to repopulate
				//   any UI elements dependent on the list.

				var removed = extracted[removedListName] = [];

				var exKeys = {};
				for (var k in exList) {
					exKeys[k] = 1;
				}
				for (var i = 0, len = list.length; i < len; i++) {
					if (has(exKeys, list[i][key]))
						delete exKeys[list[i][key]];
				}
				for (var k in exKeys) {
					removed.push(k);
				}
			}

			return extracted;
		}

		var torrentLists = extractLists("torrents", "torrentp", "torrentm", CONST.TORRENT_HASH, this.torrents);
		var torrents = torrentLists.torrents;

		this.loadLabels(Array.clone(json.label));
		delete json.label;
		if (!this.loaded) {
			if (!has(this.labels, this.config.activeLabelID) && !has(this.customLabels, decodeID(this.config.activeLabelID.replace(/^lbl_/, '')))) {
				this.config.activeLabelID = "cat_all";
				$("cat_all").addClass("sel");
			} else {
				$("cat_all").removeClass("sel");
				$(this.config.activeLabelID).addClass("sel");
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
				activeChanged = (rdata.hidden == labels.contains(this.config.activeLabelID));
				if (activeChanged) rdata.hidden = !rdata.hidden;

				this.trtTable.setIcon(hash, statinfo[0]);

				row.each(function(v, k) {
					if (v != rdata.data[k]) {
						ret = this.trtTable.updateCell(hash, k, row) || ret;

						if ("done" == this.trtColDefs[k][0]) {
							// Update the "Status" column if "Done" column changed (in case "Checking" percentage needs updating)
							ret = this.trtTable.updateCell(hash, this.trtColStatusIdx, row) || ret;
						}
					}
				}, this);

				if (!ret && activeChanged) {
					this.trtTable._insertRow(hash);
				}
			}
			else {
				// New torrent found... add to list
				this.trtTable.addRow(row, hash, statinfo[0], (!labels.contains(this.config.activeLabelID)), this.loaded || (this.trtTable.sIndex == -1));
				ret = true;
			}

			this.torrents[hash] = tor;
			sortedColChanged = sortedColChanged || ret;
		}
		torrents.length = 0;
		if (has(torrentLists, "torrentm")) {
			var clear = false;
			for (var i = 0, j = torrentLists.torrentm.length; i < j; i++) {
				var k = torrentLists.torrentm[i];
				delete this.torrents[k];

				if (this.labels[k].contains("cat_nlb"))
					this.labels["cat_nlb"]--;

				if (this.labels[k].contains("cat_com"))
					this.labels["cat_com"]--;

				if (this.labels[k].contains("cat_dls"))
					this.labels["cat_dls"]--;

				if (this.labels[k].contains("cat_act"))
					this.labels["cat_act"]--;

				if (this.labels[k].contains("cat_iac"))
					this.labels["cat_iac"]--;

				this.labels["cat_all"]--;
				delete this.labels[k];
				this.trtTable.removeRow(k);
				if (this.torrentID == k)
					clear = true;
			}
			delete torrentLists.torrentm;
			if (clear) {
				this.torrentID = "";
				this.clearDetails();
			}
		}
		var queueMax = -1;
		Object.each(this.torrents, function(trtData) {
			if (queueMax < trtData[CONST.TORRENT_QUEUE_POSITION]) {
				queueMax = trtData[CONST.TORRENT_QUEUE_POSITION];
			}
		});
		this.torQueueMax = queueMax;

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
			this.hideMsg();
		}
		this.trtTable.refresh();

		this.beginPeriodicUpdate();
		this.updateDetails();
		SpeedGraph.addData(this.totalUL, this.totalDL);

		this.updateTitle();
		this.updateToolbar();
		this.updateStatusBar();
	},

	"update": function() {
		this.totalDL = 0;
		this.totalUL = 0;

		this.getList();

		if (typeof(DialogManager) !== 'undefined') {
			if (DialogManager.showing.contains("Settings") && ("dlgSettings-TransferCap" == this.stpanes.active)) {
				this.getTransferHistory();
			}
		}
	},

	"loadLabels": function(labels) {
		var labelList = $("mainCatList-labels"), temp = {};
		labels.each(function (lbl, idx) {
			var label = lbl[0], labelId = "lbl_" + encodeID(label), count = lbl[1], li = null;
			if ((li = $(labelId))) {
				li.getElement("span").set("text", count);
			}
			else {
				$me = this;
				(new Element("li", {"id": labelId})
					.addEvent("mousedown", function() { $me.switchLabel(this); })
					.appendText(label + " (")
					.grab(new Element("span").set("text", count))
					.appendText(")")
				.inject(labelList));
			}
			if (has(this.customLabels, label))
				delete this.customLabels[label];
			temp[label] = count;
		}, this);

		var resetLabel = false;
		for (var k in this.customLabels) {
			var id = "lbl_" + encodeID(k);
			$(id).destroy();
			if (this.config.activeLabelID == id) {
				resetLabel = true;
			}
		}
		this.customLabels = temp;

		if (resetLabel) {
			this.config.activeLabelID = "";
			this.switchLabel($("cat_all"));
		}
	},

	"getLabels": function(id, label, done, dls, uls) {
		var labels = [];
		if (label == "") {
			labels.push("cat_nlb");
			if (!this.labels[id].contains("cat_nlb"))
				this.labels["cat_nlb"]++;
		} else {
			labels.push("lbl_" + encodeID(label));
			if (this.labels[id].contains("cat_nlb"))
				this.labels["cat_nlb"]--;
		}
		if (done < 1000) {
			labels.push("cat_dls");
			if (!this.labels[id].contains("cat_dls"))
				this.labels["cat_dls"]++;
			if (this.labels[id].contains("cat_com"))
				this.labels["cat_com"]--;
		} else {
			labels.push("cat_com");
			if (!this.labels[id].contains("cat_com"))
				this.labels["cat_com"]++;
			if (this.labels[id].contains("cat_dls"))
				this.labels["cat_dls"]--;
		}
		if ((dls > 103) || (uls > 103)) {
			labels.push("cat_act");
			if (!this.labels[id].contains("cat_act"))
				this.labels["cat_act"]++;
			if (this.labels[id].contains("cat_iac"))
				this.labels["cat_iac"]--;
		} else {
			labels.push("cat_iac");
			if (!this.labels[id].contains("cat_iac"))
				this.labels["cat_iac"]++;
			if (this.labels[id].contains("cat_act"))
				this.labels["cat_act"]--;
		}
		labels.push("cat_all");

		if (this.labels[id] == "")
			this.labels["cat_all"]++;

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
		var ele = $("dlgLabel-label");
		ele.set("value", (tmpl == "") ? lang[CONST.OV_NEW_LABEL] : tmpl).focus();
		ele.select();
	},

	"createLabel": function() {
		this.setLabel($("dlgLabel-label").get("value"));
	},

	"updateLabels": function() {
		var $me = this;
		["cat_all", "cat_dls", "cat_com", "cat_act", "cat_iac", "cat_nlb"].each(function(key) {
			$(key + "_c").set("text", $me.labels[key]);
		});
	},

	"switchLabel": function(element) {
		if (element.id == this.config.activeLabelID) return;
		if (this.config.activeLabelID != "")
			$(this.config.activeLabelID).removeClass("sel");
		element.addClass("sel");
		this.config.activeLabelID = element.id;

		if (this.torrentID != "") {
			this.torrentID = "";
			this.clearDetails();
		}

		var activeChanged = false;
		for (var k in this.torrents) {
			if (this.labels[k].contains(this.config.activeLabelID)) {
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

		if (activeChanged) {
			this.trtTable.refreshRows();
			this.trtTable.calcSize();
		}
	},

	"getDirectoryList": function(forceload) {

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) return;
}

		var now = Date.now();
		if (forceload || !this.dirlist._TIME_ || (now - this.dirlist._TIME_) > (this.limits.minDirListCache * 1000)) {
			this.request("action=list-dirs", (function (json) {
				this.dirlist = json["download-dirs"];
				this.dirlist._TIME_ = now;

				this.loadDirectoryList();
			}).bind(this));
		}
		else {
			this.loadDirectoryList();
		}
	},

	"loadDirectoryList": function() {
		var list = this.dirlist;

		// Throw data into frontend
		list[0].path = "Default download directory";
		var items = list.map(function (dir) {
			return '[' + parseInt(dir.available, 10).toFileSize(2, 2) + ' free] '+ dir.path;
		});

		_loadComboboxStrings("dlgAdd-basePath", items, $("dlgAdd-basePath").value);
		_loadComboboxStrings("dlgAddURL-basePath", items, $("dlgAddURL-basePath").value);
	},

	"getTransferHistory": function(forceload) {

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) return;
}

		var now = Date.now();
		if (forceload || !this.xferhist._TIME_ || (now - this.xferhist._TIME_) > (this.limits.minXferHistCache * 1000)) {
			this.request("action=getxferhist", (function (json) {
				this.xferhist = json.transfer_history;
				this.xferhist._TIME_ = now;

				this.loadTransferHistory();
			}).bind(this));
		}
		else {
			this.loadTransferHistory();
		}
	},

	"loadTransferHistory": function() {
		var history = this.xferhist;

		// Obtain number of days to consider
		if (!lang) return;
		var periodList = lang[CONST.ST_CBO_TCAP_PERIODS].split("||");
		var periodIdx = ($("multi_day_transfer_limit_span").get("value").toInt() || 0).max(0).min(periodList.length-2);
		var period = periodList[periodIdx].toInt();

		// Calculate uploads/downloads applicable to transfer cap
		var nolocal = this.getAdvSetting("net.limit_excludeslocal");

		var tu = 0, td = 0;
		for (var day = 0; day < period; day++) {
			tu += history["daily_upload"][day];
			td += history["daily_download"][day];
			if (nolocal) {
				tu -= history["daily_local_upload"][day];
				tu -= history["daily_local_download"][day];
			}
		}

		// Reduce precision for readability
		$("total_uploaded_history").set("text", tu.toFileSize());
		$("total_downloaded_history").set("text", td.toFileSize());
		$("total_updown_history").set("text", (tu + td).toFileSize());
		$("history_period").set("text", lang[CONST.DLG_SETTINGS_7_TRANSFERCAP_11].replace(/%d/, period));
	},

	"resetTransferHistory": function() {

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) return;
}

		this.request("action=resetxferhist");
	},

	"getSettings": function() {
		if (isGuest) {
			this.addSettings();
		}
		else {
			var qs = "action=getsettings";
			if (!this.loaded) {
				qs += "&list=1";
				this.endPeriodicUpdate();
			}
			this.request(qs, this.addSettings);
		}
	},

	"addSettings": function(json) {
		var loadCookie = (function (newcookie) {
			function safeCopy(objOrig, objNew) {
				$each(objOrig, function (v, k) {
					var tOrig = typeOf(objOrig[k]),
						tNew = typeOf(objNew[k]);

					if (tOrig === tNew) {
						if (tOrig === "object") {
							safeCopy(objOrig[k], objNew[k]);
						}
						else {
							objOrig[k] = objNew[k];
						}
					}
				});
			}

			var cookie = this.config;

			// Pull out only data from received cookie that we already know about.
			// Next best thing short of sanity checking every single value.
			safeCopy(cookie, newcookie || {});

			this.trtTable.setConfig({
				  "colSort": [cookie.torrentTable.sIndex, cookie.torrentTable.reverse]
				, "colMask": cookie.torrentTable.colMask
				, "colOrder": cookie.torrentTable.colOrder
				, "colWidth": this.config.torrentTable.colWidth
			});

			this.prsTable.setConfig({
				  "colSort": [cookie.peerTable.sIndex, cookie.peerTable.reverse]
				, "colMask": cookie.peerTable.colMask
				, "colOrder": cookie.peerTable.colOrder
				, "colWidth": cookie.peerTable.colWidth
			});

			this.flsTable.setConfig({
				  "colSort": [cookie.fileTable.sIndex, cookie.fileTable.reverse]
				, "colMask": cookie.fileTable.colMask
				, "colOrder": cookie.fileTable.colOrder
				, "colWidth": cookie.fileTable.colWidth
			});

			this.tableSetMaxRows(cookie.maxRows);

			resizeUI();
		}).bind(this);

		if (isGuest) {
			loadCookie();
		}
		else {
			var tcmode = 0;
			for (var i = 0, j = json.settings.length; i < j; i++) {
				var key = json.settings[i][CONST.SETTING_NAME],
					typ = json.settings[i][CONST.SETTING_TYPE],
					val = json.settings[i][CONST.SETTING_VALUE],
					par = json.settings[i][CONST.SETTING_PARAMS] || {};

				// handle cookie
				if ((key == "webui.cookie") && !this.loaded) { // only load cookie on startup
					loadCookie(JSON.decode(val, true));
					continue;
				}

				// convert types
				switch (typ) {
					case CONST.SETTINGTYPE_INTEGER: val = val.toInt(); break;
					case CONST.SETTINGTYPE_BOOLEAN: val = ('true' === val); break;
				}

				// handle special settings
				switch (key) {
					case "multi_day_transfer_mode_ul": if (val) tcmode = 0; break;
					case "multi_day_transfer_mode_dl": if (val) tcmode = 1; break;
					case "multi_day_transfer_mode_uldl": if (val) tcmode = 2; break;

					case "gui.alternate_color": this.tableUseAltColor(val); break;
					case "gui.graphic_progress": this.tableUseProgressBar(val); break;
					case "gui.log_date": Logger.setLogDate(val); break;

					case "bt.transp_disposition": $("enable_bw_management").checked = !!(val & CONST.TRANSDISP_UTP); break;
				}

				// handle special parameters

				// TODO: See if we need anything more in implementing support for par.access
				if (CONST.SETTINGPARAM_ACCESS_RO === par.access) {
					if ($(key)) $(key).addClass("disabled");
				}

				// insert into settings map and show
				this.settings[key] = val;
				_unhideSetting(key);
			}

			// Insert custom keys...
			this.settings["multi_day_transfer_mode"] = tcmode;

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	this.settings["sched_table"] = [this.settings["sched_table"], "033000330020000000000000300303003222000000000000000303003020000000000000033003003111010010100101000303003101011010100111300303003101010110100001033020330111010010110111"].pick();
	this.settings["search_list_sel"] = [this.settings["search_list_sel"], 0].pick();
	this.settings["search_list"] = [this.settings["search_list"], "BitTorrent|http://www.bittorrent.com/search?client=%v&search=\r\nGoogle|http://google.com/search?q=filetype%3Atorrent+\r\nMininova|http://www.mininova.org/search/?cat=0&search=\r\nVuze|http://search.vuze.com/xsearch/?q="].pick();
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
				"onload": this.update.bind(this)
			});
		}
	},

	"getAdvSetting": function(name) {
		if (name in this.advOptTable.rowData) {
			// TODO: Will need to rewrite bits of stable.js so that
			//       there is a clean API for obtaining values...

			return this.advOptTable.rowData[name].data[1]; // TODO: Remove hard-coded index...
		}
	},

	"setAdvSetting": function(name, val) {
		if (undefined != val && (name in this.advOptTable.rowData)) {
			// TODO: Will need to rewrite bits of stable.js so that
			//       there is a clean API for setting values...

			this.advOptTable.rowData[name].data[1] = val;
			this.advOptTable.updateCell(name, 1); // TODO: Remove hard-coded index...
		}
	},

	"loadSettings": function() {
		// Advanced settings
		this.advOptTable.clearSelection();
		this.advOptSelect();

		$each(this.advSettings, function(val, key) {
			if (undefined != this.settings[key]) {
				if (undefined != this.getAdvSetting(key)) {
					this.setAdvSetting(key, this.settings[key]);
				}
				else {
					this.advOptTable.addRow([key, this.settings[key]], key);
				}
			}
		}, this);

		// Other settings
		for (var key in this.settings) {
			var v = this.settings[key], ele = $(key);
			if (!ele) continue;
			if (ele.type == "checkbox") {
				ele.checked = !!v;
			} else {
				switch (key) {
					case "seed_ratio":
						v /= 10; break;
					case "seed_time":
						v /= 60; break;
				}
				ele.set("value", v);
			}
			ele.fireEvent("change");
			if (Browser.ie) ele.fireEvent("click");
		}

		// WebUI configuration
		[
			"showDetails",
			"showCategories",
			"showToolbar",
			"showStatusBar",
			"updateInterval",
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
		if (this.config.maxRows < this.limits.minTableRows) {
			value = (this.config.maxRows <= 0 ? 0 : this.limits.minTableRows);
		}
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
		if (!this.config.showToolbar && !isGuest)
			$("mainToolbar").hide();
		if (!this.config.showCategories)
			$("mainCatList").hide();
		if (!this.config.showDetails)
			$("mainInfoPane").hide();
		if (!this.config.showStatusBar)
			$("mainStatusBar").hide();

		this.toggleSearchBar();
	},

	"setSettings": function() {
		var value = null, reload = false, hasChanged = false;

		Logger.setLogDate(this.getAdvSetting("gui.log_date"));

		value = ($("webui.updateInterval").get("value").toInt() || 0);
		if (value < this.limits.minUpdateInterval) {
			value = this.limits.minUpdateInterval;
			$("webui.updateInterval").set("value", value);
		}
		if (this.config.updateInterval != value) {
			this.beginPeriodicUpdate(value);
			hasChanged = true;
		}

		value = $("webui.showToolbar").checked;
		if (this.config.showToolbar != value) {
			this.toggleToolbar(value);
			hasChanged = true;
		}

		value = $("webui.showCategories").checked;
		if (this.config.showCategories != value) {
			this.toggleCatPanel(value);
			hasChanged = true;
		}

		value = $("webui.showDetails").checked;
		if (this.config.showDetails != value) {
			this.toggleDetPanel(value);
			hasChanged = true;
		}

		value = $("webui.showStatusBar").checked;
		if (this.config.showStatusBar != value) {
			this.toggleStatusBar(value);
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
			value = (value <= 0 ? 0 : this.limits.minTableRows);
			$("webui.maxRows").set("value", value);
		}
		if (this.config.maxRows != value) {
			this.tableSetMaxRows(value);
			hasChanged = true;
		}

		var str = "";

		if (hasChanged && Browser.opera)
			str = "&s=webui.cookie&v=" + JSON.encode(this.config);

		value = $("gui.speed_in_title").checked;
		if (!value && !!this.settings["gui.speed_in_title"] != value) {
			document.title = g_winTitle;
		}

		value = $("gui.alternate_color").checked;
		if (!!this.settings["gui.alternate_color"] != value) {
			this.tableUseAltColor(value);
		}

		value = this.getAdvSetting("gui.graphic_progress");
		if (undefined != value && !!this.settings["gui.graphic_progress"] != value) {
			this.tableUseProgressBar(value);
		}

		value = this.getAdvSetting("gui.tall_category_list");

		for (var key in this.settings) {
			var ele = $(key);
			if (!ele) continue;
			var v = this.settings[key];
			if (ele.type && (ele.type == "checkbox")) {
				nv = ele.checked ? 1 : 0;
			} else {
				nv = ele.get("value");
			}
			switch (key) {
				case "seed_ratio":
					nv *= 10; break;
				case "seed_time":
					nv *= 60; break;
				case "search_list":
					nv = nv.split('\n').map(function(item) {
						return item.replace(/[\r\n]+/g, '');
					}).join('\r\n');
					break;
			}
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

		for (var key in this.advSettings) {
			var nv = this.getAdvSetting(key);
			if (nv === undefined) continue;
			var v = this.settings[key];

			if (v != nv) {
				this.settings[key] = nv;

				if (typeOf(nv) == 'boolean') {
					nv = nv ? 1 : 0;
				}
				str += "&s=" + key + "&v=" + encodeURIComponent(nv);
			}
		}

		if (str != "")
			this.request("action=setsetting" + str, Function.from(), !reload); // if the page is going to reload make it a synchronous request

		if (this.settings["webui.enable"] == 0) {
			this.showMsg('WebUI was disabled. Goodbye.');
			return;
		}

		var port = (window.location.port ? window.location.port : (window.location.protocol == "http:" ? 80 : 443));
		var new_port = (this.settings["webui.enable_listen"] === undefined || this.settings["webui.enable_listen"] ? this.settings["webui.port"] : this.settings["bind_port"]);

		if (port != new_port) {
			this.endPeriodicUpdate();
			this.showMsg(
				'WebUI has detected that the port setting was altered. How do you wish to proceed?' +
				'<ul>' +
					'<li><a href="#" onclick="changePort(' + new_port + '); return false;">Reload</a> on the new port</li>' +
					'<li><a href="#" onclick="utWebUI.beginPeriodicUpdate(); utWebUI.hideMsg(); return false;">Ignore</a> the port change</li>' +
				'</ul>'
			);
		}
		else if (reload) {
			window.location.reload(true);
		}

		this.toggleSearchBar();
		resizeUI();
	},

	"showSettings": function() {
		DialogManager.show("Settings");
	},

	"searchExecute": function() {
		var searchQuery = encodeURIComponent($("query").get("value"));
		var searchActive = (this.settings["search_list_sel"] || 0);
		var searchURLs = (this.settings["search_list"] || "").split("\r\n");

		searchURLs = searchURLs.map(function(item) {
			if (item && (item = item.split("|")[1])) {
				if (!item.test(/%s/)) item += "%s";
				return item.replace(/%v/, "utWebUI").replace(/%s/, searchQuery);
			}
		}).filter($chk);

		if (searchURLs[searchActive])
			window.open(searchURLs[searchActive], "_blank");
	},

	"searchMenuSet": function(index) {
		// TODO: Generalize settings storage requests
		this.request("action=setsetting&s=search_list_sel&v=" + index);

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
					ContextMenu.add([item, this.searchMenuSet.bind(this, index)]);

				++index;
			}
		}).bind(this));

		var pos = ele.getPosition(), size = ele.getSize();
		pos.x += size.x / 2;
		pos.y += size.y / 2;
		ContextMenu.show(pos);
	},

	"generateSpeedList": function(curSpeed, itemCount) {
		var LOGBASE = Math.log(3);

		curSpeed = parseInt(curSpeed, 10) || 0;
		itemCount = parseInt(itemCount || 15, 10) || 0;
		if (itemCount < 5) itemCount = 5;

		// Generate items
		var scale = (curSpeed <= 0 ? 3 : (Math.log(curSpeed) / LOGBASE));
		var scaleinc = (scale / itemCount);
		var list = (curSpeed > 0 ? [curSpeed] : []);
		var first = 0;

		for (var i = 1, curscale = (scale - 2).max(0); i <= itemCount; ++i, curscale += scaleinc) {
			var offset = i * Math.round(Math.pow(2, curscale));

			if (offset < curSpeed) {
				list.unshift(curSpeed - offset);
				++first;
			}
			list.push(curSpeed + offset);
		}

		// TODO: Consider post-processing items so they look "nicer" (intervals of 5, 10, 25, etc)

		// Determine front of list
		for (var i = (itemCount / 2) - 1; first > 0 && list[first] > 0 && i > 0; --i) {
			--first;
		}

		return [0, -1].concat(list.slice(first, first+itemCount));
	},

	"statusSpeedMenuShow": function(speed, ev) {
		if (!ev.isRightClick()) return true;

		speed.set = speed.set || Function.from();
		speed.cur = parseInt(speed.cur, 10) || 0;

		switch (typeOf(speed.list)) {
			case 'string':
				speed.list = speed.list.split(",");

			case 'array':
				speed.list = speed.list.map(function(val) {
					return String.from(val).trim();
				});
				break;

			default:
				speed.list = this.generateSpeedList(speed.cur);
		}

		ContextMenu.clear();

		speed.list.each(function(val) {
			val = parseInt(val, 10);
			if (isNaN(val)) return;

			var item;
			switch (val) {
				case -1: item = [CMENU_SEP]; break;
				case 0: item = [lang[CONST.MENU_UNLIMITED]]; break;

				default:
					if (val < 0) val *= -1;
					item = [val + " " + lang[CONST.SIZE_KB] + g_perSec];
			}

			if (val === speed.cur) {
				item.unshift(CMENU_SEL);
			}
			else {
				item.push(speed.set.pass(val));
			}
			ContextMenu.add(item);
		});

		ContextMenu.show(ev.page);
	},

	"setSpeedDownload": function(val) {
		// TODO: Generalize settings storage requests
		this.request("action=setsetting&s=max_dl_rate&v=" + val, (function() {
			this.settings["max_dl_rate"] = val;

			$("max_dl_rate").set("value", val);
			this.updateStatusBar();
		}).bind(this));
	},

	"setSpeedUpload": function(val) {
		// TODO: Generalize settings storage requests
		this.request("action=setsetting&s=max_ul_rate&v=" + val, (function() {
			this.settings["max_ul_rate"] = val;

			$("max_ul_rate").set("value", val);
			this.updateStatusBar();
		}).bind(this));
	},

	"statusDownloadMenuShow": function(ev) {
		return this.statusSpeedMenuShow({
			  "set": this.setSpeedDownload.bind(this)
			, "cur": this.settings["max_dl_rate"]
			, "list": !!this.settings["gui.manual_ratemenu"] && this.settings["gui.dlrate_menu"]
		}, ev);
	},

	"statusUploadMenuShow": function(ev) {
		return this.statusSpeedMenuShow({
			  "set": this.setSpeedUpload.bind(this)
			, "cur": this.settings["max_ul_rate"]
			, "list": !!this.settings["gui.manual_ratemenu"] && this.settings["gui.ulrate_menu"]
		}, ev);
	},

	"toolbarChevronShow": function(ele) {
		var missingItems = [];

		var eleTB = $("mainToolbar");
		eleTB.getElements(".inchev").each(function(item) {
			if (item.getPosition(eleTB).y >= eleTB.getHeight()) {
				if (item.hasClass("separator")) {
					missingItems.push([CMENU_SEP]);
				}
				else {
					var mItem = [item.get("title")];
					if (!item.hasClass("disabled")) {
						mItem[1] = function(ev) {
							ev.target = item;
							item.fireEvent("click", ev);
						};
					}

					missingItems.push(mItem);
				}
			}
		});

		while (missingItems.length > 0 && missingItems[0][0] === CMENU_SEP) {
			missingItems.shift();
		}

		ContextMenu.clear();
		if (missingItems.length > 0) {
			missingItems.each(function(item) {
				ContextMenu.add(item);
			});

			var pos = ele.getPosition(), size = ele.getSize();
			pos.y += size.y - 2;
			ContextMenu.show(pos);
		}
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
					return (data[CONST.TORRENT_PEERS_SWARM]) ? (data[CONST.TORRENT_SEEDS_SWARM] / data[CONST.TORRENT_PEERS_SWARM]) : Number.MAX_VALUE;

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
					values[i] = (values[i] / 65536).toFixedNR(3);
					break;

				case "done":
					values[i] = (values[i] / 10).toFixedNR(1) + "%";
					break;

				case "downloaded":
					values[i] = values[i].toFileSize();
					break;

				case "downspeed":
				case "upspeed":
					values[i] = (values[i] >= 103) ? (values[i].toFileSize() + g_perSec) : "";
					break;

				case "eta":
					values[i] = (values[i] == 0) ? "" :
								(values[i] == -1) ? "\u221E" : values[i].toTimeString();
					break;

				case "ratio":
					values[i] = (values[i] == -1) ? "\u221E" : (values[i] / 1000).toFixedNR(3);
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
					values[i] = (values[i] >= 103) ? values[i].toFileSize(2) : "";
					break;

				case "seeds_peers":
					values[i] = ($chk(values[i]) && (values[i] != Number.MAX_VALUE)) ? values[i].toFixedNR(3) : "\u221E";
					break;

				case "size":
					values[i]  = values[i].toFileSize(2);
					break;

				case "uploaded":
					values[i] = values[i].toFileSize();
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
		this.updateToolbar();

		var selHash = this.trtTable.selectedRows;

		if (!isGuest && ev.isRightClick()) {
			if (selHash.length > 0)
				this.showMenu.delay(0, this, [ev, id]);
			if (this.config.showDetails && (selHash.length == 1))
				this.showDetails(id);
		}
		else {
			if (this.config.showDetails) {
				if (selHash.length == 0) {
					this.torrentID = "";
					this.clearDetails();
				} else if (selHash.length == 1) {
					this.showDetails(id);
				}
			}
		}
	},

	"trtDblClk": function(id) {
		if (!isGuest && this.trtTable.selectedRows.length == 1) {
			var tor = this.torrents[id];
			var action = parseInt((
				tor[CONST.TORRENT_PROGRESS] == 1000
					? this.settings["gui.dblclick_seed"]
					: this.settings["gui.dblclick_dl"]
			), 10) || CONST.TOR_DBLCLK_SHOW_PROPS;

			switch (action) {
				case CONST.TOR_DBLCLK_SHOW_PROPS:
					this.showProperties();
					break;

				default:
					this.perform((tor[CONST.TORRENT_STATUS] & (CONST.STATE_STARTED | CONST.STATE_QUEUED)) ? "stop" : "start");
			}
		}
	},

	"showMenu": function(ev, id) {
		if (!ev.isRightClick()) return;

		var menuItems = []

		//--------------------------------------------------
		// Label Selection
		//--------------------------------------------------

		var labelIndex = CONST.TORRENT_LABEL;
		var labelSubMenu = [[lang[CONST.OV_NEW_LABEL], this.newLabel.bind(this)]];
		if (!this.trtTable.selectedRows.every(function(item) { return (this.torrents[item][labelIndex] == ""); }, this)) {
			labelSubMenu.push([lang[CONST.OV_REMOVE_LABEL], this.setLabel.bind(this, "")]);
		}
		if (Object.getLength(this.customLabels) > 0) {
			labelSubMenu.push([CMENU_SEP]);
			$each(this.customLabels, function(_, label) {
				if (this.trtTable.selectedRows.every(function(item) { return (this.torrents[item][labelIndex] == label); }, this)) {
					labelSubMenu.push([CMENU_SEL, label]);
				}
				else {
					labelSubMenu.push([label, this.setLabel.bind(this, label)]);
				}
			}, this);
		}

		//--------------------------------------------------
		// Build Menu
		//--------------------------------------------------

		var menuItemsMap = {
			  "forcestart" : [lang[CONST.ML_FORCE_START], this.forcestart.bind(this)]
			, "start"      : [lang[CONST.ML_START], this.start.bind(this)]
			, "pause"      : [lang[CONST.ML_PAUSE], this.pause.bind(this)]
			, "stop"       : [lang[CONST.ML_STOP],  this.stop.bind(this)]
			, "queueup"    : [lang[CONST.ML_QUEUEUP], (function(ev) { this.queueup(ev.shift); }).bind(this)]
			, "queuedown"  : [lang[CONST.ML_QUEUEDOWN], (function(ev) { this.queuedown(ev.shift); }).bind(this)]
			, "label"      : [CMENU_CHILD, lang[CONST.ML_LABEL], labelSubMenu]
			, "remove"     : [lang[CONST.ML_REMOVE], this.remove.bind(this, CONST.TOR_REMOVE)]
			, "removeand"  : [CMENU_CHILD, lang[CONST.ML_REMOVE_AND], [
				  [lang[CONST.ML_DELETE_TORRENT], this.remove.bind(this, CONST.TOR_REMOVE_TORRENT)]
				, [lang[CONST.ML_DELETE_DATATORRENT], this.remove.bind(this, CONST.TOR_REMOVE_DATATORRENT)]
				, [lang[CONST.ML_DELETE_DATA], this.remove.bind(this, CONST.TOR_REMOVE_DATA)]
			]]
			, "recheck"    : [lang[CONST.ML_FORCE_RECHECK], this.recheck.bind(this)]
			, "properties" : [lang[CONST.ML_PROPERTIES], this.showProperties.bind(this)]
		};

		// Gray out items based on status
		var disabled = this.getDisabledActions();

		Object.each(disabled, function(disabled, name) {
			var item = menuItemsMap[name];
			if (!item) return;

			if (disabled) {
				delete item[1];
			}
		});

		// Create item array
		menuItems = menuItems.concat([
			  menuItemsMap["forcestart"]
			, menuItemsMap["start"]
			, menuItemsMap["pause"]
			, menuItemsMap["stop"]
			, [CMENU_SEP]
			, menuItemsMap["queueup"]
			, menuItemsMap["queuedown"]
			, menuItemsMap["label"]
			, [CMENU_SEP]
			, menuItemsMap["remove"]
			, menuItemsMap["removeand"]
			, [CMENU_SEP]
			, menuItemsMap["recheck"]
			, [CMENU_SEP]
			, menuItemsMap["properties"]
		]);

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);
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
		ele.fireEvent(Browser.ie ? "click" : "change");
		$("DLG_TORRENTPROP_1_GEN_11").addStopEvent("click", function(ev) {
			ele.disabled = !ele.disabled;
		});
		var ids = {
			"superseed": 17,
			"dht": 18,
			"pex": 19
		};
		Object.each(ids, function(v, k) {
			var e = $("prop-" + k);
			e.disabled = true;
			e.checked = false;
			$("DLG_TORRENTPROP_1_GEN_" + v).removeClass("disabled").addStopEvent("click", function(ev) {
				e.disabled = !e.disabled;
			});
		});
		$("dlgProps-head").set("text", "|[" + this.trtTable.selectedRows.length + " Torrents]| - " + lang[CONST.DLG_TORRENTPROP_00]);
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
		ele.fireEvent(Browser.ie ? "click" : "change");
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
				dis = !this.settings["dht_per_torrent"];
			ele = $("prop-" + k);
			ele.disabled = dis;
			ele.checked = (props[k] == 1);
			$("DLG_TORRENTPROP_1_GEN_" + ids[k])[dis ? "addClass" : "removeClass"]("disabled");
		}
		$("dlgProps-head").set("text", this.torrents[this.propID][CONST.TORRENT_NAME] + " - " + lang[CONST.DLG_TORRENTPROP_00]);
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
			switch (k) {
				case "seed_ratio":
					nv *= 10; break;
				case "seed_time":
					nv *= 60; break;
				case "dlrate":
				case "ulrate":
					nv *= 1024; break;
				case "trackers":
					nv = nv.split('\n').map(function(item) {
						return item.replace(/[\r\n]+/g, '');
					}).join('\r\n');
					break
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
		this.getPeers(id, true);
		this.getFiles(id);
		this.updateDetails();
	},

	"clearDetails": function() {
		this.prsTable.clearRows();
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
			$("ra").set("html", (d[CONST.TORRENT_RATIO] == -1) ? "\u221E" : (d[CONST.TORRENT_RATIO] / 1000).toFixedNR(3));
			$("us").set("html", d[CONST.TORRENT_UPSPEED].toFileSize() + g_perSec);
			$("ds").set("html", d[CONST.TORRENT_DOWNSPEED].toFileSize() + g_perSec);
			$("rm").set("html", (d[CONST.TORRENT_ETA] == 0) ? "" : (d[CONST.TORRENT_ETA] <= -1) ? "\u221E" : d[CONST.TORRENT_ETA].toTimeString());
			$("se").set("html", lang[CONST.GN_XCONN].replace(/%d/, d[CONST.TORRENT_SEEDS_CONNECTED]).replace(/%d/, d[CONST.TORRENT_SEEDS_SWARM]).replace(/%d/, "\u00BF?"));
			$("pe").set("html", lang[CONST.GN_XCONN].replace(/%d/, d[CONST.TORRENT_PEERS_CONNECTED]).replace(/%d/, d[CONST.TORRENT_PEERS_SWARM]).replace(/%d/, "\u00BF?"));
		}
	},

	"addURL": function() {
		var url = encodeURIComponent($("dlgAddURL-url").get("value"));
		var dir = $("dlgAddURL-basePath").value || 0;
		var sub = encodeURIComponent($("dlgAddURL-subPath").get("value")); // TODO: Sanitize!
		var cookie = encodeURIComponent($("dlgAddURL-cookie").get("value"));

		$("dlgAddURL-url").set("value", "");
		$("dlgAddURL-cookie").set("value", "");

		if (url) {
			if (cookie) url += ":COOKIE:" + cookie;
			this.request(
				  "action=add-url&s=" + url
				+ "&download_dir=" + dir
				+ "&path=" + sub
			);
		}
	},

	"loadPeers": function() {
		var id = this.torrentID;
		if (id != "" && this.peers[id]) {
			this.prsTable.dBody.scrollLeft = 0;
			this.prsTable.dBody.scrollTop = 0;
			this.peers[id].each(function(peer, i) {
				var key = id + "_" + peer[CONST.PEER_IP].replace(/\./g, "_") + "_" + peer[CONST.PEER_PORT]; // TODO: Handle bt.allow_same_ip
				this.prsTable.addRow(this.prsDataToRow(peer), key);
				this.prsTable.setIcon(key, "country_" + peer[CONST.PEER_COUNTRY]);
			}, this);
		}
		this.prsTable.loadObj.hide.delay(200, this.prsTable.loadObj);
		this.prsTable.calcSize();
		this.prsTable.resetScroll();
	},

	"getPeers": function(id, update) {

{ // TODO: Remove this once backend support is stable (requires 3.0+)
	if (undefined === this.settings["webui.uconnect_enable"]) return;
}

		if (!has(this.peers, id) || update) {
			this.peers[id] = [];
			if (update)
				this.prsTable.clearRows();
			if (this.mainTabs.active == "mainInfoPane-peersTab")
				this.prsTable.loadObj.show();
			this.request("action=getpeers&hash=" + id, this.addPeers);
		} else {
			if (this.mainTabs.active == "mainInfoPane-peersTab") {
				this.prsTable.loadObj.show();
				this.loadPeers.delay(20, this);
			}
		}
	},

	"addPeers": function(json) {
		var peers = json.peers;
		if (peers == undefined) return;
		this.peers[peers[0]] = peers[1];
		if (this.mainTabs.active == "mainInfoPane-peersTab")
			this.loadPeers();
	},

/*
	"updateFiles": function(hash) {
		if ((this.torrentID == hash) && has(this.files, hash)) {
			this.getFiles(hash, true);
			this.updateDetails();
		}
	},
*/

	"loadFiles": function() {
		var id = this.torrentID;
		if (id != "" && this.files[id]) {
			if (!has(this.flsTable.rowData, id + "_0")) { // don't unnecessarily reload the table
				this.flsTable.dBody.scrollLeft = 0;
				this.flsTable.dBody.scrollTop = 0;
				this.files[id].each(function(file, i) {
					this.flsTable.addRow(this.flsDataToRow(file), id + "_" + i);
				}, this);
			}
		}
		this.flsTable.loadObj.hide.delay(200, this.flsTable.loadObj);
		this.flsTable.calcSize();
		this.flsTable.resetScroll();
	},

	"getFiles": function(id, update) {
		if (!has(this.files, id) || update) {
			this.files[id] = [];
			if (update)
				this.flsTable.clearRows();
			if (this.mainTabs.active == "mainInfoPane-filesTab")
				this.flsTable.loadObj.show();
			this.request("action=getfiles&hash=" + id, this.addFiles);
		} else {
			if (this.mainTabs.active == "mainInfoPane-filesTab") {
				this.flsTable.loadObj.show();
				this.loadFiles.delay(20, this);
			}
		}
	},

	"addFiles": function(json) {
		var files = json.files;
		if (files == undefined) return;
		this.files[files[0]] = files[1];
		if (this.mainTabs.active == "mainInfoPane-filesTab")
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
					values[i] = (values[i] / 10).toFixedNR(1) + "%";
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
		if (ev.isRightClick() && this.flsTable.selectedRows.length > 0)
			this.showFileMenu.delay(0, this, ev);
	},

	"showFileMenu": function(ev) {
		if (isGuest || !ev.isRightClick()) return;

		var id = this.torrentID;

		var fileIds = this.getSelFileIds(id, -1);
		if (fileIds.length <= 0) return;

		var menuItems = [];

		//--------------------------------------------------
		// Priority Selection
		//--------------------------------------------------

		var prioItems = [
			  [lang[CONST.MF_DONT], this.setPriority.pass([id, CONST.FILEPRIORITY_SKIP], this)]
			, [CMENU_SEP]
			, [lang[CONST.MF_LOW], this.setPriority.pass([id, CONST.FILEPRIORITY_LOW], this)]
			, [lang[CONST.MF_NORMAL], this.setPriority.pass([id, CONST.FILEPRIORITY_NORMAL], this)]
			, [lang[CONST.MF_HIGH], this.setPriority.pass([id, CONST.FILEPRIORITY_HIGH], this)]
		];

		// Gray out priority items based on priorities of selected files
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
		// File Download
		//--------------------------------------------------

		var fileDownloadItems = [
			  [CMENU_SEP]
			, [lang[CONST.MF_GETFILE], this.downloadFiles.bind(this, id)]
		];

		// Gray out download item if no selected file is complete
		var goodFile = false;
		for (var i = 0, l = fileIds.length; i < l; ++i) {
			var data = this.files[id][fileIds[i]];
			if (data[CONST.FILE_DOWNLOADED] == data[CONST.FILE_SIZE]) {
				goodFile = true;
				break;
			}
		}
		if (!goodFile) {
			delete fileDownloadItems[1][1];
		}

		var fdata = this.files[id][fileIds[0]];
		if (fileIds.length > 1 || fdata[CONST.FILE_DOWNLOADED] != fdata[CONST.FILE_SIZE]) {
		}

		menuItems = menuItems.concat(fileDownloadItems);

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);
	},

	"getSelFileIds": function(id, p) {
		var ids = [];
		var len = this.flsTable.selectedRows.length;
		while (len--) {
			var rowId = this.flsTable.selectedRows[len];
			var fileId = rowId.match(/.*_([0-9]+)$/)[1].toInt();
			if (this.files[id][fileId][CONST.FILE_PRIORITY] != p) {
				ids.push(fileId);
			}
		}
		return ids;
	},

	"downloadFiles": function(id) {
		var selIds = this.getSelFileIds(id, -1);

		var fileIds = [];
		$each(selIds, function(fid) {
			var data = this.files[id][fid];
			if (data[CONST.FILE_DOWNLOADED] == data[CONST.FILE_SIZE]) {
				fileIds.push(fid);
			}
		}, this);
		
		if (fileIds.length <= 0) return;

		this.proxyFiles(this.torrents[id][CONST.TORRENT_STREAM_ID], fileIds, false);
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
		Object.append(this.config.torrentTable, config);
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtSort": function(index, reverse) {
		this.config.torrentTable.sIndex = index;
		this.config.torrentTable.reverse = reverse;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtColMove": function() {
		this.config.torrentTable.colOrder = this.trtTable.colOrder;
		this.config.torrentTable.sIndex = this.trtTable.sIndex;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtColResize": function() {
		this.config.torrentTable.colWidth = this.trtTable.getColumnWidths();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"trtColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.torrentTable.colMask |= num;
		} else {
			this.config.torrentTable.colMask &= ~num;
		}
		if (!nosave && Browser.opera)
			this.saveConfig(true);
	},

	"prsColMove": function() {
		this.config.peerTable.colOrder = this.prsTable.colOrder;
		this.config.peerTable.sIndex = this.prsTable.sIndex;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"prsColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.prsColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.prsColDefs.map(function(item, idx) { return item[1]; })
		};

		this.prsColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.prsTable.setConfig(config);
		Object.append(this.config.peerTable, config);
		if (Browser.opera)
			this.saveConfig(true);
	},

	"prsColResize": function() {
		this.config.peerTable.colWidth = this.prsTable.getColumnWidths();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"prsColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.peerTable.colMask |= num;
		} else {
			this.config.peerTable.colMask &= ~num;
		}
		if (!nosave && Browser.opera)
			this.saveConfig(true);
	},

	"prsDataToRow": function(data) {
		return this.prsColDefs.map(function(item) {
			switch (item[0]) {
				case "ip":
					return (
						  ((this.settings["resolve_peerips"] && data[CONST.PEER_REVDNS]) || data[CONST.PEER_IP])
						+ (data[CONST.PEER_UTP] ? " [uTP]" : "")
					);

				case "port":
					return data[CONST.PEER_PORT];

				case "client":
					return data[CONST.PEER_CLIENT];

				case "flags":
					return data[CONST.PEER_FLAGS];

				case "pcnt":
					return data[CONST.PEER_PROGRESS];

				case "relevance":
					return data[CONST.PEER_RELEVANCE];

				case "downspeed":
					return data[CONST.PEER_DOWNSPEED];

				case "upspeed":
					return data[CONST.PEER_UPSPEED];

				case "reqs":
					return data[CONST.PEER_REQS_OUT] + "|" + data[CONST.PEER_REQS_IN];

				case "waited":
					return data[CONST.PEER_WAITED];

				case "uploaded":
					return data[CONST.PEER_UPLOADED];

				case "downloaded":
					return data[CONST.PEER_DOWNLOADED];

				case "hasherr":
					return data[CONST.PEER_HASHERR];

				case "peerdl":
					return data[CONST.PEER_PEERDL];

				case "maxup":
					return data[CONST.PEER_MAXUP];

				case "maxdown":
					return data[CONST.PEER_MAXDOWN];

				case "queued":
					return data[CONST.PEER_QUEUED];

				case "inactive":
					return data[CONST.PEER_INACTIVE];
			}
		}, this);
	},

	"prsFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

		for (var i = (index || 0); i < len; i++) {
			switch (this.prsColDefs[i][0]) {
				case "ip":
				case "port":
				case "client":
				case "flags":
				case "reqs":
					break;

				case "pcnt":
				case "relevance":
					values[i] = (values[i] / 10).toFixedNR(1) + "%";
					break;

				case "uploaded":
				case "downloaded":
				case "hasherr":
				case "queued":
					values[i] = (values[i] > 103) ? values[i].toFileSize() : "";
					break;

				case "downspeed":
				case "upspeed":
				case "peerdl":
				case "maxup":
				case "maxdown":
					values[i] = (values[i] > 103) ? (values[i].toFileSize() + g_perSec) : "";
					break;

				case "waited":
				case "inactive":
					values[i] = (values[i] == 0) ? "" :
								(values[i] == -1) ? "\u221E" : values[i].toTimeString();
					break;
			}
		}

		if (useidx)
			return values[index];
		else
			return values;
	},

	"toggleResolveIP": function() {
		this.settings["resolve_peerips"] = !this.settings["resolve_peerips"];

		// TODO: Generalize settings storage requests
		this.request("action=setsetting&s=resolve_peerips&v=" + (this.settings["resolve_peerips"] ? 1 : 0), (function () {
			if (this.torrentID != "")
				this.getPeers(this.torrentID, true);
		}).bind(this));
	},

	"prsSelect": function(ev, id) {
		if (ev.isRightClick())
			this.showPeerMenu.delay(0, this, ev);
	},

	"showPeerMenu": function(ev) {
		if (isGuest || !ev.isRightClick()) return;

		var menuItems = [
			[lang[CONST.MP_RESOLVE_IPS], this.toggleResolveIP.bind(this)]
		];

		if (this.settings["resolve_peerips"]) {
			menuItems[0].splice(0, 0, CMENU_CHECK);
		}

		//--------------------------------------------------
		// Draw Menu
		//--------------------------------------------------

		ContextMenu.clear();
		ContextMenu.add.apply(ContextMenu, menuItems);
		ContextMenu.show(ev.page);
	},


	"prsSort": function(index, reverse) {
		this.config.peerTable.sIndex = index;
		this.config.peerTable.reverse = reverse;
		if (Browser.opera)
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
		Object.append(this.config.fileTable, config);
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsSort": function(index, reverse) {
		this.config.fileTable.sIndex = index;
		this.config.fileTable.reverse = reverse;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsColMove": function() {
		this.config.fileTable.colOrder = this.flsTable.colOrder;
		this.config.fileTable.sIndex = this.flsTable.sIndex;
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsColResize": function() {
		this.config.fileTable.colWidth = this.flsTable.getColumnWidths();
		if (Browser.opera)
			this.saveConfig(true);
	},

	"flsColToggle": function(index, enable, nosave) {
		var num = 1 << index;
		if (enable) {
			this.config.fileTable.colMask |= num;
		} else {
			this.config.fileTable.colMask &= ~num;
		}
		if (!nosave && Browser.opera)
			this.saveConfig(true);
	},

	"flsDblClk": function(id) {
		if (this.flsTable.selectedRows.length != 1) return;
		var hash = id.match(/(.*)_[0-9]+$/)[1];
		var fid = id.match(/.*_([0-9]+)$/)[1].toInt();
		this.setPriority(hash, (this.files[hash][fid][CONST.FILE_PRIORITY] + 1) % 4);
	},

	"advOptDataToRow": function(data) {
		return this.advOptColDefs.map(function(item) {
			switch (item[0]) {
				case "name":
					return data[0];

				case "value":
					return data[2];
			}
		}, this);
	},

	"advOptFormatRow": function(values, index) {
		var useidx = $chk(index);
		var len = (useidx ? (index + 1) : values.length);

/*
		for (var i = (index || 0); i < len; i++) {
			switch (this.advOptColDefs[i][0]) {
				case "name":
				case "value":
					break;
			}
		}
*/

		if (useidx)
			return values[index];
		else
			return values;
	},

	"advOptColReset": function() {
		var config = {
			  "colMask": 0
			, "colOrder": this.advOptColDefs.map(function(item, idx) { return idx; })
			, "colWidth": this.advOptColDefs.map(function(item, idx) { return item[1]; })
		};

		this.advOptColDefs.each(function(item, idx) { if (!!item[3]) config.colMask |= (1 << idx); });

		this.advOptTable.setConfig(config);
	},

	"advOptSelect": function(ev, id) {
		var val = this.getAdvSetting(id);
		var contBool = $("dlgSettings-advBool-cont");
		var contText = $("dlgSettings-advText-cont")

		if (undefined != val) {
			// Item clicked
			if (typeOf(val) == 'boolean') {
				contBool.setStyle("display", "inline");
				contText.setStyle("display", "none");

				$("dlgSettings-adv" + (val ? "True" : "False")).checked = true;
			}
			else {
				contBool.setStyle("display", "none");
				contText.setStyle("display", "inline");

				$("dlgSettings-advText").value = val;
			}
		}
		else {
			// Item unclicked
			contBool.setStyle("display", "none");
			contText.setStyle("display", "none");
		}
	},

	"advOptDblClk": function(id) {
		var val = this.getAdvSetting(id);
		if (undefined != val) {
			if (typeOf(val) == 'boolean') {
				$("dlgSettings-adv" + (val ? "False" : "True")).checked = true;
				this.advOptChanged();
			}
		}
	},

	"advOptChanged": function() {
		var optIds = this.advOptTable.selectedRows;
		if (optIds.length > 0) {
			var id = optIds[0];

			switch (typeOf(this.getAdvSetting(id))) {
				case 'boolean':
					this.setAdvSetting(id, $("dlgSettings-advTrue").checked);
					break;

				case 'number':
					this.setAdvSetting(id, $("dlgSettings-advText").value.toInt() || 0);
					break;

				case 'string':
					this.setAdvSetting(id, $("dlgSettings-advText").value);
					break;
			}

			if (id == "bt.transp_disposition") {
				$("enable_bw_management").checked = !!(this.getAdvSetting("bt.transp_disposition") & CONST.TRANSDISP_UTP);
			}
		}
	},

	"restoreUI": function(bc) {
		if ((bc != false) && !confirm("Are you sure that you want to restore the interface?")) return;
		//$("stg").hide();
		this.showMsg('Reloading WebUI...');
		window.removeEvents("unload");
		this.config = {};
		this.saveConfig(false, function(){ window.location.reload(false); });
	},

	"saveConfig": function(async, callback) {
		if (isGuest) return;
		this.request("action=setsetting&s=webui.cookie&v=" + JSON.encode(this.config), callback || null, async || false);
	},

	"updateStatusBar": function() {
		var str, seg, val, data;

		// Download
		str = '';

		seg = lang[CONST.SB_DOWNLOAD].replace(/%z/, this.totalDL.toFileSize());

		val = '';
		data = this.settings["max_dl_rate"] || 0;
		if (this.settings["gui.limits_in_statusbar"] && data > 0) {
			val = '[' + data + " " + lang[CONST.SIZE_KB] + g_perSec + '] ';
		}
		seg = seg.replace(/%s/, val);

		str += seg;

		$("mainStatusBar-download").set("text", str);

		// Upload
		str = '';

		seg = lang[CONST.SB_UPLOAD].replace(/%z/, this.totalUL.toFileSize());

		val = '';
		data = this.settings["max_ul_rate"] || 0;
		if (this.settings["gui.limits_in_statusbar"] && data > 0) {
			val = '[' + data + " " + lang[CONST.SIZE_KB] + g_perSec + '] ';
		}
		seg = seg.replace(/%s/, val);

		str += seg;

		$("mainStatusBar-upload").set("text", str);

	},

	"updateTitle": function() {
		var str = lang[CONST.MAIN_TITLEBAR_SPEED].replace(/%s/, this.totalDL.toFileSize() + g_perSec).replace(/%s/, this.totalUL.toFileSize() + g_perSec);
		window.status = window.defaultStatus = str.replace(/%s/, "");
		if (this.settings["gui.speed_in_title"])
			document.title = str.replace(/%s/, g_winTitle);
	},

	"getDisabledActions": function() {
		var disabled = {
			"forcestart": 1,
			"pause": 1,
			"queuedown": 1,
			"queueup": 1,
			"remove": 1,
			"start": 1,
			"stop": 1
		};

		var selHash = this.trtTable.selectedRows;
		if (selHash.length > 0) {
			var queueSelCount = 0,
				queueSelMin = Number.MAX_VALUE,
				queueSelMax = -Number.MAX_VALUE;

			selHash.each(function(hash) {
				var tor = this.torrents[hash];

				var queue = tor[CONST.TORRENT_QUEUE_POSITION],
					state = tor[CONST.TORRENT_STATUS];

				var started = !!(state & CONST.STATE_STARTED),
					checking = !!(state & CONST.STATE_CHECKING),
					paused = !!(state & CONST.STATE_PAUSED),
					queued = !!(state & CONST.STATE_QUEUED);

				if (queue > 0) {
					++queueSelCount;

					if (queue < queueSelMin) {
						queueSelMin = queue;
					}
					if (queueSelMax < queue ) {
						queueSelMax = queue;
					}
				}
				if ((!started || queued || paused) && !checking) {
					disabled.forcestart = 0;
				}
				if (!(queued || checking) || paused) {
					disabled.start = 0;
				}
				if (!paused && (checking || started || queued)) {
					disabled.pause = 0;
				}
				if (checking || started || queued) {
					disabled.stop = 0;
				}
			}, this);

			if (queueSelCount < queueSelMax) {
				disabled.queueup = 0;
			}
			if (queueSelMin <= this.torQueueMax - queueSelCount) {
				disabled.queuedown = 0;
			}

			disabled.remove = 0;
		}

		return disabled;
	},

	"updateToolbar": function() {
		if (isGuest) return;

		var disabled = this.getDisabledActions();

		Object.each(disabled, function(disabled, name) {
			var item = $(name);
			if (!item) return;

			if (disabled) {
				item.addClass("disabled");
			}
			else {
				item.removeClass("disabled");
			}
		});
	},

	"toggleCatPanel": function(show) {
		if (show === undefined) {
			show = !this.config.showCategories;
		}

		$("mainCatList")[show ? "show" : "hide"]();
		$("webui.showCategories").checked = show;
		this.config.showCategories = show;
	},

	"toggleDetPanel": function(show) {
		if (show === undefined) {
			show = !this.config.showDetails;
		}

		$("mainInfoPane")[show ? "show" : "hide"]();
		$("webui.showDetails").checked = show;
		this.config.showDetails = show;
	},

	"toggleSearchBar": function(show) {
		if (show === undefined) {
			show = !!(this.settings["search_list"] || "").trim();
		}

		$("mainToolbar-searchbar")[show ? "show" : "hide"]();
	},

	"toggleStatusBar": function(show) {
		if (show === undefined) {
			show = !this.config.showStatusBar;
		}

		$("mainStatusBar")[show ? "show" : "hide"]();
		$("webui.showStatusBar").checked = show;
		this.config.showStatusBar = show;
	},

	"toggleToolbar": function(show) {
		if (show === undefined) {
			show = !this.config.showToolbar;
		}

		$("mainToolbar")[show ? "show" : "hide"]();
		$("webui.showToolbar").checked = show;
		this.config.showToolbar = show;
	},

	"tableSetMaxRows": function(max) {
		var virtRows = this.limits.maxVirtTableRows;

		var mode = MODE_PAGE;
		max = max || 0;

		if (max <= 0) {
			mode = MODE_VIRTUAL;
			max = 0;
		}
		else if (max < this.limits.minTableRows) {
			max = this.limits.minTableRows;
		}

		this.config.maxRows = max;
		this.trtTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		this.prsTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		this.flsTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		if (!isGuest) {
			this.advOptTable.setConfig({"rowMaxCount": max || virtRows, "rowMode": mode});
		}
	},

	"tableUseAltColor": function(enable) {
		this.trtTable.setConfig({"rowAlternate": enable});
		this.prsTable.setConfig({"rowAlternate": enable});
		this.flsTable.setConfig({"rowAlternate": enable});
		if (!isGuest) {
			this.advOptTable.setConfig({"rowAlternate": enable});
		}
	},

	"tableUseProgressBar": function(enable) {
		var progFunc = Function.from(enable ? TYPE_NUM_PROGRESS : TYPE_NUMBER);
		var trtProgCols = this.trtColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		var prsProgCols = this.prsColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		var flsProgCols = this.flsColDefs.filter(function(item) { return item[2] == TYPE_NUM_PROGRESS; }).map(function(item) { return item[0]; });
		this.trtTable.setConfig({"colType": trtProgCols.map(progFunc).associate(trtProgCols)});
		this.prsTable.setConfig({"colType": trtProgCols.map(progFunc).associate(prsProgCols)});
		this.flsTable.setConfig({"colType": flsProgCols.map(progFunc).associate(flsProgCols)});
	},

	"detPanelTabChange": function(id) {
		switch (id) {
			case "mainInfoPane-peersTab":
				this.prsTable.calcSize();
				this.prsTable.restoreScroll();

				if (this.torrentID == "") return;

				this.prsTable.loadObj.show();
				this.loadPeers.delay(20, this);

				break;

			case "mainInfoPane-filesTab":
				this.flsTable.calcSize();
				this.flsTable.restoreScroll();

				if (this.torrentID == "") return;
				if (has(this.flsTable.rowData, this.torrentID + "_0")) return;

				this.flsTable.loadObj.show();
				this.loadFiles.delay(20, this);

				break;

			case "mainInfoPane-speedTab":
				SpeedGraph.draw();
				break;

			case "mainInfoPane-loggerTab":
				Logger.scrollBottom();
				break;
		}
	},
	
	"settingsPaneChange": function(id) {
		switch (id) {
			case "dlgSettings-TransferCap":
				this.getTransferHistory();
				break;

			case "dlgSettings-Advanced":
				this.advOptTable.calcSize();
				this.advOptTable.restoreScroll();
				break;
		}
	}/*,

	"showFolderBrowser": function() {
		$("dlgFolders").centre().show();
	}*/

}
