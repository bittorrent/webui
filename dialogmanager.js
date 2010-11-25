/**
 * Copyright 2007 BitTorrent, Inc. All rights reserved.
 * Copyright 2008 Carsten Niebuhr
 */

var DialogManager = {

	"winZ": 500,
	"items": {},
	"showing": [],

	"add": function(id, isModal, showCB) {
		if (has(this.items, id)) return;

		this.items[id] = {"modal": !!isModal, "onShow": showCB};

		var dlgId = "dlg" + id;
		$(dlgId)
			.addEvent("mousedown", this.bringToFront.bind(this, id))
			.getElement(".dlg-close").addStopEvent("click", this.hide.bind(this, id));

		new Drag(dlgId, {
			"onStart": function(el, ev) {
				if (!ev.alt) this.stop();
			},
			"snap": 1
		});

		new Drag(dlgId, {
			"handle": dlgId + "-head",
			"snap": 1
		});
	},

	"show": function(id) {
		if (!ContextMenu.hidden)
			ContextMenu.hide();

		this.bringToFront(id);

		if (this.items[id].modal)
			$("modalbg").show();

		if (this.isOffScreen(id))
			$("dlg" + id).centre();

		if (this.items[id].onShow)
			this.items[id].onShow();
	},

	"hide": function(id) {
		this.showing = this.showing.erase(id);
		$("dlg" + id).hide();

		if (this.items[id].modal && !this.modalIsVisible())
			$("modalbg").hide();

		if (this.showing[0])
			this.bringToFront(this.showing[0]);
	},

	"hideTopMost": function(fireClose) {
		if (this.showing.length == 0) return;

		var id = this.showing.shift();
		this.hide(id);

		if (fireClose)
			$("dlg" + id).getElement(".dlg-close").fireEvent("click", { stop: Function.from() });
	},

	"isOffScreen": function(id) {
		var threshX = 150, threshY = 50;
		var winSize = window.getSize();
		var head = $("dlg" + id + "-head").getCoordinates();

		return (
			(head.left > winSize.x - threshX) ||
			(head.right < threshX) ||
			(head.top > winSize.y - threshY) ||
			(head.bottom < threshY)
		);
	},

	"bringToFront": function(id) {
		if (this.showing.contains(id))
			this.showing = this.showing.erase(id);

		if (this.showing[0])
			$("dlg" + this.showing[0]).removeClass("dlg-top");

		this.showing.unshift(id);
		$("dlg" + id).addClass("dlg-top").setStyle("zIndex", ++this.winZ);
	},

	"modalIsVisible": function() {
		return this.showing.some(function(id) {
			return this.items[id].modal;
		}, this);
	}
};
