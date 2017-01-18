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

        PlotCtrlr = require('widgets/plot/controllers/PlotsController');
        window.PlotController = new PlotCtrlr();

        window.isLocalWatchedInstanceOrExternal = function(projectId, experimentId, path){
            var watchedOrExternal = false;

            if(projectId == window.Project.getId() && experimentId == window.Project.getActiveExperiment().getId()){
                // local, check if experiment completed and variable watched
                if(window.Project.getActiveExperiment().getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED){
                    var watchList = window.Project.getActiveExperiment().getWatchedVariables();
                    for(var i=0; i<watchList.length; i++){
                        if(watchList[i] == path){
                            watchedOrExternal = true;
                            break;
                        }
                    }
                }
            } else {
                // external, this is always true as we only show state variables from completed external experiments
                watchedOrExternal = true;
            }

            return watchedOrExternal;
        };

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

        var configuration = {
        		id: "PublicProjectButton",
        		hideCondition : "window.Project.isReadOnly()",
        		clickHandler : toggleClickHandler,
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
        var createMenuItems = function(projectId, experimentId, instance){
        	var menuButtonItems = [];
        	var plots = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets();
			if(plots.length > 0){
				for(var i =0 ; i<plots.length; i++){
					menuButtonItems.push({
						label: "Add to " +plots[i].getId(),
                        action:"window.PlotController.plotStateVariable(" + projectId + "," + experimentId + ",'" + instance + "'," + plots[i].getId() + ")",
						value: "plot_variable"
					});
				}
			}else{
				//add default item
				menuButtonItems.push({
					label: "Add new plot ",
					action:"window.PlotController.plotStateVariable(" + projectId + "," + experimentId + ",'" + instance + "')",
					value: "plot_variable"
				});
			}
			
			return menuButtonItems;
        };
        
        // instances config
        var instancesColumnMeta = [
            {
                "columnName": "projectId",
                "order": 1,
                "locked": false,
                "visible": true,
                "displayName": "Project Id"
            },
            {
                "columnName": "experimentId",
                "order": 2,
                "locked": false,
                "visible": true,
                "displayName": "Experiment Id"
            },
            {
                "columnName": "path",
                "order": 3,
                "locked": false,
                "visible": true,
                "displayName": "Path",
                "source": "$entity$.getPath()"
            },
            {
                "columnName": "name",
                "order": 4,
                "locked": false,
                "visible": true,
                "displayName": "Name",
                "source": "$entity$.getPath()",
                "cssClassName": "control-panel-path-column",
            },
            {
                "columnName": "controls",
                "order": 5,
                "locked": false,
                "visible": true,
                "customComponent": null,
                "displayName": "Controls",
                "source": "",
                "actions": "GEPPETTO.ControlPanel.refresh();",
                "cssClassName": "controlpanel-controls-column"
            },
            {
                "columnName": "type",
                "order": 6,
                "locked": false,
                "visible": true,
                "customComponent": null,
                "displayName": "Type(s)",
                "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
                "actions": "G.addWidget(3).setData($entity$).setName('$entity$')",
                "cssClassName": "control-panel-type-column"
            },
        ];
        var instancesCols = ['name', 'type', 'controls'];
        var instancesControlsConfiguration = {
            "VisualCapability": {
                "select": {
                    "condition": "GEPPETTO.SceneController.isSelected($instances$)",
                    "false": {
                        "actions": ["GEPPETTO.SceneController.select($instances$)"],
                        "icon": "fa-hand-stop-o",
                        "label": "Unselected",
                        "tooltip": "Select"
                    },
                    "true": {
                        "actions": ["GEPPETTO.SceneController.deselect($instances$)"],
                        "icon": "fa-hand-rock-o",
                        "label": "Selected",
                        "tooltip": "Deselect"
                    },
                }, "visibility": {
                    "condition": "GEPPETTO.SceneController.isVisible($instances$)",
                    "false": {
                        "id": "visibility",
                        "actions": [
                            "GEPPETTO.SceneController.show($instances$);"
                        ],
                        "icon": "fa-eye-slash",
                        "label": "Hidden",
                        "tooltip": "Show"
                    },
                    "true": {
                        "id": "visibility",
                        "actions": [
                            "GEPPETTO.SceneController.hide($instances$);"
                        ],
                        "icon": "fa-eye",
                        "label": "Visible",
                        "tooltip": "Hide"
                    }
                },
                "color": {
                    "id": "color",
                    "actions": [
                        "$instance$.setColor('$param$');"
                    ],
                    "icon": "fa-tint",
                    "label": "Color",
                    "tooltip": "Color"
                },
                "randomcolor": {
                    "id": "randomcolor",
                    "actions": [
                        "GEPPETTO.SceneController.assignRandomColor($instance$);"
                    ],
                    "icon": "fa-random",
                    "label": "Random Color",
                    "tooltip": "Random Color"
                },
                "zoom": {
                    "id": "zoom",
                    "actions": [
                        "GEPPETTO.SceneController.zoomTo($instances$)"
                    ],
                    "icon": "fa-search-plus",
                    "label": "Zoom",
                    "tooltip": "Zoom"
                }
            },
            "StateVariableCapability": {
                "watch": {
                    "showCondition": "GEPPETTO.UserController.canUserEditExperiment() && (window.Project.getId() == $projectId$ && window.Project.getActiveExperiment().getId() == $experimentId$)",
                    "condition": "GEPPETTO.ExperimentsController.isWatched($instances$);",
                    "false": {
                        "actions": ["GEPPETTO.ExperimentsController.watchVariables($instances$,true);"],
                        "icon": "fa-circle-o",
                        "label": "Not recorded",
                        "tooltip": "Record the state variable"
                    },
                    "true": {
                        "actions": ["GEPPETTO.ExperimentsController.watchVariables($instances$,false);"],
                        "icon": "fa-dot-circle-o",
                        "label": "Recorded",
                        "tooltip": "Stop recording the state variable"
                    }
                },
                "plot": {
                    "id": "plot",
                    "actions": [
                        "window.PlotController.plotStateVariable($projectId$, $experimentId$, '$instance$')",
                    ],
                    "showCondition": "window.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                    "icon": "fa-area-chart",
                    "label": "Plot",
                    "tooltip": "Plot state variable in a new widget"
                },
                //dynamic menu button, no initial list of items, and adds menu items on the go as plots are created
                "plot2": {
                	"menu" :true,
                	"menuMaker" : createMenuItems,
                	"actions" :["GEPPETTO.ControlPanel.refresh();"],
                    "showCondition": "window.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                    "id": "plot2",
                    "icon": "fa-line-chart",
                    "label": "Plot2",
                    "tooltip": "Plot state variable in a an existing widget"
                }
            },
            "Common": {}
        };
        var instancesControls = {
            "Common": [],
            "VisualCapability": ['color', 'randomcolor', 'visibility', 'zoom'],
            "StateVariableCapability": ['watch', 'plot','plot2']
        };

        // state variables config (treated as potential instances)
        var stateVariablesColMeta = [
            {
                "columnName": "projectId",
                "order": 1,
                "locked": false,
                "visible": true,
                "displayName": "Project Id"
            },
            {
                "columnName": "experimentId",
                "order": 2,
                "locked": false,
                "visible": true,
                "displayName": "Experiment Id"
            },
            {
                "columnName": "path",
                "order": 3,
                "locked": false,
                "visible": true,
                "displayName": "Path"
            },
            {
                "columnName": "projectName",
                "order": 4,
                "locked": false,
                "visible": true,
                "displayName": "Project"
            },
            {
                "columnName": "experimentName",
                "order": 5,
                "locked": false,
                "visible": true,
                "displayName": "Experiment"
            },
            {
                "columnName": "name",
                "order": 6,
                "locked": false,
                "visible": true,
                "displayName": "Name",
                "cssClassName": "control-panel-path-column",
            },
            {
                "columnName": "controls",
                "order": 7,
                "locked": false,
                "visible": true,
                "customComponent": null,
                "displayName": "Controls",
                "source": "",
                "actions": "GEPPETTO.ControlPanel.refresh();",
                "cssClassName": "controlpanel-controls-column"
            },
            {
                "columnName": "type",
                "order": 8,
                "locked": false,
                "visible": true,
                "customComponent": null,
                "displayName": "Type(s)",
                "actions": "G.addWidget(3).setData($entity$).setName('$entity$')",
                "cssClassName": "control-panel-type-column"
            }
        ];
        var stateVariablesCols = ['name', 'type', 'controls'];
        var stateVariablesColsWithExperiment = ['name', 'type', 'controls', 'experimentName'];
        var stateVariablesColsWithProjectAndExperiment = ['name', 'type', 'controls', 'projectName', 'experimentName'];
        var stateVariablesControlsConfig = {
            "Common": {
                "watch": {
                    "showCondition": "GEPPETTO.UserController.canUserEditExperiment() && (window.Project.getId() == $projectId$ && window.Project.getActiveExperiment().getId() == $experimentId$)",
                    "condition": "(function(){ var inst = undefined; try {inst = eval('$instance$');}catch(e){} if(inst != undefined){ return GEPPETTO.ExperimentsController.isWatched($instances$); } else { return false; } })();",
                    "false": {
                        "actions": ["var inst = Instances.getInstance('$instance$'); GEPPETTO.ExperimentsController.watchVariables([inst],true);"],
                        "icon": "fa-circle-o",
                        "label": "Not recorded",
                        "tooltip": "Record the state variable"
                    },
                    "true": {
                        "actions": ["var inst = Instances.getInstance('$instance$'); GEPPETTO.ExperimentsController.watchVariables([inst],false);"],
                        "icon": "fa-dot-circle-o",
                        "label": "Recorded",
                        "tooltip": "Stop recording the state variable"
                    }
                },
                "plot": {
                    "showCondition": "window.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                    "id": "plot",
                    "actions": [
                        "window.PlotController.plotStateVariable($projectId$, $experimentId$, '$instance$')",
                    ],
                    "icon": "fa-area-chart",
                    "label": "Plot",
                    "tooltip": "Plot state variable in a new widget"
                },
                //dynamic menu button, no initial list of items, and adds menu items on the go as plots are created
                "plot2": {
                	"menu" :true,
                	"menuMaker" : createMenuItems,
                	"actions" :["GEPPETTO.ControlPanel.refresh();"],
                    "showCondition": "window.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                    "id": "plot2",
                    "icon": "fa-line-chart",
                    "label": "Plot2",
                    "tooltip": "Plot state variable in a an existing widget"
                }
            }
        };
        var stateVariablesControls = { "Common": ['watch', 'plot','plot2'] };

        // parameters config (treated as potential instances)
        var parametersColMeta = [
            {
                "columnName": "projectId",
                "order": 1,
                "locked": false,
                "visible": true,
                "displayName": "Project Id",
            },
            {
                "columnName": "experimentId",
                "order": 2,
                "locked": false,
                "visible": true,
                "displayName": "Experiment Id",
            },
            {
                "columnName": "path",
                "order": 3,
                "locked": false,
                "visible": true,
                "displayName": "Path"
            },
            {
                "columnName": "projectName",
                "order": 4,
                "locked": false,
                "visible": true,
                "displayName": "Project",
            },
            {
                "columnName": "experimentName",
                "order": 5,
                "locked": false,
                "visible": true,
                "displayName": "Experiment",
            },
            {
                "columnName": "name",
                "order": 6,
                "locked": false,
                "visible": true,
                "displayName": "Name",
                "cssClassName": "control-panel-parameter-path-column",
            },
            {
                "columnName": "value",
                "order": 7,
                "locked": false,
                "visible": true,
                "displayName": "Value",
                "actions": "$entity$.setValue($VALUE$)",
                "readOnlyCondition": "!GEPPETTO.UserController.canUserEditExperiment() || !(window.Project.getId() == $projectId$ && window.Project.getActiveExperiment().getId() == $experimentId$)",
                "cssClassName": "control-panel-value-column",
            },
            {
                "columnName": "type",
                "order": 8,
                "locked": false,
                "visible": true,
                "customComponent": null,
                "displayName": "Type(s)",
                "actions": "G.addWidget(3).setData($entity$).setName('$entity$')",
                "cssClassName": "control-panel-type-column"
            },
            {
                "columnName": "unit",
                "order": 9,
                "locked": false,
                "visible": false
            },
            {
                "columnName": "fetched_value",
                "order": 10,
                "locked": false,
                "visible": false
            }
        ];
        var paramsCols = ['name', 'type', 'value'];
        var paramsColsWithExperiment = ['name', 'type', 'value', 'experimentName'];
        var paramsColsWithProjectAndExperiment = ['name', 'type', 'value', 'projectName', 'experimentName'];
        var parametersControlsConfig = {};
        var parametersControls = { "Common": [] };

        var resetControlPanel = function(columns, colMeta, controls, controlsConfig){
            // reset filter and wipe data
            GEPPETTO.ControlPanel.setFilter('');
            GEPPETTO.ControlPanel.clearData();

            // reset params
            GEPPETTO.ControlPanel.setColumns(columns);
            GEPPETTO.ControlPanel.setColumnMeta(colMeta);
            GEPPETTO.ControlPanel.setControlsConfig(controlsConfig);
            GEPPETTO.ControlPanel.setControls(controls);
        };

        // control panel menu button configuration
        var panelMenuClickHandler = function(value){
            switch(value) {
                case 'show_visual_instances':
                    // displays actual instances
                    resetControlPanel(instancesCols, instancesColumnMeta, instancesControls, instancesControlsConfiguration);

                    // do filtering (always the same)
                    var visualInstances = [];
                    if(window.Project.getActiveExperiment() != undefined){
                        visualInstances = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, window.Instances).map(
                            function(item){
                                return {
                                    path: item.getPath(),
                                    name: item.getPath(),
                                    type: [item.getType().getPath()],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function(){
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(visualInstances); }, 5);
                    break;
                case 'show_local_state_variables':
                    // displays potential instances
                    resetControlPanel(stateVariablesCols, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var potentialStateVarInstances = [];
                    if(window.Project.getActiveExperiment() != undefined) {
                        // take all potential state variables instances
                        var filteredPaths = GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType('StateVariableType', undefined, true).filter(
                            function (item) {
                                // only include paths without stars (real paths)
                                return item.path.indexOf('*') == -1;
                            }
                        );
                        potentialStateVarInstances = filteredPaths.map(
                            function (item) {
                                return {
                                    path: item.path,
                                    name: item.path,
                                    type: ['Model.common.StateVariable'],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function () {
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(potentialStateVarInstances); }, 5);
                    break;
                case 'show_recorded_state_variables':
                    // displays actual instances
                    resetControlPanel(instancesCols, instancesColumnMeta, instancesControls, instancesControlsConfiguration);

                    var recordedStateVars = [];
                    if(window.Project.getActiveExperiment() != undefined) {
                        // show all state variable instances (means they are recorded)
                        recordedStateVars = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY, window.Instances).map(
                            function (item) {
                                return {
                                    path: item.getPath(),
                                    name: item.getPath(),
                                    type: ['Model.common.StateVariable'],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function () {
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(recordedStateVars); }, 5);
                    break;
                case 'show_project_recorded_state_variables':
                    // this will display potential instances with state variables col meta / controls
                    resetControlPanel(stateVariablesColsWithExperiment, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var projectStateVars = GEPPETTO.ProjectsController.getProjectStateVariables(window.Project.getId());

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(projectStateVars); }, 5);
                    break;
                case 'show_global_recorded_state_variables':
                    // this will display potential instances with state variables col meta / controls
                    resetControlPanel(stateVariablesColsWithProjectAndExperiment, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var globalStateVars = GEPPETTO.ProjectsController.getGlobalStateVariables(window.Project.getId(), false);

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(globalStateVars); }, 5);
                    break;
                case 'show_parameters':
                    // displays indexed parameters / similar to potential instances
                    resetControlPanel(paramsCols, parametersColMeta, parametersControls, parametersControlsConfig);

                    var potentialParamInstances = [];
                    if(window.Project.getActiveExperiment() != undefined) {
                        // take all parameters potential instances
                        potentialParamInstances = GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType('ParameterType', undefined, true).map(
                            function (item) {
                                return {
                                    path: item.path,
                                    name: item.path.replace(/Model\.neuroml\./gi, ''),
                                    type: ['Model.common.Parameter'],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function () {
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(potentialParamInstances); }, 5);
                    break;
                case 'show_project_parameters':
                    // this will display potential instances with parameters col meta / controls
                    resetControlPanel(paramsColsWithExperiment, parametersColMeta, parametersControls, parametersControlsConfig);

                    var projectEditedParameters  = GEPPETTO.ProjectsController.getProjectParameters(window.Project.getId());

                    // add any parameters edited in the current experiment that haven't been fetched
                    var parametersDictionary = {};
                    for(var i=0; i<projectEditedParameters.length; i++){
                        // if matching project/experiment id add to dictionary
                        if(projectEditedParameters[i].projectId == window.Project.getId() &&
                            projectEditedParameters[i].experimentId == window.Project.getActiveExperiment().getId()) {
                            parametersDictionary[projectEditedParameters[i].path] = projectEditedParameters[i];
                        }
                    }

                    // loop through parameters current experiment state to check if any parameters have been edited
                    var localParamEdit = window.Project.getActiveExperiment().setParameters;
                    for (var key in localParamEdit){
                        // query the other dictionary, anything not found add to projectEditedParameters in the same format
                        if(parametersDictionary[key] == undefined){
                            projectEditedParameters.unshift({
                                path: key,
                                name: key,
                                fetched_value: localParamEdit[key],
                                unit: undefined,
                                type: ['Model.common.Parameter'],
                                projectId: window.Project.getId(),
                                projectName: window.Project.getName(),
                                experimentId: window.Project.getActiveExperiment().getId(),
                                experimentName: window.Project.getActiveExperiment().getName(),
                                getPath: function () {
                                    return this.path;
                                }
                            });
                        }
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(projectEditedParameters); }, 5);
                    break;
                case 'show_global_parameters':
                    // this will display potential instances with parameters col meta / controls
                    resetControlPanel(paramsColsWithProjectAndExperiment, parametersColMeta, parametersControls, parametersControlsConfig);

                    var globalEditedParameters = GEPPETTO.ProjectsController.getGlobalParameters(window.Project.getId(), false);

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function(){ GEPPETTO.ControlPanel.setData(globalEditedParameters); }, 5);
                    break;
            }
        };
        var panelMenuItemsConfig = [
            {
                label: "Visual Instances",
                action: "",
                value: "show_visual_instances"
            },{
                label: "All Local State Variables (Current Project/Experiment)",
                action: "",
                value: "show_local_state_variables"
            },{
                label: "Recorded Local State Variables (Current project/experiment)",
                action: "",
                value: "show_recorded_state_variables"
            },{
                label: "Project Recorded State Variables (All experiments for current project)",
                action: "",
                value: "show_project_recorded_state_variables"
            },{
                label: "Global Recorded State Variables (All other projects/experiments)",
                action: "",
                value: "show_global_recorded_state_variables"
            },{
                label: "Local Parameters (Current project/experiment)",
                action: "",
                value: "show_parameters"
            },{
                label: "Project Edited Parameters (All experiments for current project)",
                action: "",
                value: "show_project_parameters"
            },{
                label: "Global Edited Parameters (All other projects/experiments)",
                action: "",
                value: "show_global_parameters"
            }
        ];

        GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {
            showMenuButton: true,
            menuButtonItems: panelMenuItemsConfig,
            menuButtonClickHandler: panelMenuClickHandler,
            listenToInstanceCreationEvents: false
        }, document.getElementById("controlpanel"), function () {
            var injectCustomControls = function(colMeta){
                for(var i=0; i<colMeta.length; i++){
                    if(colMeta[i].columnName == 'type'){
                        colMeta[i].customComponent = GEPPETTO.ArrayComponent;
                    } else if(colMeta[i].columnName == 'controls'){
                        colMeta[i].customComponent = GEPPETTO.ControlsComponent;
                    } else if(colMeta[i].columnName == 'value'){
                        colMeta[i].customComponent = GEPPETTO.ParameterInputComponent;
                    }
                }
            };
            // need to inject custom controls here as they become visible only after control panel component is imported
            injectCustomControls(instancesColumnMeta);
            injectCustomControls(stateVariablesColMeta);
            injectCustomControls(parametersColMeta);

            // whatever gets passed we keep, filtering will happen outside the control panel
            var passThroughDataFilter = function (entities) {
                return entities;
            };

            // set initial col meta (instances)
            GEPPETTO.ControlPanel.setColumnMeta(instancesColumnMeta);
            // set initial cols (instances)
            GEPPETTO.ControlPanel.setColumns(instancesCols);
            // set data filter
            GEPPETTO.ControlPanel.setDataFilter(passThroughDataFilter);
            // set default controls config
            GEPPETTO.ControlPanel.setControlsConfig(instancesControlsConfiguration);
            // set default controls
            GEPPETTO.ControlPanel.setControls(instancesControls);
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
            resetControlPanel(instancesCols, instancesColumnMeta, instancesControls, instancesControlsConfiguration);
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
