import React from 'react';
import ButtonBar from '../../../../js/components/interface/buttonBar/ButtonBar';
var d3 = require('d3');
var Rnd = require('react-rnd').default;

export default function ModelButtons(props) {
    var modelButtonsConfig = require('../../components/configuration/modelButtonsConfig').modelButtonsConfig;
    var getNodeCustomColormap = function () {
            var cells = GEPPETTO.ModelFactory.getAllInstancesOf(
                GEPPETTO.ModelFactory.getAllTypesOfType(GEPPETTO.ModelFactory.geppettoModel.neuroml.network)[0])[0].getChildren();
            var domain = [];
            var range = [];
            for (var i=0; i<cells.length; ++i) {
                if (cells[i].getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE)
                    domain.push(cells[i].getName());
                else
                    domain.push(cells[i].getPath());
                // FIXME: getColor function should exist here but this has occasionally broken
                if (typeof cells[i].getColor === 'function')
                    range.push(cells[i].getColor());
                else
                    range.push(GEPPETTO.Resources.COLORS.DEFAULT);
            }
            // if everything is default color, use a d3 provided palette as range
            if (range.filter(function(x) { return x!==GEPPETTO.Resources.COLORS.DEFAULT; }).length == 0)
                return d3.scaleOrdinal(d3.schemeCategory20).domain(domain);
            else
                return d3.scaleOrdinal(range).domain(domain);
        };
    var buttonBarHandler = function(buttonState) {
        switch (buttonState) {
        case 'Connectivity':
            var instance = GEPPETTO.ModelFactory.getAllInstancesOfType(Model.neuroml.network)[0];
            if ((Model.neuroml.importTypes.length == 0) && (typeof Model.neuroml.connection === 'undefined')) {
                GEPPETTO.ModalFactory.infoDialog("No connections present in this model.", "");
            } else {
                Model.neuroml.resolveAllImportTypes(function(){
                    $(".osb-notification-text").html(Model.neuroml.importTypes.length + " projections and " + Model.neuroml.connection.getVariableReferences().length + " connections were successfully loaded.");
                    if (GEPPETTO.ModelFactory.geppettoModel.neuroml.projection == undefined) {
                        G.addWidget(1, {isStateless: true}).then(w => w.setMessage('No connection found in this network').setName('Warning Message'));
                    } else {
                        G.addWidget(6).then(w =>
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
                                                colorMapFunction: getNodeCustomColormap
                                            }, getNodeCustomColormap())
                                            .setName('Connectivity Widget on network ' + instance.getId())
                                            .configViaGUI()
                                           );
                    }
                });
            }
            break;
        case 'Model Description':
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
            break;
        }
    }

    return (
        <Rnd enableResizing={{
            top: false, right: false, bottom: false,
            left: false, topRight: false, bottomRight: false,
            bottomLeft: false, topLeft: false}}
        default={{x: props.x, y: props.y, height: 35, width: 340}}
        className="modelButtons"
        disableDragging={true}
        maxHeight={35} minHeight={35}
        maxWidth={350} minWidth={150}>
            <ButtonBar id="ButtonBarContainer"
             configuration={modelButtonsConfig}
             buttonBarHandler={buttonBarHandler} />
        </Rnd>
    )
}
