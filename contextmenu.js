/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var CMENU_SEP = 0;
var CMENU_CHILD = 1;
var CMENU_SEL = 2;
var CMENU_CHECK = 3;
var LI = new Element("li");

var ContextMenu = {

	"init": function(id) {
		this.obj = new Element("ul", {
			"id": id,
			"class": "CMenu"
		}).addEvent("mouseenter", function() {
			ContextMenu.focused = true;
		}).addEvent("mouseleave", function() {
			ContextMenu.focused = false;
		}).inject(document.body);
	},
	
	"hideAfterClick": true,
	
	"hidden": true,
	
	"focused": false,
	
	"launched": false,

	"add": function() {
		var args = $A(arguments);
		var link, ul, li;
		var ele = args[0];
		if ($type(ele) == "element") {
			if (!ele.hasClass("CMenu")) return;
			args.splice(0, 1);
		} else {
			ele = this.obj;
		}
		for (var i = 0, j = args.length; i < j; i++) {
			li = LI.clone(false);
			link = new Element("a");
			if (args[i][0] === CMENU_SEP) {
				li.adopt(new Element("div", {"class": "hr"}));
			} else if (args[i][0] === CMENU_CHILD) {
				ul = new Element("ul");
				ul.addClass("CMenu");
				link.addClass("exp");
				link.set("html", args[i][1]);
				li.adopt(link);
				for (var k = 0, len = args[i][2].length; k < len; k++)
					this.add(ul, args[i][2][k]);
				li.adopt(ul);
			} else if (args[i][0] === CMENU_SEL) {
				link.addClass("sel");
				link.set("html", args[i][1]);
				li.adopt(link);
			} else if (args[i][0] === CMENU_CHECK) {
				link.addClass("check");
				link.setProperty("href", "#");
				var fn = args[i][2];
				link.addEvent("click", function(ev) {
					ev.stop();
					fn();
					if (ContextMenu.hideAfterClick)
						ContextMenu.hide();
				});
				link.set("html", args[i][1]);
				li.adopt(link);
			} else if (!$defined(args[i][1])) {
				link.addClass("dis");
				link.set("html", args[i][0]);
				li.adopt(link);
			} else {
				link.setProperty("href", "#");
				var fn = args[i][1];
				link.addEvent("click", function(ev) {
					ev.stop();
					fn();
					if (ContextMenu.hideAfterClick)
						ContextMenu.hide();
				});
				link.set("html", args[i][0]);
				li.adopt(link);
			}
			ele.adopt(li);
		} 
	},

	"clear": function() {
		this.obj.empty();
		this.hideAfterClick = true;
	},
	
	"show": function(p) {
		this.obj.setStyle("visibility", "hidden");
		this.obj.show();
		var x = p.x + 8;
		var size = this.obj.getSize();
		var winSize = window.getSize();
		if (x + size.x > winSize.x)
			x -= size.x;
		var y = p.y + 8;
		if (y + size.y > winSize.y)
			y -= size.y;
		this.obj.setStyles({"left": x, "top": y, "visibility": "visible"});
		this.hidden = false;
		this.focused = false;
		this.launched = true;
	},
	
	"hide": function() {
		this.obj.setStyles({
			"visibility": "hidden",
			"display": "none",
			"left": 0,
			"top": 0
		});
		this.hidden = true;
		this.focused = false;
		this.launched = false;
		this.clear.delay(20, this);
	}

};