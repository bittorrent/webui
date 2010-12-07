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
var TYPE_NUM_ORDER = 3;
var TYPE_NUM_PROGRESS = 4;
var TYPE_CUSTOM = 5;

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
var SPAN = new Element("span");

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
	"cols": 0, // # of columns
	"colData": [], // columns' data
	"sortCustom": null, // the custom sort function callback, function(col, datax, datay)
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
	"colHeader": [],
	"options": {
		"format": function() { return arguments[0]; },
		"maxRows": 25,
		"alternateRows": false,
		"mode": MODE_PAGE,
		"rowsSelectable": true,
		"rowMultiSelect": true,
		"refreshable": false
	},
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
	"curPage": 0,
	"pageCount": 0,
	"rowCache": [],
	"rowCover" : null,
	"rowModel" : null,
	"resetText": null,

	"create": function(id, columns, options) {
		this.cols = columns.length;

		var hasicon = false;
		this.colHeader = columns.map(function(item) {
			if (!!item[4]) hasicon = true;
			return {
				  "id": item[0]
				, "width": item[1]
				, "type": item[2]
				, "disabled": !![item[3], !item[1]].pick()
				, "icon": !!item[4]
				, "align": item[5] || ALIGN_AUTO
				, "text": item[6] || item[0] || ""
			};
		});
		if (!hasicon) this.colHeader[0].icon = true;

		this.colOrder = (options.colOrder && (options.colOrder.length == this.cols)) ? options.colOrder : columns.map(function(item, i) { return i; });
		this.sIndex = isNaN(options.sIndex) ? -1 : options.sIndex.toInt().limit(-1, this.cols - 1);
		delete options.colOrder;
		delete options.sIndex;
		if (options.sortCustom) {
			this.sortCustom = options.sortCustom;
			delete options.sortCustom;
		}
		this.setOptions(options);

		var badIE = (Browser.ie && Browser.version <= 7);
		var tr, td, div, $me = this;

		this.id = "stable-" + id;
		this.dCont = $(id).addClass("stable");
		this.dHead = simpleClone(DIV, false).addClass("stable-head").inject(this.dCont);
		this.dBody = simpleClone(DIV, false).addClass("stable-body").inject(this.dCont);

		this.dHead.addEvents({
			"mousedown": function(ev) {
				if (ev.isRightClick())
					$me.colMenu.delay(0, $me, ev.page);
			}
		});

		this.tHead = new Element("table", {
			"cellpadding": 0,
			"cellspacing": 0
		}).inject(this.dHead);

		this.tb.head = new Element("tbody").inject(this.tHead);
		tr = simpleClone(TR, false);
		var nDrag = new Drag(tr, {
			"modifiers" : {"x": "left", "y": false},
			"snap" : 1,
			"onBeforeStart" : function() { if ($me.hotCell >= 0) { $me.rowCover.show(); } },
			"onStart" : function(){ ColumnHandler.start($me, this); },
			"onDrag" : function(){ ColumnHandler.drag($me, this); },
			"onComplete" : function(){ ColumnHandler.end($me, this); },
/*			"onRightClick" : this.colMenu.bind(this),*/
			"onCancel" : function(_, ev) {
				this.detach();
				$me.cancelSort = false;
				$me.rowCover.hide();
				if (!ev.isRightClick())
					$me.sort(this.element, ev.shift, true);
			}
		}).detach();
		tr.addEvents({
			"mousemove": function(ev) {
				var ele = ev.target;
				if (!ele) return;
				var tag = ele.get("tag");
				if (tag == "span") {
					ele = ele.getParent();
					tag = "td";
				}
				if (tag == "td")
					ColumnHandler.check.apply($me, [ev, ele]);
			},
			"mousedown": function(ev) {
				var ele = ev.target;
				if (!ele) return;
				var tag = ele.get("tag");
				if (tag == "span") {
					ele = ele.getParent();
					tag = "td";
				}
				if (tag == "td") {
					nDrag.element = nDrag.handles = ele;
					nDrag.attach().start(ev);
				}
			}
		});

		var len = this.cols;
		this.rowModel = simpleClone(TR, false);

		for (var i = 0, j = 0; i < len; i++) {
			this.colOrder[i] = (typeOf(this.colOrder[i]) == 'number') ? this.colOrder[i].limit(0, len - 1) : i;
			this.colData[i] = this.colHeader[this.colOrder[i]];
			this.rowModel.grab(simpleClone(TD, false)
				.addClass(this.id + "-col-" + this.colOrder[i])
				.setStyle(
					badIE ? "visibility" : "display",
					badIE ? (this.colData[i].disabled ? "hidden" : "visible") : (this.colData[i].disabled ? "none" : "")
				)
			);
			td = simpleClone(TD, false)
				.grab(new Element("span", {"id": this.id + "-head-" + this.colData[i].id, "text": this.colData[i].text}))
				.setStyles({"width": this.colHeader[i].width, "display": this.colData[i].disabled ? "none" : ""})
				.store("index", i)
				.inject(tr);
			this.tHeadCols[i] = td;
			j++;
		}
		this.tb.head.grab(tr);

		this.rowCover = new Element("div", {
			"class": "rowcover"
		}).inject(this.dHead);

		this.dPad = simpleClone(DIV, false).addClass("stable-pad").inject(this.dBody);

		this.tBody = new Element("table", {
			"cellpadding": 0,
			"cellspacing": 0
		}).inject(this.dPad);

		var cg = new Element("colgroup").inject(this.tBody);
		for (var i = 0; i < len; i++) {
			this.tBodyCols[i] = new Element("col", {
				"styles": {
					"width": this.colHeader[i].width,
					"display": this.colData[i].disabled ? "none" : ""
				},
				"width": this.colHeader[i].width,
				"span": 1
			}).inject(cg);
		}
		this.tb.body = new Element("tbody");
		if (Browser.ie) {
			this.tb.body.addEvent("selectstart", function() {
				return false;
			});
		}

		this.colDragEle = null;
		this.colDragObj = simpleClone(DIV, false).addClass("stable-move-header").inject(this.dHead);
		this.colSep = simpleClone(DIV, false).addClass("stable-separator-header").inject(this.dHead);
		this.colReszObj = simpleClone(DIV, false).addClass("stable-resize-header").inject(this.dBody);

		if (this.options.rowsSelectable) {
			this.dBody.addEvent("mousedown", function(ev) {
				var ele = ev.target;
				if (ele.get("tag") != "td")
					ele = ele.getParent("td");

				if (ele) {
					$me.selectRow(ev, ele.getParent());
				}

				if (Browser.ie9 && document.documentMode >= 9) { // allow scrollbars to work on IE9
					ContextMenu.hide();
					ev.stopPropagation();
				}
			}).addEvent("click", function(ev) {
				if (ev.control || ev.shift || ev.meta) return;

				var ele = ev.target;
				if (!(ele.get("tag") == "td" || ele.getParent("td"))) {
					var pos = this.getPosition();
					if ((this.clientWidth > ev.page.x - pos.x - this.scrollLeft + 2) && (this.clientHeight > ev.page.y - pos.y - this.scrollTop + 2)) {
						$me.clearSelection();
						$me.fireEvent.delay(0, $me, ["onSelect", [ev, ""]]);
					}
				}

				ev.preventDefault();
			}).addEvent("dblclick", function(ev) {
				if (ev.control || ev.shift || ev.meta) return;

				var ele = ev.target;
				if (ele.get("tag") != "td")
					ele = ele.getParent("td");

				if (ele) {
					var idprefix = new RegExp("^" + $me.id + "-row-", "");
					$me.fireEvent("onDblClick", ele.getParent().id.replace(idprefix, ""));
				}

				ev.preventDefault();
			});
		}
		for (var i = 0; i < this.options.maxRows; i++)
			this.tb.body.appendChild(simpleClone(this.rowModel, true).hide());

		this.tBody.grab(this.tb.body);

		this.infoBar = simpleClone(DIV, false).addClass("stable-infobar").inject(this.dCont);

		if (this.options.rowsSelectable && this.options.rowMultiSelect) {
			this.pageInfo = new Element("span", {"class": "pageInfo", "text": "0 row(s) selected."}).inject(this.infoBar);
		}

		if (this.options.refreshable) {
			this.infoBar.grab(new Element("div", {"class": "refreshBtn"})
				.grab(new Element("span")
					.addEvent("click", function(ev) {
						if ($me.rows)
							$me.fireEvent("onRefresh");
					})
				)
			);
		}

		this.pageChanger = new Element("div", {"class": "pageChanger"}).inject(this.infoBar);

		this.pagePrev = new Element("span", {"class": "prevlink disabled"})
			.addEvent("click", this.prevPage.bind(this))
			.inject(this.pageChanger);

		this.pageSelect = new Element("select")
			.addEvent("change", function() {
				$me.gotoPage(this.get("value").toInt());
			})
			.inject(this.pageChanger);

		this.pageNext = new Element("span", {"class": "nextlink disabled"})
			.addEvent("click", this.nextPage.bind(this))
			.inject(this.pageChanger);

		this.assignEvents();
		this.setAlignment();
	},

	"assignEvents": function() {
		this.lastScroll = 0;
		this.dBody.addEvent("scroll", (function() {
			this.dHead.scrollLeft = this.dBody.scrollLeft;
			if (this.options.mode == MODE_PAGE) return;

			if (this.isScrolling) return;
			this.isScrolling = true;

			if (this.lastScroll != this.dBody.scrollTop) {
				this.resizePads();
				this.refreshRows();

				this.lastScroll = this.dBody.scrollTop;
			}

			this.isScrolling = false;
			return false;
		}).bind(this));

		if (!this.options.rowsSelectable) return;

		this.dCont.addEvent("keydown", (function(ev) {
			var ctrl = ((Browser.Platform.mac && ev.meta) || (!Browser.Platform.mac && ev.control));

			if (ev.key == "delete") { // DEL
				this.fireEvent("onDelete", ev);
			} else if (ctrl && (ev.key == "a")) { // Ctrl + A
				this.fillSelection();
				this.fireEvent("onSelect", ev);
			} else if (ctrl && (ev.key == "e")) { // Ctrl + E
				this.clearSelection();
				this.fireEvent("onSelect", ev);
			}
		}).bind(this));

//		if (Browser.firefox) {
			// http://n2.nabble.com/key-events-not-firing-on-div-in-FF--td663136.html
			this.dBody.addEvent("mousedown", function(ev) {
				this.focus();
			}).setProperty("tabIndex", -1);
//		}
	},

	"setAlignment": function() {
		var sb = "", cols = this.tBody.getElement("colgroup").getElements("col");
		for (var i = 0; i < this.cols; i++) {
			var align = "left";
			switch (this.colData[i].align) {
				case ALIGN_CENTER: align = "center"; break;
				case ALIGN_RIGHT: align = "right"; break;

				case ALIGN_AUTO:
				default:
					switch (this.colData[i].type) {
						case TYPE_NUM_ORDER:
						case TYPE_NUMBER: align = "right"; break;
						case TYPE_NUM_PROGRESS: align = "center"; break;
					}
			}

			this.tHeadCols[i].setStyle("textAlign", align);
			$$("." + this.id + "-col-" + this.colOrder.indexOf(i)).setStyle("textAlign", align);
		}
	},

	"isValidCol": function(iCol, allowUpEdge) {
		return ($chk(iCol) && 0 <= iCol && (allowUpEdge ? iCol <= this.cols : iCol < this.cols));
	},

	"setColumnDisabled": function(iCol, disabled) {
		if (!this.isValidCol(iCol)) return;

		var badIE = (Browser.ie && Browser.version <= 7);
		this.colData[iCol].disabled = disabled;
		this.tHeadCols[iCol].setStyle("display", disabled ? "none" : "");
		this.tBodyCols[iCol].setStyle("display", disabled ? "none" : "");
		var sname = badIE ? "visibility" : "display";
		var svalue = badIE ? (disabled ? "hidden" : "visible") : (disabled ? "none" : "");
		this.rowModel.childNodes[iCol].setStyle(sname, svalue); // update "model" row in case it's needed again (adding more rows)
		for (var i = 0, j = this.tb.body.childNodes.length; i < j; i++)
			this.tb.body.childNodes[i].childNodes[iCol].setStyle(sname, svalue);
		this.calcSize();
		this.tBodyCols[iCol].replaces(this.tBodyCols[iCol]);
		this.dHead.setStyle("width", this.dBody.clientWidth);
		this.dHead.scrollLeft = this.dBody.scrollLeft;
	},

	"setColumnPosition": function(iCol, iNew) {
		iCol = this.colOrder[iCol];
		if (iNew < 0 || iCol == iNew) return;

		// Move DOM elements around
		var headTarg = this.tHeadCols[iNew], headCol = this.tHeadCols[iCol];
		var bodyParent = this.tBody.getElement("colgroup"), bodyTarg = bodyParent.childNodes[iNew], bodyCol = bodyParent.childNodes[iCol].dispose();

		if (iNew == this.cols) {
			headCol.getParent().grab(headCol.dispose(), "bottom");
			bodyParent.grab(bodyCol, "bottom");

			this.rowModel.grab(this.rowModel.childNodes[iCol].dispose(), "bottom"); // update "model" row in case it's needed again (adding more rows)
			$each(this.tb.body.childNodes, function(row) {
				row.grab(row.childNodes[iCol].dispose(), "bottom");
			});
		}
		else {
			headCol.dispose().inject(headTarg, "before");
			bodyCol.inject(bodyTarg, "before");

			var cellTarg = this.rowModel.childNodes[iNew];
			this.rowModel.childNodes[iCol].dispose().inject(cellTarg, "before"); // update "model" row in case it's needed again (adding more rows)
			$each(this.tb.body.childNodes, function(row) {
				cellTarg = row.childNodes[iNew];
				row.childNodes[iCol].dispose().inject(cellTarg, "before");
			});
		}

		// Slide internal data structures around
		function slide(arr) { arr.splice(iNew - (iCol < iNew ? 1 : 0), 0, arr.splice(iCol, 1)[0]); }
		slide(this.tHeadCols);
		slide(this.tBodyCols);
		slide(this.colData);

		// Update column order
		this.colOrder = this.colHeader.map(function(item) {
			return this.colData.indexOf(item);
		}, this);
	},

	"getColumnWidths": function() {
		return this.colHeader.map(function(item) {
			return item.width;
		});
	},

	"setColumnWidth": function(iCol, iWidth) {
		if (!this.isValidCol(iCol)) return;

		var badIE = (Browser.ie && Browser.version <= 7);
		this.colData[iCol].width = iWidth;

		var safetyX = (this.tb.body.childNodes[0].childNodes[iCol].hasClass("stable-icon") ? 30 : 10);

		// Set column header width
		var offset = this.tHeadCols[iCol].getDimensions().x - this.tHeadCols[iCol].getStyle("width").toInt();
		if (iWidth - safetyX < offset)
			iWidth = offset + safetyX + 5;

		this.tHeadCols[iCol].setStyle("width", iWidth - offset).setProperty("width", iWidth - offset);

		// Set column body width
		if (badIE)
			iWidth -= safetyX; // substract the left & right padding

		this.tBodyCols[iCol].setStyle("width", iWidth).setProperty("width", iWidth);

		// Set column header row width
		iWidth = this.tHead.getWidth();
		if (Browser.chrome || Browser.safari)
			this.tBody.setStyle("width", iWidth);
		else
			this.tb.body.setStyle("width", iWidth);
	},

	"setConfig": function(options) {
		// NOTE: The order in which these settings are applied may be important
		//       in some cases. Watch out for regressions if changes are required.

		var val, refresh = false;

		// Map column header IDs to indices
		var ind, colHdr = this.colHeader;
		var colHdrIdx = colHdr.map(function(item, idx) {
			return idx;
		}).associate(colHdr.map(function(item) {
			return item.id;
		}));

		//--------------------------------------------------
		// COLUMN OPTIONS
		//--------------------------------------------------

		val = options.colMask; // bitfield
		if (typeOf(val) === 'number') {
			for (var i = 0, bit = 1, len = this.cols; i < len; ++i, bit <<= 1) {
				this.setColumnDisabled(this.colOrder[i], !!(options.colMask & bit));
			}
		}

		val = options.resetText; // string
		if (typeOf(val) === 'string') {
			this.resetText = val;
		}

		val = options.colText; // { colID : colText, ... }
		if (typeOf(val) === 'object') {
			$each(val, function(v, k) {
				ind = colHdrIdx[k];
				if ($chk(colHdr[ind])) {
					colHdr[ind].text = v;
					$(this.id + "-head-" + k).set("html", v);
				}
			}, this);
		}

		val = options.colType; // { colID : colType, ... }
		if (typeOf(val) === 'object') {
			var changedCols = [];
			$each(val, function(v, k) {
				ind = colHdrIdx[k];
				if ($chk(colHdr[ind]) && colHdr[ind].type != v) {
					changedCols.push(ind);
					colHdr[ind].type = v;
				}
			}, this);

			refresh = true;
		}

		val = options.colAlign; // { colID : colAlign, ... }
		if (typeOf(val) === 'object') {
			$each(val, function(v, k) {
				ind = colHdrIdx[k];
				if ($chk(colHdr[ind])) {
					colHdr[ind].align = v;
				}
			}, this);

			this.setAlignment();
		}

		val = options.colOrder; // [ colMIdx, colNIdx, ... ]
		if (typeOf(val) === 'array') {
			if (val.length == this.cols) {
				var orderOK = true, orderT = Array.clone(val).sort(function(a, b) { return (a-b); });
				for (var i = 0, l = orderT.length; i < l; ++i) {
					if (i != orderT[i]) {
						orderOK = false;
						break;
					}
				}

				if (orderOK) {
					$each(val, function(v, k, a) {
						if (a.indexOf(k) != this.colOrder.indexOf(k)) {
							this.setColumnPosition(a.indexOf(k), k);
						}
					}, this);
				}
			}
		}

		val = options.colWidth; // [ col1Width, col2Width, ... ]
		if (typeOf(val) === 'array') {
			if (val.length == this.cols) {
				$each(val, function(v, k) {
					this.setColumnWidth(this.colOrder[k], v);
				}, this);
			}
		}

		val = options.colSort; // [colIdx, reverse]
		if (typeOf(val) === 'array') {
			if ($chk(val[1])) this.options.reverse = !!val[1];
			this.sort(val[0]);
		}

		//--------------------------------------------------
		// ROW OPTIONS
		//--------------------------------------------------

		val = parseInt(options.rowMaxCount, 10); // integer
		if (!isNaN(val) && (val >= 1)) {
			var tbBody = this.tb.body;
			while (tbBody.childNodes.length < val)
				tbBody.appendChild(simpleClone(this.rowModel, true).hide());

			this.options.maxRows = val;
			this.curPage = 0;
			this.setAlignment();
			this.updatePageMenu();
			refresh = true;
		}

		val = options.rowAlternate; // boolean
		if (typeOf(val) === 'boolean' && val !== this.options.alternateRows) {
			this.options.alternateRows = !!val;
			refresh = true;
		}

		val = parseInt(options.rowMode, 10); // integer
		if (!isNaN(val) && (val != this.options.mode)) {
			this.pageChanger.setStyle("display", (val == MODE_VIRTUAL ? "none" : "block"));

			this.options.mode = val;
			this.calcSize();
		}

		//--------------------------------------------------
		if (refresh) {
			this.refreshRows();
		}
	},

	"getCache": function(index) {
		if (!this.isValidCol(index)) return;
		if (this.rowCache.length != this.rows) {
			this.clearCache();
			this.rowCache = new Array(this.rows);
		}
		var c = 0;
		for (var key in this.rowData) {
			this.rowCache[c++] = {
				"key": key,
				"v": this.rowData[key].data[index]
			};
		}
	},

	"clearCache": function(a) {
		var len = this.rowCache.length;
		while (len--) {
			this.rowCache[len].key = null;
			this.rowCache[len].v = null;
			this.rowCache[len] = null;
		}
		this.rowCache.length = 0;
	},

	"sort": function(col, shift, revtoggle) {
		if (this.cancelSort) return;
		this.isSorting = true;
		var rev = true, simpleReverse = true;

		if (!$chk(col))
			col = this.sIndex;

		if (typeOf(col) == 'number') {
			if (!this.isValidCol(col)) return;

			col = this.tHeadCols[this.colOrder[col]];
			rev = !!this.options.reverse;
			simpleReverse = false;
		}

		if (col.get("tag") != "td")
			col = col.getParent("td");
		if (!$chk(col))
			return;

		var ind = col.retrieve("index");
		if (shift) { //secondary sorting
			if (ind == this.sIndex || !this.isValidCol(this.sIndex)) {
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
			col = this.tHeadCols[this.colOrder[ind]];
			simpleReverse = false;
		}

		if (rev && !!revtoggle)
			this.options.reverse = (this.sIndex == ind) ? !this.options.reverse : false;

		if ((this.sIndex != ind) || (this.rowCache.length != this.rows)) {
			simpleReverse = false;
			this.getCache(ind);
			if (this.isValidCol(this.sIndex))
				this.tHeadCols[this.colOrder[this.sIndex]].setStyle("backgroundPosition", "right -32px");
		}

		col.setStyle("backgroundPosition", "right " + ((this.options.reverse) ? "0px" : "-16px"));

		this.sIndex = ind;
		if (!simpleReverse) {
			var $me = this, comp;
			switch (this.colHeader[ind].type) {
				case TYPE_STRING:
					comp = function(x, y) {
						return $me.sortAlphaNumeric(x, y);
					};
				break;

				case TYPE_NUMBER:
				case TYPE_NUM_PROGRESS:
					comp = function(x, y) {
						return $me.sortNumeric(x, y);
					};
				break;

				case TYPE_NUM_ORDER:
					comp = function(x, y) {
						return $me.sortNumOrder(x, y);
					};
				break;

				case TYPE_CUSTOM:
					if ($me.sortCustom) {
						comp = function(x, y) {
							return $me.sortCustom(ind, $me.rowData[x.key].data, $me.rowData[y.key].data);
						}
						break;
					}

				default:
					comp = function(x, y) {
						return Comparator.compare(x.v, y.v);
					};
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
			if (!this.rowData[key].hidden) {
				this.rowData[key].activeIndex = this.activeId.length;
				this.activeId.push(key);
			}
			this.rowData[key].index = i;
			i += diff;
		}
		if (this.options.mode == MODE_PAGE)
			this.pageCount = Math.ceil(this.activeId.length / this.options.maxRows);

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
		var index = this.secIndex;
		if (!this.isValidCol(index)) return;
		var m = this.rowData[x.key].data[index];
		var n = this.rowData[y.key].data[index];
		var r = 0;
		switch (this.colHeader[index].type) {
			case TYPE_STRING:
				r = Comparator.compareAlphaNumeric(m, n);
			break;

			case TYPE_NUMBER:
			case TYPE_NUM_PROGRESS:
				r = Comparator.compareNumeric(m, n);
			break;

			case TYPE_CUSTOM:
				if (this.sortCustom) {
					r = this.sortCustom(index, this.rowData[x.key].data, this.rowData[y.key].data);
					break;
				}

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
			r = this.rowData[x.key].index - this.rowData[y.key].index;
		if (this.options.reverse)
			r = -r;
		if (this.secRev)
			r = -r;
		return r;
	},

	"getActiveRange": function() {
		var max = this.options.maxRows, mni = 0, mxi = 0;
		if (this.options.mode == MODE_VIRTUAL) {
			mni = (this.activeId.length > 0 ? Math.floor((this.dBody.scrollTop / this.tb.body.children[0].offsetHeight) || 0) : 0).min(this.activeId.length - max).max(0);
		} else {
			mni = max * this.curPage;
		}
		mxi = (mni + max - 1).min(this.activeId.length - 1);
		return [mni.max(0), mxi.max(0)];
	},

	"refreshRows": function() {
		var range = this.getActiveRange(), count = 0, tbc = this.tb.body.childNodes;
		for (var i = range[0], il = range[1]; i <= il; i++) {
			var id = this.activeId[i], rdata = this.rowData[id], row = tbc[count];
			if (!(rdata && row)) continue;

			var clsName = "", clsChanged = false;
			if (has(this.rowSel, id))
				clsName += "selected";
			clsChanged = (clsName.test("selected") != row.hasClass("selected"));
			if (this.options.alternateRows) {
				if (i & 1) {
					clsName += " odd";
					clsChanged = clsChanged || !row.hasClass("odd");
				} else {
					clsName += " even";
					clsChanged = clsChanged || !row.hasClass("even");
				}
			}
			else {
				clsChanged = clsChanged || row.hasClass("odd") || row.hasClass("even");
			}
			if (clsChanged)
				row.className = clsName.clean();

			var data = this.options.format(Array.clone(rdata.data));
			this.fillRow(row, data);
			row.setProperties({
				"title": data[0],
				"id": this.id + "-row-" + id
			}).show(true);
			rdata.rowIndex = count++;
			this.setIcon(id, rdata.icon);
		}
		for (var i = count, il = tbc.length; i < il; i++)
			tbc[i].setProperty("id", "").hide();
		this.refresh();
		this.requiresRefresh = false;
		this.refreshPageInfo();
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
		var id = row.id.replace(new RegExp("^" + this.id + "-row-", ""), "");
		if (!(ev.isRightClick() && has(this.rowSel, id))) {
			var multi = !!this.options.rowMultiSelect;
			var ctrl = ((Browser.Platform.mac && ev.meta) || (!Browser.Platform.mac && ev.control));

			if (multi && ev.shift) {
				if (this.stSel === null) {
					this.stSel = id;
					this.rowSel[id] = 0;
					this.selectedRows.push(id);
				} else {
					var la = this.rowData[this.stSel].activeIndex;
					var lb = this.rowData[id].activeIndex;
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
			} else if (multi && ctrl) {
				this.stSel = id;
				if (has(this.rowSel, id)) {
					this.selectedRows.splice(this.rowSel[id], 1);
					for (var i = this.rowSel[id], j = this.selectedRows.length; i < j; i++)
						this.rowSel[this.selectedRows[i]] = i;
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

		this.fireEvent.delay(0, this, ["onSelect", [ev, id]]);
	},

	"addRow": function(data, id, icon, hidden, sortin) {
		if (data.length != this.cols) return;
		id = id || (1000 + this.rows);
		this.rowData[id] = {
			"data": data,
			"icon": icon || "",
			"hidden": hidden || false,
			"index": -1,
			"rowIndex": -1,
			"activeIndex": -1
		};
		if ([sortin, true].pick())
			this._insertRow(id);
		this.rows++;
	},

	"_insertRow": function(id, skipOrderCheck) {
		skipOrderCheck = (skipOrderCheck === true);
		var sindex = this.sIndex;
		if (this.isValidCol(sindex)) {
			var $me = this, index = 0;
			if (!skipOrderCheck) {
				var comp, from = 0, to = this.rowCache.length, rIndex = this.rowData[id].index, item = {
					"key": id,
					"v": this.rowData[id].data[sindex]
				};
				switch (this.colHeader[sindex].type) {
					case TYPE_STRING:
						comp = function(x, y) {
							return $me.sortAlphaNumeric(x, y);
						};
					break;

					case TYPE_NUMBER:
					case TYPE_NUM_PROGRESS:
						comp = function(x, y) {
							return $me.sortNumeric(x, y);
						};
					break;

					case TYPE_NUM_ORDER:
						comp = function(x, y) {
							return $me.sortNumOrder(x, y);
						};
					break;

					case TYPE_CUSTOM:
						if ($me.sortCustom) {
							comp = function(x, y) {
								return $me.sortCustom(sindex, $me.rowData[x.key].data, $me.rowData[y.key].data);
							}
							break;
						}

					default:
						comp = function(x, y) {
							return Comparator.compare(x.v, y.v);
						};
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
				if (index != rIndex) {
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
						var min = (index < rIndex) ? index : rIndex, max = (min == index) ? rIndex : index;
						for (var i = min; i <= max; i++)
							this.rowData[this.rowCache[i].key].index = i;
					}
				} else {
					this.rowCache[index].v = item.v;
					item = item.key = item.v = null;
				}
			}
			if (this.rowData[id].activeIndex != -1) {
				index = this.rowData[id].activeIndex;
				this.rowData[id].rowIndex = this.rowData[id].activeIndex = -1;
				this.activeId.splice(index, 1);
				for (var i = 0, j = this.activeId.length; i < j; i++)
					this.rowData[this.activeId[i]].activeIndex = i;
				if (this.rowData[id].hidden)
					this.requiresRefresh = true;
			}
			if (!this.rowData[id].hidden) {
				index = this.activeId.binarySearch(id, function(idA, idB) {
					return ($me.rowData[idA].index - $me.rowData[idB].index) * (($me.options.reverse) ? -1 : 1);
				});
				if (index < 0)
					index = -(index + 1);
				this.activeId.splice(index, 0, id);
				for (var i = index, j = this.activeId.length; i < j; i++)
					this.rowData[this.activeId[i]].activeIndex = i;
				var range = this.getActiveRange();
				if ((index >= range[0]) && (index <= range[1])) {
					this.requiresRefresh = true;
					this.rowData[id].rowIndex = index - range[0];
				}
			}
		} else {
			if (!this.rowData[id].hidden && (this.rowData[id].activeIndex == -1)) {
				index = this.rowData[id].activeIndex = this.activeId.length;
				this.activeId.push(id);
				var range = this.getActiveRange();
				if ((index >= range[0]) && (index <= range[1]))
					this.requiresRefresh = true;
			} else if (this.rowData[id].hidden && (this.rowData[id].activeIndex != -1)) {
				var index = this.rowData[id].activeIndex;
				this.rowData[id].activeIndex = -1;
				this.activeId.splice(index, 1);
				for (var i = index, j = this.activeId.length; i < j; i++)
					this.rowData[this.activeId[i]].activeIndex = i;
				this.requiresRefresh = true;
			}
		}
		if (this.options.mode == MODE_PAGE)
			this.pageCount = Math.ceil(this.activeId.length / this.options.maxRows);
	},

	"clearActive": function() {
		for (var i = 0, j = this.activeId.length; i < j; i++)
			this.rowData[this.activeId[i]].activeIndex = -1;
		this.activeId.length = 0;
	},

	"requiresRefresh": false,

	"fillRow": function(row, data) {
		var rowc = row.childNodes;
		var colh = this.colHeader;
		this.colOrder.each(function(v, k) {
			switch (colh[k].type) {
				case TYPE_NUM_PROGRESS:
					var pcnt = (parseFloat(data[k]) || 0).toFixedNR(1) + "%";
					rowc[v].empty().grab(simpleClone(DIV, false)
						.addClass("stable-progress").set("html", "&nbsp;")
						.adopt(
							simpleClone(SPAN, false).addClass("stable-progress-bar").set("html", "&nbsp;").setStyle("width", pcnt),
							simpleClone(SPAN, false).addClass("stable-progress-text").set("text", pcnt)
						)
					);
				break;

				default:
					rowc[v].set("text", data[k]);
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
		var index = rd.activeIndex;
		if (index != -1) {
			this.activeId.splice(index, 1);
			for (var i = index, j = this.activeId.length; i < j; i++)
				this.rowData[this.activeId[i]].activeIndex = i;
			if (this.options.mode == MODE_PAGE) {
				this.pageCount = Math.ceil(this.activeId.length / this.options.maxRows);
				if (this.curPage > this.pageCount)
					this.curPage--;
			}
			this.requiresRefresh = true;
		}
		if (has(this.rowSel, id)) {
			index = this.rowSel[id];
			this.selectedRows.splice(index, 1);
			for (var i = index, j = this.selectedRows.length; i < j; i++)
				this.rowSel[this.selectedRows[i]] = i;
			delete this.rowSel[id];
		}
		if (this.sIndex >= 0) {
			this.rowCache.splice(rd.index, 1);
			for (var i = rd.index, j = this.rowCache.length; i < j; i++)
				this.rowData[this.rowCache[i].key].index = i;
		}
		if (this.stSel == id)
			this.stSel = null;
		rd = null;
		delete this.rowData[id];
		this.rows--;
		this.refresh();
	},

	"clearRows": function(keepSel) {
		if (this.rows > 0) {
			this.stSel = null;
			this.clearCache();

			Array.each(this.tb.body.rows, function(row) {
				Array.each(row.cells, function(cell) {
					cell.empty();
				});
				row.setProperty("id", "").hide();
			});
			delete this.rowData;
			this.rowData = {};
			this.rows = this.curPage = this.pageCount = this.activeId.length = this.dBody.scrollLeft = this.dBody.scrollTop = this.lastScroll = 0;

			if (!keepSel) {
				delete this.rowSel;
				this.rowSel = {};
				this.selectedRows.length = 0;
			}

			this.updatePageMenu();
			this.refreshPageInfo();
		}
	},

	"calcSize": function() {
		var badIE = (Browser.ie && Browser.version <= 7);
		this.dBody.setStyles({
			"height": (this.dCont.clientHeight - this.dHead.offsetHeight - ((this.options.refreshable || this.options.mode == MODE_PAGE) ? 26 : 0)).max(52),
			"width": (this.dCont.offsetWidth - 2).max(0)
		});
		this.dHead.setStyle("width", (this.dCont.offsetWidth + (((this.dBody.offsetWidth - this.dBody.clientWidth) == 0) ? -4 : -1)).max(0));
		if (!this.isResizing) {
			for (var i = 0, j = this.cols; i < j; i++) {
				if (this.colData[i].disabled) continue;
				var w = 0;
				// padding width + border width = 19
				if (badIE) {
					w = this.tBodyCols[i].offsetWidth - 19;
				} else {
					w = parseInt(this.tBodyCols[i].width, 10) - ((Browser.chrome || Browser.safari) ? 0 : 19);
				}
				this.tHeadCols[i].setStyle("width", w.max(14));
			}
		}
		if (Browser.chrome || Browser.safari)
			this.tBody.setStyle("width", this.tHead.getWidth());
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

	"refreshPageInfo": function() {
		if (this.pageInfo && this.options.rowMultiSelect) {
			this.pageInfo.set("text", this.selectedRows.length + " row(s) selected.");
		}
	},

	"refreshSelection": function() {
		if (!this.options.rowsSelectable) return;
		var idprefix = new RegExp("^" + this.id + "-row-", "");
		var tbc = this.tb.body.childNodes;
		for (var i = 0, il = tbc.length; i < il; ++i) {
			if (has(this.rowSel, tbc[i].id.replace(idprefix, ""))) {
				tbc[i].addClass("selected");
			}
			else {
				tbc[i].removeClass("selected");
			}
		}
		this.refreshPageInfo();
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
		this.selectedRows = Array.clone(this.activeId);
		for (var i = 0, j = this.selectedRows.length; i < j; i++)
			this.rowSel[this.selectedRows[i]] = i;
		if (!noRefresh)
			this.refreshSelection();
	},

	"updateCell": function(id, col, data) {
		var row = this.rowData[id];
		if (row == null) return;
		data = (data || row.data);
		var isSortedCol = ((this.sIndex >= 0) && (col == this.sIndex));
		var hasSortedChanged = ((row.data[col] != data[col]) && isSortedCol);
		row.data[col] = data[col];
		if (isSortedCol)
			this._insertRow(id);
		if (this.requiresRefresh || row.hidden || (row.rowIndex == -1) || !$(this.id + "-row-" + id)) return hasSortedChanged;
		var r = this.tb.body.childNodes[row.rowIndex], cell = r.childNodes[this.colOrder[col]], fval = this.options.format(Array.clone(data), col);
		if (this.colHeader[col].type == TYPE_NUM_PROGRESS) {
			var pcnt = (parseFloat(fval) || 0).toFixedNR(1) + "%";
			var prog = simpleClone(DIV, false).addClass("stable-progress").set("html", "&nbsp;").inject(cell.empty());
			var pbar = simpleClone(SPAN, false).addClass("stable-progress-bar").set("html", "&nbsp;").setStyle("width", pcnt).inject(prog);
			var ptxt = simpleClone(SPAN, false).addClass("stable-progress-text").set("text", pcnt).inject(prog);
		}
		else {
			cell.set("text", fval);
		}
		return hasSortedChanged;
	},

	"setIcon": function(id, icon) {
		var row = this.rowData[id];
		if (!row || (row.rowIndex < 0) || !$(this.id + "-row-" + id)) return;

		var r = this.tb.body.childNodes[row.rowIndex];
		var rc = r.childNodes;
		var oldicon = r.retrieve("icon");

		var col;
		for (var i = 0, il = this.colHeader.length; i < il; ++i) {
			var curcol = this.colOrder[i];
			if (this.colHeader[i].icon) {
				rc[curcol].removeClass(oldicon).removeClass("stable-icon");
				if (col === undefined && !this.colHeader[i].disabled) {
					col = curcol;
				}
			}
		}
		if (col === undefined || this.colHeader[col].disabled) {
			col = this.colOrder[0];
		}

		if (icon) {
			icon = icon.trim();
			rc[col].addClass("stable-icon").addClass(icon);
		}

		r.store("icon", icon);
		row.icon = icon;
	},

	"resizeTo": function(w, h) {
		if (typeof(w) !== 'number' || w >= 0)
			this.dCont.setStyle("width", w);
		if (typeof(h) !== 'number' || h >= 0)
			this.dCont.setStyle("height", h);

		this.isResizing = true;
		this.calcSize();
		this.isResizing = false;
	},

	"colMenu": function(coords) {
		ContextMenu.clear();
		this.colHeader.each(function(col, idx) {
			var opts = [col.text, this.toggleColumn.bind(this, idx)];
			if (!col.disabled)
				opts.splice(0, 0, CMENU_CHECK);
			ContextMenu.add(opts);
		}, this);
		if (this.resetText) {
			ContextMenu.add([CMENU_SEP]);
			ContextMenu.add([this.resetText, this.fireEvent.bind(this, "onColReset")]);
		}
		ContextMenu.show(coords);
	},

	"toggleColumn": function(index) {
		var hide = !this.colHeader[index].disabled;
		this.setColumnDisabled(this.colOrder[index], hide);
		this.fireEvent("onColToggle", [index, hide]);
		this.refreshRows(); // makes sure icons are properly shown
		return true;
	},

	"resizePads": function() {
		switch (this.options.mode) {
			case MODE_PAGE:
				this.dPad.setStyle("height", 0);
				this.tBody.setStyle("top", 0);
			break;

			case MODE_VIRTUAL:
				this.dPad.setStyle("height", this.activeId.length * this.tb.body.children[0].offsetHeight);

				var st = this.dBody.scrollTop;
				var diff = this.dPad.offsetHeight - (st + this.tBody.offsetHeight);
				this.tBody.setStyle("top", st + diff.min(0));
			break;
		}
	},

	"resetScroll": function() {
//		if (this.options.mode != MODE_VIRTUAL) return;
		++this.dBody.scrollTop; --this.dBody.scrollTop;
		this.dBody.scrollTop = this.lastScroll = 0;
		if (this.activeId.length > 0) {
			this.resizePads();
			this.refreshRows();
		}
	},

	"restoreScroll": function() {
//		if (this.options.mode != MODE_VIRTUAL) return;
		if (this.activeId.length > 0) {
			this.resizePads();
			this.refreshRows();
		}
		++this.dBody.scrollTop; --this.dBody.scrollTop;
		this.dBody.scrollTop = this.lastScroll || 0;
	},

	"keepScroll": function(fn) {
		if (typeOf(fn) === 'function') {
			var top = this.dBody.scrollTop;
			fn();
			this.resizePads();
			this.dBody.scrollTop = top;
		}
	},

	"updatePageMenu": function() {
		if (this.options.mode != MODE_PAGE) {
			this.pageCount = 0;
		}
		else {
			this.pageCount = Math.ceil(this.activeId.length / this.options.maxRows);
		}

		if (this.curPage > 0)
			this.pagePrev.removeClass("disabled");
		else
			this.pagePrev.addClass("disabled");

		if (this.curPage < this.pageCount - 1)
			this.pageNext.removeClass("disabled");
		else
			this.pageNext.addClass("disabled");

		this.pageSelect.options.length = 0;
		this.pageSelect.empty();
		if (this.pageCount <= 1) {
			this.pageSelect.disabled = true;
			return;
		}
		this.pageSelect.disabled = false;
		for (var i = 0; i < this.pageCount; i++) {
			this.pageSelect.options[i] = new Option(i + 1, i);
			if (i == this.curPage)
				this.pageSelect.options[i].selected = true;
		}
	},

	"gotoPage": function(i) {
		if (this.curPage == i) return;
		this.curPage = i;
		var range = this.getActiveRange();
		for (var j = range[0]; j <= range[1]; j++)
			this.rowData[this.activeId[j]].rowIndex = -1;
		this.updatePageMenu();
		this.refreshRows();
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

	"check": function(ev, cell) {
		if (this.isResizing) return;
		var x = ev.page.x - cell.getPosition().x;
		var i = this.colOrder[cell.retrieve("index")];

		if ((x <= 4) && (i > 0)) { // resizing, mouse slightly to right of resize grip
			// Skip hidden columns...
			var j = i - 1;
			while (j >= 0 && this.colData[j].disabled) --j;
			if (j >= 0) {
				x += cell.offsetWidth;
				i = j;
			}
		}

		if (x >= cell.offsetWidth - 6) { // resizing, mouse slightly to left of resize grip
			this.hotCell = i;
			cell.setStyle("cursor", "e-resize");
		} else { // reordering
			this.hotCell = -1;
			cell.setStyle("cursor", "default");
		}
	},

	"start": function initColAct(st, drag) {
		st.cancelSort = true; // just to be sure
		if (st.hotCell != -1) { // resizing
			var col = st.tHeadCols[st.hotCell];
			var w = col.getWidth();
			var left = col.getPosition(st.dCont).x + w + st.dBody.scrollLeft;
			st.resizeCol = {"width": col.getStyle("width").toInt(), "left": left};
			drag.value.now.x = left;
			drag.mouse.pos.x = drag.mouse.start.x - left;
			st.cancelMove = true;
			st.isResizing = true;
			st.colReszObj.setStyles({
				"left": left,
				"height": st.tBody.getHeight(), //st.dBody.getSize().y + 2,
				"visibility": "visible"
			});
			st.colDragEle = drag.element;
			drag.element = drag.handle = st.colReszObj;
			drag.limit.x = [];
			drag.options.limit = true;
		} else { // reordering
			var left = drag.element.getPosition(st.dCont).x + st.dBody.scrollLeft - ((Browser.firefox && Browser.version >= 3) ? 4 : 0);
			drag.value.now.x = left;
			drag.mouse.pos.x = drag.mouse.start.x - left;
			st.colDragObj.set("html", drag.element.get("text")).setStyles({
				"visibility": "visible",
				"left": left,
				"width": drag.element.getStyle("width").toInt() - ((Browser.chrome || Browser.safari) ? 19 : 0),
				"textAlign": drag.element.getStyle("textAlign")
			});

			st.colDragEle = drag.element;
			drag.element = drag.handle = st.colDragObj;
			st.cancelMove = false;
			st.colMove = { "from": st.colDragEle.retrieve("index"), "to": -1 };
			document.body.setStyle("cursor", "move");
		}
	},

	"drag": function(st, drag) {
		if (st.cancelMove) { // resizing
			var w = drag.value.now.x - st.resizeCol.left + st.resizeCol.width;
			drag.limit.x[0] = st.tHeadCols[st.hotCell].getPosition(st.dCont).x + st.dBody.getScrollLeft();
			st.tHeadCols[st.hotCell].setStyle("width", w.max(14));
			$(document.body).setStyle("cursor", "e-resize");
		} else { // reordering
			var i = 0, x = drag.mouse.now.x;
			while ((i < st.cols) && (st.colData[i].disabled || ((st.tHeadCols[i].getLeft() + (st.tHeadCols[i].getWidth() / 2)) < x))) ++i;

			if (i >= st.cols) {
				i = st.cols;
				st.colSep.setStyle("left", st.tHeadCols[i - 2].offsetLeft + st.tHeadCols[i - 2].getWidth() - 1);
			} else {
				st.colSep.setStyle("left", st.tHeadCols[i].offsetLeft);
			}
			st.colSep.setStyle("visibility", "visible");
			st.colMove.to = i;
		}
	},

	"end": function(st, drag) {
		drag.element = drag.handle = st.colDragEle;
		st.colDragEle = null;
		if (st.isResizing) { // resizing
			st.colReszObj.setStyles({"left": 0, "height": 0, "visibility": "hidden"});
			st.isResizing = false;
			st.setColumnWidth(st.hotCell, st.tHeadCols[st.hotCell].getWidth());
			st.fireEvent("onColResize");
			document.body.setStyle("cursor", "default");
			st.rowCover.hide();
			drag.options.limit = false;
		} else { // reordering
			st.colDragObj.setStyles({"left": 0, "width": 0, "visibility": "hidden"});
			st.colSep.setStyle("visibility", "hidden");
			document.body.setStyle("cursor", "default");
			st.setColumnPosition(st.colMove.from, st.colMove.to);
			st.cancelSort = false;
			st.fireEvent("onColMove");
		}
		st.cancelSort = false;
	}

};

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