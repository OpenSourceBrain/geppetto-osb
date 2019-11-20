import React from 'react';
import ButtonBar from 'geppetto-client/js/components/interface/buttonBar/ButtonBar';
import AbstractComponent from 'geppetto-client/js/components/AComponent';

var Rnd = require('react-rnd').default;
var Utilities = require('../../utilities');

//var AbstractComponent = require('../../../../js/components/AComponent');

export default class ModelButtons extends AbstractComponent {

  constructor(props) {
    super(props);
    this.state = {};
    this.state.modelButtonsConfig = require('../../components/configuration/modelButtonsConfig').modelButtonsConfig;
    
    this.buttonBarHandler = function(buttonState) {
      switch (buttonState) {
      case 'Connectivity':
        this.props.loadConnections(this.connectivityCallback)(); 
        break;
      case 'Model Description':
        this.showModelDescription();
        break;
      }
    }.bind(this);
  }

  // FIXME: need to abstract the window.mainPopup nonsense into a widget
  showModelDescription() {
    var model = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.network)[0];
    if (window.mainPopup == undefined || window.mainPopup.destroyed) {
      var customHandler = function(node, path, widget) {
        var n;
        try {
          n = eval(path);
          var metaType = n.getMetaType();
          if (metaType == GEPPETTO.Resources.VARIABLE_NODE) {
            //A plot function inside a channel
            G.addWidget(Widgets.PLOT).then(w => w.plotFunctionNode(n));
          } else if (metaType == GEPPETTO.Resources.VISUAL_GROUP_NODE) {
            //A visual group
            n.show(true);
            Canvas1.viewState.custom.highlight = n.getPath();
            Canvas1.setDirty(true);
          } else if (metaType == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
            //Another composite
            widget.setName('Information for ' + n.getId()).setData(n, [GEPPETTO.Resources.HTML_TYPE])
          }
        } catch (ex) {
          node = undefined;
        }
      };
      G.addWidget(1).then(w => {
        window.mainPopup = w;
        w.setName('Model Description - ' + model.getName()).addCustomNodeHandler(customHandler, 'click').setPosition(95, 140);
        w.showHistoryNavigationBar(true);
        w.setData(model, [GEPPETTO.Resources.HTML_TYPE]);
      });
    } else {
      window.mainPopup.setName('Model Description - ' + model.getName()).addCustomNodeHandler(customHandler, 'click');
      window.mainPopup.setData(model, [GEPPETTO.Resources.HTML_TYPE]);
    }
  }

  connectivityCallback() {
    var network_type = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.network)[0];
    var instance = GEPPETTO.ModelFactory.getAllInstancesOfType(network_type)[0];
    if (GEPPETTO.ModelFactory.geppettoModel.neuroml.projection == undefined) {
      G.addWidget(1, {isStateless: true}).then(w => w.setMessage('No connection found in this network').setName('Warning Message'));
    } else {
      require(['../widgets/connectivity/controllers/ConnectivityController.js'], function(Controller) {
        new Controller().addWidget(6).then(w =>
                          w.setData(instance, {
                            linkType: function(cs, linkCache) {
                              var types = [];
                              for (var c of cs) {
                                if (linkCache[c.getParent().getPath()]) {
                                  types = types.concat(linkCache[c.getParent().getPath()]);
                                  types = Array.from(new Set(types));
                                }
                                else if (GEPPETTO.ModelFactory.geppettoModel.neuroml.synapse != undefined) {
                                  linkCache[c.getParent().getPath()] = [];
                                  var synapseType = GEPPETTO.ModelFactory.getAllVariablesOfType(c.getParent(), GEPPETTO.ModelFactory.geppettoModel.neuroml.synapse)[0];
                                  if (synapseType != undefined) {
                                    linkCache[c.getParent().getPath()].indexOf(synapseType.getId()) === -1 ? linkCache[c.getParent().getPath()].push(synapseType.getId()) : undefined;
                                    types.indexOf(synapseType.getId()) === -1 ? types.push(synapseType.getId()) : undefined;
                                  }
                                }
                              }
                              return types;
                            },
                            library: GEPPETTO.ModelFactory.geppettoModel.neuroml,
                            colorMapFunction: Utilities.getNodeCustomColormap
                          }, Utilities.getNodeCustomColormap())
                          .setName('Connectivity Widget on network ' + instance.getId())
                          .configViaGUI()
                         );
      });
    }
  }

  hideConnectivityButton() {
    var configCopy = Object.assign({}, this.state.modelButtonsConfig);
    configCopy["Connectivity"] = Object.assign(this.state.modelButtonsConfig["Connectivity"], {"hidden": true});
    this.setState({modelButtonsConfig: configCopy});
  }
  
  render() {
    return (
        <Rnd enableResizing={{
          top: false, right: false, bottom: false,
          left: false, topRight: false, bottomRight: false,
          bottomLeft: false, topLeft: false}}
      default={{x: this.props.x, y: this.props.y, height: 35, width: 340}}
      className="modelButtons"
      disableDragging={true}
      maxHeight={35} minHeight={35}
      maxWidth={350} minWidth={150}>
        <ButtonBar id="ButtonBarContainer"
      ref="buttonBarRef"
      configuration={this.state.modelButtonsConfig}
      buttonBarHandler={this.buttonBarHandler} />
        </Rnd>
    )
  }
}
