/**
* Link.tsx
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* RN-specific implementation of the cross-platform Link abstraction.
*/
import React = require('react');
import RN = require('react-native');
import Types = require('../common/Types');
export declare class Link extends React.Component<Types.LinkProps, {}> {
    setNativeProps(nativeProps: RN.TextProps): void;
    render(): JSX.Element;
    private _onPress;
    private _onLongPress;
}
export default Link;
