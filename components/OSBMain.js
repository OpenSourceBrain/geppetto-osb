import React, { Component } from 'react';

import Logo from '../../../js/components/interface/logo/Logo';
import Canvas from '../../../js/components/interface/3dCanvas/Canvas';
import Button from '../../../js/components/controls/button/Button';
import Console from '../../../js/components/interface/console/Console';
import Spotlight from '../../../js/components/interface/spotlight/spotlight';
import MenuButton from '../../../js/components/controls/menuButton/MenuButton';
import HomeControl from '../../../js/components/interface/home/HomeControl';
import SaveControl from '../../../js/components/interface/save/SaveControl';
import TabbedDrawer from '../../../js/components/interface/drawer/TabbedDrawer';
import ControlPanel from '../../../js/components/interface/controlPanel/controlpanel';
import ExperimentsTable from '../../../js/components/interface/experimentsTable/ExperimentsTable';
import SimulationControls from '../../../js/components/interface/simulationControls/ExperimentControls';
import ForegroundControls from '../../../js/components/interface/foregroundControls/ForegroundControls';

import ModelButtons from './interface/ModelButtons';
import TutorialWidget from './interface/TutorialWidget';
import ProjectionsDialog from './interface/ProjectionsDialog';

require('../css/OSB.less');

var $ = require('jquery');
var GEPPETTO = require('geppetto');
var Bloodhound = require("typeahead.js/dist/bloodhound.min.js");
var networkControlPanel = require('../osbNetworkControlPanel.json');
var colorbar = require('../colorbar');
var activity = require('../activity');
var Utilities = require('../utilities');

export default class OSBMain extends React.Component {
    constructor(props) {
        super(props);
        this.spotlightConfig = require('../components/configuration/spotlightConfig').spotlightConfig;
        this.downloadProjectButtonConfig = require('../components/configuration/downloadProjectButtonConfig').downloadProjectButtonConfig;
        this.runMenuConfig = require('../components/configuration/runMenuConfig').runMenuConfig;
        this.toggleRunMenuOptions = require('../components/configuration/runMenuConfig').toggleRunMenuOptions;
        this.resultsMenuConfig = require('../components/configuration/resultsMenuConfig').resultsMenuConfig;
        this.toggleResultsMenuOptions = require('../components/configuration/resultsMenuConfig').toggleResultsMenuOptions;
        this.state = { ca_colouring: false };
    }

    addSpotlightSuggestions(spotlightRef) {
        var recordAll = {
            "label": "Record all membrane potentials",
            "actions": [
                // without setTimeout, this will hang when n instances large
                "setTimeout(function(){var instances = Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')); GEPPETTO.ExperimentsController.watchVariables(instances,true);},250);"
            ],
            "icon": "fa-dot-circle-o"
        };

        var recordSoma = {
            "label": "Record all membrane potentials at soma",
            "actions": [
                "var instances=window.getSomaVariableInstances('v'); GEPPETTO.ExperimentsController.watchVariables(instances,true);"
            ],
            "icon": "fa-dot-circle-o"
        };

        var lightUpSample = {
            "label": "Link morphology colour to recorded membrane potentials",
            "actions": [
                "GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);"
            ],
            "icon": "fa-lightbulb-o"
        };

        spotlightRef.addSuggestion(recordSoma, GEPPETTO.Resources.RUN_FLOW);
        spotlightRef.addSuggestion(recordAll, GEPPETTO.Resources.RUN_FLOW);
        spotlightRef.addSuggestion(lightUpSample, GEPPETTO.Resources.PLAY_FLOW);
        spotlightRef.addSuggestion(spotlightRef.plotSample, GEPPETTO.Resources.PLAY_FLOW);

        var caVars = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.caConc');
        if (caVars.length > 0) {
            var caSuggestion = {
                "label": "Record Ca2+ concentrations",
                "actions": ["var instances=Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.caConc')); GEPPETTO.ExperimentsController.watchVariables(instances,true);"],
                "icon": "fa-dot-circle-o"
            };
            var caSomaSuggestion = {
                "label": "Record Ca2+ concentrations at soma",
                "actions": ["var instances=window.getSomaVariableInstances('caConc'); GEPPETTO.ExperimentsController.watchVariables(instances,true);"],
                "icon": "fa-dot-circle-o"
            };

            spotlightRef.addSuggestion(caSuggestion, GEPPETTO.Resources.RUN_FLOW);
            spotlightRef.addSuggestion(caSomaSuggestion, GEPPETTO.Resources.RUN_FLOW);
        }
        var rateVars = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.r');
        if (rateVars.length > 0) {
            var rateSuggestion = {
                "label": "Record all rates for neural masses",
                "actions": ["var instances=Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.r')); GEPPETTO.ExperimentsController.watchVariables(instances,true);"],
                "icon": "fa-dot-circle-o"
            };

            spotlightRef.addSuggestion(rateSuggestion, GEPPETTO.Resources.RUN_FLOW);
        }
    }

