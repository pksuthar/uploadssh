"use strict";
/**
* FocusManager.ts
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* Manages focusable elements for better keyboard navigation.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var ReactDOM = require("react-dom");
var PropTypes = require("prop-types");
var UserInterface_1 = require("../UserInterface");
var ATTR_NAME_TAB_INDEX = 'tabindex';
var ATTR_NAME_ARIA_HIDDEN = 'aria-hidden';
var _lastComponentId = 0;
var _isNavigatingWithKeyboard;
var _isShiftPressed;
UserInterface_1.default.keyboardNavigationEvent.subscribe(function (isNavigatingWithKeyboard) {
    _isNavigatingWithKeyboard = isNavigatingWithKeyboard;
});
var _skipFocusCheck = false;
if ((typeof document !== 'undefined') && (typeof window !== 'undefined')) {
    // The default behaviour on Electron is to release the focus after the
    // Tab key is pressed on a last focusable element in the page and focus
    // the first focusable element on a consecutive Tab key press.
    // We want to avoid losing this first Tab key press.
    var _checkFocusTimer_1;
    // Checking if Shift is pressed to move the focus into the right direction.
    window.addEventListener('keydown', function (event) {
        _isShiftPressed = event.shiftKey;
    });
    window.addEventListener('keyup', function (event) {
        _isShiftPressed = event.shiftKey;
    });
    document.body.addEventListener('focusout', function (event) {
        if (!_isNavigatingWithKeyboard || (event.target === document.body)) {
            return;
        }
        if (_checkFocusTimer_1) {
            clearTimeout(_checkFocusTimer_1);
        }
        if (_skipFocusCheck) {
            // When in between the FocusManager restrictions,
            // don't check for the focus change here, FocusManager
            // will take care of it.
            _skipFocusCheck = false;
            return;
        }
        _checkFocusTimer_1 = setTimeout(function () {
            _checkFocusTimer_1 = undefined;
            if (_isNavigatingWithKeyboard &&
                (!document.activeElement || (document.activeElement === document.body))) {
                // This should work for Electron and the browser should
                // send the focus to the address bar anyway.
                FocusManager.focusFirst(_isShiftPressed);
            }
        }, 0);
    });
}
var FocusManager = (function () {
    function FocusManager(parent) {
        this._myFocusableComponentIds = {};
        if (parent) {
            this._parent = parent;
        }
        else if (FocusManager._rootFocusManager) {
            console.error('FocusManager: root is already set');
        }
        else {
            FocusManager._rootFocusManager = this;
        }
    }
    // Whenever the focusable element is mounted, we let the application
    // know so that FocusManager could account for this element during the
    // focus restriction.
    FocusManager.prototype.addFocusableComponent = function (component) {
        if (component._focusableComponentId) {
            return;
        }
        var componentId = 'fc-' + ++_lastComponentId;
        var storedComponent = {
            id: componentId,
            component: component,
            restricted: false,
            limitedCount: 0,
            onFocus: function () {
                FocusManager._currentFocusedComponent = storedComponent;
            }
        };
        component._focusableComponentId = componentId;
        FocusManager._allFocusableComponents[componentId] = storedComponent;
        var withinRestrictionOwner = false;
        for (var parent_1 = this; parent_1; parent_1 = parent_1._parent) {
            parent_1._myFocusableComponentIds[componentId] = true;
            if (FocusManager._currentRestrictionOwner === parent_1) {
                withinRestrictionOwner = true;
            }
            if (parent_1._isFocusLimited) {
                storedComponent.limitedCount++;
            }
        }
        if (!withinRestrictionOwner && FocusManager._currentRestrictionOwner) {
            storedComponent.restricted = true;
        }
        FocusManager._updateComponentFocusRestriction(storedComponent);
        var el = ReactDOM.findDOMNode(component);
        if (el) {
            el.addEventListener('focus', storedComponent.onFocus);
        }
    };
    FocusManager.prototype.removeFocusableComponent = function (component) {
        var componentId = component._focusableComponentId;
        if (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            var el = ReactDOM.findDOMNode(component);
            if (storedComponent && el) {
                el.removeEventListener('focus', storedComponent.onFocus);
            }
            storedComponent.removed = true;
            storedComponent.restricted = false;
            storedComponent.limitedCount = 0;
            FocusManager._updateComponentFocusRestriction(storedComponent);
            delete storedComponent.callbacks;
            for (var parent_2 = this; parent_2; parent_2 = parent_2._parent) {
                delete parent_2._myFocusableComponentIds[componentId];
            }
            delete FocusManager._allFocusableComponents[componentId];
            delete component._focusableComponentId;
        }
    };
    FocusManager.prototype.restrictFocusWithin = function (noFocusReset) {
        var _this = this;
        // Limit the focus received by the keyboard navigation to all
        // the descendant focusable elements by setting tabIndex of all
        // other elements to -1.
        if (FocusManager._currentRestrictionOwner === this) {
            return;
        }
        if (FocusManager._currentRestrictionOwner) {
            FocusManager._removeFocusRestriction();
        }
        if (!this._prevFocusedComponent) {
            this._prevFocusedComponent = FocusManager._pendingPrevFocusedComponent || FocusManager._currentFocusedComponent;
        }
        FocusManager._clearRestoreRestrictionTimeout();
        FocusManager._restrictionStack.push(this);
        FocusManager._currentRestrictionOwner = this;
        Object.keys(FocusManager._allFocusableComponents).forEach(function (componentId) {
            if (!(componentId in _this._myFocusableComponentIds)) {
                var storedComponent = FocusManager._allFocusableComponents[componentId];
                storedComponent.restricted = true;
                FocusManager._updateComponentFocusRestriction(storedComponent);
            }
        });
        if (!noFocusReset) {
            FocusManager.resetFocus();
        }
    };
    FocusManager.prototype.removeFocusRestriction = function () {
        var _this = this;
        // Restore the focus to the previous view with restrictFocusWithin or
        // remove the restriction if there is no such view.
        FocusManager._restrictionStack = FocusManager._restrictionStack.filter(function (focusManager) { return focusManager !== _this; });
        if (FocusManager._currentRestrictionOwner === this) {
            // We'll take care of setting the proper focus below,
            // no need to do a regular check for focusout.
            _skipFocusCheck = true;
            var prevFocusedComponent_1 = this._prevFocusedComponent;
            this._prevFocusedComponent = undefined;
            FocusManager._removeFocusRestriction();
            FocusManager._currentRestrictionOwner = undefined;
            // Defer the previous restriction restoration to wait for the current view
            // to be unmounted, or for the next restricted view to be mounted (like
            // showing a modal after a popup).
            FocusManager._clearRestoreRestrictionTimeout();
            FocusManager._pendingPrevFocusedComponent = prevFocusedComponent_1;
            FocusManager._restoreRestrictionTimer = setTimeout(function () {
                FocusManager._restoreRestrictionTimer = undefined;
                FocusManager._pendingPrevFocusedComponent = undefined;
                var prevRestrictionOwner = FocusManager._restrictionStack.pop();
                var needsFocusReset = true;
                var currentFocusedComponent = FocusManager._currentFocusedComponent;
                if (currentFocusedComponent && !currentFocusedComponent.removed &&
                    !(currentFocusedComponent.id in _this._myFocusableComponentIds)) {
                    // The focus has been manually moved to something outside of the current
                    // restriction scope, we should skip focusing the component which was
                    // focused before the restriction and keep the focus as it is.
                    prevFocusedComponent_1 = undefined;
                    needsFocusReset = false;
                }
                if (prevFocusedComponent_1 && !prevFocusedComponent_1.removed &&
                    !prevFocusedComponent_1.restricted && !prevFocusedComponent_1.limitedCount) {
                    // If possible, focus the previously focused component.
                    var el = ReactDOM.findDOMNode(prevFocusedComponent_1.component);
                    if (el && el.focus) {
                        el.focus();
                        needsFocusReset = false;
                    }
                }
                if (prevRestrictionOwner) {
                    prevRestrictionOwner.restrictFocusWithin(true);
                }
                if (needsFocusReset) {
                    FocusManager.resetFocus();
                }
            }, 100);
        }
    };
    FocusManager.prototype.limitFocusWithin = function () {
        if (this._isFocusLimited) {
            return;
        }
        this._isFocusLimited = true;
        Object.keys(this._myFocusableComponentIds).forEach(function (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            storedComponent.limitedCount++;
            FocusManager._updateComponentFocusRestriction(storedComponent);
        });
    };
    FocusManager.prototype.removeFocusLimitation = function () {
        if (!this._isFocusLimited) {
            return;
        }
        Object.keys(this._myFocusableComponentIds).forEach(function (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            storedComponent.limitedCount--;
            FocusManager._updateComponentFocusRestriction(storedComponent);
        });
        this._isFocusLimited = false;
    };
    FocusManager.prototype.release = function () {
        this.removeFocusRestriction();
        this.removeFocusLimitation();
    };
    FocusManager.prototype.subscribe = function (component, callback) {
        var storedComponent = FocusManager._getStoredComponent(component);
        if (storedComponent) {
            if (!storedComponent.callbacks) {
                storedComponent.callbacks = [];
            }
            storedComponent.callbacks.push(callback);
        }
    };
    FocusManager.prototype.unsubscribe = function (component, callback) {
        var storedComponent = FocusManager._getStoredComponent(component);
        if (storedComponent && storedComponent.callbacks) {
            storedComponent.callbacks = storedComponent.callbacks.filter(function (cb) {
                return cb !== callback;
            });
        }
    };
    FocusManager.prototype.isComponentFocusRestrictedOrLimited = function (component) {
        var storedComponent = FocusManager._getStoredComponent(component);
        return storedComponent && (storedComponent.restricted || storedComponent.limitedCount > 0);
    };
    FocusManager.focusFirst = function (last) {
        var focusable = Object.keys(FocusManager._allFocusableComponents)
            .map(function (componentId) { return FocusManager._allFocusableComponents[componentId]; })
            .filter(function (storedComponent) { return !storedComponent.removed && !storedComponent.restricted && !storedComponent.limitedCount; })
            .map(function (storedComponent) { return ReactDOM.findDOMNode(storedComponent.component); })
            .filter(function (el) { return el && el.focus; });
        if (focusable.length) {
            focusable.sort(function (a, b) {
                // Some element which is mounted later could come earlier in the DOM,
                // so, we sort the elements by their appearance in the DOM.
                if (a === b) {
                    return 0;
                }
                return a.compareDocumentPosition(b) & document.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
            });
            focusable[last ? focusable.length - 1 : 0].focus();
        }
    };
    FocusManager.resetFocus = function () {
        if (FocusManager._resetFocusTimer) {
            clearTimeout(FocusManager._resetFocusTimer);
            FocusManager._resetFocusTimer = undefined;
        }
        if (_isNavigatingWithKeyboard) {
            // When we're in the keyboard navigation mode, we want to have the
            // first focusable component to be focused straight away, without the
            // necessity to press Tab.
            // Defer the focusing to let the view finish its initialization.
            FocusManager._resetFocusTimer = setTimeout(function () {
                FocusManager._resetFocusTimer = undefined;
                FocusManager.focusFirst();
            }, 0);
        }
        else if ((typeof document !== 'undefined') && document.body && document.body.focus && document.body.blur) {
            // An example to explain this part:
            // We've shown a modal dialog which is higher in the DOM by clicking
            // on a button which is lower in the DOM, we've applied the restrictions
            // and only the elements from the modal dialog are focusable now.
            // But internally the browser keeps the last focus position in the DOM
            // (even if we do blur() for the button) and when Tab is pressed again,
            // the browser will start searching for the next focusable element from
            // this position.
            // This means that the first Tab press will get us to the browser's address
            // bar (or nowhere in case of Electron) and only the second Tab press will
            // lead us to focusing the first focusable element in the modal dialog.
            // In order to avoid losing this first Tab press, we're making <body>
            // focusable, focusing it, removing the focus and making it unfocusable
            // back again.
            var prevTabIndex = FocusManager._setTabIndex(document.body, 0);
            document.body.focus();
            document.body.blur();
            FocusManager._setTabIndex(document.body, prevTabIndex);
        }
    };
    FocusManager._getStoredComponent = function (component) {
        var componentId = component._focusableComponentId;
        if (componentId) {
            return FocusManager._allFocusableComponents[componentId];
        }
        return null;
    };
    FocusManager._callFocusableComponentStateChangeCallbacks = function (storedComponent, restrictedOrLimited) {
        if (!storedComponent.callbacks) {
            return;
        }
        storedComponent.callbacks.forEach(function (callback) {
            callback.call(storedComponent.component, restrictedOrLimited);
        });
    };
    FocusManager._removeFocusRestriction = function () {
        Object.keys(FocusManager._allFocusableComponents).forEach(function (componentId) {
            var storedComponent = FocusManager._allFocusableComponents[componentId];
            storedComponent.restricted = false;
            FocusManager._updateComponentFocusRestriction(storedComponent);
        });
    };
    FocusManager._clearRestoreRestrictionTimeout = function () {
        if (FocusManager._restoreRestrictionTimer) {
            clearTimeout(FocusManager._restoreRestrictionTimer);
            FocusManager._restoreRestrictionTimer = undefined;
            FocusManager._pendingPrevFocusedComponent = undefined;
        }
    };
    FocusManager._setComponentTabIndexAndAriaHidden = function (component, tabIndex, ariaHidden) {
        var el = ReactDOM.findDOMNode(component);
        return el ?
            {
                tabIndex: FocusManager._setTabIndex(el, tabIndex),
                ariaHidden: FocusManager._setAriaHidden(el, ariaHidden)
            }
            :
                null;
    };
    FocusManager._setTabIndex = function (element, value) {
        var prev = element.hasAttribute(ATTR_NAME_TAB_INDEX) ? element.tabIndex : undefined;
        if (value === undefined) {
            if (prev !== undefined) {
                element.removeAttribute(ATTR_NAME_TAB_INDEX);
            }
        }
        else {
            element.tabIndex = value;
        }
        return prev;
    };
    FocusManager._setAriaHidden = function (element, value) {
        var prev = element.hasAttribute(ATTR_NAME_ARIA_HIDDEN) ? element.getAttribute(ATTR_NAME_ARIA_HIDDEN) : undefined;
        if (value === undefined) {
            if (prev !== undefined) {
                element.removeAttribute(ATTR_NAME_ARIA_HIDDEN);
            }
        }
        else {
            element.setAttribute(ATTR_NAME_ARIA_HIDDEN, value);
        }
        return prev;
    };
    FocusManager._updateComponentFocusRestriction = function (storedComponent) {
        if ((storedComponent.restricted || (storedComponent.limitedCount > 0)) && !('origTabIndex' in storedComponent)) {
            var origValues = FocusManager._setComponentTabIndexAndAriaHidden(storedComponent.component, -1, 'true');
            storedComponent.origTabIndex = origValues ? origValues.tabIndex : undefined;
            storedComponent.origAriaHidden = origValues ? origValues.ariaHidden : undefined;
            FocusManager._callFocusableComponentStateChangeCallbacks(storedComponent, true);
        }
        else if (!storedComponent.restricted && !storedComponent.limitedCount && ('origTabIndex' in storedComponent)) {
            FocusManager._setComponentTabIndexAndAriaHidden(storedComponent.component, storedComponent.origTabIndex, storedComponent.origAriaHidden);
            delete storedComponent.origTabIndex;
            delete storedComponent.origAriaHidden;
            FocusManager._callFocusableComponentStateChangeCallbacks(storedComponent, false);
        }
    };
    FocusManager._restrictionStack = [];
    FocusManager._allFocusableComponents = {};
    return FocusManager;
}());
exports.FocusManager = FocusManager;
// A mixin for the focusable elements, to tell the views that
// they exist and should be accounted during the focus restriction.
//
// isConditionallyFocusable is an optional callback which will be
// called for componentDidMount() or for componentWillUpdate() to
// determine if the component is actually focusable.
function applyFocusableComponentMixin(Component, isConditionallyFocusable) {
    var contextTypes = Component.contextTypes || {};
    contextTypes.focusManager = PropTypes.object;
    Component.contextTypes = contextTypes;
    inheritMethod('componentDidMount', function (focusManager) {
        if (!isConditionallyFocusable || isConditionallyFocusable.call(this)) {
            focusManager.addFocusableComponent(this);
        }
    });
    inheritMethod('componentWillUnmount', function (focusManager) {
        focusManager.removeFocusableComponent(this);
    });
    inheritMethod('componentWillUpdate', function (focusManager, origArguments) {
        if (isConditionallyFocusable) {
            var isFocusable = isConditionallyFocusable.apply(this, origArguments);
            if (isFocusable && !this._focusableComponentId) {
                focusManager.addFocusableComponent(this);
            }
            else if (!isFocusable && this._focusableComponentId) {
                focusManager.removeFocusableComponent(this);
            }
        }
    });
    function inheritMethod(methodName, action) {
        var origCallback = Component.prototype[methodName];
        Component.prototype[methodName] = function () {
            var focusManager = this._focusManager || (this.context && this.context.focusManager);
            if (focusManager) {
                action.call(this, focusManager, arguments);
            }
            else {
                console.error('FocusableComponentMixin: context error!');
            }
            if (origCallback) {
                origCallback.apply(this, arguments);
            }
        };
    }
}
exports.applyFocusableComponentMixin = applyFocusableComponentMixin;
exports.default = FocusManager;
