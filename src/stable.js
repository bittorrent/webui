/*

Copyright 2007 Carsten Niebuhr (directrix)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

-----------------------------

This is a modified Sortable Table/ColumnList script, which can be found
at http://webfx.eae.net/.

Original authors:
	Emil A Eklund  - Column List Widget 1.03
			 (http://webfx.eae.net/dhtml/collist/columnlist.html)
	Erik Arvidsson - Sortable Table 1.12
			 (http://webfx.eae.net/dhtml/sortabletable/sortabletable.html)

*/

var TYPE_STRING = 0;
var TYPE_NUMBER = 1;
var TYPE_DATE = 2;
var TYPE_STRING_NO_CASE = 3;

var ALIGN_AUTO = 0;
var ALIGN_LEFT = 1;
var ALIGN_CENTER = 2;
var ALIGN_RIGHT  = 3;

var MODE_PAGE = 0;
var MODE_VIRTUAL = 1;

var TD = new Element("td");
var TR = new Element("tr");
var DIV = new Element("div");

var dxSTable = new Class({

	"Implements": [Options, Events],
	"rows": 0, // # of rows
	"rowData": {}, // the rows' raw data (unformatted)
	"rowId": [], // row ids in their current sorted order
	"rowSel": {}, // rows' select state
	"selectedRows": [], // the selected rows
	"activeId": [], // position -> id
	"activePos": {}, // id -> position
	"viewRows": 0, // # of visible rows
	"cols": 0, // # of columns
	"colData": [], // columns' data
	"dCont": null, // the main container
	"dHead": null, // head container
	"dBody": null, // body container
	"tHead" : null, // <table> element for the header
	"tBody" : null, // <table> element for the body
	"tb" : {
		"head": null,
		"body": null
	}, // <tbody> elements for header & body
	// sorting
	"sIndex": -1,
	"reverse": 0,
	"secIndex": 0,
	"secRev": 0,
	"colOrder": [],
	"colWidth": [],
	"colHeader": [],
	"options": {
		"format": $arguments(0),
		"maxRows": 25,
		"alternateRows": false,
		"mode": MODE_PAGE
	},
	
	// constructor
	"initialize": function() {
		this.startSel = null;
		
		this.tHeadCols = [];
		this.tBodyCols = [];
		this.cancelSort = false;
		this.cancelMove = false;

		this.hotCell = -1;
		this.isMoving = false;
		this.isResizing = false;
		this.isSorting = false;
		this.isScrolling = false;
		this.selCount = 0;
		this.curPage = 0;
		this.pageCount = 0;
	},
	
	"create": function(id, columns, options) {
		this.setOptions(options);
		this.colHeader = columns;
		this.colWidth = options.colWidth || (new Array(columns.length));
		this.colWidth.map(function(v) {
			return v || 150;
		});
	
		var tr, td, div, $me = this;

		this.id = "stable-" + id;
		this.dCont = $(id).addClass("stable");
		this.dHead = $(DIV.cloneNode(false)).addClass("stable-head").inject(this.dCont);
		this.dBody = $(DIV.cloneNode(false)).addClass("stable-body").inject(this.dCont);

		this.tHead = new Element("table", {
			"cellpadding": 0,
			"cellspacing": 0
		}).inject(this.dHead);
		
		this.tHead.addEvent("contextmenu", function(ev) {
			ev.stop();
			return false;
		});
		
		this.tb.head = new Element("tbody").inject(this.tHead);
		tr = $(TR.cloneNode(false));
		var nDrag = new Drag(tr, {
			"modifiers": {"x": "left", "y": false},
			"snap": 2,
			"onStart": function(){ ColumnHandler.start($me, this); },
			"onDrag": function(){ ColumnHandler.drag($me, this); },
			"onComplete": function(){ ColumnHandler.end($me, this); },
			"onRightClick": this.colMenu.bind(this),
			"onCancel": function() {
				this.detach();
				$me.cancelSort = false;
				$me.sort(this.element);
			}
		}).detach();
		tr.addEvent("mousemove", function(ev) {
			if (ev.target && (ev.target.tagName.toLowerCase() == "td"))
				ColumnHandler.check.apply($me, [ev, ev.target]);
		}).addEvent("mousedown", function(ev) {
			if (ev.target && (ev.target.tagName.toLowerCase() == "td")) {
				nDrag.element = nDrag.handles = ev.target;
				nDrag.attach().start(ev);
			}
		});

		var len = this.colHeader.length, ROW = $(TR.cloneNode(false));
		for (var i = 0, j = 0; i < len; i++) {
			this.colOrder[i] = this.colOrder[i] || i;
			this.cols++;
			this.colData[i] = this.colHeader[this.colOrder[i]];
			ROW.grab(
				$(TD.cloneNode(false))
					.addClasses(this.id + "-col-" + this.colOrder[i], this.colData[i].disabled ? "stable-hidden-column" : "")
			);
				
			td = $(TD.cloneNode(false))
				.set("text", this.colData[i].text)
				.setStyle("width", this.colWidth[i])
				.store("index", i)
				.inject(tr);
			if (this.colData[i].disabled)
				td.addClass("stable-hidden-column");
			this.tHeadCols[i] = td;
			j++;
		}
		this.tb.head.grab(tr);
		
		if (this.options.mode == MODE_VIRTUAL)
			this.topPad = $(DIV.cloneNode(false)).addClass("stable-pad").inject(this.dBody);
		
		this.tBody = new Element("table", {
			"cellpadding": 0,
			"cellspacing": 0
		}).inject(this.dBody);
		
		if (this.options.mode == MODE_VIRTUAL)
			this.bottomPad = $(DIV.cloneNode(false)).addClass("stable-pad").inject(this.dBody);
		
		var cg = new Element("colgroup").inject(this.tBody);
		for (var i = 0; i < len; i++) {
			this.tBodyCols[i] = new Element("col", {
				"styles": {
					"width": this.colWidth[i],
					"display": this.colData[i].disabled ? "none" : ''
				},
				"width": this.colWidth[i],
				"span": 1
			}).inject(cg);
		}
		this.tb.body = new Element("tbody");
		if (Browser.Engine.trident) {
			this.tb.body.addEvent("selectstart", function() {
				return false;
			});
		}
		
		this.colDragEle = null;
		this.colDragObj = $(DIV.cloneNode(false)).addClass("stable-move-header").inject(this.dHead);		
		this.colSep = $(DIV.cloneNode(false)).addClass("stable-separator-header").inject(this.dHead);
		this.colReszObj = $(DIV.cloneNode(false)).addClass("stable-resize-header").inject(this.dBody);
		
		this.loadObj = $(DIV.cloneNode(false)).addClass("stable-loading").grab($(DIV.cloneNode(false)).addClass("stable-loading-text").set("html", "Loading...")).inject(this.dCont);
		
		this.tb.body.addEvent("mousedown", function(ev) {
			if (ev.target && (ev.target.tagName.toLowerCase() == "td"))
				$me.selectRow(ev, ev.target.parentNode);
		});
		for (var i = 0; i < this.options.maxRows; i++)
			this.tb.body.grab(ROW.cloneNode(true).hide());
		ROW = null;
		
		this.tBody.grab(this.tb.body);
		if (this.options.mode == MODE_PAGE) {
			this.pageMenu = $(DIV.cloneNode(false)).addClass("stable-pagemenu").inject(this.dCont);
			this.pageNext = $(DIV.cloneNode(false))
							.addClass("nextlink-disabled")
							.addEvent("click", this.nextPage.bind(this))
							.addEvent("mouseenter", function() {
								if (this.hasClass("nextlink")) this.addClass("nextlink-hover");
							})
							.addEvent("mouseleave", function() {
								if (this.hasClass("nextlink")) this.removeClass("nextlink-hover");
							})
							.inject(this.pageMenu);
			this.pagePrev = $(DIV.cloneNode(false))
							.addClass("prevlink-disabled")
							.addEvent("click", this.prevPage.bind(this))
							.addEvent("mouseenter", function() {
								if (this.hasClass("prevlink")) this.addClass("prevlink-hover");
							})
							.addEvent("mouseleave", function() {
								if (this.hasClass("prevlink")) this.removeClass("prevlink-hover");
							})
							.inject(this.pageMenu);
			this.pageStat = new Element("span").addClass("pagestat").inject(this.pageMenu);
			
			this.pageSelect = new Element("select", {
				"events": {
					"change": function() {
						$me.gotoPage(this.get("value").toInt());
					}
				}
			}).inject(this.pageStat);
		}
		
		this.assignEvents();
		this.setAlignment();
	},
	
	"assignEvents": function() {
		this.scrollTimeout = null;
		this.scrollDiff = 0;
		this.scrollTimer = null;
		this.dBody.addEvent("scroll", (function() {
			this.dHead.scrollLeft = this.dBody.scrollLeft;
			if (this.options.mode == MODE_PAGE) return;
			if (this.scrollDiff === 0) {
				this.scrollDiff = this.dBody.scrollTop;
			} else {
				var diff = Math.abs(this.scrollDiff - this.dBody.scrollTop);
				if (diff > 19) {
					this.isScrolling = true;
					$clear(this.scrollTimer);
					this.scrollTimer = (function() {
						this.scrollDiff = 0;
						$clear(this.scrollTimer);
						this.isScrolling = false;
						this.resizePads();
					}).delay(300);
				} else {
					$clear(this.scrollTimer);
				}
			}
			return false;
		}).bind(this));
		
		this.dCont.addEvent("keydown", (function(ev) {
			if (ev.key == "delete") { // DEL
				this.fireEvent("onDelete");
			} else if ((ev.key == "a") && ev.control) { // Ctrl + A
				this.fillSelection();
				this.fireEvent("onSelect", ev);
			} else if ((ev.key == "e") && ev.control) { // Ctrl + Z
				this.clearSelection();
				this.fireEvent("onSelect", ev);
			}
		}).bind(this));
	},

	"setAlignment": function() {
		var sb = [], cols = this.tBody.getElement("colgroup").getElements("col");
		for (var i = 0; i < this.cols; i++) {
			var align = '';
			switch (this.colData[i].align) {
				case ALIGN_LEFT:
					align = "left";
				break;
				
				case ALIGN_CENTER:
					align = "center";
				break;
				
				case ALIGN_RIGHT:
					align = "right";
				break;
				
				case ALIGN_AUTO:
				default:
					align = (this.colData[i].type == TYPE_NUMBER) ? "right" : "left";
			}
			this.tHeadCols[i].setStyle("textAlign", align);
			(Browser.Engine.trident) ?
				cols[i].setProperty("align", align)
			:
				sb.push("." + this.id + "-col-" + this.colOrder[i] + " { text-align: " + align + " }");
		}
		if (!Browser.Engine.trident) {
			$("colrules").appendText(sb.join(''));
			sb.empty();
		}
	},
	
	"sort": function(col) {
		if (this.cancelSort) return;
		this.isSorting = true;
		var rev = true;

		if (col === null) {
			if (this.options.sIndex == -1) return;
			rev = false;
			col = this.tb.head.childNodes[0].childNodes[this.options.sIndex];
		}
		
		if (col.get("tag") != "td")
			col = col.getParent("td");

		var ind = col.retrieve("index");
		if (window.shiftKey) { //secondary sorting
			if (ind == this.options.sIndex) {
				this.secIndex = 0;
				return;
			}
			if (this.secIndex == ind) {
				this.secRev = 1 - this.secRev;
			} else {
				this.secRev = 0;
			}
			this.secIndex = ind;
			ind = this.options.sIndex;
			rev = false;
			col = this.tb.head.childNodes[0].childNodes[this.options.sIndex];
		}

		if (rev)
			this.options.reverse = (this.options.sIndex == ind) ? (1 - this.options.reverse) : 0;
		
		if (this.options.sIndex >= 0)
			this.tb.head.childNodes[0].childNodes[this.options.sIndex].setStyle("backgroundPosition", "right -32px");

		col.setStyle("backgroundPosition", "right " + ((this.options.reverse) ? "-16px" : "0px"));

		this.options.sIndex = ind;
		var d = this.getCache(ind);
		var $me = this;
		switch (this.colData[ind].type)
		{
			case TYPE_STRING:
				d.sort(function(x, y) {
					return $me.sortAlphaNumeric(x, y);
				});
			break;
			
			case TYPE_NUMBER:
				d.sort(function(x, y) {
					return $me.sortNumeric(x, y);
				});
			break;

			default:
				d.sort(function(x, y) {
					return Compare.compare(x.v, y.v);
				});
		}
		if (this.options.reverse)
			d.reverse();

		var refresh = false, j = 0;
		this.activeId.length = 0;
		for (var i = 0; i < this.rows; i++) {
			var key = d[i].key;
			if (!d[i].e.hidden) {
				this.activePos[key] = this.activeId.length;
				this.activeId.push(key);
			}
			this.rowData[key].index = i;
			if (this.rowId[i] === key) continue;
			this.rowId[i] = key;
			refresh = true;
		}

		this.clearCache(d);
		this.isSorting = false;
		
		if (refresh)
			this.refreshRows(true);
			
		this.fireEvent("onSort");
	},

	"sortNumeric": function(x, y) {
		var r = Compare.numeric(x.v, y.v);
		return ((r == 0) ? this.sortSecondary(x, y) : r);
	},

	"sortAlphaNumeric": function(x, y) {
		var r = Compare.alphaNumeric(x.v, y.v);
		return ((r == 0) ? this.sortSecondary(x, y) : r);
	},

	"sortSecondary": function(x, y) {
		var m = this.getValue(x.e, this.secIndex);
		var n = this.getValue(y.e, this.secIndex);
		var type = this.colData[this.colOrder[this.secIndex]].type;
		var r = 0;
		switch (type) {
			case TYPE_STRING:
				r = Compare.alphaNumeric(m, n);
			break;
			
			case TYPE_NUMBER:
				r = Compare.numeric(m, n);
			break;

			default:
				r = Compare.compare(m, n);
		}
		if (r == 0)
			r = x.e.index - y.e.index;
		if (this.options.reverse)
			r = -r;
		if (this.secRev)
			r = -r;	
		return r;
	},

	"refreshRows": function(fromSort) {
		if (fromSort !== true) return;
		var max = this.options.maxRows, mni = 0;
		if (this.options.mode == MODE_VIRTUAL) {
			var rt = (this.dBody.scrollHeight == 0) ? 0.0 : (this.dBody.scrollTop / this.dBody.scrollHeight);
			if (rt > 1.0) rt = 1.0;
			mni = Math.floor(rt * this.activeId.length);
		} else {
			mni = max * this.curPage;
		}
		
		// doing offline updating in IE helps speedwise,
		// but IE doesn't render all cells (ie. text) after the
		// table is re-inserted
		if (Browser.Engine.gecko)
			this.detachBody();
		var mxi = mni + max - 1;
		var i = 0, j = 0, obj = null, vr = -1;
	 	while (i < this.rows) {
			var id = this.rowId[i];
			var r = this.rowData[id];
			obj = $(id);
			vr++;
			if (!r.hidden && (vr >= mni) && (vr <= mxi)) {
				var row = obj || this.tb.body.childNodes[j], data = this.options.format($A(r.data)), icon = r.icon;
				row.setProperties({"title": data[0], "id": id});
				row.addClasses((this.options.alternateRows) ? ((j & 1) ? "odd" : "even") : "", (this.rowSel[id]) ? "selected" : "", true);
				for (var n = 0, m = this.colOrder.length; n < m; n++) {
					var k = n, v = this.colOrder[n];
					var cell = row.childNodes[k];
					if (cell.hasChildNodes()) {
						if ((v == 0) && (icon != ""))
							cell.addClasses("stable-icon", icon, true);
						cell.firstChild.nodeValue = data[v];
					} else {
						if ((v == 0) && (icon != ""))
							cell.addClasses("stable-icon", icon, true);
						cell.appendText(data[v]);
					}
				}
				if (row != this.tb.body.childNodes[j]) row.inject(this.tb.body.childNodes[j], "before");
				row.show(true);
				r.rowIndex = j++;
			} else
			{
				r.rowIndex = -1;
				if (r.hidden) vr--;
			}
			if (j >= max) break;
			i++;
		}
		for (i = j; i < max; i++)
			this.tb.body.childNodes[i].setProperty("id", "").hide();
		if (Browser.Engine.gecko)
			this.attachBody();
		this.refresh();
	},
	
	"refresh": function() {
		if (this.isScrolling) return;
		if (this.options.mode == MODE_PAGE)
			this.updatePageMenu();
		if (this.options.mode == MODE_VIRTUAL)
			this.resizePads();
	},
	
	"selectRow": function(ev, row) {
		var id = row.get("id");
		if (!(ev.rightClick && this.rowSel[id])) {
			if (ev.shift) {
				if (this.stSel === null) {
					this.stSel = id;
					this.rowSel[id] = 0;
					this.selectedRows.push(id);
				} else {
					var la = this.activePos[this.stSel];
					var lb = this.activePos[id];
					var lo = la.min(lb);
					var hi = la.max(lb);
					this.selectedRows.length = 0;
					delete this.rowSel;
					this.rowSel = {};
					for (var i = lo; i <= hi; i++) {
						var key = this.activeId[i];
						this.rowSel[key] = this.selectedRows.length;
						this.selectedRows.push(key);
					}
				}
			} else if (ev.control) {
				this.stSel = id;
				if (this.rowSel.hasOwnProperty(id)) {
					this.selectedRows.splice(this.rowSel[id], 1);
					for (var i = this.rowSel[id], j = this.selectedRows.length; i < j; i++)
						this.rowSel[this.selectedRows[i]]--;
					delete this.rowSel[id];
				} else {
					this.rowSel[id] = this.selectedRows.length;
					this.selectedRows.push(id);
				}
			} else {
				this.stSel = id;
				this.selectedRows.length = 0;
				delete this.rowSel;
				this.rowSel = {};
				this.rowSel[id] = 0;
				this.selectedRows.push(id);
			}
			
			if (this.selectedRows.length == 0)
				this.stSel = null;
				
			this.refreshSelection();
		}
		
		this.fireEvent("onSelect", [ev, id]);
	},

	"addRow": function(data, id, icon, hidden) {
		if ((data.length != this.cols) || ((id != null) && this.rowData.hasOwnProperty(id))) return;
		id = id || (this.id + "-row-" + (1000 + this.rows));
		this.rowSel[id] = false;
		var rowIndex = -1;
		if (!hidden) {
			if (this.viewRows < this.options.maxRows) {
				var index = this.viewRows;
				var row = this.tb.body.childNodes[index]; //this.tb.body.rows[index];
				var fdata = this.options.format($A(data));
				row.setProperties({"index": index, "title": fdata[0], "id": id});
				row.addClasses((this.options.alternateRows) ? ((index & 1) ? "odd" : "even") : "", (this.rowSel[id]) ? "selected" : "", true);
				this.fillRow(row, fdata, icon);
				row.show(true);
				rowIndex = this.viewRows++;
			}
			this.activePos[id] = this.activeId.length;
			this.activeId.push(id);
		}
		
		this.rowData[id] = {
			"data": data,
			"icon": icon || '',
			"hidden": hidden || false,
			"index": this.rowId.length, 
			"rowIndex": rowIndex
		};
		this.rowId.push(id);
		this.rows++;
		this.pageCount = (this.options.mode == MODE_PAGE) ? Math.ceil(this.activeId.length / this.options.maxRows) : 0;
	},
	
	"fillRow": function(row, data, icon) {
		var cells = row.getChildren();
		this.colOrder.each(function(v, k) {
			var cell = cells[k]; //row.cells[k];
			if (cell.hasChildNodes()) {
				if ((v == 0) && icon)
					cell.addClasses("stable-icon", icon);
				cell.firstChild.nodeValue = data[v];
			} else {
				if ((v == 0) && icon)
					cell.addClasses("stable-icon", icon);
				cell.appendText(data[v]);
			}
		});
	},
	
	"detachBody": function() {
		this.tb.body.dispose();
	},
	
	"attachBody": function() {
		this.tBody.grab(this.tb.body);
	},

	"removeRow": function(id) {
		var rd = this.rowData[id];
		if (rd == null) return;
		if (!rd.hidden) {
			this.activeId.splice(this.activePos[id], 1);
			delete this.activePos[id];
		}
		delete this.rowSel[id];
		this.rowId.splice(rd.index, 1);
		delete this.rowData[id];
		this.rows--;
		this.refreshSelection();
	},

	"clearRows": function() {
		if (this.rows > 0) {
			Array.each(this.tb.body.childNodes, function(row) {
				Array.each(row.childNodes, function(cell) {
					cell.empty();
				});
			});
			this.rows = 0;
			this.activeId.empty();
			this.viewRows = 0;
			delete this.rowSel;
			this.rowSel = {};
			delete this.rowData;
			this.rowData = {};
			this.rowId.empty();
			this.dBody.scrollLeft = 0;
			this.dBody.scrollTop = 0;
			this.curPage = 0;
			this.pageCount = 0;
		}
	},

	"calcSize": function() {
		this.dBody.setStyle("height", (this.dCont.clientHeight - this.dHead.offsetHeight - ((this.options.mode == MODE_PAGE) ? 26 : 0)).max(52));
		this.dBody.setStyle("width", (this.dCont.getWidth() - 2).max(0));
		this.dHead.setStyle("width", (this.dBody.clientWidth + (((this.dBody.offsetWidth - this.dBody.clientWidth) == 0) ? -4 : -1)).max(0));
		if (!this.isResizing) {
			for (var i = 0, j = this.cols; i < j; i++) {
				if (this.colData[i].disabled) continue;
				var w = 0;
				// padding width + border width = 19
				if (Browser.Engine.trident) {
					w = this.tBodyCols[i].offsetWidth - 19;
				} else {
					w = this.tBodyCols[i].width - (Browser.Engine.webkit ? 0 : 19);
				}
				this.tHeadCols[i].setStyle("width", w.max(14));
			}
		}
	},

	"hideRow": function(id) {
		if (this.activePos.hasOwnProperty(id)) {
			this.activeId.splice(this.activePos[id], 1);
			for (var i = this.activePos[id], j = this.activeId.length; i < j; i++)
				this.activePos[this.activeId[i]]--;
			delete this.activePos[id];
		}
		this.rowData[id].hidden = true;
		this.rowSel[id] = false;
		this.pageCount = (this.options.mode == MODE_PAGE) ? Math.floor(this.activeId.length / this.options.maxRows) : 0;
	},

	"unhideRow": function(id) {
		if (!this.activePos.hasOwnProperty(id)) {
			//FIXME: this doesn't respect the sort order
			this.activePos[id] = this.activeId.length;
			this.activeId.push(id);
		}
		this.rowData[id].hidden = false;
		this.pageCount = (this.options.mode == MODE_PAGE) ? Math.ceil(this.activeId.length / this.options.maxRows) : 0;
	},

	"refreshSelection": function() {
		var i = this.tb.body.childNodes.length;
		while (i--) {
			var row = this.tb.body.childNodes[i];
			row[this.rowSel.hasOwnProperty(row.id) ? "addClass" : "removeClass"]("selected");
		}
	},

	"clearSelection": function(noRefresh) {
		this.selectedRows.length = 0;
		delete this.rowSel;
		this.rowSel = {};
		if (!noRefresh) this.refreshSelection();
	},

	"fillSelection": function(noRefresh) {
		this.selectedRows = $A(this.activeId);
		for (var i = 0, j = this.selectedRows.length; i < j; i++)
			this.rowSel[this.selectedRows[i]] = i;
		if (!noRefresh) this.refreshSelection();
	},

	"getCache": function(index) {
		var a = [];
		index = this.colOrder[index];
		for (var key in this.rowData) if (this.rowData.hasOwnProperty(key)) {
			a.push({
				"key": key,
				"v": this.rowData[key].data[index],
				"e": this.rowData[key]
			});
		}
		return a;
	},

	"clearCache": function(a) {
		for (var i = 0, j = a.length; i < j; i++) {
			a[i].key = null;
			a[i].v = null;
			a[i].e = null;
			a[i] = null;
		}
		a = null;
	},

	"getValue": function(row, col) {
		return row.data[this.colOrder[col]];
	},

	"setValue": function(id, col, val) {
		var row = this.rowData[id];
		if (row == null)	return;
		row.data[col] = val;
		if (row.rowIndex == -1) return;
		console.assert((row.rowIndex >= 0) && (row.rowIndex < this.tb.body.childNodes.length), "rowIndex is ", row.rowIndex);
		var r = this.tb.body.childNodes[row.rowIndex], index = this.colOrder.indexOf(col);
		if (index == -1) return;
		// lastChild should be a TextNode
		r.childNodes[index].lastChild.nodeValue = this.options.format(val, col);
	},

	"setIcon": function(id, icon) {
		this.rowData[id].icon = icon;
		var r = $(id), index = this.colOrder.indexOf(0);
		if (!r || (index == -1)) return;
		r.cells[index].firstChild.className = "stable-icon " + icon;
	},

	"setAttr": function(id, name, value) {
		this.rowData[id].attr[name] = value;
	},

	"getAttr": function(row, name) {
		return this.rowData[row].attr[name];
	},
	
	"setMaxRows": function(max) {
		this.maxRows = max;
	},

	"resizeTo": function(w, h, c) {
		if ($type(w) == "number")
			this.dCont.setStyle("width", w);
		if ($type(h) == "number")
			this.dCont.setStyle("height", h);
		this.calcSize();
	},
	
	"colMenu": function(coords) {
		ContextMenu.clear();
		for (var i = 0; i < this.cols; i++) {
			var opts = [this.colData[i].text, this.toggleColumn.bind(this, i)];
			if (!this.colData[i].disabled)
				opts.splice(0, 0, CMENU_CHECK);
			ContextMenu.add(opts);
		}
		ContextMenu.show(coords);
	},
	
	"toggleColumn": function(index) {
		var hide = !this.colData[index].disabled;
		this.colData[index].disabled = hide;
		this.tBodyCols[index].setStyles({
			"width": hide ? 0 : (this.colWidth[index] || "auto"),
			"display": hide ? "none" : ''
		});
		this.tHeadCols[index][hide ? "addClass" : "removeClass"]("stable-hidden-column");
		$each(this.tb.body.rows, function(row) {
			row.cells[index][hide ? "addClass" : "removeClass"]("stable-hidden-column");
		});
		this.fireEvent("onColToggle", [index, hide]);
		this.calcSize();
		return true;
	},
	
	"resizePads": function() {
		if (this.activeId.length <= this.maxRows) {
			this.topPad.setStyle("height", 0);
			this.bottomPad.setStyle("height", 0);
		} else {
			var vh = this.activeId.length * 16;
			var rt = (this.dBody.scrollHeight == 0) ? 0.0 : (this.dBody.scrollTop / this.dBody.scrollHeight);
			if (rt > 1.0) rt = 1.0;
			var mh = this.options.maxRows * 16;
			var th = this.dBody.scrollTop - ((mh - this.dBody.offsetHeight) * rt).toInt();
			if (vh < mh + th)
				th = vh - mh;
			this.topPad.setStyle("height", th);
			this.bottomPad.setStyle("height", vh - mh - th);
		}
	},

	"updatePageMenu": function() {
		(this.curPage > 0) ?
			this.pagePrev.addClass("prevlink")
		:
			this.pagePrev.removeClass("prevlink").removeClass("prevlink-hover");
		(this.curPage < this.pageCount - 1) ?
			this.pageNext.addClass("nextlink")
		:
			this.pageNext.removeClass("nextlink").removeClass("nextlink-hover");
			
		this.pageSelect.options.length = 0;
		if (this.pageCount <= 1) {
			this.pageSelect.disabled = true;
			return;
		}
		this.pageSelect.disabled = false;
		for (var i = 0; i < this.pageCount; i++)
			this.pageSelect.options[i] = new Option(/* text */ i + 1, /* value */ i, /* defaultSelected */ false, /* selected */ i == this.curPage);
		this.pageStat.show();
	},

	"gotoPage": function(i) {
		this.curPage = i;
		this.updatePageMenu();
		if (Browser.Engine.gecko)
			this.detachBody();
		this.refreshRows(true);
		if (Browser.Engine.gecko)
			this.attachBody();
	},

	"prevPage": function() {
		if (this.curPage > 0)
			this.gotoPage(this.curPage - 1);
	},

	"nextPage": function() {
		if (this.curPage < this.pageCount - 1)
			this.gotoPage(this.curPage + 1);
	}
});

