import SyncTasks = require('synctasks');
import RX = require('../common/Interfaces');
import Types = require('../common/Types');
export declare class Network extends RX.Network {
    constructor();
    isConnected(): SyncTasks.Promise<boolean>;
    getType(): SyncTasks.Promise<Types.DeviceNetworkType>;
    private _onEventOccured(isConnected);
    private static _NativeNetworkTypeToDeviceNetworkType(networkType);
}
declare const _default: Network;
export default _default;
