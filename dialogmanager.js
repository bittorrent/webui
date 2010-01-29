/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var DialogManager = {

	"dragMask": null,
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
			if (cls.contains("dlg-header", " ") || cls.contains("dlg-close", " ")) return;
			this.setStyle("zIndex", ++DialogManager.winZ);
		}).getElement("a").addEvent("click", function(ev) {
			ev.stop();
			$me.hide(oid);
		});
		var dragElement = null;
		new Drag(id, {
			"handle": id + "-header",
			"modifiers": {"x": "left", "y": "top"},
			"snap": 2,
			"onBeforeStart": function() {
				var size = this.element.getSize(), pos = this.element.getPosition();
				$me.dragMask.setStyles({
					"width": size.x - 4,
					"height": size.y - 4,
					"left": pos.x,
					"top": pos.y,
					"zIndex": ++DialogManager.winZ
				});
				dragElement = this.element;
				this.element = $me.dragMask;
			},
			"onStart": function() {
				this.element.show();
			},
			"onCancel": function() {
				this.element = dragElement;
				$me.bringToFront(oid);
				$me.dragMask.setStyle("display", "none");
			},
			"onComplete": function() {
				this.element = dragElement;
				dragElement = null;
				var pos = $me.dragMask.getPosition();
				$me.dragMask.setStyle("display", "none");
				this.element.setStyles({
					"left": pos.x,
					"top": pos.y
				});
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
