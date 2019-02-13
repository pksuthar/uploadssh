import RX = require('../common/Interfaces');
import Types = require('../common/Types');
export declare class App extends RX.App {
    constructor();
    initialize(debug: boolean, development: boolean): void;
    getActivationState(): Types.AppActivationState;
}
declare const _default: App;
export default _default;
