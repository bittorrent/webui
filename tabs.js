/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

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
		this.element.addEvent("click", function(ev) {
			ev.stop();
			if (ev.target && (ev.target.get("tag") == "span"))
				ev.target = ev.target.parentNode;
			if (ev.target && (ev.target.get("tag") == "a"))
				$me.show(ev.target.retrieve("showId"));
		});
	},

	"draw": function() {
		this.element.empty();
		for (var k in this.tabs) {
			this.element.adopt(new Element("li", {
				"id": "tab_" + k
			}).adopt(new Element("a", {
				"href": "#"
			}).store("showId", k).adopt(new Element("span", {
				"html": this.tabs[k]
			}))));
		};
		return this;
	},

	"onChange": function() {
		var args = arguments.length > 0 ? Array.from(arguments) : [this.active];
		this.tabchange(args);
	},

	"setNames": function(names) {
		for (var k in names) {
			$("tab_" + k).getElement("span").set("html", names[k]);
		}
		return this;
	},

	"show": function(id) {
		if (!has(this.tabs, id)) return;
		for (var k in this.tabs) {
			$(k)[(k == id) ? "show" : "hide"]();
			$("tab_" + k)[((k == id) ? "add" : "remove") + "Class"]("selected");
		};
		this.active = id;
		this.onChange(id);
		return this;
	}

});