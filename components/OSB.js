import React, { Component } from 'react';

import Logo from 'geppetto-client/js/components/interface/logo/Logo';
// import PlotComponent from 'geppetto-client/js/components/interface/plot/PlotComponent';
import Canvas from 'geppetto-client/js/components/interface/3dCanvas/Canvas';
import Button from 'geppetto-client/js/components/controls/button/Button';
import Console from 'geppetto-client/js/components/interface/console/Console';
import Spotlight from 'geppetto-client/js/components/interface/spotlight/spotlight';
import MenuButton from 'geppetto-client/js/components/controls/menuButton/MenuButton';
import HomeControl from 'geppetto-client/js/components/interface/home/HomeControl';
import SaveControl from 'geppetto-client/js/components/interface/save/SaveControl';
import TabbedDrawer from 'geppetto-client/js/components/interface/drawer/TabbedDrawer';
import ControlPanel from 'geppetto-client/js/components/interface/controlPanel/controlpanel';
import ExperimentsTable from 'geppetto-client/js/components/interface/experimentsTable/ExperimentsTable';
import SimulationControls from 'geppetto-client/js/components/interface/simulationControls/ExperimentControls';
import ForegroundControls from 'geppetto-client/js/components/interface/foregroundControls/ForegroundControls';
import Menu from 'geppetto-client/js/components/interface/menu/Menu';

// import Plot from './interface/Plot';
import Colorbar from './interface/Colorbar';
import ModelButtons from './interface/ModelButtons';
import TutorialWidget from './interface/TutorialWidget';
import ProtocolResultsWidget from './interface/ProtocolResultsWidget';
import ProjectionsDialog from './interface/ProjectionsDialog';

require('../css/OSB.less');

// var $ = require('jquery');
var GEPPETTO = require('geppetto');
var Bloodhound = require("typeahead.js/dist/bloodhound.min.js");
var networkControlPanel = require('../osbNetworkControlPanel.json');
var Utilities = require('../utilities');
var WidgetCapability = require('../geppetto-client/js/components/widgets/WidgetCapability.js');


