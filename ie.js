(function () {
	// We need this because conditional HTML comments cannot detect IE compatibility modes
	var ieVersion = (document.documentMode !== 'undefined' && document.documentMode) || 6;

	if (ieVersion <= 8) {
		document.write('<style type="text/css">@import "./ie.css";</style>');
	}
	if (ieVersion <= 7) {
		document.write('<style type="text/css">@import "./ie7.css";</style>');
	}
})();