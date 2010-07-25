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
			$me.bringToFront(oid);
		}).getElement("a").addEvent("click", function(ev) {
			ev.stop();
			$me.hide(oid);
		});
		new Drag(id, {
			"handle": id + "-head",
			"modifiers": {"x": "left", "y": "top"},
			"snap": 2,
			"onBeforeStart": function() {
				$me.bringToFront(oid);
			}
		});
	},

	"show": function(id) {
		this.bringToFront(id);
		if (this.items[id].modal)
			$("modalbg").show();
		if (this.isOffScreen(id))
			$("dlg" + id).centre();
	},

	"hide": function(id) {
		this.showing = this.showing.erase(id);
		$("dlg" + id).hide();
		if (this.items[id].modal)
			$("modalbg").hide();
		if (this.showing[0])
			this.bringToFront(this.showing[0]);
	},

	"hideTopMost": function(fireClose) {
		if (this.showing.length == 0) return;
		var id = this.showing.shift();
		this.hide(id);
		if (fireClose)
			$("dlg" + id).getElement("a").fireEvent("click", { stop: $empty });
	},

	"isOffScreen": function(id) {
		var threshX = 150, threshY = 50,
			doc = document.getSize(),
			head = $("dlg" + id + "-head").getCoordinates();

		return (
			(head.left > doc.x - threshX)
		 || (head.right < threshX)
		 || (head.top > doc.y - threshY)
		 || (head.bottom < threshY)
		);
	},

	"bringToFront": function(id) {
		if (this.showing.contains(id))
			this.showing = this.showing.erase(id);
		if (this.showing[0])
			$("dlg" + this.showing[0]).removeClass("dlg-top");
		this.showing.unshift(id);
		$("dlg" + id).setStyle("zIndex", ++this.winZ).addClass("dlg-top");
	}
};
