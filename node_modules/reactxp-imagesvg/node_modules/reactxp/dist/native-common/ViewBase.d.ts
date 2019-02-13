/**
 * ViewBase.tsx
 *
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 *
 * Base class that is used for several RX views.
 */
/// <reference types="react" />
import * as RN from 'react-native';
import * as RX from '../common/Interfaces';
export declare abstract class ViewBase<P extends RX.Types.ViewProps, S, T extends RN.View | RN.ScrollView> extends RX.ViewBase<P, S> {
    private static _defaultViewStyle;
    private _layoutEventValues;
    abstract render(): JSX.Element;
    protected _nativeComponent: T | undefined;
    static setDefaultViewStyle(defaultViewStyle: RX.Types.ViewStyleRuleSet): void;
    static getDefaultViewStyle(): RX.Types.StyleRuleSet<RX.Types.ViewStyle>;
    setNativeProps(nativeProps: RN.ViewProps): void;
    protected _setNativeComponent: (view: T | null) => void;
    protected _getStyles(props: RX.Types.ViewProps): RX.Types.StyleRuleSetRecursive<RX.Types.StyleRuleSet<RX.Types.ViewStyle>>;
    protected _onLayout: (event: RN.LayoutChangeEvent) => void;
}
export default ViewBase;