var menuConfiguration = {
  global: {
    subMenuOpenOnHover: true,
    menuOpenOnClick: true,
    menuPadding: 2,
    fontFamily: "Khan",
    menuFontSize: "14",
    subMenuFontSize: "12"
  },
  buttons: [
    {
      label: "Virtual Fly Brain",
      icon: "",
      action: "",
      position: "bottom-start",
      list: [
        {
          label: "About",
          icon: "",
          action: {
            handlerAction: "clickAbout",
            parameters: []
          }
        },
        {
          label: "Contribute",
          icon: "",
          action: {
            handlerAction: "clickContribute",
            parameters: []
          }
        },
        {
          label: "Feedback",
          icon: "",
          action: {
            handlerAction: "clickFeedback",
            parameters: []
          }
        },
        {
          label: "Social media",
          icon: "",
          position: "right-start",
          action: {
            handlerAction: "submenu",
            parameters: ["undefinedAction"]
          },
          list: [
            {
              label: "Twitter",
              icon: "fa fa-twitter",
              action: {
                handlerAction: "openNewTab",
                parameters: ["http://twitter.com/virtualflybrain"]
              }
            },
            {
              label: "Facebook",
              icon: "fa fa-facebook",
              action: {
                handlerAction: "openNewTab",
                parameters: ["https://www.facebook.com/pages/Virtual-Fly-Brain/131151036987118"]
              }
            },
            {
              label: "Blog",
              icon: "",
              action: {
                handlerAction: "openNewTab",
                parameters: ["https://virtualflybrain.tumblr.com/"]
              }
            },
            {
              label: "Rss",
              icon: "fa fa-rss",
              action: {
                handlerAction: "openNewTab",
                parameters: ["http://blog.virtualflybrain.org/rss"]
              }
            }
          ]
        }
      ]
    },
    {
      label: "Tools",
      icon: "",
      action: "",
      position: "bottom-start",
      list: [
        {
          label: "Search",
          icon: "fa fa-search",
          action: {
            handlerAction: "UIElementHandler",
            parameters: ["spotlightVisible"]
          }
        },
        {
          label: "Query",
          icon: "fa fa-quora",
          action: {
            handlerAction: "UIElementHandler",
            parameters: ["queryBuilderVisible"]
          }
        },
        {
          label: "Layers",
          icon: "fa fa-list",
          action: {
            handlerAction: "UIElementHandler",
            parameters: ["controlPanelVisible"]
          }
        },
        {
          label: "Term Info",
          icon: "fa fa-info",
          action: {
            handlerAction: "UIElementHandler",
            parameters: ["termInfoVisible"]
          }
        },
        {
          label: "3D Viewer",
          icon: "fa fa-cube",
          action: {
            handlerAction: "UIElementHandler",
            parameters: ["canvasVisible"]
          }
        },
        {
          label: "Slice Viewer",
          icon: "fa fa-sliders",
          action: {
            handlerAction: "UIElementHandler",
            parameters: ["sliceViewerVisible"]
          }
        }
      ]
    },
    {
      label: "History",
      icon: "",
      action: "",
      position: "bottom-start",
      dynamicListInjector: {
        handlerAction: "historyMenuInjector",
        parameters: ["undefined"]
      },
      list: []
    },
    {
      label: "Templates",
      icon: "",
      action: "",
      position: "bottom-start",
      list: [
        {
          label: "Adult",
          position: "right-start",
          action: {
            handlerAction: "submenu",
            parameters: ["undefinedAction"]
          },
          list: [
            {
              label: "Adult Brain (JFRC2)",
              icon: "",
              action: {
                handlerAction: "openNewTab",
                parameters: ["/org.geppetto.frontend/geppetto?i=VFB_00017894"]
              }
            },
            {
              label: "Adult VNS",
              icon: "",
              action: {
                handlerAction: "openNewTab",
                parameters: ["/org.geppetto.frontend/geppetto?i=VFB_00100000"]
              }
            },
            {
              label: "Ito Half Brain",
              icon: "",
              action: {
                handlerAction: "openNewTab",
                parameters: ["/org.geppetto.frontend/geppetto?i=VFB_00030786"]
              }
            }
          ]
        },
        {
          label: "Larval",
          icon: "",
          position: "right-start",
          action: {
            handlerAction: "submenu",
            parameters: ["undefinedAction"]
          },
          list: [
            {
              label: "L1 CNS (ssTEM)",
              icon: "",
              action: {
                handlerAction: "openNewTab",
                parameters: ["/org.geppetto.frontend/geppetto?i=VFB_00050000"]
              }
            },
            {
              label: "L3 CNS (Wood2018)",
              icon: "",
              action: {
                handlerAction: "openNewTab",
                parameters: ["/org.geppetto.frontend/geppetto?i=VFB_00049000"]
              }
            }
          ]
        }
      ]
    },
    {
      label: "Help",
      icon: "",
      action: "",
      position: "bottom-start",
      list: [
        {
          label: "Start Tutorial",
          icon: "",
          action: {
            handlerAction: "UIElementHandler",
            parameters: ["tutorialWidgetVisible"]
          }
        },
        {
          label: "F.A.Q.",
          icon: "",
          action: {
            handlerAction: "openNewTab",
            parameters: ["http://www.virtualflybrain.org/site/vfb_site/faq.htm"]
          }
        },
        {
          label: "Support Forum",
          icon: "",
          action: {
            handlerAction: "openNewTab",
            parameters: ["https://groups.google.com/forum/#!forum/vfb-suport"]
          }
        },
        {
          label: "Report an issue",
          icon: "",
          action: {
            handlerAction: "clickFeedback",
            parameters: []
          }
        }
      ]
    }
  ]
};


