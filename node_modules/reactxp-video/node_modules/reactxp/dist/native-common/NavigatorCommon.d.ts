import RN = require('react-native');
import RX = require('../common/Interfaces');
import Types = require('../common/Types');
export declare enum CommandType {
    Push = 0,
    Pop = 1,
    Replace = 2,
}
export interface CommandParam {
    route?: Types.NavigatorRoute;
    value?: number;
}
export interface NavigationCommand {
    type: CommandType;
    param: CommandParam;
}
export interface NavigatorState {
    state: RN.NavigationExperimental.NavigationState;
}
export declare abstract class NavigatorDelegate {
    protected _owner: RX.Navigator;
    constructor(navigator: RX.Navigator);
    onBackPress: () => boolean;
    abstract getRoutes(): Types.NavigatorRoute[];
    abstract immediatelyResetRouteStack(nextRouteStack: Types.NavigatorRoute[]): void;
    abstract render(): JSX.Element;
    abstract processCommand(commandQueue: NavigationCommand[]): void;
    abstract handleBackPress(): void;
}
