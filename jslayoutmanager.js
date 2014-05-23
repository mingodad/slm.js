/*
	JsLayoutManager without third party dependencies.  (https://github.com/mingodad/slm.js)
	Originally derived from 
		Simple Layout Manager: simplify the layout management of UI in Single Page Applications 
		(https://github.com/alexroat/slm.js)
	Copyright (c) 2014, Domingo Alvarez Duarte - mingodad[at]gmail[dot]com
	
	Released under the GNU LESSER GENERAL PUBLIC LICENSE  Version 3
	
*/
JsLayoutManager = function() {

	var isSpace = function( ch ) {
			return (ch === " ") || (ch === "\t") || (ch === "\n") || (ch === "\r") || (ch === "\v");
	};

	var strHasWord = function(str, word){
		var found = str.indexOf(word);
		while(found >= 0) {
			if(found === 0){
				if( (str.length === word.length) ||
					(isSpace(str[word.length])) ) return true;
			} else {
				if( isSpace(str[found-1]) ) {
					if( (str.length === found+word.length) ||
						(isSpace(str[found+word.length]))) return true;
				}
			}
			found = str.indexOf(word, found+1);
		}
		return false;
	};

	var strRemoveWord = function(str, word){
		var found = str.indexOf(word);
		while(found >= 0) {
			if(found === 0){
				if(str.length === word.length) return "";
				if(isSpace(str[word.length])) return str.substring(word.length+1);
			} else {
				if( isSpace(str[found-1]) ) {
					var lastPos = found+word.length;
					if(str.length === lastPos) {
						return str.substring(0, found-1);
					}
					if(isSpace(str[lastPos])) {
						return str.substring(0, found-1) + str.substring(lastPos);
					}
				}
			}
			found = str.indexOf(word, found+1);
		}
		return str;
	};

	if(document.classList)
	{
		var hasClass = function(elm, className) {
			return className && elm.classList.indexOf(className) >= 0;
		};

		var addClass = function(elm, className) {
			if(className)
			{
				if(elm.classList.indexOf(className) >= 0) return;
				elm.classList.add(className);
			}
		};

		var removeClass = function(elm, className) {
			elm.classList.remove(className);
		};	
	} else {
		var hasClass = function(elm, className) {
			var elm_className = elm.className;
			return elm_className && strHasWord(elm_className, className);
		};

		var addClass = function(elm, className) {
			if(hasClass(elm, className)) return;
			var elm_className = elm.className;
			if(elm_className) elm.className = elm_className + " " + className;
			else elm.className = className;
		};

		var removeClass = function(elm, className) {
			elm.className = strRemoveWord(elm.className, className);
		};
	}

	var toggleClass = function(elm, className, doAdd) {
		if(doAdd) {
			addClass(elm, className);
			return;
		}
		removeClass(elm, className);
	};
	
	var isArray = function(obj) { return Object.prototype.toString.call( obj ) === '[object Array]';};

	var addEvent = window.addEventListener ? 
		function(obj,evt,fn) {obj.addEventListener(evt,fn,false);} :
		function(obj,evt,fn) {obj.attachEvent('on'+evt,fn);};

	var removeEvent = window.removeEventListener ?
		function(obj,evt,fn) {obj.removeEventListener(evt,fn,false);} :
		function(obj,evt,fn) {obj.detachEvent('on'+evt,fn);};

	var cancelEvent = window.addEventListener ? 
		function (e, c) {e.preventDefault(); if (c) e.stopPropagation();}:
		function (e, c) {e.preventDefault ? e.preventDefault() : e.returnValue = false; if (c) e.cancelBubble = true;};
	
	// As taken from the UnderscoreJS utility framework
	var debounce = function(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	var getLayout = function(elm)
	{
		var json_str = elm.getAttribute("data-layout");
		if (json_str)
		{
			json_str = "[{" + json_str + "}][0]";
			//console.log(json_str);
			try
			{
				//return JSON ? JSON.parse(json_str) : eval(json_str);
				return eval(json_str);
			}
			catch (ex)
			{
				console.log(ex);
			}
		}
		return {};
	};

	var setLayout = function(elm, obj)
	{
		var objs = JSON.stringify(obj);
		objs = objs.substr(1, objs.length - 2);
		elm.setAttribute("data-layout", objs);
	};

	var invalidate = function(elm)
	{
		var objLayout = getLayout(elm);
		objLayout.ok = false;
		setLayout(elm, objLayout);
		manageLayout(elm);
	};

	var getFullElmSize = function(elm) {
		var elmHeight, elmHMargin, elmWdith, elmWMargin, cs;
		if (document.all) {// IE
			elmHeight = elm.currentStyle.height;
			elmHMargin = parseInt(elm.currentStyle.marginTop, 10) + parseInt(elm.currentStyle.marginBottom, 10);
			elmWMargin = parseInt(elm.currentStyle.marginLeft, 10) + parseInt(elm.currentStyle.marginRight, 10);
		} else {// Mozilla
			cs = document.defaultView.getComputedStyle(elm, null);
			elmHeight = elm.offsetHeight;
			elmHMargin = parseInt(cs.marginTop) + parseInt(cs.marginBottom);
			elmWdith = elm.offsetWidth;
			elmWMargin = parseInt(cs.marginLeft) + parseInt(cs.marginRight);
		}
		return {heigth : (elmHeight + elmHMargin), width: (elmWdith + elmWMargin)};
	};

	var setCss = function(elm, kv)
	{
		var i, len, k, style;
		var setStyle = function(elm, kv)
		{
			style = elm.style;
			for (k in kv)
			{
				style[k] = kv[k];
			}			
		};
		if (isArray(elm))
		{
			for (i = 0, len = elm.length; i < len; ++i)
			{
				setStyle(elm[i], kv);
			}
		} else {
			setStyle(elm, kv);
		}
	};
	var getCss = function(elm, k)
	{
		return elm.style[k];
	};

	var addStr_px = function(x) {
		return x + "px";
	};

	var elmHide = function(elm)
	{
		var i, len, style;
		var setDisplay = function(elm) {
			style = elm.style;
			if (style.display && style.display !== 'none')
			{
				style.hideSavedDisplay = style.display;
			}
			elm.style.display = 'none';
		};
		if (isArray(elm))
		{
			for (i = 0, len = elm.length; i < len; ++i)
			{
				setDisplay(elm[i]);
			}
		} else {
			setDisplay(elm);
		}
	};
	var elmShow = function(elm)
	{
		style = elm.style;
		if (style.hideSavedDisplay)
		{
			style.display = style.hideSavedDisplay;
			style.hideSavedDisplay = null;
		} else {
			elm.style.display = '';
		}
	};

	var getChildrenByClass = function(elm, cls, notHaving)
	{
		var children = elm.children;
		var result = [];
		var i = 0, len = children.length;
		for (; i < len; ++i)
		{
			var child = children[i];
			var ok_to_add = hasClass(child, cls);
			if(notHaving)
			{
				ok_to_add = !ok_to_add;
			}
			if (ok_to_add)
			{
				result.push(child);
			}
		}
		return result;
	};
	var removeChildrenByClass = function(elm, cls)
	{
		var children = elm.children;
		var toRemove = getChildrenByClass(elm, cls);
		var i = 0;
		var len = toRemove.length;
		for (; i < len; ++i)
		{
			elm.removeChild(toRemove[i]);
		}
	};
	var removeClassForChildren = function(elm, cls)
	{
		var children = elm.children;
		var i = 0;
		var len = children.length;
		for (; i < len; ++i)
		{
			removeClass(children[i], cls);
		}
	};
	
	var getPercentage = function(snum)
	{
		if(snum && (typeof snum === "string") && snum.indexOf("%") > 0)
		{
			snum = parseFloat(snum);
			return isNaN(snum) ? null : snum;
		}
		return null;
	};

	var getNumber = function(snum, dflt)
	{
		if(snum && (typeof snum === "string"))
		{
			snum = parseFloat(snum);
		}
		return isNaN(snum) ? dflt : snum;
	};

	var getInteger = function(snum, dflt)
	{
		if(snum && (typeof snum === "string"))
		{
			snum = parseInt(snum);
		}
		return isNaN(snum) ? dflt : snum;
	};

	var createBorderMirror = function(elm)
	{
		var bm = document.createElement('div');
		bm.className = "resizer-mirror-tmp";
		setCss(bm, {"position": "absolute",
			"left": addStr_px(elm.offsetLeft),
			"top": addStr_px(elm.offsetTop),
			"width": addStr_px(elm.offsetWidth),
			"height": addStr_px(elm.offsetHeight)});
		elm.parentNode.appendChild(bm);
		return bm;
	};

	var getBorderMirror = function(elm)
	{
		var bm = getChildrenByClass(elm.parentNode, "resizer-mirror-tmp");
		return bm.length ? bm[0] : null;
	};

	var removeBorderMirror = function(elm)
	{
		removeChildrenByClass(elm.parentNode, "resizer-mirror-tmp");
	};

	var setCssBorderMirror = function(elm, ocss)
	{
		var bm = getBorderMirror(elm);
		setCss(bm, ocss);
	};

	//crea gestione resize su target
	var rsz = function(target)
	{
		var d;
		var fmousemove = function(e) {
			var objLayout = getLayout(target);
			var dx = e.pageX - d.ex;
			var dy = e.pageY - d.ey;
			var edge = d.edge;
			if (edge.right)
				objLayout.w = d.w + dx;
			if (edge.bottom)
				objLayout.h = d.h + dy;
			if (edge.left)
			{
				objLayout.w = d.w - dx;
				objLayout.x = d.x + dx;
			}
			if (edge.top)
			{
				objLayout.h = d.h - dy;
				objLayout.y = d.y + dy;
			}
			setLayout(target, objLayout);
			manageLayout(target);
			cancelEvent(e);
		};
		var fmouseup = function(e) {
			removeEvent(document, "mouseup", fmouseup);
			removeEvent(document, "mousemove", fmousemove);
		};
		var fmousedown = function(e) {
			//calcolo edge resize
			var x = e.pageX - target.offsetLeft;
			var y = e.pageY - target.offsetTop;
			var w = target.offsetWidth;
			var h = target.offsetHeight;
			var q = 4;
			var l = {left: x < q, top: y < q, right: w - x < q, bottom: h - y < q};
			if (l.left || l.top || l.right || l.bottom)
			{
				objLayout = getLayout(target);
				objLayout.ex = e.pageX;
				objLayout.ey = e.pageY;
				objLayout.edge = l;
				addEvent(document, "mousemove", fmousemove);
				addEvent(document, "mouseup", fmouseup);
			}
		};
		addEvent(target, "mousedown", fmousedown);
	};

	var layoutFunctions = {
		absolute: function(elmToManage, objLayout, c)
		{
			if (!objLayout.ok)
			{
				setCss(elmToManage, {overflow: "hidden"});
				objLayout.x = isNaN(objLayout.x) ? 0 : objLayout.x;
				objLayout.y = isNaN(objLayout.y) ? 0 : objLayout.y;
				objLayout.w = isNaN(objLayout.w) ? 0 : objLayout.w;
				objLayout.h = isNaN(objLayout.h) ? 0 : objLayout.h;
				setCss(elmToManage, {"position": "absolute",
					"left": addStr_px(objLayout.x), "top": addStr_px(objLayout.y),
					"width": addStr_px(objLayout.w), "height": addStr_px(objLayout.h)});
				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
			}
		},
		fullpage: function(elmToManage, objLayout, c, propagate)
		{
			var c0;
			if (!objLayout.ok)
			{
				setCss(elmToManage, {overflow: 'hidden'});
				//vincola il contenitore alla finestra e aggancia gli eventi di resize
				setCss(elmToManage, {"position": "fixed", "left": 0, "top": 0, "right": 0, "bottom": 0, "width": "", "height": ""});
				window.onresize = propagate;
				//figli: il dialog accetta un solo figlio e lo massimizza
				elmHide(c);
				c0 = c[0];
				setCss(c0, {"position": "absolute", "left": 0, "top": 0, "right": 0, "bottom": 0});
				elmShow(c0);
				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
			}
		},
		dialog: function(elmToManage, objLayout, c)
		{
			var drag, handle_mouseup, handle_mousemove;
			if (!objLayout.ok)
			{
				setCss(elmToManage, {overflow: 'hidden'});
				addClass(elmToManage, "slmdialog");
				objLayout.x = isNaN(objLayout.x) ? 100 : objLayout.x;
				objLayout.y = isNaN(objLayout.y) ? 100 : objLayout.y;
				objLayout.w = isNaN(objLayout.w) ? 100 : objLayout.w;
				objLayout.h = isNaN(objLayout.h) ? 100 : objLayout.h;
				setCss(elmToManage, {"position": "fixed",
					"top": addStr_px(objLayout.y), "left": addStr_px(objLayout.x),
					"width": addStr_px(objLayout.w), "height": addStr_px(objLayout.h),
					"background": "white", "border": "2px solid grey"});
				//barra del dialog
				var m = 10;
				var hdlg = document.createElement('div');
				addClass(hdlg, "slmignore");
				setCss(hdlg, {"left": 0, "top": 0, "right": 0, "cursor": "move"});
				hdlg.innerHTML = "dialog";
				elmToManage.insertBefore(hdlg, elmToManage.firstChild);
				//gestione chiusura
				var hh = addStr_px(hdlg.clientHeight);
				var closeDlg = document.createElement('div');
				setCss(closeDlg, {"position": "absolute", "right": 0, "top": 0,
					"width": hh, "height": hh, "background": "rgb(230, 102, 102)", "text-align": "center", "cursor": "default"});
				closeDlg.innerHTML = "x";
				hdlg.appendChild(closeDlg);
				closeDlg.onclick = function() {
					elmToManage.parentNode.removeChild(elmToManage);
				};
				//gestione spostamento

				handle_mousemove = function(e) {
					if (drag) {
						objLayout.x = e.pageX - drag[0];
						objLayout.y = e.pageY - drag[1];
						//setLayout(elmToManage, objLayout);
						setCss(elmToManage, {"left": addStr_px(objLayout.x), "top": addStr_px(objLayout.y)});
						cancelEvent(e);
					}
				};
				handle_mouseup = function(e) {
					drag = null;
					setLayout(elmToManage, objLayout);
					document.onmousemove = null;
					document.onmouseup = null;
				};
				hdlg.onmousedown = function(e) {
					objLayout = getLayout(elmToManage);
					drag = [e.pageX - objLayout.x, e.pageY - objLayout.y];
					document.onmousemove = handle_mousemove;
					document.onmouseup = handle_mouseup;
				};
				//figli: il dialog accetta un solo figlio e lo massimizza
				elmHide(c);
				var c0 = c[0];
				setCss(c0, {"position": "absolute", "left": 0, "top": addStr_px(hdlg.offsetHeight), "right": 0, "bottom": 0});
				elmShow(c0);
				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
				rsz(elmToManage);//crea gestione resize
			}
		},
		boxV: function(elmToManage, objLayout, elmToManageChildren)
		{
			var i, o, cc, tcc;
			setCss(elmToManage, {overflow: 'hidden'});
			var r = elmToManage.clientHeight;
			var ta = [];
			var tp = 0;
			//calcolo
			var csize = elmToManageChildren.length;
			for (i = 0; i < csize; i++)
			{
				cc = elmToManageChildren[i];
				tcc = getLayout(cc);
				tcc.p = isNaN(tcc.p) ? 0 : tcc.p;
				tcc.h = isNaN(tcc.h) ? cc.offsetHeight : tcc.h;
				if (tcc.ex)
				{
					tcc.x = 0;
					tcc.w = elmToManage.clientWidth;
				}
				r -= tcc.h;
				tp += tcc.p;
				ta.push(tcc);
			}
			for (i = 0, o = 0; i < csize; i++)
			{
				cc = elmToManageChildren[i];
				tcc = ta[i];
				if (tp)
					tcc.h += r * tcc.p / tp;
				tcc.y = o;
				o += tcc.h;
				setCss(cc, {"position": "absolute",
					"left": addStr_px(tcc.x), "top": addStr_px(tcc.y),
					"width": addStr_px(tcc.w), "height": addStr_px(tcc.h)});
			}
		},
		boxH: function(elmToManage, t, elmToManageChildren)
		{
			var i, o, cc, tcc;
			setCss(elmToManage, {overflow: 'hidden'});
			var r = elmToManage.clientWidth;
			var ta = [];
			var tp = 0;
			//calcolo
			var csize = elmToManageChildren.length;
			for (i = 0; i < csize; i++)
			{
				cc = elmToManageChildren[i];
				tcc = getLayout(cc);
				tcc.p = isNaN(tcc.p) ? 0 : tcc.p;
				tcc.w = isNaN(tcc.w) ? cc.offsetWidth : tcc.w;
				if (tcc.ex)
				{
					tcc.y = 0;
					tcc.h = elmToManage.clientHeight;
				}
				r -= tcc.w;
				tp += tcc.p;
				ta.push(tcc);
			}
			for (i = 0, o = 0; i < csize; i++)
			{
				cc = elmToManageChildren[i];
				tcc = ta[i];
				if (tp)
					tcc.w += r * tcc.p / tp;
				tcc.x = o;
				o += tcc.w;
				setCss(cc, {"position": "absolute",
					"left": addStr_px(tcc.x), "top": addStr_px(tcc.y),
					"width": addStr_px(tcc.w), "height": addStr_px(tcc.h)});
			}
		},
		tab: function(elmToManage, objLayout, elmToManageChildren)
		{
			var isVisible, i, csize, cc, pt, s;
			var header;
			//creazione header
			csize = elmToManageChildren.length;
			if (!objLayout.ok)
			{
				objLayout.sel = isNaN(objLayout.sel) ? 0 : objLayout.sel;
				isVisible = (objLayout.o === 'w' || objLayout.o === 'e');
				setCss(elmToManage, {overflow: 'hidden'});
				removeChildrenByClass(elmToManage, "slmignore");
				header = document.createElement('div');
				addClass(header, "slmignore tabheader");
				setCss(header, {"position": "absolute", "left": 0, "top": 0, "right": 0, "overflow": "hidden"});
				elmToManage.insertBefore(header, elmToManage.firstChild);
				for (i = 0; i < csize; i++)
				{
					cc = elmToManageChildren[i];
					pt = getLayout(cc);
					pt.title = (pt.title === undefined) ? "tab " + i : pt.title;
					s = document.createElement('div');
					s.innerHTML = pt.title;
					header.appendChild(s);
					toggleClass(s, "selected", i === objLayout.sel);
					setCss(s, {"display": isVisible ? "block" : "inline-block"});
					s.onclick = (function(j) {
						return function() {
							removeClass(header.children[objLayout.sel], "selected");
							objLayout.sel = j;
							setLayout(elmToManage, objLayout);
							addClass(this, "selected");
							manageLayout(elmToManage);
						};
					})(i);
				}
				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
			}
			//adattamento children
			objLayout.sel = isNaN(objLayout.sel) ? 0 : objLayout.sel % csize;
			var hs = getChildrenByClass(elmToManage, "tabheader");
			hs = addStr_px(hs.length ? getFullElmSize(hs[0]).heigth : 0);
			elmHide(elmToManageChildren);
			var ctsel = elmToManageChildren[objLayout.sel];
			setCss(ctsel, {"position": "absolute", "left": 0, "top": hs, "right": 0, "bottom": 0});
			elmShow(ctsel);

			return false;
		},
		accordion: function(elmToManage, objLayout, elmToManageChildren)
		{
			var i, cc, ct, s, csize = elmToManageChildren.length;
			if (!objLayout.ok)
			{
				objLayout.sel = isNaN(objLayout.sel) ? 0 : objLayout.sel;
				setCss(elmToManage, {overflow: 'hidden'});
				//creazione header accordion
				removeChildrenByClass(elmToManage, "accheader");
				for (i = 0; i < csize; i++)
				{
					cc = elmToManageChildren[i];
					ct = getLayout(cc);
					ct.title = (ct.title === undefined) ? "acc " + i : ct.title;
					s = document.createElement('div');
					addClass(s, "slmignore accheader");
					s.innerHTML = ct.title;
					cc.parentNode.insertBefore(s, cc);
					s.onclick = (function(j) {
						return function() {
							objLayout.sel = j;
							setLayout(elmToManage, objLayout);
							manageLayout(elmToManage);
						};
					})(i);
				}
				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
			}
			//ricalcolo spazio
			var aci, ac = getChildrenByClass(elmToManage, "accheader");
			var r = elmToManage.clientHeight;
			var acsize = ac.length;
			for (i = 0; i < acsize; i++) {
				aci = ac[i];
				toggleClass(aci, "selected", i === objLayout.sel);
				r -= getFullElmSize(aci).heigth;
			}
			//adattamento children
			elmHide(elmToManageChildren);
			objLayout.sel = isNaN(objLayout.sel) ? 0 : objLayout.sel % csize;
			var ctsel = elmToManageChildren[objLayout.sel];
			elmShow(ctsel);
			setCss(ctsel, {left: 0, right: 0, height: addStr_px(r)});
			return false;
		},
		shift: function(elmToManage, objLayout, elmToManageChildren)
		{
			var i, len, sn, sp, ctsel;
			objLayout.sel = isNaN(objLayout.sel) ? 0 : objLayout.sel;
			//creazione header
			if (!objLayout.ok)
			{
				setCss(elmToManage, {overflow: 'hidden'});
				removeChildrenByClass(elmToManage, "slmignore");
				sn = document.createElement('span');
				addClass(sn, "slmignore shift");
				sn.innerHTML = "NEXT";
				setCss(sn, {"position": "absolute", "right": 0, "top": 0, "overflow": "hidden"});
				elmToManage.insertBefore(sn, elmToManage.firstChild);
				sn.onclick = function() {
					var csize = elmToManageChildren.length;
					objLayout.sel = (objLayout.sel + csize + 1) % csize;
					setLayout(elmToManage, objLayout);
					manageLayout(elmToManage);
				};

				sp = document.createElement('span');
				addClass(sp, "slmignore shift");
				sp.innerHTML = "PREV";
				setCss(sp, {"position": "absolute", "left": 0, "top": 0, "overflow": "hidden"});
				elmToManage.insertBefore(sp, elmToManage.firstChild);
				sp.onclick = function() {
					var csize = elmToManageChildren.length;
					objLayout.sel = (objLayout.sel + csize - 1) % csize;
					setLayout(elmToManage, objLayout);
					manageLayout(elmToManage);
				};
				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
			}
			setCss(getChildrenByClass(elmToManage, "shift"), {"top": addStr_px(elmToManage.clientHeight / 2)});
			//attivazione figlio selezionato
			elmHide(elmToManageChildren);
			ctsel = elmToManageChildren[objLayout.sel];
			setCss(ctsel, {"position": "absolute", "left": 0, "top": 0, "right": 0, "bottom": 0});
			elmShow(ctsel);
			return false;
		},
		splitV: function(elmToManage, objLayout, elmToManageChildren)
		{
			var i, len, spl, drag, handle_mousedown, handle_mouseup, handle_mousemove;
			//creazione splitter
			if (!objLayout.ok)
			{
				i = getPercentage(objLayout.sash);
				if(i !== null)
				{
					objLayout.sash = (elmToManage.clientHeight / 100.0) * i;
				} else {
					objLayout.sash = getNumber(objLayout.sash, elmToManage.clientHeight / 2);
				}
				setLayout(elmToManage, objLayout);
				setCss(elmToManage, {overflow: 'hidden'});
				spl = document.createElement('div');
				addClass(spl, "slmignore splitter");
				setCss(spl, {"position": "absolute", "left": 0, "right": 0,
					"height": "5px", "overflow": "hidden", "cursor": "row-resize"});
				elmToManage.insertBefore(spl, elmToManage.firstChild);
				drag = -1;

				handle_mousemove = function(e) {
					if (drag >= 0) {
						var offset = e.pageY - drag;
						if (offset > 0 && offset < (elmToManage.offsetHeight - spl.offsetHeight))
						{
							var bm = getBorderMirror(spl);
							if(bm)
							{
								setCss(bm, {"top": addStr_px(offset)});
							}
						}
					}
					cancelEvent(e);
				};

				handle_mouseup = function(e) {
					if (drag >= 0) {
						var offset = e.pageY - drag;
						if (offset > 0 && offset < (elmToManage.offsetHeight - spl.offsetHeight))
						{
							objLayout.sash = offset;
							setLayout(elmToManage, objLayout);
							manageLayout(elmToManage);
						}
					}
					drag = -1;
					removeBorderMirror(spl);
					cancelEvent(e);
					window.onmouseup = null;
					window.ontouchend = null;
					window.onmousemove = null;
					window.ontouchmove = null;
				};

				handle_mousedown = function(e) {
					drag = e.pageY - objLayout.sash;
					var rs = createBorderMirror(spl);
					cancelEvent(e);
					window.onmouseup = handle_mouseup;
					window.ontouchend = handle_mouseup;
					window.onmousemove = handle_mousemove;
					window.ontouchmove = handle_mousemove;
				};
				spl.onmousedown = handle_mousedown;
				spl.ontouchstart = handle_mousedown;


				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
			}
			//adattamento children	
			setCss(elmToManageChildren[0], {"position": "absolute", "left": 0, 
				"top": 0, "right": 0, "height": addStr_px(objLayout.sash)});
			setCss(elmToManageChildren[1], {"position": "absolute", "left": 0, 
				"top": addStr_px(objLayout.sash + 5), "right": 0, "bottom": 0});
			setCss(getChildrenByClass(elmToManage, "splitter"),
				{"top": addStr_px(objLayout.sash)});
			return false;
		},
		splitH: function(elmToManage, objLayout, elmToManageChildren)
		{
			var i, len, spl, drag, handle_mousedown, handle_mouseup, handle_mousemove;
			//creazione splitter
			if (!objLayout.ok)
			{
				setCss(elmToManage, {overflow: 'hidden'}); 
				i = getPercentage(objLayout.sash);
				if(i !== null)
				{
					objLayout.sash = (elmToManage.clientWidth / 100.0) * i;
				} else {
					objLayout.sash = getNumber(objLayout.sash, elmToManage.clientWidth / 2);
				}
				setLayout(elmToManage, objLayout);
				spl = document.createElement('div');
				addClass(spl, "slmignore splitter");
				setCss(spl, {"position": "absolute", "top": 0, 
					"bottom": 0, "width": "5px", "overflow": "hidden", "cursor": "col-resize"});
				elmToManage.insertBefore(spl, elmToManage.firstChild);
				drag = -1;

				handle_mousemove = function(e) {
					if (drag >= 0) {
						var offset = e.pageX - drag;
						if (offset > 0 && offset < (elmToManage.offsetWidth - spl.offsetWidth))
						{
							var bm = getBorderMirror(spl);
							if(bm)
							{
								setCss(bm, {"left": addStr_px(offset)});
							}
						}
					}
					cancelEvent(e);
				};

				handle_mouseup = function(e) {
					if (drag >= 0) {
						var offset = e.pageX - drag;
						if (offset > 0 && offset < (elmToManage.offsetWidth - spl.offsetWidth))
						{
							objLayout.sash = offset;
							setLayout(elmToManage, objLayout);
							manageLayout(elmToManage);
						}
					}
					drag = -1;
					removeBorderMirror(spl);
					cancelEvent(e);
					window.onmouseup = null;
					window.ontouchend = null;
					window.onmousemove = null;
					window.ontouchmove = null;
				};

				handle_mousedown = function(e) {
					t = getLayout(elmToManage);
					drag = e.pageX - objLayout.sash;
					var rs = createBorderMirror(spl);
					cancelEvent(e);
					window.onmousemove = handle_mousemove;
					window.ontouchmove = handle_mousemove;
					window.onmouseup = handle_mouseup;
					window.ontouchend = handle_mouseup;
				};
				spl.onmousedown = handle_mousedown;
				spl.ontouchstart = handle_mousedown;

				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
			}
			setCss(elmToManageChildren[0], {"position": "absolute", "top": 0, 
				"bottom": 0, "left": 0, "width": addStr_px(objLayout.sash)});
			setCss(elmToManageChildren[1], {"position": "absolute", "top": 0, 
				"left": addStr_px(objLayout.sash + 5), "bottom": 0, "right": 0});
			setCss(getChildrenByClass(elmToManage, "splitter"),
				{"left": addStr_px(objLayout.sash)});
			return false;
		},
		snap: function(elmToManage, objLayout, elmToManageChildren)
		{
			setCss(elmToManage, {overflow: 'hidden'});
			var i = getPercentage(objLayout.sash);
			if(i !== null)
			{
				objLayout.snap = (elmToManage.clientWidth / 100.0) * i;
			} else {
				objLayout.snap = isNaN(objLayout.snap) ? 32 : objLayout.snap;
			}
			setLayout(elmToManage, objLayout);
			var w = elmToManage.offsetWidth;
			var ox = objLayout.snap;
			var oy = objLayout.snap;
			var maxch = 0;
			var rowcnt = 0;
			var csize = elmToManageChildren.length;
			for (i = 0; i < csize; i++)
			{
				var cc = elmToManageChildren[i];
				var ct = getLayout(cc);
				var cw = (isNaN(ct.sx) ? 1 : ct.sx) * objLayout.snap;
				var ch = (isNaN(ct.sy) ? 1 : ct.sy) * objLayout.snap;
				if (ox + cw > w && rowcnt > 0)
				{
					ox = objLayout.snap;
					oy += maxch + objLayout.snap;
					maxch = 0;
				}
				setCss(cc, {top: addStr_px(oy), left: addStr_px(ox),
					width: addStr_px(cw), height: addStr_px(ch), position: 'absolute'});
				rowcnt++;
				ox += cw + objLayout.snap;
				maxch = ch > maxch ? ch : maxch;//stride
			}
			return false;
		},
		menu: function(elmToManage, objLayout, elmToManageChildren)
		{
			var i, len, j, jlen, cc, elm, pc, fhide;
			if (!objLayout.ok)
			{
				objLayout.bar = !!objLayout.bar;//indica se il menu è a barra
				setCss(elmToManage, {overflow: "initial"});
				var fshow = (function(bar) {
					return function(e) {
						e.preventDefault();
						var i, len, elm, tc, ocss = {
							position: 'absolute',
							top: addStr_px(bar ? this.offsetHeight - 1 : 0),
							left: addStr_px(bar ? 0 : this.offsetWidth - 1)
						};
						tc = this.children;
						for (i = 0, len = tc.length; i < len; ++i)
						{
							elm = tc[i];
							setCss(elm, ocss);
							elmShow(elm);
						}
					};
				})(objLayout.bar);
				fhide = function() {
					var i, len, tc = this.children;
					for (i = 0, len = tc.length; i < len; ++i)
					{
						elmHide(tc[i]);
					}
				};
				addClass(elmToManage, "menu");
				if (objLayout.bar)
					addClass(elmToManage, "menubar");
				for (i = 0, len = elmToManageChildren.length; i < len; ++i)
				{
					elm = elmToManageChildren[i];
					elm.onmouseenter = fshow;
					elm.onmouseleave = fhide;
				}
				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
				for (i = 0, len = elmToManageChildren.length; i < len; ++i)
				{
					cc = elmToManageChildren[i].children;
					for (j = 0, jlen = cc.length; j < jlen; ++j)
					{
						elmHide(cc[j]);
						manageLayout(cc[j]);
					}
				}
				manageLayout(elmToManage.parentNode);
			}

			return false;
		},
		flap: function(elmToManage, objLayout, elmToManageChildren)
		{
			var isVisible, header, csize, i, len, cc, pt, s;
			//creazione header
			if (!objLayout.ok)
			{
				setCss(elmToManage, {overflow: 'hidden', position: 'absolute'});
				addClass(elmToManage, "exclude");
				isVisible = (objLayout.o === 'w' || objLayout.o === 'e');

				removeChildrenByClass(elmToManage, "slmignore");
				header = document.createElement('div');
				addClass(header, "slmignore tabheader");
				setCss(header, {"position": "absolute", "overflow": "hidden"});
				elmToManage.insertBefore(header, elmToManage.firstChild);
				csize = elmToManageChildren.length;
				for (i = 0; i < csize; i++)
				{
					cc = elmToManageChildren[i];
					pt = getLayout(cc);
					pt.title = (pt.title === undefined) ? "tab " + i : pt.title;
					s = document.createElement('div');
					s.innerHTML = pt.title;
					header.appendChild(s);
					setCss(s, {"display": isVisible ? "block" : "inline-block"});
					s.onclick = ((function(j) {
						return function() {
							removeClassForChildren(header, "selected");
							addClass(this, "selected");
							if (objLayout.sel === j) {
								objLayout.sel = undefined;
							} else {
								objLayout.sel = j;
							}
							setLayout(elmToManage, objLayout);
							manageLayout(elmToManage);
						};
					})(i));
					if (getCss(cc, "overflow") === "visible")
						setCss(cc, {"overflow": "auto"});
				}
				switch (objLayout.o)
				{
					case 'n':
						setCss(elmToManage, {top: 0, left: 0, right: 0, bottom: 'auto', width: 'auto', height: addStr_px(objLayout.h)});
						setCss(header, {bottom: 0, left: 0, right: 0});
						break;
					case 's':
						setCss(elmToManage, {bottom: 0, left: 0, right: 0, top: 'auto', width: 'auto', height: addStr_px(objLayout.h)});
						setCss(header, {top: 0, left: 0, right: 0});
						break;
					case 'w':
						setCss(elmToManage, {top: 0, bottom: 0, left: 0, right: 'auto', height: 'auto', width: addStr_px(objLayout.w)});
						setCss(header, {top: 0, bottom: 0, right: 0});
						break;
					case 'e':
						setCss(elmToManage, {top: 0, bottom: 0, right: 0, left: 'auto', height: 'auto', width: addStr_px(objLayout.w)});
						setCss(header, {top: 0, bottom: 0, left: 0});
						break;
				}

				objLayout.ok = true;
				setLayout(elmToManage, objLayout);
				invalidate(elmToManage.parentNode);
			}

			//using header as variable name overwrite the header declared inside the above if statement
			//that is a closure variable used in onclick event
			var myHeader = getChildrenByClass(elmToManage, "tabheader")[0];

			var full_size = getFullElmSize(myHeader);
			var hs = addStr_px(full_size.heigth);
			var ws = addStr_px(full_size.width);
			var opened = (objLayout.sel !== undefined);
			setCss(elmToManageChildren, {position: 'absolute'});
			switch (objLayout.o)
			{
				case 'n':
					setCss(elmToManageChildren, {top: 0, left: 0, right: 0, bottom: hs});
					setCss(elmToManage, {height: (opened ? addStr_px(objLayout.h) : hs)});
					break;
				case 's':
					setCss(elmToManageChildren, {bottom: 0, left: 0, right: 0, top: hs});
					setCss(elmToManage, {height: (opened ? addStr_px(objLayout.h) : hs)});
					break;
				case 'w':
					setCss(elmToManageChildren, {top: 0, bottom: 0, left: 0, right: ws});
					setCss(elmToManage, {width: (opened ? addStr_px(objLayout.w) : ws)});
					break;
				case 'e':
					setCss(elmToManageChildren, {top: 0, bottom: 0, right: 0, left: ws});
					setCss(elmToManage, {width: (opened ? addStr_px(objLayout.w) : ws)});
					break;
			}
			elmHide(elmToManageChildren);
			if (objLayout.sel !== undefined)
				elmShow(elmToManageChildren[objLayout.sel]);

			return false;

		}
	};

	var manageLayout = function(elmToManage)
	{

		var objLayout = getLayout(elmToManage);

		//funzioni di geomerty handling
		var elmToManageChildren;
		var myLayoutFunction = layoutFunctions[objLayout.sz];

		var propagate = function()
		{
			var i, len, elm, position = getCss(elmToManage, "position");
			if (!position || position === "static")
				setCss(elmToManage, {"position": "relative"});

			var ttc = [];
			elmToManageChildren = [];
			var children = elmToManage.children;
			for (i = 0, len = children.length; i < len; ++i)
			{
				elm = children[i];
				if (!hasClass(elm, "slmignore"))
				{
					ttc.push(elm);
					if (!hasClass(elm, "exclude"))
					{
						setCss(elm, {height: "", width: ""});
						elmToManageChildren.push(elm);
					}
				}
			}

			if (myLayoutFunction)
				myLayoutFunction(elmToManage, objLayout, elmToManageChildren, propagate);

			for (i = 0, len = ttc.length; i < len; ++i)
			{
				elm = ttc[i];
				if (elm.clientWidth && elm.clientHeight) //is it visible ?
				{
					manageLayout(elm);
				}
			}
		};

		propagate();//propagate event to the children
	};
	return manageLayout;
}();
