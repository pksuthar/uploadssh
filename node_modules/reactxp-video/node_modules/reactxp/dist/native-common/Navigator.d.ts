/**
* Navigator.tsx
*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT license.
*
* Common native implementation for Navigator on mobile.
*/
import React = require('react');
import { NavigatorState } from './NavigatorCommon';
import Types = require('../common/Types');
export declare class Navigator extends React.Component<Types.NavigatorProps, NavigatorState> {
    private _delegate;
    private _commandQueue;
    constructor(initialProps: Types.NavigatorProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    protected componentDidUpdate(): void;
    protected getRoutes(): Types.NavigatorRoute[];
    push(route: Types.NavigatorRoute): void;
    pop(): void;
    replace(route: Types.NavigatorRoute): void;
    replacePrevious(route: Types.NavigatorRoute): void;
    replaceAtIndex(route: Types.NavigatorRoute, index: number): void;
    immediatelyResetRouteStack(nextRouteStack: Types.NavigatorRoute[]): void;
    popToRoute(route: Types.NavigatorRoute): void;
    popToTop(): void;
    getCurrentRoutes(): Types.NavigatorRoute[];
    render(): JSX.Element;
    private _enqueueCommand(command);
    private _processCommand();
}
export default Navigator;
