define(function(require) {

	var cellControlPanel = require('json!../../geppetto-osb/osbCellControlPanel.json');
	var networkControlPanel = require('json!../../geppetto-osb/osbNetworkControlPanel.json');
	var osbTutorial = require('json!../../geppetto-osb/osbTutorial.json');
	
    return function(GEPPETTO) {

        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "geppetto/extensions/geppetto-osb/css/OSB.css";
        document.getElementsByTagName("head")[0].appendChild(link);

        //Loading spinner initialization
        GEPPETTO.Spinner.setLogo("gpt-osb");

        //This function will be called when the run button is clicked
        GEPPETTO.showExecutionDialog = function(callback) {
            var formCallback = callback;

            var formId = "gptForm";

            var formName = "Run experiment";

            var schema = {
                type: "object",
                required: ["experimentName", "timeStep", "length", "simulator", "numberProcessors"],
                properties: {
                    experimentName: {
                        type: "string",
                        title: "Experiment Name"
                    },
                    timeStep: {
                        type: 'number',
                        title: 'Time Step (s)'
                    },
                    length: {
                        type: 'number',
                        title: 'Length (s)'
                    },
                    simulator: {
                        type: "string",
                        title: "Simulator",
                        enum: ["neuronSimulator", "lemsSimulator", "neuronNSGSimulator"],
                        enumNames: ["Neuron", "jLems", "Neuron on NSG"]
                    },

                    numberProcessors: {
                        type: 'number',
                        title: 'Number of Processors'
                    }
                }
            };

            var formData = {
                experimentName: Project.getActiveExperiment().getName(),
                numberProcessors: 1
            };

            if (Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()] != null || undefined) {
                formData['timeStep'] = Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getTimeStep();
                formData['length'] = Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getLength();
                formData['simulator'] = Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getSimulator();
            }

            var submitHandler = function() {
                GEPPETTO.Flows.showSpotlightForRun(formCallback);
                $("#" + formWidget.props.id + "_dialog").remove();
            };

            var errorHandler = function() {

            };

            var changeHandler = function(formObject) {
                for (var key in formObject.formData) {
                    if (formObject.formData[key] != this.formData[key]) {
                        if (key == 'experimentName') {
                            $("#experimentsOutput").find(".activeExperiment").find("td[name='name']").html(formObject.formData[key]).blur();
                        } else if (key == 'timeStep') {
                            $("#experimentsOutput").find(".activeExperiment").find("td[name='timeStep']").html(formObject.formData[key]).blur();
                        } else if (key == 'length') {
                            $("#experimentsOutput").find(".activeExperiment").find("td[name='length']").html(formObject.formData[key]).blur();
                        } else if (key == 'numberProcessors') {
                            Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].setSimulatorParameter('numberProcessors', formObject.formData[key]);
                        } else if (key == 'simulator') {
                            $("#experimentsOutput").find(".activeExperiment").find("td[name='simulatorId']").html(formObject.formData[key]).blur();
                        }
                        this.formData[key] = formObject.formData[key];
                    }
                }
            };

            var formWidget = null;
            
            GEPPETTO.ComponentFactory.addComponent('FORM', {
                id: formId,
                name: formName,
                schema: schema,
                formData: formData,
                submitHandler: submitHandler,
                errorHandler: errorHandler,
                changeHandler: changeHandler
            }, undefined, function(renderedComponent){
            	formWidget=renderedComponent;
        	});
        };

        //Function to add a dialog when run button is pressed
        GEPPETTO.Flows.addCompulsoryAction('GEPPETTO.showExecutionDialog', GEPPETTO.Resources.RUN_FLOW);

        //Logo initialization 
        GEPPETTO.ComponentFactory.addComponent('LOGO', {
            logo: 'gpt-osb'
        }, document.getElementById("geppettologo"));

        //Tutorial component initialization
        GEPPETTO.ComponentFactory.addComponent('TUTORIAL', {
        	tutorialData: osbTutorial
		}, document.getElementById("tutorial"));

        //Save initialization 
        GEPPETTO.ComponentFactory.addComponent('SAVECONTROL', {}, document.getElementById("SaveButton"));

        var toggleClickHandler = function(){
        	if(!window.Project.isPublic()){
        		var title = "Copy URL to Share Public Project"
        		GEPPETTO.FE.infoDialog(title, window.location.href);
        	}
        }
        
        var toggleEventHandler = function(component){
    		GEPPETTO.on(Events.Project_loaded,function(){
    			component.evaluateState();
    		});
    		
    		GEPPETTO.on(Events.Project_made_public,function(){
    			component.evaluateState();
    		});
        }

        var configuration = {
        		id: "PublicProjectButton",
        		hideCondition : "window.Project.isReadOnly()",
        		clickHandler : toggleClickHandler,
        		eventHandler : toggleEventHandler,
        		condition: "window.Project.isPublic()",
        		"false": {
        			"action": "window.Project.makePublic(true)",
        			"icon": "fa fa-share-alt",
        			"label": " Set Public",
        			"tooltip": "This Project is now public"
        		},
        		"true": {
        			"action": "window.Project.makePublic(false)",
        			"icon": "fa fa-share-alt",
        			"label": " Set Private",
        			"tooltip": "This Project is now private"
        		}
        };

        GEPPETTO.ComponentFactory.addComponent('PUBLICPROJECT', {configuration: configuration}, document.getElementById("PublicProject"));

        //Control panel initialization
        GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {
            useBuiltInFilters: true,
            listenToInstanceCreationEvents: false
        }, document.getElementById("controlpanel"), function () {
            // whatever gets passed we keep
            var passThroughDataFilter = function (entities) {
                return entities;
            };

            // set data filter
            GEPPETTO.ControlPanel.setDataFilter(passThroughDataFilter);
        });

        //Spotlight initialization
        GEPPETTO.ComponentFactory.addComponent('SPOTLIGHT', {}, document.getElementById("spotlight"), function() {
            	var recordAll = {
                    "label": "Record all membrane potentials",
                    "actions": [
                        "var instances=Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'));",
                        "GEPPETTO.ExperimentsController.watchVariables(instances,true);"
                    ],
                    "icon": "fa-dot-circle-o"
                };
            	
            	var recordSoma = {
            	        "label": "Record all membrane potentials at soma",
            	        "actions": [
            	            "var instances=window.getMembranePotentialsAtSoma();",
            	            "GEPPETTO.ExperimentsController.watchVariables(instances,true);"
            	        ],
            	        "icon": "fa-dot-circle-o"
            	    };
            	
            	var lightUpSample = {
                    "label": "Link morphology colour to recorded membrane potentials",
                    "actions": [
                        "G.addBrightnessFunctionBulkSimplified(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), function(x){return (x+0.07)/0.1;});"
                    ],
                    "icon": "fa-lightbulb-o"
                };
            	
            	GEPPETTO.Spotlight.addSuggestion(recordSoma, GEPPETTO.Resources.RUN_FLOW);
            	GEPPETTO.Spotlight.addSuggestion(recordAll, GEPPETTO.Resources.RUN_FLOW);
            	GEPPETTO.Spotlight.addSuggestion(lightUpSample, GEPPETTO.Resources.PLAY_FLOW);
            	GEPPETTO.Spotlight.addSuggestion(GEPPETTO.Spotlight.plotSample, GEPPETTO.Resources.PLAY_FLOW);
        });


        window.getRecordedMembranePotentials = function() {
            var instances = Project.getActiveExperiment().getWatchedVariables(true, false);
            var v = [];
            for (var i = 0; i < instances.length; i++) {
                if (instances[i].getInstancePath().endsWith(".v")) {
                    v.push(instances[i]);
                }
            }
            return v;
        };

        //Menu button initialization
        var clickHandler = function(value) {
            //Do Something with value returned
            if (value != null) {
                GEPPETTO.Console.log(value);
            }
        };
        var configuration = {
            id: "controlsMenuButton",
            openByDefault: false,
            closeOnClick: false,
            label: ' Results',
            iconOn: 'fa fa-caret-square-o-up',
            iconOff: 'fa fa-caret-square-o-down',
            menuPosition: {
                top: 40,
                right: 550
            },
            menuSize: null,
            menuItems: [{
                label: "Plot all recorded variables",
                action: "window.plotAllRecordedVariables();",
                value: "plot_recorded_variables"
            }, {
                label: "Play step by step",
                action: "Project.getActiveExperiment().play({step:1});",
                value: "play_speed_1"
            }, {
                label: "Play step by step (10x)",
                action: "Project.getActiveExperiment().play({step:10});",
                value: "play_speed_10"
            }, {
                label: "Play step by step (100x)",
                action: "Project.getActiveExperiment().play({step:100});",
                value: "play_speed_100"
            }, {
                label: "Apply voltage colouring to morphologies",
                condition: "GEPPETTO.G.isBrightnessFunctionSet()",
                value: "apply_voltage",
                false: {
                    action: "G.addBrightnessFunctionBulkSimplified(window.getRecordedMembranePotentials(), function(x){return (x+0.07)/0.1;});"
                },
                true: {
                    action: "G.removeBrightnessFunctionBulkSimplified(window.getRecordedMembranePotentials(),false);"
                }
            }, {
                label: "Show simulation time",
                action: "G.addWidget(5).setName('Simulation time').setVariable(time);",
                value: "simulation_time"
            }]
        };
        GEPPETTO.ComponentFactory.addComponent('CONTROLSMENUBUTTON', { configuration: configuration }, document.getElementById("ControlsMenuButton"));

        //Foreground initialization
        GEPPETTO.ComponentFactory.addComponent('FOREGROUND', {}, document.getElementById("foreground-toolbar"));

        //Experiments table initialization
        GEPPETTO.ComponentFactory.addComponent('EXPERIMENTSTABLE', {}, document.getElementById("experiments"));

        //Home button initialization
        GEPPETTO.ComponentFactory.addComponent('HOME', {}, document.getElementById("HomeButton"));

        //Simulation controls initialization
        GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {}, document.getElementById("sim-toolbar"));

        //Camera controls initialization
        GEPPETTO.ComponentFactory.addComponent('CAMERACONTROLS', {}, document.getElementById("camera-controls"));


        //OSB Geppetto events handling
        GEPPETTO.on(Events.Model_loaded, function() {
            if (Model.neuroml != undefined && Model.neuroml.importTypes != undefined && Model.neuroml.importTypes.length > 0) {
                $('#mainContainer').append('<div class="alert alert-warning osb-notification alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><span class="osb-notification-text">' + Model.neuroml.importTypes.length + ' projections in this model have not been loaded yet. <a href="javascript:loadConnections();" class="alert-link">Click here to load the connections.</a> (Note: depending on the size of the network this could take some time).</span></div>');
            }
        });

        GEPPETTO.on(Events.Project_loading, function() {
            $('.osb-notification').remove();
        });

        GEPPETTO.on(Events.Experiment_loaded, function() {
            // reset control panel with defaults
            GEPPETTO.ControlPanel.clearData();
        });


        //OSB Utility functions
        window.loadConnections = function() {
            Model.neuroml.resolveAllImportTypes(function() {
                $(".osb-notification-text").html(Model.neuroml.importTypes.length + " projections and " + Model.neuroml.connection.getVariableReferences().length + " connections were successfully loaded.");
            });
        };
        
        window.plotAllRecordedVariables = function() {
            Project.getActiveExperiment().playAll();
            var plt = G.addWidget(0).setName('Recorded Variables');
            $.each(Project.getActiveExperiment().getWatchedVariables(true, false),
                function(index, value) {
                    plt.plotData(value)
                });
        };

        window.getMembranePotentialsAtSoma = function() {
            var trail = ".v";
            var instances = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith(trail);
            var instancesToRecord = [];
            for (var i = 0; i < instances.length; i++) {
                var s = instances[i].split(trail)[0];
                if (s.endsWith("_0") || s.endsWith("]")) {
                    instancesToRecord.push(instances[i]);
                }
            }
            return Instances.getInstance(instancesToRecord);
        };


        window.getRecordedMembranePotentials = function() {
            var instances = Project.getActiveExperiment().getWatchedVariables(true, false);
            var v = [];
            for (var i = 0; i < instances.length; i++) {
                if (instances[i].getInstancePath().endsWith(".v")) {
                    v.push(instances[i]);
                }
            }
            return v;
        };

        //OSB Widgets configuration
        
        var widthScreen = this.innerWidth;
        var heightScreen = this.innerHeight;

        var marginLeft = 100;
        var marginTop = 70;
        var marginRight = 10;
        var marginBottom = 50;

        var defaultWidgetWidth = 450;
        var defaultWidgetHeight = 500;

        var mainPopup=undefined;
        
        window.initialiseTreeWidget = function(title, posX, posY, widgetWidth, widgetHeight) {
        	widgetWidth = typeof widgetWidth !== 'undefined' ? widgetWidth : defaultWidgetWidth;
        	widgetHeight = typeof widgetHeight !== 'undefined' ? widgetHeight : defaultWidgetHeight;
        	
        	var tv = G.addWidget(3);
        	tv.setSize(widgetHeight, widgetWidth);
        	tv.setName(title);
        	tv.setPosition(posX, posY);
        	return tv;
        };

        window.initialiseControlPanel = function(barDef, id){
        	var modifiedBarDef = JSON.parse(JSON.stringify(barDef, id).split("$ENTER_ID").join(id.getId()));
        	
        	var posX = 90;
        	var posY = 5;
        	var target = G.addWidget(7).renderBar('OSB Control Panel', modifiedBarDef['OSB Control Panel']);
        	target.setPosition(posX, posY).showTitleBar(false).setTrasparentBackground(true);
        	$("#" + target.id).find(".btn-lg").css("font-size","15px");
        };

        window.showConnectivityMatrix = function(instance){
        	loadConnections();
        	if (GEPPETTO.ModelFactory.geppettoModel.neuroml.projection == undefined){
        		G.addWidget(1).setMessage('No connection found in this network').setName('Warning Message');
        	}else{
        		G.addWidget(6).setData(instance,
        				{linkType:
        					function(c){
        						if (GEPPETTO.ModelFactory.geppettoModel.neuroml.synapse != undefined){
        							var synapseType = GEPPETTO.ModelFactory.getAllVariablesOfType(c.getParent(),GEPPETTO.ModelFactory.geppettoModel.neuroml.synapse)[0];
        							if(synapseType != undefined){
        								return synapseType.getId();
        							}
        						}
        						return c.getName().split("-")[0];
        					}
        				}).setName('Connectivity Widget on network ' + instance.getId()).configViaGUI();
        	}
        };
        
        window.showChannelTreeView = function(csel) {
        	if (GEPPETTO.ModelFactory.geppettoModel.neuroml.ionChannel){
        		var tv = initialiseTreeWidget('Ion Channels on cell ' + csel.getName(), widthScreen - marginLeft - defaultWidgetWidth, marginTop);
        		
        		var ionChannel = GEPPETTO.ModelFactory.getAllTypesOfType(GEPPETTO.ModelFactory.geppettoModel.neuroml.ionChannel);
        		var ionChannelFiltered = [];
        		for (ionChannelIndex in ionChannel){
        			var ionChannelItem = ionChannel[ionChannelIndex];
        			if (ionChannelItem.getId()!='ionChannel'){
        				ionChannelFiltered.push(ionChannelItem);
        			}
        		}
        		tv.setData(ionChannelFiltered);
        	}
        };

        window.showInputTreeView = function(csel) {
        	if (GEPPETTO.ModelFactory.geppettoModel.neuroml.pulseGenerator){
        		var tv = initialiseTreeWidget('Inputs on ' + csel.getId(), widthScreen - marginLeft - defaultWidgetWidth, marginTop);
        		var pulseGenerator = GEPPETTO.ModelFactory.getAllTypesOfType(GEPPETTO.ModelFactory.geppettoModel.neuroml.pulseGenerator);
        		var pulseGeneratorFiltered = [];
        		for (pulseGeneratorIndex in pulseGenerator){
        			var pulseGeneratorItem = pulseGenerator[pulseGeneratorIndex];
        			if (pulseGeneratorItem.getId()!='pulseGenerator'){
        				pulseGeneratorFiltered.push(pulseGeneratorItem);
        			}
        		}
        		tv.setData(pulseGeneratorFiltered);
        	}
        };

        window.showVisualTreeView = function(csel) {
        	var visualWidgetWidth = 350;
        	var visualWidgetHeight = 400;

        	var tv = initialiseTreeWidget('Visual information on cell ' + csel.getName(), widthScreen - marginLeft - visualWidgetWidth, heightScreen - marginBottom - visualWidgetHeight, visualWidgetWidth, visualWidgetHeight);
        	tv.setData(csel.getType().getVisualType(), {
        		expandNodes : true
        	});
        };
        
        //Custom handler for handling clicks inside the popup widget
        var customHandler = function(node, path, widget) {
            var n;
            try {
                n = eval(path);
            } catch (ex) {
                node = undefined;
            }

            var metaType = n.getMetaType();
            if (metaType == GEPPETTO.Resources.VARIABLE_NODE) {
            	//A plot function inside a channel
                G.addWidget(Widgets.PLOT).plotFunctionNode(n);
            } else if (metaType == GEPPETTO.Resources.VISUAL_GROUP_NODE) {
            	//A visual group
                n.show(true);
            } else if (metaType == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
            	//Another composite
                var target = widget;
                if (GEPPETTO.isKeyPressed("meta")) {
                    target = G.addWidget(1).addCustomNodeHandler(customHandler, 'click');
                }
                target.setName('Information for ' + n.getId()).setData(n,[GEPPETTO.Resources.HTML_TYPE]);
           }

        };
        	
        window.showModelDescription = function(model){
        	if(mainPopup==undefined || mainPopup.destroyed){
        		mainPopup=G.addWidget(1).setName('Model Description - ' + model.getName()).addCustomNodeHandler(customHandler, 'click').setPosition(95,140);
        		mainPopup.showHistoryNavigationBar(true);
        	}
        	mainPopup.setData(model,[GEPPETTO.Resources.HTML_TYPE]);	
        };
        
        window.executeOnSelection = function(callback) {
        	if (GEPPETTO.ModelFactory.geppettoModel.neuroml.cell){
        		var csel = G.getSelection()[0];
        		if (typeof csel !== 'undefined') {
        			callback(csel);
        		} else {
        			G.addWidget(1).setMessage('No cell selected! Please select one of the cells and click here for information on its properties.').setName('Warning Message');
        		}
        	}
        };

        window.showSelection = function(csel) {
        	if(mainPopup==undefined || mainPopup.destroyed){
        		mainPopup=G.addWidget(1).addCustomNodeHandler(customHandler, 'click').setPosition(95, 140);
        	}
            mainPopup.setName("Cell Information for " + csel.getType().getId()).setData(csel.getType(),[GEPPETTO.Resources.HTML_TYPE]);
        };
        
        window.getMainType = function(id){
        	return (typeof(id) === 'undefined')?GEPPETTO.ModelFactory.geppettoModel.neuroml[id]:id.getType();
        };

        
        //This is the main function which is called to initialize OSB Geppetto
        window.initOSBGeppetto=function(type,idString){
        	var id=eval(idString);
        	switch(type){
        	case "generic":
        		window.initialiseControlPanel(networkControlPanel, id);
	        	var mdPopupWidth = 350;
	        	var mdPopupHeight = 400;
	        	var elementMargin = 20;
	
	        	var realHeightScreen = heightScreen - marginTop - marginBottom;
	        	var realWidthScreen = widthScreen - marginRight - marginLeft - defaultWidgetWidth - elementMargin;
	
	        	showModelDescription((typeof(id) === 'undefined')?GEPPETTO.ModelFactory.geppettoModel.neuroml[idString]:id.getType());
	
	        	G.setCameraPosition(-60,-250,370);
	        	break;
        	case "cell":
                window.initialiseControlPanel(cellControlPanel, id);
        		id.select();
        		break;
        	case "network":
                window.initialiseControlPanel(networkControlPanel, id);
        		// Check if there is one single cell and select it so that TreeVisualisers work from the beginning 
        		var population = GEPPETTO.ModelFactory.getAllTypesOfType(GEPPETTO.ModelFactory.geppettoModel.neuroml.population);
        		// If there are two cells -> SuperType and cell
        		if (population.length == 2){
        			for (var i = 0; i<population.length; i++){
        				if (typeof population[i].getSize === "function" && population[i].getSize() == 1){
        					population[i].select();
        				}
        			}
        		}
        		break;
        	case "synapse":
        	case "channel":
        		var plotMaxWidth = 450;
        		var plotMinWidth = 250;
        		var plotMaxMinHeight = 200;
        		var elementMargin = 20;

        		var realHeightScreen = heightScreen - marginTop - marginBottom;
        		var realWidthScreen = widthScreen - marginRight - marginLeft - defaultWidgetWidth - elementMargin;

        		var generatePlotForFunctionNodes = function() {
        			// Retrieve function nodes from model tree summary
        			var nodes = GEPPETTO.ModelFactory.getAllVariablesOfMetaType(Model.neuroml[idString], GEPPETTO.Resources.DYNAMICS_TYPE, true);
        			
        			// Create a plot widget for every function node with plot metadata
        			// information

        			// Generate dimensions depending on number of nodes and iframe size
        			var plottableNodes = [];
        			for ( var nodesIndex in nodes) {
        				if (nodes[nodesIndex].getInitialValues()[0].value.dynamics.functionPlot != undefined && !nodes[nodesIndex].getInitialValues()[0].value.dynamics.expression.expression.startsWith('org.neuroml.export.info')) {
        					plottableNodes.push(nodes[nodesIndex]);
        				}
        			}

        			var plotHeight = realHeightScreen / plottableNodes.length;
        			var plotLayout = [];
        			if (plotHeight < plotMaxMinHeight) {
        				var plotHeight = plotMaxMinHeight;
        				var plotWidth = realWidthScreen / 2;
        				if (plotWidth < plotMinWidth) {
        					plotWidth = plotMinWidth;
        				}
        				for ( var plottableNodesIndex in plottableNodes) {
        					if (plottableNodesIndex % 2 == 0) {
        						plotLayout.push({
        							'posX' : widthScreen - plotWidth - marginRight,
        							'posY' : (plotHeight + elementMargin) * Math.floor(plottableNodesIndex / 2) + marginTop
        						});
        					} else {
        						plotLayout.push({
        							'posX' : widthScreen - plotWidth - marginRight - (plotWidth + elementMargin),
        							'posY' : (plotHeight + elementMargin) * Math.floor(plottableNodesIndex / 2) + marginTop
        						});
        					}
        				}
        			} else {
        				var plotHeight = plotMaxMinHeight;
        				var plotWidth = plotMaxWidth;
        				for ( var plottableNodesIndex in plottableNodes) {
        					plotLayout.push({
        						'posX' : widthScreen - plotWidth - marginRight,
        						'posY' : (plotHeight + elementMargin) * plottableNodesIndex	+ marginTop
        					});
        				}
        			}

        			for ( var plottableNodesIndex in plottableNodes) { 
        				var plotObject = G.addWidget(Widgets.PLOT);
        				plotObject.plotFunctionNode(plottableNodes[plottableNodesIndex]);
        				plotObject.setSize(plotHeight, plotWidth);
        				plotObject.setPosition(plotLayout[plottableNodesIndex].posX, plotLayout[plottableNodesIndex].posY);
        			}
        		};

        		// Adding TreeVisualiserDAT Widget
        		var title=type[0].toUpperCase() + type.substring(1) + " - " + idString;
        		var treeVisualiserDAT1 = initialiseTreeWidget(title, marginLeft, marginTop);
        		treeVisualiserDAT1.setData(Model.neuroml[idString], {
        			expandNodes : true
        		});
        		generatePlotForFunctionNodes();
        		break;
        	
        	}	
        }

        GEPPETTO.G.setIdleTimeOut(-1);

        GEPPETTO.SceneController.setLinesThreshold(20000);

        //Change this to prompt the user to switch to lines or not
        GEPPETTO.SceneFactory.setLinesUserInput(false);
        
        GEPPETTO.G.autoFocusConsole(false);
    };
});
