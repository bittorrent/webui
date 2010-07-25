/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var DialogManager = {

	"winZ": 500,
	"items": {},
	"showing": [],

	"add": function(id, isModal) {
		if (has(this.items, id)) return;
		isModal = !!isModal;
		this.items[id] = {"modal": isModal};
		var oid = id, $me = this;
		id = "dlg" + id;
		$(id).addEvent("mousedown", function(ev) {
			var cls = ev.target.className;
			if (cls.contains("dlg-head", " ") || cls.contains("dlg-close", " ")) return;
			this.setStyle("zIndex", ++DialogManager.winZ);
		}).getElement("a").addEvent("click", function(ev) {
			ev.stop();
			$me.hide(oid);
		});
		var dragElement = null;
		new Drag(id, {
			"handle": id + "-head",
			"modifiers": {"x": "left", "y": "top"},
			"snap": 2,
			"onBeforeStart": function() {
			},
			"onStart": function() {
				this.element.show();
			},
			"onCancel": function() {
				$me.bringToFront(oid);
			},
			"onComplete": function() {
				$me.bringToFront(oid);
			}
		});
	},

	"show": function(id) {
		this.bringToFront(id);
		if (this.items[id].modal)
			$("modalbg").show();
		$("dlg" + id).setStyle("zIndex", ++this.winZ).centre();
	},

	"hide": function(id) {
		this.showing = this.showing.erase(id);
		$("dlg" + id).hide();
		if (this.items[id].modal)
			$("modalbg").hide();
	},

	"hideTopMost": function(fireClose) {
		if (this.showing.length == 0) return;
		var id = this.showing.shift();
		this.hide(id);
		if (fireClose)
			$("dlg" + id).getElement("a").fireEvent("click", { stop: $empty });
	},

	"bringToFront": function(id) {
		if (this.showing.contains(id))
			this.showing = this.showing.erase(id);
		this.showing.unshift(id);
		$("dlg" + id).setStyle("zIndex", ++this.winZ);
	}
};
