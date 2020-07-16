import React from 'react';
import {OBJModel, DAEModel} from 'react-3d-viewer';
import STLViewer from 'stl-viewer';
import ReactJson from 'react-json-view';
import WaveSurfer from 'wavesurfer.js';
import JSZip from 'jszip';
import {getFileUrl} from 'mattermost-redux/utils/file_utils';
import FileViewer from '@marcioferlan/react-file-viewer';
import Emulator from 'jsnes-web/src/Emulator.js';
import manifest from './manifest.js';
import { saveAs } from 'file-saver';
// import { Document, Page } from 'react-pdf/dist/entry'

function loadBinary(path, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", path);
    req.overrideMimeType("text/plain; charset=x-user-defined");
    
    req.onload = function () {
      if (this.status === 200) {
        if (req.responseText.match(/^<!doctype html>/i)) {
          // Got HTML back, so it is probably falling back to index.html due to 404
          return callback(new Error("Page not found"));
        }
    
        callback(null, this.responseText);
      } else if (this.status === 0) {// Aborted, so ignore error
      } else {
        callback(new Error(req.statusText));
      }
    };
    
    req.onerror = function () {
      callback(new Error(req.statusText));
    };
    
    req.send();
    return req;
}

class MyEmulator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      romData: null,
      error: null
    };
  }

    load = () => {
      loadBinary(this.props.url, (err, data) => {
        if (err) {
          this.setState({
            error: "Error loading ROM: ".concat(err.message)
          });
        } else {
          this.setState({
            romData: data,
            error: null
          });
        }
      });
    }


  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    this.load();
  }

  render() {
    if (!this.state.romData) {
      return null;
    }

    return (
        <Emulator romData={this.state.romData}/>
    );
  }
}

// class MyPdfViewer extends React.Component {
//     constructor(props) {       
//         super(props);
//         this.state = {
//             numPages: null,
//             page: 1,                 
//         }                            
//     }                                               
//     onDocumentLoadSuccess = ({ numPages }) => {
//         this.setState({numPages});                
//     }                                 
                            
//     render() {        
//       return (  
//           <div style={{textAlign: 'center'}}>
//               <Document file={this.props.url} onLoadSuccess={this.onDocumentLoadSuccess}>
//                   <Page pageNumber={this.state.page}/>
//               </Document>     
//               {this.state.numPages && <p>Page {this.state.page} of {this.state.numPages}</p>}
//               <p>
//                   <button disabled={this.state.page === 1} onClick={() => this.setState({page: this.state.page-1})}>Prev</button>    
//                   <button disabled={this.state.page === this.state.numPages} onClick={() => this.setState({page: this.state.page+1})}>Next</button>      
//               </p>                                         
//           </div>                              
//       );                                      
//     }                  
// }
                                                                                                                              


class ZipViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      allPaths: [],
        zip: null,
    };
  }

    loadZip =  () => {
      loadBinary(this.props.url, (err, data) => {
        new JSZip.loadAsync(data, {}).then(zip => {
          this.setState({zip});
          const allPaths = [];
          zip.forEach((relativePath, file) => {
            allPaths.push(relativePath);
          });
          this.setState({
            allPaths
          });
        });
      });
    }

    isDir = item => {
      const splitted = item.split("/");

      if (splitted[splitted.length - 1] === "") {
        return true;
      }

      return false;
    }

    download = item => {
        console.log("DOWNLOADING?")
        this.state.zip.file(item).async('string').then((content) => {
            const splitted = item.split("/");
            console.log("YES; IN THEORY", content, splitted[splitted.length-1])
            saveAs(content, splitted[splitted.length-1])
        });
    }

    toggleCollapse = item => {
      this.setState({
        [item]: !this.state[item]
      });
    }

    renderList = items => {
      const itemsLis = this.state.allPaths.map(item => {
        const splitted = item.split("/");

        if (this.isDir(item)) {
          for (const key of Object.keys(this.state)) {
            if (item.indexOf(key) === 0 && this.state[key] === true && key !== item) {
              return null;
            }
          }

          const itemName = splitted[splitted.length - 2];
          return (
              <li key={item} style={{position: 'relative', cursor: 'pointer', listStyle: 'none', marginLeft: (splitted.length - 2) * 20}} onClick={(e) => this.toggleCollapse(item)}>
                {this.state[item] && <i style={{paddingRight: 5}} className="fa fa-chevron-right" aria-hidden={true}/>}
                {!this.state[item] && <i style={{paddingRight: 5}} className="fa fa-chevron-down" aria-hidden={true}/>}
                <i className="fa fa-folder" style={{paddingRight: 5, color: '#145dbf'}} aria-hidden={true}/> {itemName}
              </li>
          );
        } else {
          for (const key of Object.keys(this.state)) {
            if (item.indexOf(key) === 0 && this.state[key] === true) {
              return null;
            }
          }

          const itemName = splitted[splitted.length - 1];
          return React.createElement("li", {
            key: item,
            onClick: (e) => this.download(item),
            style: {
              cursor: 'pointer',
              listStyle: 'none',
              paddingTop: 3,
              paddingBottom: 3,
              marginLeft: ((splitted.length - 1) * 20)
            }
          }, React.createElement("i", {
            className: "fa fa-file",
            style: {
              paddingRight: 5,
              color: 'rgba(22,109,224,0.2)',
            },
            "aria-hidden": "true"
          }), " ", itemName);
        }
      });
      return React.createElement("ul", {
        style: {
          textAlign: 'left',
          fontSize: 16,
        }
      }, itemsLis);
    }


  componentDidMount() {
    this.loadZip();
  }

  render() {
    return <div style={{paddingTop: 10, paddingBottom: 10, maxWidth: 640, minWidth: 480, maxHeight: 640, minHeight: 480}}>{this.renderList(this.state.allPaths)}</div>;
  }

} // class PdfViewer extends React.Component {
// 	state = {numPages: null, pageNumber: 1};
// 	onDocumentLoadSuccess = ({numPages}) => {
// 		this.setState({numPages});
// 	};
// 	goToPrevPage = () => {
// 		this.setState(state => ({ pageNumber: state.pageNumber - 1 }));
// 	}
// 	goToNextPage = () => {
// 	    this.setState(state => ({ pageNumber: state.pageNumber + 1 }));
// 	}
// 	render() {
// 		const { pageNumber, numPages } = this.state;
// 		return (
// 			<div>
// 				<nav>
// 					<button onClick={this.goToPrevPage}>Prev</button>
// 					<button onClick={this.goToNextPage}>Next</button>
// 				</nav>
// 				<div style={{ width: 600 }}>
// 					<Document
// 						file={this.props.url}
// 						onLoadSuccess={this.onDocumentLoadSuccess}
// 					>
// 						<Page pageNumber={pageNumber} width={600} />
// 					</Document>
// 				</div>
// 				<p>Page {pageNumber} of {numPages}</p>
// 			</div>
// 		);
// 	}
// }


