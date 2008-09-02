/*

	Copyright Emil A Eklund - Column List Widget 1.03
			 (http://webfx.eae.net/dhtml/collist/columnlist.html)
	Copyright Erik Arvidsson - Sortable Table 1.12
			 (http://webfx.eae.net/dhtml/sortabletable/sortabletable.html)
	Copyright 2007, 2008 Carsten Niebuhr

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

var TYPE_STRING = 0;
var TYPE_NUMBER = 1;
var TYPE_DATE = 2;
var TYPE_STRING_NO_CASE = 3;
var TYPE_NUM_ORDER = 3;

var ALIGN_AUTO = 0;
var ALIGN_LEFT = 1;
var ALIGN_CENTER = 2;
var ALIGN_RIGHT  = 3;

var MODE_PAGE = 0;
var MODE_VIRTUAL = 1;

var NO_CHANGE = 0;
var HAS_CHANGED = 1;

var TD = new Element("td");
var TR = new Element("tr");
var DIV = new Element("div");
function simpleClone(element, content) {
	element = $(element.cloneNode(!!content));
	element.uid = null;
	$uid(element);
	return element;
}

var dxSTable = new Class({

	"Implements": [Options, Events],
	"rows": 0, // # of rows
	"rowData": {}, // the rows' raw data (unformatted)
	"rowId": [], // row ids in their current sorted order
	"rowSel": {}, // rows' select state
	"selectedRows": [], // the selected rows
	"stSel": null, //
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
		"mode": MODE_PAGE,
		"rowsSelectable": true,
		"refreshable": false
	},
	"startSel": null,
	"tHeadCols": [],
	"tBodyCols": [],
	"cancelSort": false,
	"cancelMove": false,
	"hotCell": -1,
	"colMove": null,
	"colSep": null,
	"isMoving": false,
	"isResizing": false,
	"isSorting": false,
	"isScrolling": false,
	"selCount": 0,
	"curPage": 0,
	"pageCount": 0,
	"rowCache": [],
	"rowCover" : null,
	
	"create": function(id, columns, options) {
		this.colHeader = columns;
		this.colWidth = options.colWidth || (new Array(columns.length));
		this.colOrder = options.colOrder || (new Array(columns.length));
		this.sIndex = isNaN(options.sIndex) ? -1 : options.sIndex.toInt().limit(-1, columns.length - 1);
		delete options.colOrder;
		delete options.colWidth;
		delete options.sIndex;
		this.setOptions(options);
	
		var tr, td, div, $me = this;

		this.id = "stable-" + id;
		this.dCont = $(id).addClass("stable");
		this.dHead = simpleClone(DIV, false).addClass("stable-head").inject(this.dCont);
		this.dBody = simpleClone(DIV, false).addClass("stable-body").inject(this.dCont);

		this.tHead = new Element("table", {
			"cellpadding": 0,
			"cellspacing": 0
		}).inject(this.dHead);
		
		this.tHead.addEvent("contextmenu", function(ev) {
			ev.stop();
			return false;
		});
		
		this.tb.head = new Element("tbody").inject(this.tHead);
		tr = simpleClone(TR, false);
		var nDrag = new Drag(tr, {
			"modifiers" : {"x": "left", "y": false},
			"snap" : 1,
			"onBeforeStart" : function() { if ($me.hotCell >= 0) { $me.rowCover.show(); } },
			"onStart" : function(){ ColumnHandler.start($me, this); },
			"onDrag" : function(){ ColumnHandler.drag($me, this); },
			"onComplete" : function(){ ColumnHandler.end($me, this); },
			"onRightClick" : this.colMenu.bind(this),
			"onCancel" : function(_, ev) {
				this.detach();
				$me.cancelSort = false;
				$me.rowCover.hide();
				$me.sort(this.element, ev.shift);
			}
		}).detach();
		tr.addEvent("mousemove", function(ev) {
			var ele = ev.target;
			if (!ele) return;
			var tag = ele.get("tag");
			if (tag == "span") {
				ele = ele.parentNode;
				tag = "td";
			}
			if (tag == "td")
				ColumnHandler.check.apply($me, [ev, ele]);
		}).addEvent("mousedown", function(ev) {
			var ele = ev.target;
			if (!ele) return;
			var tag = ele.get("tag");
			if (tag == "span") {
				ele = ele.parentNode;
				tag = "td";
			}
			if (tag == "td") {
				nDrag.element = nDrag.handles = ele;
				nDrag.attach().start(ev);
			}
		});

		var len = this.colHeader.length, ROW = simpleClone(TR, false);
		for (var i = 0, j = 0; i < len; i++) {
			this.colOrder[i] = (typeof this.colOrder[i] == "number") ? this.colOrder[i].limit(0, len - 1) : i;
			this.cols++;
			this.colData[i] = this.colHeader[this.colOrder[i]];
			ROW.grab(
				simpleClone(TD, false).addClasses(this.id + "-col-" + this.colOrder[i], this.colData[i].disabled ? "stable-hidden-column" : "")
			);
			td = simpleClone(TD, false)
				.grab(new Element("span", {"text": this.colData[i].text}))
				.setStyle("width", this.colWidth[this.colOrder[i]])
				.addClass(this.colData[i].disabled ? "stable-hidden-column" : "")
				.store("index", i)
				.inject(tr);
			this.tHeadCols[i] = td;
			j++;
		}
		this.tb.head.grab(tr);
		
		this.rowCover = new Element("div", {
			"class": "rowcover"
		}).inject(this.dHead);	

		if (this.options.mode == MODE_VIRTUAL)
			this.topPad = simpleClone(DIV, false).addClass("stable-pad").inject(this.dBody);
		
		this.tBody = new Element("table", {
			"cellpadding": 0,
			"cellspacing": 0
		}).inject(this.dBody);
		
		if (this.options.mode == MODE_VIRTUAL)
			this.bottomPad = simpleClone(DIV, false).addClass("stable-pad").inject(this.dBody);

		var cg = new Element("colgroup").inject(this.tBody);
		for (var i = 0; i < len; i++) {
			this.tBodyCols[i] = new Element("col", {
				"styles": {
					"width": this.colWidth[this.colOrder[i]],
					"display": this.colData[i].disabled ? "none" : ''
				},
				"width": this.colWidth[this.colOrder[i]],
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
		this.colDragObj = simpleClone(DIV, false).addClass("stable-move-header").inject(this.dHead);		
		this.colSep = simpleClone(DIV, false).addClass("stable-separator-header").inject(this.dHead);
		this.colReszObj = simpleClone(DIV, false).addClass("stable-resize-header").inject(this.dBody);
		
		this.loadObj = simpleClone(DIV, false).addClass("stable-loading").grab(simpleClone(DIV, false).addClass("stable-loading-text").set("html", "Loading...")).inject(this.dCont);
		
		if (this.options.rowsSelectable) {
			this.dBody.addEvent("mousedown", function(ev) {
				var ele = ev.target;
				if (!ele) return;
				if (ele.get("tag") == "td")
					$me.selectRow(ev, ele.parentNode);
			}).addEvent("click", function(ev) {
				var ele = ev.target;
				if (!ele) return;
				if (ele.get("tag") != "td") {
					var pos = this.getPosition();
					if ((this.clientWidth > ev.page.x - pos.x - this.scrollLeft + 2) && (this.clientHeight > ev.page.y - pos.y - this.scrollTop + 2)) {
						$me.clearSelection();
						$me.fireEvent("onSelect", [ev, ""]);
					}
				}
			});
		}
		for (var i = 0; i < this.options.maxRows; i++)
			this.tb.body.appendChild(simpleClone(ROW, true).hide());
		ROW = null;

		this.tBody.grab(this.tb.body);
		if (this.options.mode == MODE_PAGE) {
			this.pageMenu = simpleClone(DIV, false).addClass("stable-pagemenu").inject(this.dCont);
			if (this.options.rowsSelectable)
				this.pageInfo = new Element("span", {"class": "pageinfo", "text": "0 row(s) selected."}).inject(this.pageMenu);
			this.pageNext = simpleClone(DIV, false)
				.addClass("nextlink-disabled")
				.addEvent("click", this.nextPage.bind(this))
				.addEvent("mouseenter", function() {
					if (this.hasClass("nextlink"))
						this.addClass("nextlink-hover");
				})
				.addEvent("mouseleave", function() {
					if (this.hasClass("nextlink"))
						this.removeClass("nextlink-hover");
				})
				.inject(this.pageMenu);
			this.pagePrev = simpleClone(DIV, false)
				.addClass("prevlink-disabled")
				.addEvent("click", this.prevPage.bind(this))
				.addEvent("mouseenter", function() {
					if (this.hasClass("prevlink"))
						this.addClass("prevlink-hover");
				})
				.addEvent("mouseleave", function() {
					if (this.hasClass("prevlink"))
						this.removeClass("prevlink-hover");
				})
				.inject(this.pageMenu);
				
			this.pageStat = new Element("span").addClass("pagestat").inject(this.pageMenu);
			
			this.pageSelect = new Element("select", {
				"events": {
					"change": function() {
						$me.gotoPage(this.get("value").toInt());
					}
				},
				"disabled": "disabled"
			}).inject(this.pageStat);
			
			if (this.options.refreshable) {
				new Element("a", {
					"class": "refreshBtn",
					"href": "#",
					"events": {
						"click": function(ev) {
							ev.stop();
							if ($me.rows)
								$me.fireEvent("onRefresh");
						}
					}
				}).grab(new Element("div")).inject(this.pageStat);
			}
		}
		
		this.assignEvents();
		this.setAlignment();
	},
	
	"assignEvents": function() {
		var scrollDiff = 0, scrollTimer = null;
		this.dBody.addEvent("scroll", (function() {
			this.dHead.scrollLeft = this.dBody.scrollLeft;
			if (this.options.mode == MODE_PAGE) return;
			if (scrollDiff === 0) {
				scrollDiff = this.dBody.scrollTop;
			} else {
				var diff = Math.abs(scrollDiff - this.dBody.scrollTop);
				if (diff > 0) {
					this.isScrolling = true;
					$clear(scrollTimer);
					this.scrollTimer = (function() {
						scrollDiff = 0;
						$clear(scrollTimer);
						this.isScrolling = false;
						this.resizePads();
						this.loadObj.show();
						this.refreshRows();
					}).bind(this).delay(300);
				} else {
					$clear(scrollTimer);
				}
			}
			return false;
		}).bind(this));
		if (!this.options.rowsSelectable) return;
		this.dCont.addEvent("keydown", (function(ev) {
			if (ev.key == "delete") { // DEL
				this.fireEvent("onDelete");
			} else if ((ev.key == "a") && ev.control) { // Ctrl + A
				this.fillSelection();
				this.fireEvent("onSelect", ev);
			} else if ((ev.key == "e") && ev.control) { // Ctrl + E
				this.clearSelection();
				this.fireEvent("onSelect", ev);
			}
		}).bind(this));
		if (Browser.Engine.gecko) {
			// http://n2.nabble.com/key-events-not-firing-on-div-in-FF--td663136.html
			this.dBody.addEvent("mousedown", function(ev) {
				this.focus();
			}).setProperty("tabIndex", -1);
		}
	},

	"setAlignment": function() {
		var sb = "", cols = this.tBody.getElement("colgroup").getElements("col");
		for (var i = 0; i < this.cols; i++) {
			var align = "";
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
			if (Browser.Engine.trident) {
				cols[i].setStyle("textAlign", align);
			} else {
				sb += "." + this.id + "-col-" + this.colOrder[i] + " { text-align: " + align + " }";
			}
		}
		if (!Browser.Engine.trident)
			$("colrules").appendText(sb);
	},
	
	"getCache": function(index) {
		if (this.rowCache.length != this.rows) {
			this.clearCache();
			this.rowCache = new Array(this.rows);
		}
		var c = 0, index = this.colOrder[index];
		for (var key in this.rowData) {
			this.rowCache[c++] = {
				"key": key,
				"v": this.rowData[key].data[index],
				"e": this.rowData[key]
			};
		}
	},

	"clearCache": function(a) {
		var len = this.rowCache.length;
		while (len--) {
			this.rowCache[len].key = null;
			this.rowCache[len].v = null;
			this.rowCache[len].e = null;
			this.rowCache[len] = null;
		}
		this.rowCache.length = 0;
	},
	
	"sort": function(col, shift) {
		if (this.cancelSort) return;
		this.isSorting = true;
		var rev = true, simpleReverse = true;

		if (col == null) {
			if (this.sIndex == -1) return;
			rev = false;
			col = this.tb.head.childNodes[0].childNodes[this.sIndex];
			simpleReverse = false;
		}
		
		if (col.get("tag") != "td")
			col = col.getParent("td");

		var ind = col.retrieve("index");
		if (shift) { //secondary sorting
			if (ind == this.sIndex) {
				this.secIndex = 0;
				return;
			}
			if (this.secIndex == ind) {
				this.secRev = 1 - this.secRev;
			} else {
				this.secRev = 0;
			}
			this.secIndex = ind;
			ind = this.sIndex;
			rev = false;
			col = this.tb.head.childNodes[0].childNodes[this.sIndex];
			simpleReverse = false;
		}

		if (rev)
			this.options.reverse = (this.sIndex == ind) ? !this.options.reverse : false;
		
		if (this.sIndex != ind) {
			simpleReverse = false;
			this.getCache(ind);
			if (this.sIndex >= 0)
				this.tb.head.childNodes[0].childNodes[this.sIndex].setStyle("backgroundPosition", "right -32px");
		}

		col.setStyle("backgroundPosition", "right " + ((this.options.reverse) ? "0px" : "-16px"));

		this.sIndex = ind;
		if (!simpleReverse) {
			var $me = this, comp;
			switch (this.colData[ind].type) {
			case TYPE_STRING:
				comp = function(x, y) {
					return $me.sortAlphaNumeric(x, y);
				};
				break;
				
			case TYPE_NUMBER:
				comp = function(x, y) {
					return $me.sortNumeric(x, y);
				};
				break;
				
			case TYPE_NUM_ORDER:
				comp = function(x, y) {
					return $me.sortNumOrder(x, y);
				};
				break;

			default:
				comp = function(x, y) {
					return Comparator.compare(x.v, y.v);
				};
				break;
			}
			this.rowCache.sort(comp);
		}

		this.clearActive();
		var end = this.rows, i = 0, diff = 1;
		if (this.options.reverse) {
			end = diff = -1;
			i = this.rows - 1;
		}
		while (i != end) {
			var key = this.rowCache[i].key;
			if (!this.rowCache[i].e.hidden) {
				this.activePos[key] = this.activeId.length;
				this.activeId.push(key);
			}
			this.rowData[key].index = i;
			i += diff;
		}

		this.isSorting = false;
		
		this.curPage = 0;
		this.refreshRows();
			
		this.fireEvent("onSort", [this.sIndex, this.options.reverse]);
	},
	
	//"cmp": {}, // map for compare functions, type -> function

	"sortNumeric": function(x, y) {
		var r = Comparator.compareNumeric(x.v, y.v);
		return (((r == 0) && (this.secIndex != this.sIndex)) ? this.sortSecondary(x, y) : r);
	},
	
	"sortNumOrder": function(x, y) {
		var r = Comparator.compareNumeric(x.v, y.v);
		if (r != 0) {
			if (x.v == -1)
				r = 1;
			else if (y.v == -1)
				r = -1;
		}
		return (((r == 0) && (this.secIndex != this.sIndex)) ? this.sortSecondary(x, y) : r);
	},

	"sortAlphaNumeric": function(x, y) {
		var r = Comparator.compareAlphaNumeric(x.v, y.v);
		return (((r == 0) && (this.secIndex != this.sIndex)) ? this.sortSecondary(x, y) : r);
	},

	"sortSecondary": function(x, y) {
		var index = this.colOrder[this.secIndex];
		var m = x.e.data[index];
		var n = y.e.data[index];
		var type = this.colData[index].type;
		var r = 0;
		switch (type) {
		case TYPE_STRING:
			r = Comparator.compareAlphaNumeric(m, n);
			break;
			
		case TYPE_NUMBER:
			r = Comparator.compareNumeric(m, n);
			break;
			
		case TYPE_NUM_ORDER:
			r = Comparator.compareNumeric(m, n);
			if (r != 0) {
				if (m == -1)
					r = 1;
				else if (n == -1)
					r = -1;
			}
			break;

		default:
			r = Comparator.compare(m, n);
		}
		if (r == 0)
			r = x.e.index - y.e.index;
		if (this.options.reverse)
			r = -r;
		if (this.secRev)
			r = -r;	
		return r;
	},
	
	"getActiveRange": function() {
		var max = this.options.maxRows, mni = 0, mxi = 0;
		if (this.options.mode == MODE_VIRTUAL) {
			var rt = (this.dBody.scrollHeight == 0) ? 0.0 : (this.dBody.scrollTop / this.dBody.scrollHeight);
			if (rt > 1.0)
				rt = 1.0;
			mni = Math.floor(rt * this.activeId.length);
		} else {
			mni = max * this.curPage;
		}
		mxi = (mni + max - 1).min(this.activeId.length - 1);
		return [mni, mxi];
	},

	"refreshRows": function() {
		var range = this.getActiveRange();
		if (Browser.Engine.gecko || Browser.Engine.trident4)
			this.detachBody();
		var count = 0;
		for (var i = range[0]; i <= range[1]; i++) {
			var id = this.activeId[i], rdata = this.rowData[id], row = $(id) || this.tb.body.childNodes[count], data = this.options.format($A(rdata.data));
			var clsName = "", clsChanged = row.hasClass("selected");
			if (has(this.rowSel, id)) {
				clsName += "selected";
				clsChanged = !clsChanged;
			}
			if (this.options.alternateRows) {
				if (count & 1) {
					clsName += " odd";
					clsChanged = clsChanged | !row.hasClass("odd");
				} else {
					clsName += " even";
					clsChanged = clsChanged | !row.hasClass("even");
				}
			}
			if (clsChanged)
				row.className = clsName.clean();
			this.fillRow(row, data, rdata.icon);
			if (row != this.tb.body.childNodes[count])
				row.inject(this.tb.body.childNodes[count], "before");
			row.setProperties({"title": data[0], "id": id}).show(true);
			rdata.rowIndex = count++;
		}
		for (var i = count; i < this.options.maxRows; i++)
			this.tb.body.childNodes[i].setProperty("id", "").hide();
		if (Browser.Engine.gecko || Browser.Engine.trident4)
			this.attachBody();
		this.loadObj.hide();
		this.refresh();
		this.requiresRefresh = false;
	},
	
	"refresh": function() {
		if (this.isScrolling) return;
		this.updatePageMenu();
		this.dHead.setStyle("width", this.dBody.clientWidth);
		this.rowCover.setStyle("width", this.dBody.clientWidth);
		//if (this.options.mode == MODE_VIRTUAL)
		//	this.resizePads();
	},
	
	"selectRow": function(ev, row) {
		var id = row.id;
		if (!(ev.rightClick && has(this.rowSel, id))) {
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
				if (has(this.rowSel, id)) {
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
		if (data.length != this.cols) return;
		id = id || (this.id + "-row-" + (1000 + this.rows));
		this.rowData[id] = {
			"data": data,
			"icon": icon || "",
			"hidden": hidden || false,
			"index": -1, 
			"rowIndex": -1
		};
		this._insertRow(id);
		this.rows++;
	},
	
	"_insertRow": function(id, skipOrderCheck) {
		skipOrderCheck = !!skipOrderCheck;
		var sindex = this.sIndex;
		if (sindex >= 0) {
			var $me = this, index = 0;
			if (!skipOrderCheck) {
				var comp, from = 0, to = this.rowCache.length, rIndex = this.rowData[id].index, item = {
					"key": id,
					"v": this.rowData[id].data[this.colOrder[sindex]],
					"e": this.rowData[id]
				};
				switch (this.colData[sindex].type) {
				case TYPE_STRING:
					comp = function(x, y) {
						return $me.sortAlphaNumeric(x, y);
					};
					break;
					
				case TYPE_NUMBER:
					comp = function(x, y) {
						return $me.sortNumeric(x, y);
					};
					break;
					
				case TYPE_NUM_ORDER:
					comp = function(x, y) {
						return $me.sortNumOrder(x, y);
					};
					break;

				default:
					comp = function(x, y) {
						return Comparator.compare(x.v, y.v);
					};
					break;
				}
				if (rIndex >= 0) {
					if ((rIndex != 0) && (comp(item, this.rowCache[rIndex - 1]) < 0)) {
						to = rIndex + 1;
					} else if ((rIndex < this.rowCache.length - 1) && (comp(item, this.rowCache[rIndex + 1]) > 0)) {
						from = rIndex;
					}
				}
				index = this.rowCache.binarySearch(item, comp, from, to);
				if (index < 0)
					index = -(index + 1);
				// TODO: get this working
				//if (index != rIndex) {
					if (rIndex >= 0) {
						if (rIndex < index)
							index--;
						this.rowCache.splice(rIndex, 1);
					}
					this.rowCache.splice(index, 0, item);
					if (rIndex == -1) {
						for (var i = index, j = this.rowCache.length; i < j; i++)
							this.rowData[this.rowCache[i].key].index = i;
					} else {
						for (var i = index, j = rIndex; i <= j; i++)
							this.rowData[this.rowCache[i].key].index = i;
						for (var i = rIndex, j = index; i <= j; i++)
							this.rowData[this.rowCache[i].key].index = i;
					}
				//}
			}
			if (has(this.activePos, id)) {
				this.rowData[id].rowIndex = -1;
				index = this.activePos[id];
				delete this.activePos[id];
				this.activeId.splice(index, 1);
				for (var i = 0, j = this.activeId.length; i < j; i++)
					this.activePos[this.activeId[i]] = i;
				if (this.rowData[id].hidden)
					this.requiresRefresh = true;
			}
			if (!this.rowData[id].hidden) {
				index = this.activeId.binarySearch(id, function(idA, idB) {
					return ($me.rowData[idA].index.toFloat() - $me.rowData[idB].index.toFloat()) * (($me.options.reverse) ? -1 : 1);
				});
				if (index < 0)
					index = -(index + 1);
				this.activeId.splice(index, 0, id);
				for (var i = index, j = this.activeId.length; i < j; i++)
					this.activePos[this.activeId[i]] = i;
				var range = this.getActiveRange();
				if ((index >= range[0]) && (index <= range[1])) {
					this.requiresRefresh = true;
					this.rowData[id].rowIndex = index - range[0];
				}
			}
		} else {
			if (!this.rowData[id].hidden && !has(this.activePos, id)) {
				this.activePos[id] = this.activeId.length;
				this.activeId.push(id);
				var range = this.getActiveRange();
				if ((this.activePos[id] >= range[0]) && (this.activePos[id] <= range[1]))
					this.requiresRefresh = true;
			} else if (this.rowData[id].hidden && has(this.activePos, id)) {
				var index = this.activePos[id];
				delete this.activePos[id];
				this.activeId.splice(index, 1);
				for (var i = index, j = this.activeId.length; i < j; i++)
					this.activePos[this.activeId[i]] = i;
				this.requiresRefresh = true;
			}
		}
		if (this.options.mode == MODE_PAGE)
			this.pageCount = Math.ceil(this.activeId.length / this.options.maxRows);
	},
	
	"clearActive": function() {
		delete this.activePos;
		this.activePos = {};
		this.activeId.length = 0;
	},
	
	"requiresRefresh": false,
	
	"fillRow": function(row, data, icon) {
		var $me = this;
		this.colOrder.each(function(v, k) {
			var cell = row.childNodes[k];
			if (cell.lastChild) {
				if ((v == 0) && icon)
					cell.addClasses("stable-icon", icon, true);
				cell.lastChild.nodeValue = data[v];
			} else {
				if ((v == 0) && icon)
					cell.addClasses("stable-icon", icon, true);
				cell.appendText(data[v]);
			}
		});
	},
	
	"isDetached": false,
	
	"detachBody": function() {
		if (this.isDetached) return;
		this.tb.body.dispose();
		this.isDetached = true;
	},
	
	"attachBody": function() {
		if (!this.isDetached) return;
		this.tBody.grab(this.tb.body);
		this.isDetached = false;
	},

	"removeRow": function(id) {
		var rd = this.rowData[id], row;
		if (rd == null) return;
		if (row = $(id))
			row.setProperty("id", "");
		if (has(this.activePos, id)) {
			this.activeId.splice(this.activePos[id], 1);
			for (var i = this.activePos[id], j = this.activeId.length; i < j; i++)
				this.activePos[this.activeId[i]]--;
			delete this.activePos[id];
			this.requiresRefresh = true;
		}
		if (has(this.rowSel, id)) {
			this.selectedRows.splice(this.rowSel[id], 1);
			for (var i = this.rowSel[id], j = this.selectedRows.length; i < j; i++)
				this.rowSel[this.selectedRows[i]]--;
			delete this.rowSel[id];
		}
		if (this.sIndex >= 0) {
			this.rowCache.splice(rd.index, 1);
			for (var i = rd.index, j = this.rowCache.length; i < j; i++)
				this.rowData[this.rowCache[i].key].index = i;
		}
		rd = null;
		delete this.rowData[id];
		this.rows--;
	},

	"clearRows": function() {
		if (this.rows > 0) {
			Array.each(this.tb.body.rows, function(row) {
				Array.each(row.cells, function(cell) {
					cell.empty();
				});
				row.setProperty("id", "").hide();
			});
			delete this.activePos;
			this.activePos = {};
			delete this.rowSel;
			this.rowSel = {};
			delete this.rowData;
			this.rowData = {};
			this.clearCache();
			this.rows = this.curPage = this.pageCount = this.activeId.length = this.selectedRows.length = this.viewRows = this.dBody.scrollLeft = this.dBody.scrollTop = 0;
			this.updatePageMenu();
		}
	},

	"calcSize": function() {
		this.dBody.setStyle("height", (this.dCont.clientHeight - this.dHead.offsetHeight - ((this.options.mode == MODE_PAGE) ? 26 : 0)).max(52));
		this.dBody.setStyle("width", (this.dCont.offsetWidth - 2).max(0));
		if (Browser.Engine.trident && (Browser.Engine.version == 6))
			this.dHead.setStyle("overflow", "visible");
		this.dHead.setStyle("width", (this.dCont.offsetWidth + (((this.dBody.offsetWidth - this.dBody.clientWidth) == 0) ? -4 : -1)).max(0));
		if (!this.isResizing) {
			for (var i = 0, j = this.cols; i < j; i++) {
				if (this.colData[i].disabled) continue;
				var w = 0;
				// padding width + border width = 19
				if (Browser.Engine.trident && (Browser.Engine.version < 6)) {
					w = this.tBodyCols[i].offsetWidth - 19;
				} else {
					w = this.tBodyCols[i].width - (Browser.Engine.webkit ? 0 : 19);
				}
				this.tHeadCols[i].setStyle("width", w.max(14));
			}
		}
	},

	"hideRow": function(id) {
		this.rowData[id].hidden = true;
		this.rowData[id].rowIndex = -1;
		this._insertRow(id, true);
	},

	"unhideRow": function(id) {
		this.rowData[id].hidden = false;
		this._insertRow(id, true);
	},

	"refreshSelection": function() {
		if (!this.options.rowsSelectable) return;
		var len = this.tb.body.childNodes.length, i = 0;
		while (i < len) {
			var row = this.tb.body.childNodes[i];
			var clsName = "", clsChanged = row.hasClass("selected");
			if (has(this.rowSel, row.id)) {
				clsName += "selected";
				clsChanged = !clsChanged;
			}
			if (this.options.alternateRows) {
				if (i & 1) {
					clsName += " odd";
					clsChanged = clsChanged | !row.hasClass("odd");
				} else {
					clsName += " even";
					clsChanged = clsChanged | !row.hasClass("even");
				}
			}
			if (clsChanged)
				row.className = clsName.clean();
			i++;
		}
		this.pageInfo.set("text", this.selectedRows.length + " row(s) selected.");
	},

	"clearSelection": function(noRefresh) {
		if (this.selectedRows.length == 0) return;
		this.selectedRows.length = 0;
		delete this.rowSel;
		this.rowSel = {};
		this.stSel = null;
		if (!noRefresh)
			this.refreshSelection();
	},

	"fillSelection": function(noRefresh) {
		this.selectedRows = $A(this.activeId);
		for (var i = 0, j = this.selectedRows.length; i < j; i++)
			this.rowSel[this.selectedRows[i]] = i;
		if (!noRefresh)
			this.refreshSelection();
	},

	"setValue": function(id, col, val) {
		var row = this.rowData[id];
		if (row == null) return;
		var isSortedCol = ((this.sIndex >= 0) && (col == this.colOrder[this.sIndex]));
		var hasSortedChanged = ((row.data[col] != val) && isSortedCol);
		row.data[col] = val;
		if (isSortedCol)
			this._insertRow(id);
		if (this.requiresRefresh || row.hidden || (row.rowIndex == -1)) return hasSortedChanged;
		var r = this.tb.body.childNodes[row.rowIndex], i = this.colOrder.indexOf(col), cell = r.childNodes[i], fval = this.options.format([val], col)[0];
		if (cell.lastChild) {
			cell.lastChild.nodeValue = fval;
		} else {
			cell.appendText(fval);
		}
		return hasSortedChanged;
	},

	"setIcon": function(id, icon) {
		var row = this.rowData[id];
		row.icon = icon;
		if (row.rowIndex == -1) return;
		var r = this.tb.body.childNodes[row.rowIndex], i = this.colOrder.indexOf(0);
		if (r.childNodes[i].hasClass(icon)) return;
		r.childNodes[i].className = "stable-icon " + icon;
	},

	"resizeTo": function(w, h) {
		if (typeof w == "number")
			this.dCont.setStyle("width", w);
		if (typeof h == "number")
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
			"width": hide ? 0 : (this.colWidth[this.colOrder[index]] || "auto"),
			"display": hide ? "none" : ''
		});
		this.tHeadCols[index][hide ? "addClass" : "removeClass"]("stable-hidden-column");
		for (var i = 0, j = this.tb.body.childNodes.length; i < j; i++) {
			this.tb.body.childNodes[i].childNodes[index][hide ? "addClass" : "removeClass"]("stable-hidden-column");
		}
		this.fireEvent("onColToggle", [this.colOrder[index], hide]);
		this.calcSize();
		return true;
	},
	
	"resizePads": function() {
		if (this.options.mode != MODE_VIRTUAL) return;
		var mr = this.options.maxRows;
		if (this.activeId.length <= mr) {
			this.topPad.setStyle("height", 0);
			this.bottomPad.setStyle("height", 0);
		} else {
			var bh = this.dBody.clientHeight;
			var vh = this.activeId.length * 17;
			var st = this.dBody.scrollTop, sh = this.dBody.scrollHeight;
			var rt = ((sh - bh) <= 0) ? 0.0 : (st / (sh - bh));
			if (rt > 1.0)
				rt = 1.0;
			var mh = this.tBody.tBodies[0].offsetHeight;
			var th = (st + bh >= vh - mh) ? (vh - mh) : (st - (mh - bh) * rt);
			this.topPad.setStyle("height", th);
			this.bottomPad.setStyle("height", vh - mh - th);
		}
	},

	"updatePageMenu": function() {
		if (this.options.mode != MODE_PAGE) return;
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
	},

	"gotoPage": function(i) {
		if (this.curPage == i) return;
		var range = this.getActiveRange();
		for (var j = range[0]; j <= range[1]; j++)
			this.rowData[this.activeId[j]].rowIndex = -1;
		this.curPage = i;
		this.updatePageMenu();
		if (Browser.Engine.gecko || Browser.Engine.trident4)
			this.detachBody();
		this.refreshRows();
		if (Browser.Engine.gecko || Browser.Engine.trident4)
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
			var left = drag.element.getPosition(st.dCont).x + st.dBody.scrollLeft - (Browser.Engine.gecko19 ? 4 : 0);
			drag.value.now.x = left;
			drag.mouse.pos.x = drag.mouse.start.x - left;
			st.colDragObj.set("html", drag.element.get("text")).setStyles({
				"visibility": "visible",
				"left": left,
				"width": drag.element.getStyle("width").toInt(),
				"textAlign": drag.element.getStyle("textAlign")
			});
			st.colDragEle = drag.element;
			drag.element = drag.handle = st.colDragObj;
			st.cancelMove = false;
			st.colMove = { "from": st.colDragEle.retrieve("index"), "to": -1 };
			document.body.setStyle("cursor", "move");
		} else {
			var col = st.tHeadCols[st.hotCell];
			var w = col.getSize().x;
			var left = col.getPosition(st.dCont).x + w - (Browser.Engine.gecko19 ? 4 : 0);
			st.resizeCol = {"width": col.getStyle("width").toInt(), "left": left};
			drag.value.now.x = left;
			drag.mouse.pos.x = drag.mouse.start.x - left;
			st.cancelMove = true;
			st.isResizing = true;
			st.colReszObj.setStyles({
				"left": left,
				"height": st.dBody.getSize().y + 2,
				"visibility": "visible"
			});
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
				c = st.cols;
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
			st.tHeadCols[st.hotCell].setStyle("width", w);
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
				st.rowCover.hide();
			break;
		    
			default:
				st.colDragObj.setStyles({"left": 0, "width": 0, "visibility": "hidden"});
				st.colSep.setStyle("visibility", "hidden");
				document.body.setStyle("cursor", "default");
				moveColumn.call(st, st.colMove.from, st.colMove.to);
		}
		st.cancelSort = false;
	},

	"check": function(ev, cell) {
		if (this.isResizing) return;
		var x = ev.page.x - cell.getPosition().x;
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

function resizeColumn(index) {
	var w = this.tHeadCols[index].offsetWidth;
	this.colWidth[this.colOrder[index]] = w;
	if (Browser.Engine.trident && !Browser.Engine.trident6)
		w -= (index == 0) ? 30 : 10; // substract the left & right padding
	this.tBodyCols[index].setStyle("width", w).setProperty("width", w);
	w = this.tHead.getSize().x;
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
	
	$each(this.tb.body.childNodes, function(row) {
		var bef = insertOuter ? null : row.childNodes[iNew];
		var cell = row.childNodes[iCol].dispose();
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
	
	/*
	this.tHeadCols = aHC.slice(0);
	this.tBodyCols = aBC.slice(0);
	this.colData = aC.slice(0);
	this.colOrder = aO.slice(0);
	
	aHC = aBC = aC = aO = null;
	*/
	this.tHeadCols = aHC;
	this.tBodyCols = aBC;
	this.colData = aC;
	this.colOrder = aO;
	
	for (i = 0; i < this.cols; i++)
		this.tHeadCols[i].store("index", i);
	if (iCol == this.sIndex) {
		// we moved the sorted column
		this.sIndex = iNew;
		if (iNew > iCol) // we moved it to the right
			this.sIndex--;
	} else if ((iNew <= this.sIndex) && (iNew < iCol)) {
		// we moved a column that was to the right of the sorted column to the left of it
		this.sIndex++;
	} else if ((iCol < iNew) && (this.sIndex < iNew) && (this.sIndex > iCol)) {
		// we moved a column that was to the left of the sorted column to the right of it
		this.sIndex--;
	}

	this.cancelSort = false;
	this.fireEvent("onColMove");
}

var Comparator = {

	"compare": function(x, y) {
		var a = '' + x, b = '' + y;
		return (a < b) ? -1 :
			   (a > b) ? 1 : 0;
	},
	
	"compareNumeric": function(x, y) {
		return (x.toFloat() - y.toFloat());
	},
	
	"compareAlphaNumeric": function(x, y) {
		var a = ('' + x).toLowerCase(), b = ('' + y).toLowerCase();
		return (a < b) ? -1 :
			   (a > b) ? 1 : 0;
	}
	
};