    componentDidMount() {
        GEPPETTO.G.setIdleTimeOut(-1);
        GEPPETTO.SceneController.setLinesThreshold(20000);
        GEPPETTO.MessageSocket.send("get_dropbox_token");
        GEPPETTO.Spinner.setLogo("gpt-osb");

        GEPPETTO.UnitsController.addUnit("V","Membrane potential");
        GEPPETTO.UnitsController.addUnit("mol_per_m3","Concentration");
        GEPPETTO.UnitsController.addUnit("S / m2","Conductance density");
        GEPPETTO.UnitsController.addUnit("A / m2","Current density");

        this.refs.osbCanvas.displayAllInstances();
        this.refs.controlpanelRef.setDataFilter(function (entities) {
            return entities;
        });

        // status indicator for experiments drawer button, this remains hacky
        $(".tabButton .fa-flask").before('<div class="circle small-expt-indicator" data-status="DESIGN" title="" rel="tooltip"></div>');

        GEPPETTO.on(GEPPETTO.Events.Model_loaded, function() {
            if (Model.neuroml != undefined && Model.neuroml.importTypes != undefined && Model.neuroml.importTypes.length > 0)
                this.refs.projectionsDialogRef.setState({show: true, msg: Model.neuroml.importTypes.length + ' projections in this model have not been loaded yet. '});

            this.addSpotlightSuggestions(this.refs.spotlightRef);
        }.bind(this));

        GEPPETTO.on(GEPPETTO.Events.Experiment_loaded, function() {
            // update results menu with appropriate options (ca highlighting etc.)
            this.toggleResultsMenuOptions(this.refs.resultsMenuRef)();
            this.toggleRunMenuOptions(this.refs.runMenuRef);
        }.bind(this));

        // update results menu with appropriate options (ca highlighting etc.)
        GEPPETTO.on(GEPPETTO.Events.Experiment_completed, this.toggleResultsMenuOptions(this.refs.resultsMenuRef));
    }

    render() {
        return (
            <div style={{height: '100%', width: '100%'}}>
              <Logo logo='gpt-osb' id="geppettologo"/>
              <div id="sim">
                <Canvas id="CanvasContainer" name="Canvas" ref="osbCanvas" />
              </div>

              <ModelButtons x={90} y={10} />

              <SaveControl />
              <Button configuration={this.downloadProjectButtonConfig} />
              <HomeControl />
              <SimulationControls ref="runMenuRef" runConfiguration={this.runMenuConfig} />
              <MenuButton ref="resultsMenuRef" configuration={this.resultsMenuConfig} />
              <ForegroundControls />

              <TutorialWidget ref="tutorialWidgetRef" />

              <div id="controlpanel">
                <ControlPanel ref="controlpanelRef" icon="styles.Modal" enableInfiniteScroll={true} useBuiltInFilters={true} />
              </div>
              <div id="spotlight" style={{top: 0}}>
                <Spotlight ref="spotlightRef" indexInstances={true} />
              </div>

              <ProjectionsDialog ref="projectionsDialogRef" />

              <div id="footerHeader">
                <TabbedDrawer ref="tabbedDrawRef" children={[Console, ExperimentsTable]} labels={["Console", "Experiments"]} iconClass={["fa fa-terminal", "fa fa-flask"]} />
              </div>
            </div>
        )
    }
}
