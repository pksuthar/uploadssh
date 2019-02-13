import RX = require('../common/Interfaces');
import Types = require('../common/Types');
export declare class WebView extends RX.ViewBase<Types.WebViewProps, {}> {
    render(): JSX.Element;
    reload(): void;
    goBack(): void;
    goForward(): void;
}
export default WebView;
