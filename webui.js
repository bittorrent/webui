/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var VERSION = "0.350";
var BUILD_REQUIRED = -1; // the ut build the webui requires
var lang = lang || null;
var isGuest = (window.location.pathname == "/gui/guest.html");

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
	"langLoaded": false,
	"TOKEN": "",
	"delActions": ["remove", "removedata"],

	"init": function() {
		var port = (location.host.split(":"))[1];
		if (!$defined(port))
			port = (window.location.protocol == "http:") ? 80 : 443;
		this.url = window.location.protocol + "//" + document.domain + ":" + port + "/gui/";
		
		this.config = {
			"showDetails": true,
			"showCategories": true,
			"showToolbar": true,
			"showSpeed": 0,
			"updateInterval": 3000,
			"alternateRows": false,
			"confirmDelete": true,
			"lang": "en",
			"hSplit": 0.88,
			"vSplit": 0.5,
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
			new Request({
				"url": this.url + "token.html",
				"method": "get",
				"async": false,
				"onSuccess": function(str) {
					utWebUI.TOKEN = str.substring(str.indexOf("none;'>") + 7, str.indexOf("</div>"));
				}
			}).send();
		} else {
			this.TOKEN = $("token").get("text");
		}
		
		this.getSettings();
	},
	
	"request": function(qs, fn) {
		new Request.JSON({
			"url": this.url + qs,
			"method": "get",
			"onSuccess": (fn) ? fn.bind(this) : $empty
		}).send();
	},
	
	"perform": function(action) {
		var hashes = this.getHashes(action);
		if (action == "pause") {
			var temp = this.getHashes("unpause");
			if (temp.length)
				this.request("?token=" + this.TOKEN + "&action=unpause&hash=" + temp.join("&hash="));
		}
		if (hashes.length == 0) return;
		if (action.test(/^remove/) && (hashes.indexOf(this.torrentID) > -1)) {
			this.torrentID = "";
			this.flsTable.clearRows();
			this.clearDetails();
		}
		this.getTorrents(action + "&hash=" + hashes.join("&hash=") + "&list=1");
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
		if (!this.config.confirmDelete || confirm(lang[CONST.OV_CONFIRM_DELETE]))
			this.perform(this.delActions[mode]);
	},
	
	"recheck": function() {
		this.perform("recheck");
	},
	
	"getTorrents": function(qs) {
		$clear(this.updateTimeout);
		this.timer = $time();
		if (qs != "list=1")
			qs = "action=" + qs;
		this.request("?token=" + this.TOKEN + "&" + qs + "&cid=" + this.cacheID, this.addTorrents);
	},
	
	"getStatusInfo": function(state, done) {
		var res = ["", ""];
		if (state & CONST.STATE_STARTED) { // started
			if (state & CONST.STATE_PAUSED) { // paused
				res = ["Status_Paused", lang[CONST.OV_FL_PAUSED]];
			} else { // seeding or leeching
				res = [(done == 1000) ? "Status_Up" : "Status_Down", (done == 1000) ? lang[CONST.OV_FL_SEEDING] : lang[CONST.OV_FL_DOWNLOADING]];
			}
		} else if (state & CONST.STATE_CHECKING) { // checking
			res = [(state & CONST.STATE_PAUSED) ? "Status_Paused" : "Status_Checking", lang[CONST.OV_FL_CHECKED].replace(/%:\.1d%/, "??")];
		} else if (state & CONST.STATE_ERROR) { // error
			res = ["Status_Error", lang[CONST.OV_FL_ERROR].replace(/%s/, "??")];
		} else if (state & CONST.STATE_QUEUED) { // queued
			res = [(done == 1000) ? "Status_Queued_Up" : "Status_Queued_Down", lang[CONST.OV_FL_QUEUED]];
		}
		if (!(state & CONST.STATE_QUEUED) && !(state & CONST.STATE_CHECKING)) // forced started
			res[1] = "[F] " + res[1];
		if ((done == 1000) && (res[0] == ""))
			res = ["Status_Completed", lang[CONST.OV_FL_FINISHED]];		
		else if ((done < 1000) && (res[0] == ""))
			res = ["Status_Incompleted", lang[CONST.OV_FL_STOPPED]];	
		return res;
	},

	"addTorrents": function(json) {
		var torrents = [];
		if (!has(json, "torrents")) {
			torrents = json.torrentp;
			delete json.torrentp;
		} else {
			torrents = json.torrents;
			delete json.torrents;
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
		
		var scroll = this.trtTable.dBody.getScroll(), noRefresh = true;
		if (Browser.Engine.gecko || Browser.Engine.trident4) // doing offline updating slows Presto & WebKit down
			this.trtTable.detachBody();
		for (var i = 0, len = torrents.length; i < len; i++) {
			var tor = torrents[i];
			var hash = tor[CONST.TORRENT_HASH];
			var done = tor[CONST.TORRENT_PROGRESS];
			var stat = this.getStatusInfo(tor[CONST.TORRENT_STATUS], done);
			this.totalDL += tor[CONST.TORRENT_DOWNSPEED];
			this.totalUL += tor[CONST.TORRENT_UPSPEED];
			tor.swap(CONST.TORRENT_UPSPEED, CONST.TORRENT_DOWNSPEED);
			tor.insertAt(stat[1], 3);
			
			if (!has(this.labels, hash))
				this.labels[hash] = "";
			var labels = this.getLabels(hash, tor[12], done, tor[9], tor[10]);
			if (!has(this.torrents, hash)) {
				this.torrents[hash] = tor.slice(1);
				this.labels[hash] = labels;
				tor.splice(0, 2); // remove the hash & status from the array
				tor[11] = tor[11] + " (" + tor[12] + ")";
				tor[12] = tor[13] + " (" + tor[14] + ")";
				tor[13] = tor[15];
				tor.splice(13, 2);
				this.trtTable.addRow(tor, hash, stat[0], (labels.indexOf(this.config.activeLabel) == -1));
			} else {
				var ln = tor.length - 7;
				var prevtor = this.torrents[hash];
				if (labels != this.labels[hash]) {
					this.labels[hash] = labels;
					if (labels.indexOf(this.config.activeLabel) > -1) {
						this.trtTable.unhideRow(hash);
					} else {
						this.trtTable.hideRow(hash);
					}
					noRefresh = false;
				}
				if ((prevtor[0] != tor[1]) || (prevtor[3] != tor[4])) { // status/done changed?
					this.torrents[hash][0] = tor[1];
					this.trtTable.setIcon(hash, stat[0]);
					this.trtTable.setValue(hash, 1, stat[1], noRefresh);
				}
				if ((prevtor[12] != tor[13]) || (prevtor[13] != tor[14])) { // # of peers changed?
					this.torrents[hash][12] = tor[13];
					this.torrents[hash][13] = tor[14];
					this.trtTable.setValue(hash, 11, tor[13] + " (" + tor[14] + ")", noRefresh);
				}
				if ((prevtor[14] != tor[15]) || (prevtor[15] != tor[16])) { // # of seeds changed?
					this.torrents[hash][14] = tor[15];
					this.torrents[hash][15] = tor[16];
					this.trtTable.setValue(hash, 12, tor[15] + " (" + tor[16] + ")", noRefresh);
				}
				for (var j = 16; j < 20; j++) {
					if (prevtor[j] != tor[j + 1]) {
						this.torrents[hash][j] = tor[j + 1];
						this.trtTable.setValue(hash, j - 3, tor[j + 1], noRefresh);
					}
				}
				for (var j = 1; j < ln; j++) {
					if (prevtor[j] != tor[j + 1]) {
						this.torrents[hash][j] = tor[j + 1];
						if ((j == 4) && (this.torrentID == hash))
							this.updateFiles(hash);
						this.trtTable.setValue(hash, j - 1, tor[j + 1], noRefresh);
					}
				}
			}
			delete tor;
		}
		delete torrents;
		if (!noRefresh)
			this.trtTable.refreshRows(true);
		if (Browser.Engine.gecko || Browser.Engine.trident4)
			this.trtTable.attachBody();
		if (has(json, "torrentm")) {
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
			}
			delete json.torrentm;
		}
		this.trtTable.dBody.scrollTo(scroll.x, scroll.y);
		this.trtTable.loadObj.hide();
		
		this.cacheID = json.torrentc;
		json = null;
		this.updateLabels();
		this.loadTorrents();
	},
	
	"loadTorrents": function() {
		if (!this.loaded) {
			this.loaded = true;
			if (this.trtTable.sIndex > -1)
				this.trtTable.sort();
			this.trtTable.refreshRows(true);
			this.trtTable.calcSize();
			$("cover").hide();
		}
		this.trtTable.refresh();
			
		this.updateTimeout = this.update.delay(this.getInterval(), this);
		this.updateDetails();
		
		this.updateSpeed();
	},
	
	"updateSpeed": function () {
		var str = "Download: " + this.totalDL.toFileSize() + "/s | " +
				  "Upload: " + this.totalUL.toFileSize() + "/s";
		window.status = str;
		window.defaultStatus = str;
		if (this.config.showTitleSpeed)
			document.title = "\u00B5Torrent WebUI v" + VERSION + " - " + str;
	},
	
	"update": function () {
		this.totalDL = 0;
		this.totalUL = 0;
		this.getTorrents("list=1");
	},
	
	"getInterval": function() {
		var t = $time() - this.timer;
		this.interval = (this.interval == -1) ? (this.config.updateInterval + t * 4) : ((this.interval + this.config.updateInterval + t * 4) / 2).toInt();
		return this.interval;
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
			if (has(this.customLabels, label))
				delete this.customLabels[label];
			temp[label] = count;
		}
		var resetLabel = false;
		for (var k in this.customLabels) {
			$("label_" + k).remove();
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
		var str = "";
		for (var i = 0, j = this.trtTable.selectedRows.length; i < j; i++) {
			var key = this.trtTable.selectedRows[i];
			if (this.torrents[key][11] != lbl)
				str += "&hash=" + key;
		}
		if (str != "")
			this.request("?token=" + this.TOKEN + "&action=setprops&s=label" + str + "&v=" + lbl);
		return true;
	},
	
	"newLabel": function() {
		var tmpl = "";
		if (this.trtTable.selectedRows.length == 1)
			tmpl = this.torrents[this.trtTable.selectedRows[0]][11];
		$("txtLabel").set("value", (tmpl == "") ? lang[CONST.OV_NEW_LABEL] : tmpl);
		$("dlgLabel").centre().show();
		return true;
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
	
	"switchLabel": function(element) {
		if (element.id == this.config.activeLabel) return;
		if (this.config.activeLabel != "")
			$(this.config.activeLabel).removeClass("sel");
		element.addClass("sel");
		this.config.activeLabel = element.id;
		
		for (var k in this.torrents) {
			if (this.labels[k].indexOf(this.config.activeLabel) > -1) {
				this.trtTable.unhideRow(k);
			} else {
				this.trtTable.hideRow(k);
			}
		}
		this.trtTable.selectedRows.length = 0;
		delete this.trtTable.rowSel;
		this.trtTable.rowSel = {};
		
		if (this.torrentID != "") {
			this.torrentID = "";
			this.flsTable.clearRows();
			this.clearDetails();
		}
		this.trtTable.curPage = 0;
		this.trtTable.refreshRows(true);
		//this.trtTable.refresh();
	},
	
	"getSettings": function() {
		var qs = "?token=" + this.TOKEN + "&action=getsettings";
		if (!this.loaded) {
			qs += "&list=1";
			$clear(this.updateTimeout);
			this.timer = $time();
		}
		this.request(qs, this.addSettings);
	},
	
	"addSettings": function(json) {
		if (BUILD_REQUIRED > -1) {
			if (!has(json.settings, "build") || (json.settings.build < BUILD_REQUIRED)) {
				alert("The WebUI requires atleast \u00B5Torrent (build " + BUILD_REQUIRED + ")");
				return;
			}
		}
		for (var i = 0, j = json.settings.length; i < j; i++) {
			if ((json.settings[i][0] == "webui.cookie") && !this.loaded) { // only load webui.cookie on startup
				$extend(this.config, JSON.decode(json.settings[i][2])); // if the user corrupts the "cookie," good for him/her
				this.config.torrentTable.alternateRows = this.config.fileTable.alternateRows = this.config.alternateRows;
				continue;
			}
			var val = json.settings[i][2];
			var typ = json.settings[i][1];
			if (typ == 0)
				val = parseInt(val);
			if (typ == 1)
				val = (val == "true");	
			this.settings[json.settings[i][0]] = val;
		}
		delete json.settings;
		if (!this.loaded) {
			var detectLang = (navigator.language) ? navigator.language : navigator.userLanguage;
			var matches;
			if (matches = detectLang.match(/af|ar|az|be|ca|cs|de|en|eo|es|et|fr|it|jp|nl|pt|sv/i))
				detectLang = matches[0];
			if ((lang !== null) && ((lang_code == this.config.lang) || ((this.config.lang == "auto") && (lang_code == detectLang)))) {
				setupUI();
				utWebUI.addTorrents(json);
			} else {
				loadJS(this.url + "lang/" + ((this.config.lang == "auto") ? detectLang : this.config.lang) + ".js", {"onload": function() { setupUI(); utWebUI.addTorrents(json); }});
			}
		}
		this.loadSettings();
	},
	
	"loadSettings": function() {
		for (var key in this.settings) {
			var v = this.settings[key], ele;
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
			
		value = $("webui.updateInterval").get("value").toInt();
		if (this.config.updateInterval != value) {
			this.config.updateInterval = value;
			$clear(this.updateTimeout);
			this.updateTimeout = this.update.delay(value, this);
			hasChanged = true;
		}
			
		value = $("webui.showTitleSpeed").get("value").toInt();
		if (this.config.showTitleSpeed != value) {
			this.config.showTitleSpeed = value;
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
		if (this.config.maxRows != value) {
			this.config.maxRows = value;
			this.trtTable.setMaxRows(this.config.maxRows);
			this.flsTable.setMaxRows(this.config.maxRows);
			hasChanged = true;
		}
		
		value = $("webui.lang").get("value");
		if (this.config.lang != value) {
			this.config.lang = value;
			reload = true;
			hasChanged = true;
		}
		
		var str = "";
		
		if (window.opera && hasChanged)
			str = "&s=webui.cookie&v=" + JSON.encode(this.config);
		
		for (var key in this.settings) {
			v = this.settings[key];
			var ele = $(key);
			if (!ele) continue;
			if (ele.type && (ele.type == "checkbox")) {
				nv = ele.checked;
			} else {
				nv = ele.get("value");
			}
			if (key == "seed_ratio")
				nv *= 10;
			if (v != nv) {
				str += "&s=" + key + "&v=" + nv;
				this.settings[key] = nv;
				log(key + " " + v + " --> " + nv);
			}
		}
		if (str != "")
			this.request("?token=" + this.TOKEN + "&action=setsetting" + str);
		if (this.settings["webui.enable"] == "0") {
			$("msg").set("html", "Goodbye.");
			$("cover").show();
			return;
		}
		var sp = location.host.split(":");
		var port = sp[1] || sp[5];
		if (!$defined(port))
			port = (window.location.protocol == "http:") ? 80 : 443;
		if (this.settings["webui.enable_listen"] && (this.settings["webui.port"] != port)) {
			redirect.delay(1000, null, window.location.protocol + "//" + document.domain + ":" + this.settings["webui.port"] + "/gui/");
		} else if (!this.settings["webui.enable_listen"] && (this.settings["bind_port"] != port)) {
			redirect.delay(1000, null, window.location.protocol + "//" + document.domain + ":" + this.settings["bind_port"] + "/gui/");
		} else if (reload) {
			window.location.reload();
		} else if (resize) {
			resizeUI();
		}

	},
	
	"showSettings": function() {
		if (!this.langLoaded && !isGuest)
			loadSettingStrings();
		$("dlgSettings").centre();
	},
	
	"trtSelect": function(e, id) {
		if (e.rightClick) {
			if (this.config.showDetails && (this.trtTable.selectedRows.length == 1))
				this.showDetails(id);
			if (this.trtTable.selectedRows.length > 0)
				this.showMenu(e, id);
		} else {
			if (this.config.showDetails) {
				if (this.trtTable.selectedRows.length == 0) {
					this.torrentID = "";
					this.flsTable.clearRows();
					this.clearDetails();
				} else if (this.trtTable.selectedRows.length == 1) {
					this.showDetails(id);
				}
			}
		}
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
		var lgroup = [];
		$each(this.customLabels, function(_, k) {
			if ((this.trtTable.selCount == 1) && (this.torrents[id][11] == k)) {
				lgroup.push([CMENU_SEL, k]);
	 		} else {
				lgroup.push([k, this.setLabel.bind(this, k)]);
			}
		}, this);
		lgroup.push([CMENU_SEP]);
		lgroup.push([lang[CONST.OV_NEW_LABEL], this.newLabel.bind(this)]);
		lgroup.push([lang[CONST.OV_REMOVE_LABEL], this.setLabel.bind(this, "")]);
		ContextMenu.add([CMENU_CHILD, lang[CONST.ML_LABEL], lgroup]);
		ContextMenu.add([CMENU_SEP]);
		ContextMenu.add([lang[CONST.ML_REMOVE], this.remove.bind(this, 0)]);
		ContextMenu.add([CMENU_CHILD, lang[CONST.ML_REMOVE_AND], [[lang[CONST.ML_DELETE_DATA], this.remove.bind(this, 1)]]]);
		ContextMenu.add([CMENU_SEP]);
		ContextMenu.add([lang[CONST.ML_PROPERTIES], (this.trtTable.selCount > 1) ? null : this.showProperties.bind(this, id)]);
		ContextMenu.show(e.page);
	},
	
	"showProperties": function(k) {
		this.propID = k;
		this.request("?token=" + this.TOKEN + "&action=getprops&hash=" + k, this.loadProperties);
		return true;
	},
	
	"loadProperties": function(json) {
		var props = json.props[0], id = this.propID;
		if (!has(this.props, id))
			this.props[id] = {};
		for (var k in props) 
			this.props[id][k] = props[k];
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
					nv += a[i].replace(/\s+/, "") + "%0D%0A";
			}
			if (v != nv) {
				str += "&s=" + k + "&v=" + nv;
				this.props[this.propID][k] = nv;
			}
		}, this);
		if (str != "")
			this.request("?token=" + this.TOKEN + "&action=setprops&hash=" + this.propID + str);
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
			this.request("?token=" + this.TOKEN + "&action=add-url&s=" + url, $empty);
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
					data[3] = ((data[1] > 0) ? ((data[2] / data[1]) * 100).roundTo(1) : 100);
					this.flsTable.addRow(data, id + "_" + i);
				}, this);
				this.flsTable.calcSize();
				this.flsTable.refreshRows(true);
			}
			this.flsTable.loadObj.hide();
		}
	},
	
	"getFiles": function(id, update) {
		if (!has(this.files, id) || update) {
			this.files[id] = [];
			this.request("?token=" + this.TOKEN + "&action=getfiles&hash=" + id, this.addFiles);
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
	
	"flsSelect": function(e, id) {
		if (this.flsTable.selectedRows.length > 0)
			this.showFileMenu(e, id.substr(41).toInt());
	},
	
	"showFileMenu": function(e, ind) {
		if (!e.rightClick) return;
			
		var id = this.torrentID;
		var p = this.files[id][ind][3];
		
		var high = ["High Priority", this.setPriority.bind(this, [id, 3])];
		var normal = ["Normal Priority", this.setPriority.bind(this, [id, 2])];
		var low = ["Low Priority", this.setPriority.bind(this, [id, 1])];
		var skip = ["Don't Download", this.setPriority.bind(this, [id, 0])];

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
		this.request("?token=" + this.TOKEN + "&action=setprio&hash=" + id + "&p=" + p + "&f=" + this.getFileIds(id, p).join("&f="));
	},
	
	"trtSort": function(index, reverse) {
		this.config.torrentTable.sIndex = index;
		this.config.torrentTable.reverse = reverse;
	},
	
	"trtColMove": function() {
		this.config.torrentTable.colOrder = this.trtTable.colOrder;
	},
	
	"trtColResize": function() {
		this.config.torrentTable.colWidth = this.trtTable.colWidth;
	},
	
	"trtColToggle": function(index, enable) {
		var num = 1 << index;
		if (enable) {
			this.config.trtCols |= num;
		} else {
			this.config.trtCols &= ~num;
		}
	},
	
	"flsSort": function(index, reverse) {
		this.config.fileTable.sIndex = index;
		this.config.fileTable.reverse = reverse;
	},
	
	"flsColMove": function() {
		this.config.fileTable.colOrder = this.flsTable.colOrder;
	},
	
	"flsColResize": function() {
		this.config.fileTable.colWidth = this.flsTable.colWidth;
	},
	
	"flsColToggle": function(index, enable) {
		var num = 1 << index;
		if (enable) {
			this.config.flsCols |= num;
		} else {
			this.config.flsCols &= ~num;
		}
	},
	
	"restoreUI" : function(bc) {
		if ((bc != false) && !confirm("Are you sure that you want to restore the interface?")) return;
		//$("stg").hide();
		$("msg").set("html", "Reloading...");
		$("cover").show();
		window.removeEvents("unload");
		utWebUI.request("?token=" + this.TOKEN + "&action=setsetting&s=webui.cookie&v={}", function(){ window.location.reload(false); });
	},
	
	"saveConfig": function() {
		new Request({
			"url": this.url + "?action=setsetting&s=webui.cookie&v=" + JSON.encode(this.config),
			"method": "get",
			"async": false
		}).send();
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
		}
	}/*,
	
	"showFolderBrowser": function() {
		$("dlgFolders").centre().show();
	}*/
	
}