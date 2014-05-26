/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//globals
var drag_mouse_point = false;
var drag_mouse_clone = false;
var drag_mouse_target = false;
var treeViewDOMData;
var currentWidgetId = false;
var currentProjectTabId = false;


function applyLayoutToBody()
{
	var i, len, layout, children = document.body.children;
	for (i = 0, len = children.length; i < len; ++i)
	{
		layout = children[i].getAttribute('data-layout');
		if (layout)
		{
			JsLayoutManager.manageLayout(children[i]);
		}
	}
	projectChanged(0);
}
window.onload = applyLayoutToBody;

function dockPaletteShowHide(bval)
{
	//JsLayoutManager[bval ? "elmShow" : "elmHide"](document.getElementById("box-palette"));
	JsLayoutManager.spliterOpenClose(document.getElementById("box-palette").parentNode, 0, bval);
}

function dockPropertiesShowHide(bval)
{
	//JsLayoutManager[bval ? "elmShow" : "elmHide"](document.getElementById("box-properties"));
	JsLayoutManager.spliterOpenClose(document.getElementById("box-properties").parentNode, 1, bval);
}

function showHideInsertionPoint(evt, show, elm) {
	if (!elm)
	{
		elm = JsLayoutManager.getEventSource(evt);
	}
	if (elm) {
		var currClass = elm.className.replace(/\s*\bshow-insertion-[hv][ab]\b/g, '');
		if (show) {
			var isBlock = getComputedStyle(elm, null).display === "block";
			var mousePos = JsLayoutManager.getMousePos(evt);
			//console.log(mousePos.x + " : " + elm.offsetLeft + " :: " + mousePos.y + " : " + elm.offsetTop);
			currClass += " show-insertion-" + (isBlock ? "v" : "h") + "a";
		}
		if (elm.className !== currClass)
			elm.className = currClass;
	}
}

function setCssByIds(idsSpaceSeparatedStr, cssProperty, cssValue)
{
	var ids = idsSpaceSeparatedStr.split(" ");
	for (var i = 0, len = ids.length; i < len; ++i)
	{
		var elm = document.getElementById(ids[i]);
		if (elm)
		{
			elm.style[cssProperty] = cssValue;
		}
	}
}

function childOf(c, p) {
	while (c && c !== p)
	{
		c = c.parentNode; 
	}
	return !!c;
}

function isValidToDrop(target)
{
	var allowedToDrop = document.getElementById(currentProjectTabId);
	return (target === allowedToDrop) || childOf(target, allowedToDrop);
}

function handle_mousemove(e) {
	if (drag_mouse_point) {
		var target = JsLayoutManager.getEventSource(e);
		//console.log(target);
		if (target !== drag_mouse_target) {
			if (drag_mouse_target)
			{
				showHideInsertionPoint(e, false, drag_mouse_target);
			}
			if (isValidToDrop(target))
			{
				drag_mouse_target = target;
				showHideInsertionPoint(e, true, drag_mouse_target);
				drag_mouse_clone.style.opacity = 1;
			} else {
				drag_mouse_target = false;
				drag_mouse_clone.style.opacity = 0.5;
			}
		}
		if (drag_mouse_clone)
		{
			drag_mouse_point = JsLayoutManager.getMousePos(e);
			drag_mouse_point.x++;
			drag_mouse_point.y++;
			JsLayoutManager.setCss(drag_mouse_clone, {
				top: JsLayoutManager.addStr_px(drag_mouse_point.y),
				left: JsLayoutManager.addStr_px(drag_mouse_point.x)});
		}
	}
	JsLayoutManager.cancelEvent(e);
}

function handle_mouseup(e) {
	if (drag_mouse_point) {
		var target = JsLayoutManager.getEventSource(e);
		//console.log(target);
		if (drag_mouse_clone)
		{
			if (isValidToDrop(target))
			{
				drag_mouse_clone.removeAttribute("style");
				target.appendChild(drag_mouse_clone.parentNode.removeChild(drag_mouse_clone));
			} else {
				drag_mouse_clone.parentNode.removeChild(drag_mouse_clone);
			}
		}
	}
	if (drag_mouse_target)
	{
		showHideInsertionPoint(e, false, drag_mouse_target);
	}
	drag_mouse_point = false;
	drag_mouse_target = false;
	drag_mouse_clone = false;
	JsLayoutManager.cancelEvent(e);
	JsLayoutManager.removeEventMulti(window, "mouseup touchend", handle_mouseup);
	JsLayoutManager.removeEventMulti(window, "mousemove touchmove", handle_mousemove);
	//setCssByIds('box-palette box-properties', "opacity", "");
}

function startDragPalette(e)
{
	var target = JsLayoutManager.getEventSource(e);
	//console.log(target);
	drag_mouse_point = JsLayoutManager.getMousePos(e);
	drag_mouse_point.x++;
	drag_mouse_point.y++;
	var elmType = target.getAttribute("data-type");
	if (elmType)
	{
		drag_mouse_clone = document.createElement(elmType);
		if (elmType === "button")
		{
			drag_mouse_clone.innerHTML = "Button";
		}
	} else {
		drag_mouse_clone = target.cloneNode(true);
	}
	document.body.appendChild(drag_mouse_clone);
	JsLayoutManager.setCss(drag_mouse_clone, {
		outline: "dotted 1px",
		position: "absolute",
		top: JsLayoutManager.addStr_px(drag_mouse_point.y),
		left: JsLayoutManager.addStr_px(drag_mouse_point.x)});
	JsLayoutManager.cancelEvent(e, true);
	JsLayoutManager.addEventMulti(window, "mouseup touchend", handle_mouseup);
	JsLayoutManager.addEventMulti(window, "mousemove touchmove", handle_mousemove);
}

