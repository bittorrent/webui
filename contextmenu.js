/**
 * Copyright 2007 BitTorrent, Inc. All rights reserved.
 * Copyright 2008 Carsten Niebuhr
 */

var CMENU_SEP = 0;
var CMENU_CHILD = 1;
var CMENU_SEL = 2;
var CMENU_CHECK = 3;

var ELE_A = new Element("a");
var ELE_LI = new Element("li");
var ELE_UL = new Element("ul");

var ContextMenu = {

	"hideAfterClick": true,
	"hidden": true,

	"init": function(id) {
		this.element = ELE_UL.clone(false)
			.setProperties({
				"class": "CMenu",
				"id": id
			})
			.addStopEvent("mousedown")
			.inject(document.body);
	},

	"add": function() {
		function clickEvent(fn) {
			return (function(ev) {
				if (ContextMenu.hideAfterClick)
					ContextMenu.hide();

				if (typeOf(fn) == 'function')
					return fn(ev);
			});
		}

		var items = Array.from(arguments);
		var menu = items[0];

		if (typeOf(menu) == 'element') {
			if (!menu.hasClass("CMenu")) return;
			items.splice(0, 1);
		}
		else {
			menu = this.element;
		}

		items.each(function(item) {
			var li = ELE_LI.clone(false);
			menu.adopt(li);

			switch (item[0]) {

				case CMENU_SEP:
					li.addClass("sep");
					break;

				case CMENU_SEL:
					li.adopt(ELE_A.clone(false)
						.addClass("sel")
						.set("text", item[1])
					);
					break;

				case CMENU_CHECK:
					li.adopt(ELE_A.clone(false)
						.addClass("check")
						.setProperty("href", "#")
						.set("text", item[1])
						.addStopEvent("mouseup", clickEvent(item[2]))
					);
					break;

				case CMENU_CHILD:
					li.adopt(ELE_A.clone(false)
						.addClass("exp")
						.set("text", item[1])
					);

					var ul = ELE_UL.clone(false).addClass("CMenu");
					for (var k = 0, len = item[2].length; k < len; k++)
						this.add(ul, item[2][k]);

					li.adopt(ul);
					break;

				default:
					if (item[1] === undefined) {
						li.adopt(ELE_A.clone(false)
							.addClass("dis")
							.set("text", item[0])
						);
					}
					else {
						li.adopt(ELE_A.clone(false)
							.setProperty("href", "#")
							.set("text", item[0])
							.addStopEvent("mouseup", clickEvent(item[1]))
						);
					}

			}
		}, this);
	},

	"clear": function() {
		this.element.empty();
		this.hideAfterClick = true;
	},

	"show": function(coord) {
		this.element.show();
		this.hidden = false;

		// Get sizes
		var winSize = window.getSize();
		var size = this.element.getSize();

		// Try to keep menu within window boundaries
		var x = coord.x + 1;
		if (x + size.x > winSize.x)
			x -= size.x;

		var y = coord.y + 1;
		if (y + size.y > winSize.y)
			y -= size.y;

		// Position menu
		this.element.setStyles({
			"left": x.max(0),
			"top": y.max(0)
		});
	},

	"hide": function() {
		this.hidden = true;
		this.element.hide();

		this.clear();
	}

};
