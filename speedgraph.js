/**
 * @author Novik
 */

var SpeedGraph = {

	"plot": null,

	"init": function(element) {
		if (Browser.Engine.trident6) return;
		this.element = $(element);
		this.maxSeconds = 600;
		this.seconds = -1;
		this.startSeconds = $time() / 1000;
		this.plot = new Flotr.Plot(this.element, [{ label: lang[CONST.OV_COL_UPSPD], data: [] }, { label: lang[CONST.OV_COL_DOWNSPD], data: [] }], {
			"colors" : ["#009900", "#1C8DFF"],
			"lines" : {
				show: true
			},
			"xaxis" : {
				"max" : (this.seconds - this.startSeconds >= this.maxSeconds) ? null : this.maxSeconds + this.startSeconds,
				"tickSize" : 60,
				"tickFormatter" : function(n) {
					var dt = new Date(n * 1000);
					var h = dt.getHours();
					var m = dt.getMinutes();
					var s = dt.getSeconds();
					h = (h < 10) ? ("0" + h) : h;
					m = (m < 10) ? ("0" + m) : m;
					s = (s < 10) ? ("0" + s) : s;
					return (h + ":" + m + ":" + s);
				}
			},
			"yaxis" : {
				"min": 0,
				"minTickSize": 5 * 1024,
				"tickFormatter": function(n) { return (parseInt(n).toFileSize() + perSec); }
			},
			"grid": {
				"color": "#868686"
			},
			"shadowSize": 0
		});
	},

	"draw": function() {
		if ((utWebUI.tabs.active != "spgraph") || Browser.Engine.trident6) return;
		this.plot.repaint();
	},

	"resize": function(w, h) {
		if (!w && !h) return;
		var style = {};
		if (w)
			style.width = w;
		if (h)
			style.height = h;
		this.element.setStyles(style);
		this.draw();
	},

	"addData": function(upSpeed, downSpeed) {
		if (Browser.Engine.trident6) return;
		this.seconds = $time() / 1000;
		this.plot.series[0].data.push([this.seconds, upSpeed]);
		this.plot.series[1].data.push([this.seconds, downSpeed]);
		var data = this.plot.series[0].data;
		while ((data[data.length - 1][0] - data[0][0]) > this.maxSeconds) {
			this.plot.series[0].data.shift();
			this.plot.series[1].data.shift();
		}
		this.plot.options.xaxis.max = (this.seconds - this.startSeconds >= this.maxSeconds) ? null : this.maxSeconds + this.startSeconds;
		this.draw();
	}
};
