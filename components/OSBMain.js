import React, { Component } from 'react';
import Logo from '../../../js/components/interface/logo/Logo';
import Canvas from '../../../js/components/interface/3dCanvas/Canvas';
import Console from '../../../js/components/interface/console/Console';
import SaveControl from '../../../js/components/interface/save/SaveControl';
import ButtonBar from '../../../js/components/interface/buttonBar/ButtonBar';
import SpotLight from '../../../js/components/interface/spotlight/spotlight';
import TabbedDrawer from '../../../js/components/interface/drawer/TabbedDrawer';
import ControlPanel from '../../../js/components/interface/controlPanel/controlpanel';
import ExperimentsTable from '../../../js/components/interface/experimentsTable/ExperimentsTable';

require('../css/OSB.css');

//var $ = require('jquery');
//var GEPPETTO = require('geppetto');
var Rnd = require('react-rnd').default;
var Bloodhound = require("typeahead.js/dist/bloodhound.min.js");
var networkControlPanel = require('../osbNetworkControlPanel.json');

export default class OSBMain extends React.Component {
    constructor(props) {
        super(props);
        this.modelButtonsConfig = require('../components/configuration/modelButtonsConfig').modelButtonsConfig;
        this.downloadProjectButtonConfig = require('../components/configuration/downloadProjectButtonConfig').downloadProjectButtonConfig;
    }

    componentWillMount() {

    }

    componentWillUnMount() {
    }

    componentDidMount() {
        GEPPETTO.G.setIdleTimeOut(-1);
        GEPPETTO.SceneController.setLinesThreshold(20000);
        GEPPETTO.G.autoFocusConsole(false);
        GEPPETTO.UnitsController.addUnit("V","Membrane potential");
        GEPPETTO.UnitsController.addUnit("mol_per_m3","Concentration");
        GEPPETTO.UnitsController.addUnit("S / m2","Conductance density");
        GEPPETTO.UnitsController.addUnit("A / m2","Current density");

        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "geppetto/extensions/geppetto-osb/css/OSB.css";
        document.getElementsByTagName("head")[0].appendChild(link);

        window.initialiseControlPanel = function(barDef, id) {
            var modifiedBarDef = JSON.parse(JSON.stringify(barDef, id).split("$ENTER_ID").join(id.getId()));

            var posX = 90;
            var posY = 5;
            var target = GEPPETTO.ComponentFactory.addWidget('BUTTONBAR', {configuration: modifiedBarDef, isStateless: true},
                                                             function() {
                                                                 ButtonBar1 = this;
                                                                 this.setPosition(posX, posY);
                                                                 this.showTitleBar(false);
                                                                 this.setTransparentBackground(true);
                                                                 this.setResizable(false);
                                                                 this.setMinSize(0, 0);
                                                                 this.setAutoWidth();
                                                                 this.setAutoHeight();
                                                             });
        };

        window.initOSBGeppetto = function(type, id) {
            var model = eval(id);
            switch (type) {
            case "network":
                //window.initialiseControlPanel(networkControlPanel, id);
                break;
            }
        }

        if(this.refs.controlpanelRef !== undefined) {
            this.refs.controlpanelRef.setDataFilter(function (entities) {
                return entities;
            })
        }

        $(".tabButton .fa-flask").before('<div class="circle small-expt-indicator" data-status="DESIGN" title="" rel="tooltip"></div>');

        this.refs.osbCanvas.displayAllInstances();

        var that = this;
        GEPPETTO.on(GEPPETTO.Events.Experiment_loaded, function() {
            window.getPulseGenerators = function() {
                // really we should implement a "getAllPotentialInstancesOfSuperType"
                var potentialInstances = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith(".i");
                var currentInstances = [];
                for (var i=0; i<potentialInstances.length; ++i)
                    try {
                        currentInstances.push(Instances.getInstance(potentialInstances[i]));
                    } catch (e) {
                        break;
                    }
                var pulseGenerators = [];
                if (Model.neuroml.pulseGenerator)
                    pulseGenerators = GEPPETTO.ModelFactory.getAllInstancesOfSuperType(Model.neuroml.pulseGenerator);
                return pulseGenerators;
            }
            var runConfiguration = {
                id: "runMenuButton",
                openByDefault: false,
                closeOnClick: true,
                label: ' Run',
                iconOn: 'fa fa-cogs',
                iconOff: 'fa fa-cogs',
                disableable: false,
                menuPosition: {
                    top: 40,
                    right: 450
                },
                menuSize: {
                    height: "auto",
                    width: "auto"
                },
                menuItems: [{
                    label: "Run active experiment",
                    action: "GEPPETTO.runActiveExperiment();",
                    value: "run_experiment",
                    disabled: false
                }, {
                    label: "Add new experiment",
                    action: "GEPPETTO.addNewExperiment();",
                    value: "add_experiment",
                    disabled: false
                },{
                    label: "Add & run protocol",
                    action: "GEPPETTO.showAddProtocolDialog();",
                    value: "add_protocol",
                    disabled: false
                }]
            };
            if (!GEPPETTO.UserController.hasWritePermissions() && !GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT))
                runConfiguration.menuItems.push({
                    label: "Sign up and log in to run experiments",
                    action: "top.window.location = 'http://www.opensourcebrain.org/account/register'",
                    value: "add_experiment",
                    disabled: false
                })
            GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {runConfiguration: runConfiguration}, document.getElementById("sim-toolbar"));

            GEPPETTO.ComponentFactory.addComponent('BUTTON', {configuration: that.downloadProjectButtonConfig}, document.getElementById("DownloadProjectButton"));

            GEPPETTO.ComponentFactory.addComponent('FOREGROUND', {}, document.getElementById("foreground-toolbar"));
        });
    }

    render() {
        return (
            <div style={{height: '100%', width: '100%'}}>
              <Logo logo='gpt-osb' id="geppettologo" />
              <Rnd
                enableResizing={{
                    top: false, right: false, bottom: false,
                    left: false, topRight: false, bottomRight: false,
                    bottomLeft: false, topLeft: false}}
                default={{
                    x: 10, y: 10,
                    height: 35, width: 340}}
                className="new-widget"
                disableDragging={true}
                maxHeight={35} minHeight={35}
                maxWidth={350} minWidth={150}
                ref="buttonBarRef">
                <ButtonBar
                  id="ButtonBarContainer"
                  configuration={this.modelButtonConfig}
                  buttonBarHandler={this.buttonBarHandler} />
              </Rnd>
              <div id="sim">
                <Canvas id="CanvasContainer" name={"Canvas"} ref="osbCanvas" />
              </div>

              <div id="controlpanel" style={{top: 0}}>
                <ControlPanel ref="controlpanelRef" icon={"styles.Modal"} enableInfiniteScroll={true} 
                              useBuiltInFilter={true}/>
              </div>

              <div id="footerHeader">
                <TabbedDrawer ref="tabbedDrawRef" children={[Console, ExperimentsTable]} labels={["Console", "Experiments"]} iconClass={["fa fa-terminal", "fa fa-flask"]}/>
              </div>
              
              <div id="sim-toolbar">
              </div>

              <div id="DownloadProjectButton"></div>
              <div id="foreground-toolbar"></div>

            <SaveControl ref="saveControl"/>
            </div>
        )
    }
}
