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
	},
	
	"draw": function() {
		this.element.empty();
		var $me = this;
		$each(this.tabs, function(v, k) {			
			$me.element.adopt(new Element("li", {
				"id": "tab_" + k
			}).adopt(new Element("a", {
				"href": "#",
				"events": {
					"click": function(ev) {
						ev.stop();
						$me.show(k)
					}
				},
				"html": v
			})));
		});
		return this;
	},
	
	"show": function(id) {
		if (!has(this.tabs, id)) return;
		$each(this.tabs, function(_, k) {
			$(k)[(k == id) ? "show" : "hide"]();
			$("tab_" + k)[((k == id) ? "add" : "remove") + "Class"]("selected");
		});
		this.active = id;
		this.onChange(id);
		return this;
	}
	
});