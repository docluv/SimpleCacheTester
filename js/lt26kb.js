/*

Just a filler library to take up enough space for testing caching
*/


(function (window, undefined) {

    "use strict";

    var toolbar = function (node, customSettings) {

        return new toolbar.fn.init(node, customSettings);
    };

    toolbar.fn = toolbar.prototype = {

        constructor: toolbar,

        init: function (node, customSettings) {

            if (!node) {
                return node;
            }

            if (typeof node === "string") { //assume selector

                node = document.querySelector(node);

                if (!node) {
                    return node;
                }

            }

            if ("length" in node) {  //rude detection for nodeList
                node = node[0]; //limit the toolbar application to a single node for now, just makes sense
            }

            var that = this,
                settings = that.settings =
                            MBP.extend({}, that.settings, customSettings);

            that.support = MBP.buildVendorNames();
            that.support.transitionEnd =
                                that.eventNames[that.support.transition] || null;

            that.setupToolbarElements(node, settings);
            that.applyTransitionEnd();
            that.setupOritentationChange();
            that.setToolbarMenu(settings.menuItems);

            return this;
        },

        version: "0.0.3",

        toolbar: undefined,
        topMenu: undefined,
        subMenu: undefined,
        expandTarget: undefined,

        hasMouse: "",
        touchType: "",
        touchStart: "",

        div: undefined,
        support: {},
        eventNames: {
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'WebkitTransition': 'webkitTransitionEnd',
            'msTransition': 'MSTransitionEnd',
            'transition': 'transitionend'
        },

        /*
        Use this method to configure or change the items displayed in the toolbar.
        There are two arrays in the menuItems object, topMenu and subMenu. They
        are parsed to build the menu items using the templates defined in the settings
        object.
        */
        setToolbarMenu: function (menuItems) {

            var i = 0,
                topHTML = "",
                subHTML = "",
                that = this,
                settings = that.settings;

            that.expandToolbar(true);

            that.topMenu.innerHTML = "";
            that.subMenu.innerHTML = "";

            if (menuItems.topMenu) {

                //will replace this with a forEach soon....
                for (i = 0; i < menuItems.topMenu.length; i++) {
                    topHTML += that.parseMenuItem(menuItems.topMenu[i],
                                    settings.toolbarItemTemplate);
                }

            }

            if (menuItems.subMenu) {

                for (i = 0; i < menuItems.subMenu.length; i++) {
                    subHTML += that.parseMenuItem(menuItems.subMenu[i],
                                    settings.subMenuItemTemplate);
                }

            }

            i = menuItems.topMenu.length;

            if (topHTML === "" && subHTML === "") {
                that.toolbar.style.display = "none";
            } else {

                that.toolbar.style.display = "block";

                topHTML += "<div class='expand-toolbar'>...</div>";
                i++;

                that.topMenu.innerHTML = topHTML;
                that.subMenu.innerHTML = subHTML;

                that.setIconWidth(i);
                //document.querySelector(that.settings.subMenuNavListSelector)

                that.expandTarget = that.toolbar.querySelector(settings.expandTargetSelector);

                that.setupExpand();
                that.bindCallBacks(menuItems);

            }

        },

        parseMenuItem: function (menuItem, template) {

            return template.replace("{{title}}", menuItem.title)
                            .replace("{{iconClass}}", menuItem.iconClass);

        },

        setIconWidth: function (count) {

            var settings = this.settings,
                tbitem = document.querySelector(settings.topMenuItemSelector).clientWidth,
                wWidth = window.innerWidth,
                mWidth = Math.floor((((wWidth - (count * tbitem)) / (count * 2)) / wWidth) * 98),
                tbItems = document.querySelectorAll(settings.topMenuItemSelector),
                exp = document.querySelector(settings.topMenuItemSelector);

            for (count = 0; count < tbItems.length; count++) {
                tbItems[count].style.marginRight = mWidth + "%";
                tbItems[count].style.marginLeft = mWidth + "%";
            }

            if (exp) {
                exp.style.marginRight = mWidth + "%";
                exp.style.marginLeft = mWidth + "%";
            }

        },

        bindCallBacks: function (menuItems) {

            var i = 0,
                that = this,
                menuItem, target;

            for (i = 0; i < menuItems.topMenu.length; i++) {

                menuItem = menuItems.topMenu[i];

                that.bindTapEvent(
                            document.querySelector("." + menuItem.iconClass),
                                menuItem.callback);
            }

            for (i = 0; i < menuItems.subMenu.length; i++) {

                menuItem = menuItems.subMenu[i];

                that.bindTapEvent(
                            document.querySelector("." + menuItem.iconClass),
                            menuItem.callback);
            }

        },

        buildTransitionValue: function (prop) {

            var settings = this.settings;

            return prop + " " + settings.expandSpeed + "ms " + settings.easing;
        },

        setupToolbarElements: function (node, settings) {

            var that = this;

            that.toolbar = node;
            that.topMenu = that.toolbar.querySelector(settings.topMenuSelector);
            that.subMenu = that.toolbar.querySelector(settings.subMenuSelector);

        },

        applyTransitionEnd: function () {

            var that = this;

            //This gets called when the animation is complete
            that.toolbar.addEventListener(that.support.transitionEnd, function (e) {
                that.transitionEnd(e);
            });

        },

        transitionEnd: function (e) {

            this.toolbar.style[this.support.transition] = "";

        },

        setupTouch: function () {

            var that = this;

            that.touchType = window.navigator.msPointerEnabled ? "pointer" :
                                "ontouchstart" in window ? "touch" : "mouse";

            that.hasMouse = ("ontouchstart" in window && "onmousedown" in window);

            that.touchStart = this.touchType === "pointer" ? "MSPointerDown" :
                            this.touchType === "touch" ? "touchstart" : "mousedown";

        },

        setupExpand: function () {

            var that = this;

            that.setupTouch();
            that.bindTapEvent(that.expandTarget, function (e) {
                e.preventDefault();
                that.expandToolbar();
            });

        },

        bindTapEvent: function (target, callback) {

            var that = this;

            if (!target) {
                return;
            }

            target.addEventListener(that.touchStart, function (e) {
                callback.call(that, e);
            });

            if (that.hasMouse) {
                target.addEventListener("mousedown", function (e) {
                    callback.call(that, e);
                });
            }

        },

        expandToolbar: function (forceClose) {

            var that = this,
                settings = that.settings,
                toolbar = that.toolbar,
                top, sub;

            if (forceClose === true &&
                    (toolbar.expanded === undefined || toolbar.expanded === false)) {
                return;
            }


            if (toolbar.orientation === "portrait") {
                toolbar.style[that.support.transition] = that.buildTransitionValue("height");
            } else {
                toolbar.style[that.support.transition] = that.buildTransitionValue("width");
            }

            if (toolbar.expanded) {

                if (toolbar.orientation === "portrait") {
                    toolbar.style.height = settings.minHeight + "px";
                } else {
                    toolbar.style.width = settings.minWidth + "px";
                }

                toolbar.expanded = false;

            } else {

                top = (that.topMenu !== undefined) ?
                                that.topMenu.getBoundingClientRect() : { height: "0px", width: "0px" },
                sub = (that.subMenu !== undefined) ?
                                that.subMenu.getBoundingClientRect() : { height: "0px", width: "0px" };

                if (that.toolbar.orientation === "portrait") {

                    toolbar.style.height = (top.height + sub.height) + "px";

                } else {

                    if(settings.menuItems.subMenu.length > 0){
                        toolbar.style.width = settings.expandWidth + "px";
                    //}else{
                      //nothing to expend if there are no sub menu items      
                    }

                }

                toolbar.expanded = true;
            }

        },

        setupOritentationChange: function () {

            var that = this,
                toolbar = that.toolbar,
                supportsOrientationChange = "onorientationchange" in window,
                orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

            toolbar.orientation = (window.innerWidth > window.innerHeight) ?
                                "landscape" : "portrait";

            window.addEventListener(orientationEvent, function () {

                toolbar.orientation = (window.innerWidth > window.innerHeight) ?
                                "landscape" : "portrait";

                if (toolbar.orientation === "landscape") {
                    toolbar.style.height = window.innerHeight + "px";
                    toolbar.style.width = "42px";
                } else {
                    toolbar.style.height = "35px";
                    toolbar.style.width = window.innerWidth + "px";

                    that.setIconWidth(that.settings.menuItems.topMenu.length + 1);
                }

            }, false);

        },

        settings: {

            minHeight: 35,
            minWidth: 42,
            expandWidth: 200,

            mainSelector: ".toolbar",
            topMenuSelector: ".toolbar-top-menu",
            subMenuSelector: ".toolbar-sub-menu",
            expandTargetSelector: ".expand-toolbar",
            topMenuItemSelector: ".toolbar-item",

            menuItems: {
                topMenu: [],
                subMenu: []
            },
            toolbarItemTemplate: "<div class='toolbar-item'><div class='toolbar-item-icon {{iconClass}}'></div><figcaption>{{title}}</figcaption></div>",
            subMenuItemTemplate: "<div class='toolbar-sub-menu-nav-item {{iconClass}}'>{{title}}</div>",

            topLevelItems: [],
            secondLevelItems: [],
            expandSpeed: 1000, //ms
            that: undefined,

            easing: "ease-in-out"
        }

    };

    // Give the init function the toolbar prototype for later instantiation
    toolbar.fn.init.prototype = toolbar.fn;


    return (window.toolbar = toolbar);


} (window));