var ColumnHandler = {

	"start": function initColAct(st, drag) {
		st.cancelSort = true; // just to be sure
		if (st.hotCell == -1) {
			var l = drag.element.getPosition().x - st.dCont.getPosition().x;
			drag.value.now.x = l;
			drag.mouse.pos.x = drag.mouse.start.x - l;
			st.colDragObj.set("html", drag.element.get("text"));
			st.colDragObj.setStyles({
				"left": l,
				"width": drag.element.getStyle("width").toInt(),
				"textAlign": drag.element.getStyle("textAlign"),
				"visibility": "visible"
			});
			st.colDragEle = drag.element;
			drag.element = drag.handle = st.colDragObj;
			st.cancelMove = false;
			st.colMove = {"from": st.colDragEle.retrieve("index"), "to": -1};
		} else {
			var col = st.tHeadCols[st.hotCell];
			var w = col.getSize().x;
			var l = col.getPosition().x - st.dCont.getPosition().x + w;
			st.resizeCol = {"width": col.getStyle("width").toInt(), "left": l};
			drag.value.now.x = l;
			drag.mouse.pos.x = drag.mouse.start.x - l;
			//st.resizeCol.left = l;
			st.cancelMove = true;
			st.isResizing = true;
			st.colReszObj.setStyles({"left": l, "height": st.dBody.getSize().y, "visibility": "visible"});
			st.colDragEle = drag.element;
			drag.element = drag.handle = st.colReszObj;
		}
	},

	"drag": function (st, drag) {
		if (!st.cancelMove) {
			var offsetX = 0, i = 0;
			var x = drag.value.now.x;
			while ((offsetX < x) && (i <= st.cols)) {
				offsetX += st.tHeadCols[i].getWidth();
				i++;
			}
			if (i >= st.cols) {
				c = i;
				st.colSep.setStyle("left", st.tHeadCols[c - 1].offsetLeft + st.tHeadCols[c - 1].getWidth() - 1);
			} else {
				st.colSep.setStyle("left", st.tHeadCols[i].offsetLeft);
			}
			st.colSep.setStyle("visibility", "visible");
			st.colMove.to = i;
			if (i == st.colMove.from)
				st.colMove.to++;
		} else {
			var w = drag.value.now.x - st.resizeCol.left + st.resizeCol.width;
			if (w < 14)
				w = 14;
			var col = st.tHeadCols[st.hotCell];
			col.setStyle("width", w);
			if (window.ie || window.gecko)
				st.tBody.setStyle("width", "auto");
			$(document.body).setStyle("cursor", "e-resize");
		}
	},

	"end": function (st, drag) {
		drag.element = drag.handle = st.colDragEle;
		st.colDragEle = null;
		switch (true) {
			case st.isResizing:
				st.colReszObj.setStyles({"left": 0, "height": 0, "visibility": "hidden"});
				st.isResizing = false;
				resizeColumn.call(st, st.hotCell);
				document.body.setStyle("cursor", "default");
			break;
		    
			default:
				st.colDragObj.setStyles({"left": 0, "width": 0, "visibility": "hidden"});
				st.colSep.setStyle("visibility", "hidden");
				moveColumn.call(st, st.colMove.from, st.colMove.to);
		}
		st.cancelSort = false;
	},

	"check": function(ev, cell) {
		if (this.isResizing) return;
		var x = ev.page.x - cell.getPosition().x + this.dBody.scrollLeft;
		var i = cell.retrieve("index");
		if ((x <= 8) && (i > 0)) {
			this.hotCell = i - 1;
			cell.setStyle("cursor", "e-resize");
		} else if (x >= cell.offsetWidth - 8) {
			this.hotCell = i;
			cell.setStyle("cursor", "e-resize");
		} else {
			this.hotCell = -1;
			cell.setStyle("cursor", "default");
		}
	}
	
};

