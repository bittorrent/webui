// ==UserScript==
// @include *
// ==/UserScript==

/**

 Found at: http://my.opera.com/community/forums/topic.dml?id=194049

 all-in-one allmighty contextmenu emulator for Opera
 Detects:
  - right-click
 
 Implementation:
  - detects oncontextmenu in html markup
  - detects oncontextmenu properties for DOM nodes
  - fires contextmenu event if detection conditions are met 
  - cancel right-click menu ! yay ! :p
  
 Testcases:
  - http://www.worldofwarcraft.com/info/classes/hunter/talents.html?5500322152501001500500300000003300000000000000
  - http://docs.google.com/
  - http://mail.yahoo.com/
  

**/

	
(function(){

	if ( 'oncontextmenu' in document.createElement('foo') )
		//contextmenu supported - nothing to do
		return;
		
	function cloneObject(src,dest){
		dest=dest||{};
		for(var prop in src)
			dest[prop]=src[prop];
		return dest;
	};
	function prepareContextMenuEvent(e,node){
		var ev = cloneObject(e);
		ev.currentTarget=node;
		ev.type='contextmenu';
		ev.returnValue=true;
		ev.cancelBubble=false;
		ev.preventDefault=function(){this.returnValue=false;}
		ev.stopPropagation=function(){this.cancelBubble=false;}
		return ev;
	}
	function ctxClickHandler(e){
		var node = e.target, foundAnything = false, retVal;
		do{
			var ev = prepareContextMenuEvent(e,node);
			window['event'] = ev;
			try{
				if( typeof node.oncontextmenu == 'function' )
					retVal = node.oncontextmenu(ev);
				else if( node.getAttribute && (js = node.getAttribute('oncontextmenu')) )
					retVal = eval('(function(){'+js+';}).call(node,ev);');
				else
					continue;
			}catch(ex){
				setTimeout(function(){throw ex;},1);
			}
			
			if( (!retVal && (retVal!==undefined)) || !ev.returnValue ){
				cancelMenu(e);
				e.preventDefault();
			}
			if(ev.cancelBubble){
				cancelMenu(e);
				e.stopPropagation();
			}
		}while(node=node.parentNode);
	}
	function dispatchCtxMenuEvent(e,evType){
		var doc = e.target.ownerDocument||(e.view?e.view.document:null)||e.target;
		var newEv = doc.createEvent('MouseEvent');
		newEv.initMouseEvent(evType||'contextmenu', true, true, doc.defaultView, e.detail,
			e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey,
			e.shiftKey, e.metaKey, e.button, e.relatedTarget);
		e.target.dispatchEvent(newEv);
	};
	
	//contextmenu must be fired on mousedown if we want to cancel the menu
	addEventListener('mousedown',function(e){
		//right-click doesn't fire click event. Only mouseup
		if( e && e.button == 2 ){
			dispatchCtxMenuEvent(e);
		}
	},true);
	
	var overrideButton;
	function cancelMenu(e){
		if(!overrideButton){
			var doc = e.target.ownerDocument;
			overrideButton = doc.createElement('input');
			overrideButton.type='button';
			(doc.body||doc.documentElement).appendChild(overrideButton);
		}
		overrideButton.style='position:absolute;top:'+(e.clientY-2)+'px;left:'+(e.clientX-2)+'px;width:5px;height:5px;opacity:0.01';
		document.documentElement.className+=' ';
	}
	
	addEventListener('mouseup',function(e){
		if(overrideButton){
			e.target.ownerDocument.documentElement.className+= ' ';
			overrideButton.parentNode.removeChild(overrideButton);
			overrideButton = undefined;
		}
	},true);
	
	opera.addEventListener('BeforeEventListener.contextmenu',function(e){
		var ev = prepareContextMenuEvent(e.event,e.event.currentTarget);
		window['event'] = ev;
		try{
			e.listener(ev);
		}catch(ex){
			setTimeout(function(){throw ex;},1);
		}
		if(!ev.returnValue){
			cancelMenu(e.event);
			e.event.preventDefault();
		}
		if(ev.cancelBubble){
			cancelMenu(e.event);
			e.event.stopPropagation();
			return true;
		}
		e.preventDefault();
	},false);

	
	addEventListener('contextmenu',ctxClickHandler,true);

})( true, 1000 );
