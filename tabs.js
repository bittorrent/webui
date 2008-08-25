/*
 *
 *     Copyright 2007 BitTorrent, Inc. All rights reserved.
 *     Copyright 2008 Carsten Niebuhr
 *
*/

var Tabs = new Class({

	"tabs": {},
	
	"active": "",
	
	"initialize": function(ele, options) {
		this.element = ele;
		this.tabs = options.tabs;
		this.onChange = options.onChange || $empty;
		var $me = this;
		this.element.addEvent("click", function(ev) {
			ev.stop();
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
				"href": "#",
				"html": this.tabs[k]
			}).store("showId", k)));
		};
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