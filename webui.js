/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

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
	"TOKEN": "",

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
			"trtCols": 0x0000,
			"torrentTable": {
				"reverse": false,
				"maxRows": 50,
				"colOrder": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
				"colWidth": [220,100,80,80,100,80,60,80,80,60,80,60,60,60,30,90],
				"sIndex": -1,
				"alternateRows": true
			},
			"flsCols": 0x00,
			"fileTable": {
				"reverse": false,
				"maxRows": 50,
				"colOrder": [0,1,2,3,4],
				"colWidth": [200,60,80,100,80],
				"sIndex": -1,
				"alternateRows": true
			},
			"updateInterval": 3000,
			"lang": "en",
			"activeLabel": "_all_"
		};
		
		this.TOKEN = $("token").get("text");
		
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
			if (hashes.length)
				this.request("?token=" + this.TOKEN + "&action=unpause&hash=" + hashes.join("&hash="));
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
		if (this.bConfDel) {
			this.delmode = "removedata";
		} else {
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
			
		this.request("?token=" + this.TOKEN + "&" + qs + "&cid=" + this.cacheID, this.addTorrents);
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
		else if ((done < 1000) && (res[0] == ""))
			res = ["Status_Incompleted", lang.OV_FL_STOPPED];	
		return res;
	},

	"addTorrents": function(json) {
		var dobj = JSON.decode(json), torrents = [];
		delete json;
		if (!has(dobj, "torrents")) {
			torrents = dobj.torrentp;
			delete dobj.torrentp;
		} else {
			torrents = dobj.torrents;
			delete dobj.torrents;
		}
		this.loadLabels($A(dobj.label));
		delete dobj.label;
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
		
		var scroll = this.trtTable.dBody.getScroll();
		if (Browser.Engine.gecko) // doing offline updating slows Presto & WebKit down
			this.trtTable.detachBody();
		for (var i = 0, len = torrents.length; i < len; i++) {
			var tor = torrents[i];
			var hash = tor[TORRENT_HASH];
			var done = tor[TORRENT_PROGRESS];
			var stat = this.getStatusInfo(tor[TORRENT_STATUS], done);
			this.totalDL += tor[TORRENT_DOWNSPEED];
			this.totalUL += tor[TORRENT_UPSPEED];
			tor.swap(TORRENT_UPSPEED, TORRENT_DOWNSPEED);
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
				}
				if ((prevtor[0] != tor[1]) || (prevtor[3] != tor[4])) { // status/done changed?
					this.torrents[hash][0] = tor[1];
					this.trtTable.setIcon(hash, stat[0]);
					this.trtTable.setValue(hash, 1, stat[1]);
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
			delete tor;
		}
		delete torrents;
		if (Browser.Engine.gecko)
			this.trtTable.attachBody();
		if (has(dobj, "torrentm")) {
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
		this.trtTable.dBody.scrollTo(scroll.x, scroll.y);
		this.trtTable.loadObj.hide();
		
		this.cacheID = dobj.torrentc;
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
			$("cover").hide();
		}
			
		this.updateTimeout = this.update.delay(this.getInterval(), this);
		this.updateDetails();
		
		if (this.config.showSpeed > 0)
			this.updateSpeed();
	},
	
	"updateSpeed": function () {
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
		this.interval = (this.interval == -1) ? (this.config.updateInterval + t * 4) : ((this.interval + this.config.updateInterval + t * 4) / 2).toInt();
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
		$("txtLabel").set("value", (tmpl == "") ? lang.OV_NEW_LABEL : tmpl);
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
		
		if (this.torrentID != "") {
			this.torrentID = "";
			this.flsTable.clearRows();
			this.clearDetails();
		}
		this.trtTable.curPage = 0;
		this.trtTable.refreshRows(true);
	},
	
	"getSettings": function() {
		this.request("?token=" + this.TOKEN + "&action=getsettings", this.addSettings);
	},
	
	"addSettings": function(settings) {
		settings = JSON.decode(settings).settings;
		if (BUILD_REQUIRED > -1)
		{
			if (!has(settings, "build") || (settings.build < BUILD_REQUIRED)) {
				alert("The WebUI requires atleast \u00B5Torrent (build " + BUILD_REQUIRED + ")");
				return;
			}
		}
		for (var i = 0, j = settings.length; i < j; i++) {
			if ((settings[i][0] == "webui.cookie") && !this.loaded) { // only load webui.cookie on startup
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
		for (var key in this.settings) {
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
		["lang"].each(function(key) {
			var ele;
			if (!(ele = $("webui." + key))) return;
			var v = utWebUI.config[key];
			if (ele.type == "checkbox") {
				ele.checked = ((v == "1") || (v == "true"));
			} else {
				ele.set("value", v);
			}
			ele.fireEvent("change");
		});
	},
	
	"setSettings": function() {
		var value = null, resize = false, reload = false;
		value = $("webui.confirm_when_deleting").checked;
		if (this.bConfDel != value)
			this.bConfDel = (value) ? 1 : 0;
		value = $("webui.speed_display").get("value").toInt();
		if (this.config.showSpeed != value) {
			this.config.showSpeed = value;
			if ((value == 0) || (value == 2)) {
				window.status = "";
				window.defaultStatus = "";
			}
			if ((value == 0) || (value == 1))
				document.title = "\u00B5Torrent WebUI v" + VERSION;
		}
		value = $("webui.alternate_color").checked;
		if (this.config.alternateRows != value) {
			this.config.alternateRows = (value) ? 1 : 0;
			this.trtTable.options.alternateRows = (this.config.alternateRows) ? true : false;
			this.flsTable.options.alternateRows = (this.config.alternateRows) ? true : false;
			this.trtTable.refreshSelection();
			this.flsTable.refreshSelection();
		}
		value = $("webui.show_cats").checked;
		if (this.config.showCategories != value) {
			this.config.showCategories = (value) ? 1 : 0;
			$("CatList")[(!this.config.showCategories) ? "hide" : "show"]();
			resize = true;
		}
		value = $("webui.show_dets").checked;
		if (this.config.showDetails != value) {
			this.config.showDetails = (value) ? 1 : 0;
			$("tdetails")[(!this.config.showDetails) ? "hide" : "show"]();
			resize = true;
		}
		value = $("webui.maxrows").value.toInt();
		if (this.config.maxRows != value) {
			this.config.maxRows = value;
			this.trtTable.setMaxRows(this.config.maxRows);
			this.flsTable.setMaxRows(this.config.maxRows);
		}
		value = $("webui.lang").get("value");
		if (this.config.lang != value) {
			this.config.lang = value;
			reload = true;
		}
		this.setUpdateInterval();
		var str = "";
		for (var key in this.settings) {
			t = this.settings[key].t;
			v = this.settings[key].v;
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
				this.settings[key].v = nv;
			}
		}
		if (str != "")
			this.request("?token=" + this.TOKEN + "&action=setsetting" + str);
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
			window.location.reload();
		} else if (resize) {
			resizeUI();
		}

	},
	
	"showSettings": function() {
		//this.getSettings();
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
		var lgroup = [];
		$each(this.customLabels, function(_, k) {
			if ((this.trtTable.selCount == 1) && (this.torrents[id][11] == k)) {
				lgroup.push([CMENU_SEL, k]);
	 		} else {
				lgroup.push([k, this.setLabel.bind(this, k)]);
			}
		}, this);
		lgroup.push([CMENU_SEP]);
		lgroup.push([lang.OV_NEW_LABEL, this.newLabel.bind(this)]);
		lgroup.push([lang.OV_REMOVE_LABEL, this.setLabel.bind(this, "")]);
		ContextMenu.add([CMENU_CHILD, lang.ML_LABEL, lgroup]);
		ContextMenu.add([CMENU_SEP]);
		ContextMenu.add([lang.ML_REMOVE, this.remove.bind()]);
		ContextMenu.add([CMENU_CHILD, lang.ML_REMOVE_AND,[[lang.ML_DELETE_DATA, this.removeAll.bind(this)]]]);
		ContextMenu.add([CMENU_SEP]);
		ContextMenu.add([lang.ML_PROPERTIES, (this.trtTable.selCount > 1) ? null : this.showProperties.bind(this, id)]);
		ContextMenu.show(e.page);
	},
	
	"showProperties": function(k) {
		this.propID = k;
		this.request("?token=" + this.TOKEN + "&action=getprops&hash=" + k, this.loadProperties);
		return true;
	},
	
	"loadProperties": function(str) {
		var data = JSON.decode(str);
		var props = data.props[0], id = this.propID;
		if (!$defined(this.props[id]))
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
				this.flsTable.refresh();
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
	
	"addFiles": function(fd) {
		var files = JSON.decode(fd).files;
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
		this.request("?token=" + this.TOKEN + "&action=setprio&hash=" + id + "&p=" + p + "&f=" + this.getFileIds(id, p).join("&f="));
	},
	
	"trtSort": function() {
		this.config.torrentTable.sIndex = this.trtTable.sIndex;
		this.config.torrentTable.reverse = this.trtTable.reverse;
	},
	
	"trtColMove": function() {
		this.config.torrentTable.colOrder = this.trtTable.colOrder;
	},
	
	"trtColResize": function() {
		this.config.torrentTable.colWidth = this.trtTable.colWidth;
	},
	
	"trtColToggle": function(index, state) {
		if (state) {
			this.config.trtCols |= 1 << index;
		} else {
			this.config.trtCols &= ~(1 << index);
		}
	},
	
	"flsSort": function() {
		this.config.fileTable.sIndex = this.flsTable.sIndex;
		this.config.fileTable.reverse = this.flsTable.reverse;
	},
	
	"flsColMove": function() {
		this.config.fileTable.colOrder = this.flsTable.colOrder;
	},
	
	"flsColResize": function() {
		this.config.fileTable.colWidth = this.flsTable.colWidth;
	},
	
	"flsColToggle": function(index, state) {
		if (state) {
			this.config.flsCols |= 1 << index;
		} else {
			this.config.flsCols &= ~(1 << index);
		}
	},
	
	"restoreUI" : function(bc) {
		if ((bc != false) && !confirm("Are you sure that you want to restore the interface?")) return;
		$("stg").hide();
		$("msg").set("html", "Reloading...");
		$("cover").show();
		utWebUI.request("?token=" + this.TOKEN + "&action=setsetting&s=webui.cookie&v={}", function(){ window.location.reload(false); });
	},
	
	"saveConfig": function() {
		// this gets called on window unload, WebKit & Presto cancels asynchronous requests
		// so, we force it to perform a synchronous request
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
		if ((id == "FileList") && (this.config.showDetails) && (this.torrentID != "")) {
			if (has(this.flsTable.rowData, this.torrentID + "_0")) return;
			this.flsTable.loadObj.show();
			this.loadFiles.delay(20, this);
		} else if (id == "FileList")
		{
			this.flsTable.calcSize();
		}
	},
	
	"showFolderBrowser": function() {
		$("dlgFolders").centre().show();
	}
	
}