function resizeColumn(index)
{
	var cols = this.tBody.getElement("colgroup").getElements("col");
	this.colWidth[index] = this.tHeadCols[index].getWidth();
	var from = $pick(index, 0);
	var to = $pick(index, cols.length - 1);
 	for (var i = from; i <= to; i++)
		cols[i].setStyle("width", this.tHeadCols[i].getWidth() - (Browser.Engine.trident ? 10 : 0));
	var w = this.tHead.getSize().x;
	this.tb.body.setStyle("width", w);
	this.tBody.setStyle("width", w);
	this.fireEvent("onColResize");
}

// move column iCol infront of column iNew
function moveColumn(iCol, iNew) {
	if ((iNew == -1) || (iCol == iNew - 1)) return;
	var i, l, oParent, oCol, oBefore, aRows, a;
	var insertAtEnd = (iNew == this.cols)
	var insertOuter = (iNew == 0) || insertAtEnd;
	var moveToFront = (iNew < iCol);
	var moveToBack = (iNew > iCol);

	oCol = this.tHeadCols[iCol];
	oParent = oCol.parentNode;
	oCol.dispose();
	insertOuter ?
		oParent.grab(oCol, insertAtEnd ? "bottom" : "top")
	:
		oCol.inject(this.tHeadCols[iNew], "before");

	oParent = this.tBody.getElement("colgroup");
	oBefore = insertOuter ? null : oParent.childNodes[iNew];
	oCol = oParent.childNodes[iCol].dispose();
	insertOuter ?
		oParent.grab(oCol, insertAtEnd ? "bottom" : "top")
	:
		oCol.inject(oBefore, "before");
	
	$each(this.tb.body.rows, function(row) {
		var bef = insertOuter ? null : row.cells[iNew];
		var cell = row.cells[iCol].dispose();
		insertOuter ?
			row.grab(cell, insertAtEnd ? "bottom" : "top")
		:
			cell.inject(bef, "before");
	});
	
	var aHC = [], aBC = [], aC = [], aO = [];
	oCol = this.tHeadCols[iCol];
	var oBCol = this.tBodyCols[iCol];
	for (i = 0; i < this.cols; i++) {
		if (i == iCol) continue;
		if (i == iNew) {
			aHC.push(oCol);
			aBC.push(oBCol)
			aC.push(this.colData[iCol]);
			aO.push(this.colOrder[iCol]);
		}
		aHC.push(this.tHeadCols[i]);
		aBC.push(this.tBodyCols[i]);
		aC.push(this.colData[i]);
		aO.push(this.colOrder[i]);
	}
	
	if (iNew == this.cols) {
		aHC.push(oCol);
		aBC.push(oBCol);
		aC.push(this.colData[iCol]);
		aO.push(this.colOrder[iCol]);
	}
	
	this.tHeadCols = aHC.slice(0);
	this.tBodyCols = aBC.slice(0);
	this.colData = aC.slice(0);
	this.colOrder = aO.slice(0);
	
	aHC = aBC = aC = aO = null;
	
	for (i = 0; i < this.cols; i++)
		this.tHeadCols[i].store("index", i);

	if ((iNew == this.options.sIndex) && (iCol > iNew)) {
		// we moved a column that was to the right of the sorted column to the left of it
		this.options.sIndex = iNew + 1;
	} else if ((iCol < iNew) && (this.options.sIndex < iNew) && (this.options.sIndex > iCol)) {
		// we moved a column that was to the left of the sorted column to the right of it
		this.options.sIndex--;
	} else if (iCol == this.options.sIndex) {
		// we moved the sorted column
		this.options.sIndex = iNew;
		if (iNew > iCol) // we moved it to the right
			this.options.sIndex--;
	}

	this.cancelSort = false;
	this.fireEvent("onColMove");
}

var Compare = {

	"compare": function(x, y) {
		var a = '' + x, b = '' + y;
		return (a < b) ? -1 :
			   (a > b) ? 1 : 0;
	},
	
	"numeric": function(x, y) {
		return (x.toFloat() - y.toFloat());
	},
	
	"alphaNumeric": function(x, y) {
		var a = ('' + x).toLowerCase(), b = ('' + y).toLowerCase();
		return (a < b) ? -1 :
			   (a > b) ? 1 : 0;
	}
};