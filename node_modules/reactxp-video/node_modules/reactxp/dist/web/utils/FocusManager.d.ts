/**
* FocusManager.ts
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* Manages focusable elements for better keyboard navigation.
*/
import React = require('react');
export declare type FocusableComponentStateCallback = (restrictedOrLimited: boolean) => void;
export declare class FocusManager {
    private static _rootFocusManager;
    private static _restrictionStack;
    private static _currentRestrictionOwner;
    private static _restoreRestrictionTimer;
    private static _pendingPrevFocusedComponent;
    private static _currentFocusedComponent;
    private static _allFocusableComponents;
    private static _resetFocusTimer;
    private _parent;
    private _isFocusLimited;
    private _prevFocusedComponent;
    private _myFocusableComponentIds;
    constructor(parent: FocusManager);
    addFocusableComponent(component: React.Component<any, any>): void;
    removeFocusableComponent(component: React.Component<any, any>): void;
    restrictFocusWithin(noFocusReset?: boolean): void;
    removeFocusRestriction(): void;
    limitFocusWithin(): void;
    removeFocusLimitation(): void;
    release(): void;
    subscribe(component: React.Component<any, any>, callback: FocusableComponentStateCallback): void;
    unsubscribe(component: React.Component<any, any>, callback: FocusableComponentStateCallback): void;
    isComponentFocusRestrictedOrLimited(component: React.Component<any, any>): boolean;
    static focusFirst(last?: boolean): void;
    static resetFocus(): void;
    private static _getStoredComponent(component);
    private static _callFocusableComponentStateChangeCallbacks(storedComponent, restrictedOrLimited);
    private static _removeFocusRestriction();
    private static _clearRestoreRestrictionTimeout();
    private static _setComponentTabIndexAndAriaHidden(component, tabIndex, ariaHidden);
    private static _setTabIndex(element, value);
    private static _setAriaHidden(element, value);
    private static _updateComponentFocusRestriction(storedComponent);
}
export declare function applyFocusableComponentMixin(Component: any, isConditionallyFocusable?: Function): void;
export default FocusManager;