export default class OSB extends React.Component {
  constructor (props) {
    super(props);
    this.spotlightConfig = require('../components/configuration/spotlightConfig').spotlightConfig;
    this.downloadProjectButtonConfig = require('../components/configuration/downloadProjectButtonConfig').downloadProjectButtonConfig;
    this.runMenuConfig = require('../components/configuration/runMenuConfig').runMenuConfig;
    this.runMenuHandler = require('../components/configuration/runMenuConfig').runMenuHandler;
    this.toggleRunMenuOptions = require('../components/configuration/runMenuConfig').toggleRunMenuOptions;
    this.resultsMenuConfig = require('../components/configuration/resultsMenuConfig').resultsMenuConfig;
    this.resultsMenuHandler = require('../components/configuration/resultsMenuConfig').resultsMenuHandler;
    this.toggleResultsMenuOptions = require('../components/configuration/resultsMenuConfig').toggleResultsMenuOptions;
    this.state = { protocolWidgetVisible: true, ca_colouring: false };
    this.closeHandler = this.closeHandler.bind(this);
    this.resultsMenu = React.createRef();
    window.initOSBGeppetto = function () {} ;
  }
  componentWillUnmount () {
    console.log("unmounting");
  }

  addSpotlightSuggestions (spotlightRef) {
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

    // FIXME
    /*
     * spotlightRef.addSuggestion(recordSoma, GEPPETTO.Resources.RUN_FLOW);
     * spotlightRef.addSuggestion(recordAll, GEPPETTO.Resources.RUN_FLOW);
     * spotlightRef.addSuggestion(lightUpSample, GEPPETTO.Resources.PLAY_FLOW);
     * // ADD the capital V one (cf. PR #282 on geppetto-osb)
     * spotlightRef.addSuggestion(spotlightRef.plotSample, GEPPETTO.Resources.PLAY_FLOW);
     */

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

      // FIXME
      /*
       * spotlightRef.addSuggestion(caSuggestion, GEPPETTO.Resources.RUN_FLOW);
       * spotlightRef.addSuggestion(caSomaSuggestion, GEPPETTO.Resources.RUN_FLOW);
       */
    }
    var rateVars = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.r');
    if (rateVars.length > 0) {
      var rateSuggestion = {
        "label": "Record all rates for neural masses",
        "actions": ["var instances=Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.r')); GEPPETTO.ExperimentsController.watchVariables(instances,true);"],
        "icon": "fa-dot-circle-o"
      };

      /*
       * FIXME
       * spotlightRef.addSuggestion(rateSuggestion, GEPPETTO.Resources.RUN_FLOW);
       */
    }
  }

  componentDidMount () {
    GEPPETTO.G.setIdleTimeOut(-1);
    GEPPETTO.SceneController.setLinesThreshold(20000);
    GEPPETTO.MessageSocket.send("get_dropbox_token");
    GEPPETTO.Spinner.setLogo("gpt-osb");

    GEPPETTO.UnitsController.addUnit("V","Membrane potential");
    GEPPETTO.UnitsController.addUnit("mol_per_m3","Concentration");
    GEPPETTO.UnitsController.addUnit("S / m2","Conductance density");
    GEPPETTO.UnitsController.addUnit("A / m2","Current density");

    this.osbCanvas.displayAllInstances();
    this.controlpanel.setDataFilter(function (entities) {
      return entities;
    });

    /*
     * status indicator for experiments drawer button, this remains hacky
     * $(".tabButton .fa-flask").before('<div class="circle small-expt-indicator" data-status="DESIGN" title="" rel="tooltip"></div>');
     */

    GEPPETTO.on(GEPPETTO.Events.Model_loaded, function () {
      if (Model.neuroml != undefined && Model.neuroml.importTypes != undefined && Model.neuroml.importTypes.length > 0) {
        this.projectionsDialog.setState({ show: true, msg: Model.neuroml.importTypes.length + ' projections in this model have not been loaded yet. ' });
      }

      this.addSpotlightSuggestions(this.spotlight);

      if ((Model.neuroml.importTypes.length == 0) && (typeof Model.neuroml.connection === 'undefined')) {
        var aa = 1;
      }
      // this.modelButtons.hideConnectivityButton();
    }.bind(this));
        
    var that = this;
    GEPPETTO.on(GEPPETTO.Events.Experiment_loaded, (function () {
      // update results menu with appropriate options (ca highlighting etc.)
      this.toggleResultsMenuOptions(this.resultsMenu)();
      this.toggleRunMenuOptions(this.runMenu);
    }).bind(this));

    // update results menu with appropriate options (ca highlighting etc.)
    GEPPETTO.on(GEPPETTO.Events.Experiment_completed, this.toggleResultsMenuOptions(this.resultsMenu));
  }


  loadConnections (cb) {
    return function (e) {
      if (e) {
        e.preventDefault();
      }
      Model.neuroml.resolveAllImportTypes(function () {
        if (cb) {
          cb();
        }
        this.projectionsDialog.setState({
          msg: window.Model.neuroml.importTypes.length
                       + " projections and "
                       + window.Model.neuroml.connection.getVariableReferences().length
                       + " connections were successfully loaded.",
          loadLink: false 
        });
      }.bind(this));
    }.bind(this);
  }
  closeHandler () {
    if (this.state.protocolWidgetVisible == true) {
      this.setState({ protocolWidgetVisible: false });
    }
  }

  render () {
    // let protocolWidgetRender = this.state.protocolWidgetVisible ? <ProtocolResultsWidget ref="protocolResults" closeHandler={this.closeHandler} /> : null;
    return (
      <div style={{ height: '100%', width: '100%' }}>
        <Logo logo='gpt-osb' id="geppettologo"/>
        <div id="sim">
          <Canvas id="CanvasContainer" name="Canvas" ref={ref => this.osbCanvas = ref} />
        </div>

        <ModelButtons ref={ref => this.modelButtons = ref} x={90} y={10} loadConnections={this.loadConnections.bind(this)} />
          
        {/* <div style={{position: 'fixed', top: '100px'}}><Menu configuration={menuConfiguration} menuHandler={this.menuHandler2} /></div>*/}

        <SaveControl />
        <Button configuration={this.downloadProjectButtonConfig} />
        <HomeControl />
        <SimulationControls ref={ref => this.runMenu = ref} onClickHandler={this.runMenuHandler.bind(this)} runConfiguration={this.runMenuConfig} />
        <MenuButton ref={ref => this.resultsMenu = ref} onClickHandler={this.resultsMenuHandler.bind(this)} configuration={this.resultsMenuConfig} />
        <ForegroundControls />

        {/* <TutorialWidget ref={ref => this.tutorialWidget = ref} />*/}
            
        <div id="controlpanel">
          <ControlPanel ref={ref => this.controlpanel = ref} icon="styles.Modal" enableInfiniteScroll={true} useBuiltInFilters={true} />
        </div>
        <div id="spotlight" style={{ top: 0 }}>
          <Spotlight ref={ref => this.spotlight = ref} indexInstances={true} />
        </div>

        <Colorbar ref={ref => this.colorbar = ref} />
        {/* protocolWidgetRender*/}
        {/* <ProtocolResultsWidget ref="protocolResults" />*/}
        <ProjectionsDialog ref={ref => this.projectionsDialog = ref} loadConnections={this.loadConnections()} />
        {/* <ModelDescriptionWidget ref="modelDesc" hidden={true} />*/}

        <div id="footerHeader">
          <TabbedDrawer ref={ref => this.tabbedDraw = ref} children={[Console, ExperimentsTable]} labels={["Console", "Experiments"]} iconClass={["fa fa-terminal", "fa fa-flask"]} />
        </div>
      </div>
    )
  }
}
