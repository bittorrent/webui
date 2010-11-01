/**
 * Copyright 2007 BitTorrent, Inc. All rights reserved.
 * Copyright 2008 Carsten Niebuhr
 */

var ELE_A = new Element("a");
var ELE_LI = new Element("li");
var ELE_SPAN = new Element("span");

var Tabs = new Class({

	"active": "",
	"tabs": {},
	"tabchange": Function.from(),

	"initialize": function(ele, options) {
		this.element = $(ele);
		this.tabs = options.tabs;
		if (typeOf(options.onChange) == 'function') {
			this.tabchange = options.onChange;
		}
		var $me = this;
		this.element.addStopEvent("click", function(ev) {
			var targ = ev.target;

			if (targ && (targ.get("tag") == "span"))
				targ = targ.parentNode;

			if (targ && (targ.get("tag") == "a"))
				$me.show(targ.retrieve("showId"));
		});
	},

	"draw": function() {
		this.element.empty();

		Object.each(this.tabs, function(text, id) {
			this.element.adopt(ELE_LI.clone(false)
				.set("id", "tab_" + id)
				.adopt(ELE_A.clone(false)
					.setProperty("href", "#")
					.store("showId", id)
					.adopt(ELE_SPAN.clone(false)
						.set("html", text)
					)
				)
			);
		}, this);

		return this;
	},

	"onChange": function() {
		if (arguments.length > 0)
			this.tabchange.apply(this, arguments);
		else
			this.tabchange.call(this, this.active);
	},

	"setNames": function(names) {
		Object.each(names, function(name, id) {
			$("tab_" + id).getElement("span").set("html", name);
		});

		return this;
	},

	"show": function(id) {
		if (!has(this.tabs, id)) return;

		Object.each(this.tabs, function(_, tab) {
			if (tab == id) {
				$(tab).show();
				$("tab_" + tab).addClass("selected");
			}
			else {
				$(tab).hide();
				$("tab_" + tab).removeClass("selected");
			}
		});

		this.active = id;
		this.onChange(id);
		return this;
	}

});