function getClassNameOrText(elm) {
	switch (elm.nodeName) {
		case "#comment":
		case "#text":
			var nodeValue = elm.nodeValue;
			var isSpace = JsLayoutManager.isSpace;
			for (var i = 0, len = nodeValue.length; i < len; ++i) {
				if (!isSpace(nodeValue[i])) {
					return nodeValue;
				}
			}

			return "";
			break;
		default:
			return elm.className;
	}
}

function showTreeDOM(element, data) {
	var nameOrText = getClassNameOrText(element);
	if (element.nodeName === "#text" && nameOrText === "")
		return "";
	var result = "<ul><li><a href='#' class='a_dt' data-did='" + data.length + "' id='did" + data.length + "'>" + element.nodeName + " : " + nameOrText + "</a>";
	data.push(element);
	var cn = element.childNodes;
	for (var i = 0, cnl = cn.length; i < cnl; i++) {
		var elm = cn[i];
		result += showTreeDOM(elm, data);
	}
	result += "</li></ul>";
	//result += "<pre>" + getStyle(element, "") + "</pre>";
	return result;
}

function projectChanged(tabId)
{
	var elm = document.getElementById('tabs-projects');
	var treeBrowser = document.getElementById('tree-browser');
	//console.log(tabId, elm.children[tabId+1]);
	treeViewDOMData = [];
	var projectTab = elm.children[tabId + 1];
	treeBrowser.innerHTML = showTreeDOM(projectTab, treeViewDOMData);
	currentProjectTabId = JsLayoutManager.getAutoId(projectTab);
}

function showPropertiesFor(event)
{
	var target = JsLayoutManager.getEventSource(event);
	if (target && !this.contentEditable)
	{
		var elm = document.getElementById('widget-propery-type-name');
		if (elm)
		{
			currentWidgetId = JsLayoutManager.getAutoId(target);
			elm.innerHTML = "Widget " + target.nodeName + " > " + currentWidgetId;
			elm = document.getElementById('widget-propery-id');
			if (elm)
			{
				elm.value = currentWidgetId;
			}
			var signals = document.getElementById('widget-properties-signals');
			if (signals)
			{
				var prop, events_keys = [], ev_edit = ["<table>"];
				for (prop in target)
				{
					if (prop.indexOf("on") === 0)
					{
						events_keys.push(prop);
					}
				}
				events_keys.sort();
				for (var i = 0, len = events_keys.length; i < len; ++i)
				{
					prop = events_keys[i];
					ev_edit.push("<tr><td>" + prop + "</td><td><input type='text' value='" + (target[prop] || "") + "'></td></tr>");
				}
				ev_edit.push("</table>");
				signals.innerHTML = ev_edit.join("");
			}
		}
	} else {
		currentWidgetId = false;
	}
}

function currWidgetSetId(theId)
{
	if (currentWidgetId)
	{
		if (document.getElementById(theId))
		{
			alert("This id is already in use : " + theId);
			return;
		}
		var elm = document.getElementById(currentWidgetId);
		if (elm)
		{
			elm.id = currentWidgetId = theId;
		}
	}
}

function switchToSourceOrCodeView(bToSource)
{
	if (currentProjectTabId)
	{
		var elm = document.getElementById(currentProjectTabId);
		if (elm)
		{
			var textProperty = "innerText";
			if (!(textProperty in elm))
			{
				textProperty = "textContent";
			}
			if (bToSource)
			{
				if (elm.contentEditable !== "true")
				{
					elm[textProperty] = elm.innerHTML;
					elm.contentEditable = true;
				}
			} else {
				if (elm.contentEditable === "true")
				{
					elm.innerHTML = elm[textProperty];
					elm.contentEditable = false;
				}
			}
		}
	}
}

function doSaveLoadHtmlContent(doSave, elmId, name)
{
	var elm = document.getElementById(elmId);
	if (elm)
	{
		if (Storage)
		{
			var key_name = "html-content--" + name;
			if (doSave)
			{
				localStorage.setItem(key_name, elm.innerHTML);
			} else {
				var txt = localStorage.getItem(key_name);
				if (txt)
				{
					elm.innerHTML = txt;
				}
			}
		}
	}
}

function manageMenuClick(event)
{
	var target = JsLayoutManager.getEventSource(event);
	//console.log(target);
	var action = target.getAttribute("data-action");
	if (action)
	{
		var tabs = document.getElementById('tabs-projects');
		var project_name, theTab = document.getElementById(currentProjectTabId);
		switch (action)
		{
			case "project-new":
				project_name = prompt("Please enter project name","");
				if(project_name)
				{
					if(tabs)
					{
						var newTab = JsLayoutManager.tabsAddTab(tabs, project_name);
						if(newTab)
						{
							newTab.onclick = showPropertiesFor;
						}
					}
				}
				break;
			case "project-close":
				if (confirm("Are you sure to close the current project ?") === true)
				{
					if(theTab)
					{
						JsLayoutManager.tabsRemoveTab(theTab);
					}
				}
				break;
			case "project-save":
				if(theTab)
				{
					project_name = JsLayoutManager.tabsGetTabTitle(theTab);
					doSaveLoadHtmlContent(true, currentProjectTabId, project_name);
				}				
				break;
			case "project-open":
				if(theTab)
				{
					project_name = JsLayoutManager.tabsGetTabTitle(theTab);
					doSaveLoadHtmlContent(false, currentProjectTabId, project_name);
				}				
				break;
		}
	}
	//JsLayoutManager.menuClose(menu);
}



