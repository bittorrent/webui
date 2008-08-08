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
			
			this.element.adopt(new Element("li", {
				"id": "tab_" + k
			}).adopt(new Element("a", {
				"href": "#",
				"events": {
					"click": function(ev) {
						(new Event(ev)).stop();
						$me.show(k)
					}
				}
			}).set("html", v)));
			
		}, this);
		return this;
	},
	
	"show": function(id) {
		if (!has(this.tabs, id)) return;
		$each(this.tabs, function(v, k) {
			var tab = $("tab_" + k);
			var ele = $(k);
			if (k == id) {
				ele.show();
				tab.addClass("selected");
			} else {
				ele.hide();
				tab.removeClass("selected");
			}
		}, this);
		this.active = id;
		this.onChange(id);
		return this;
	}
	
});