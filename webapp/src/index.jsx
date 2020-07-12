import React from 'react';
import {OBJModel, DAEModel} from 'react-3d-viewer';
import STLViewer from 'stl-viewer';
import ReactJson from 'react-json-view';

import {getFileUrl} from 'mattermost-redux/utils/file_utils';

import manifest from './manifest';

class JSONViewer extends React.Component {
    constructor() {
        super();
        this.state = {
            json: '',
        };
    }
    componentDidMount() {
        this.loadJson(this.props.url);
    }

    loadJson = async (url) => {
        const response = await fetch(url, {headers: {'Content-Type': 'application/json'}});
        const data = await response.json();
        this.setState({json: data});
    }

    render() {
        return (
            <div style={{background: 'white', minWidth: 640, minHeight: 640, textAlign: 'left', padding: 15}}>
                {this.state.json && <ReactJson src={this.state.json}/>}
                {!this.state.json && 'Loading'}
            </div>
        );
    }
}

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
        registry.registerFilePreviewComponent(
            (fileInfo) => fileInfo && fileInfo.extension && fileInfo.extension === 'obj',
            (props) => (
                <OBJModel
                    src={props.fileInfo.link || getFileUrl(props.fileInfo.id)}
                    texPath=''
                />
            )
        );
        registry.registerFilePreviewComponent(
            (fileInfo) => fileInfo && fileInfo.extension && fileInfo.extension === 'dae',
            (props) => (<DAEModel src={props.fileInfo.link || getFileUrl(props.fileInfo.id)}/>)
        );
        registry.registerFilePreviewComponent(
            (fileInfo) => fileInfo && fileInfo.extension && fileInfo.extension === 'json',
            (props) => (<JSONViewer url={props.fileInfo.link || getFileUrl(props.fileInfo.id)}/>)
        );
    }
}

window.registerPlugin(manifest.id, new Plugin());
