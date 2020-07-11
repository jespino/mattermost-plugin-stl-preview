import manifest from './manifest';
import {getFileUrl} from 'mattermost-redux/utils/file_utils';

import STLViewer from 'stl-viewer';

export default class Plugin {
    // eslint-disable-next-line no-unused-vars
    initialize(registry, store) {
        // @see https://developers.mattermost.com/extend/plugins/webapp/reference/
        registry.registerFilePreviewComponent(
            (fileInfo) => fileInfo && fileInfo.extension && fileInfo.extension === 'stl',
            (props) => (
                <STLViewer
                    model={props.fileInfo.link || getFileUrl(props.fileInfo.id)}
                    rotate={false}
                    width={640}
                    height={640}
                />
            )
        );
    }
}

window.registerPlugin(manifest.id, new Plugin());