class AudioViewer extends React.Component {
  componentDidMount() {
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'violet',
      progressColor: 'purple',
      closeAudioContext: true,
      mediaControls: true,
      backend: 'MediaElement'
    });
    this.wavesurfer.on('ready', () => {
      this.wavesurfer.play();
    });
    this.wavesurfer.load(this.props.url);
  }

  componentWillUnmount() {
    this.wavesurfer.stop();
  }

  render() {
    return React.createElement("div", {
      id: "waveform"
    });
  }

}

class JSONViewer extends React.Component {
  constructor() {
    super();
    this.state = {
      json: ''
    };
  }

  componentDidMount() {
    this.loadJson(this.props.url);
  }

  loadJson = async url => {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      this.setState({
        json: data
      });
    };

  render() {
    return React.createElement("div", {
      style: {
        background: 'white',
        minWidth: 640,
        minHeight: 640,
        textAlign: 'left',
        padding: 15
      }
    }, this.state.json && React.createElement(ReactJson, {
      src: this.state.json
    }), !this.state.json && 'Loading');
  }

} // function DocViewer(props) {
//     const url = encodeURI(window.location.protocol + '//' + window.location.host + props.url);
//     return (
//         <iframe
//             width="640"
//             height="640"
//             frameborder="0"
//             src={`https://docs.google.com/gview?url=${url}&embedded=true`}
//         />
//     );
// }


class Plugin {
  // eslint-disable-next-line no-unused-vars
  initialize(registry, store) {
    // @see https://developers.mattermost.com/extend/plugins/webapp/reference/
    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && fileInfo.extension === 'stl', props => React.createElement(STLViewer, {
      model: props.fileInfo.link || getFileUrl(props.fileInfo.id),
      rotate: false,
      width: 640,
      height: 640
    }));
    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && fileInfo.extension === 'obj', props => React.createElement(OBJModel, {
      src: props.fileInfo.link || getFileUrl(props.fileInfo.id),
      texPath: ""
    }));
    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && fileInfo.extension === 'dae', props => React.createElement(DAEModel, {
      src: props.fileInfo.link || getFileUrl(props.fileInfo.id)
    }));
    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && fileInfo.extension === 'json', props => React.createElement(JSONViewer, {
      url: props.fileInfo.link || getFileUrl(props.fileInfo.id)
    }));
    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && fileInfo.extension === 'docx', props => (
        <div style={{textAlign: 'left'}}>
          <FileViewer fileType="docx" filePath={props.fileInfo.link || getFileUrl(props.fileInfo.id)}/>
        </div>
    )); // registry.registerFilePreviewComponent(
    //     (fileInfo) => fileInfo && fileInfo.extension && fileInfo.extension === 'docx',
    //     (props) => {
    //         console.log(props.fileInfo);
    //         return (
    //             <DocViewer
    //                 url={props.fileInfo.link || getFileUrl(props.fileInfo.id)}
    //             />
    //         );
    //     }
    // );
    // registry.registerFilePreviewComponent(
    //     (fileInfo) => fileInfo && fileInfo.extension && fileInfo.extension === 'pdf',
    //     (props) => {
    //         return (
    //             <Document
    //                 file={props.fileInfo.link || getFileUrl(props.fileInfo.id)}
    //             />
    //         );
    //     }
    // );
    // registry.registerFilePreviewComponent(
    //     (fileInfo) => fileInfo && fileInfo.extension && fileInfo.extension === 'pdf',
    //     (props) => {
    //         return (
    //             <MyPdfViewer url={props.fileInfo.link || getFileUrl(props.fileInfo.id)}/>
    //         );
    //     }
    // );

    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && (fileInfo.extension === 'mp3' || fileInfo.extension === 'ogg' || fileInfo.extension === 'wav'), props => {
      return React.createElement(AudioViewer, {
        url: props.fileInfo.link || getFileUrl(props.fileInfo.id)
      });
    });
    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && fileInfo.extension === 'nes', props => {
      return React.createElement("div", {
        style: {
          height: 480,
          width: 512
        }
      }, React.createElement(MyEmulator, {
        url: props.fileInfo.link || getFileUrl(props.fileInfo.id)
      }));
    });
    registry.registerFilePreviewComponent(fileInfo => fileInfo && fileInfo.extension && fileInfo.extension === 'zip', props => {
      return React.createElement(ZipViewer, {
        url: props.fileInfo.link || getFileUrl(props.fileInfo.id)
      });
    });
  }

}
window.registerPlugin(manifest.id, new Plugin());
