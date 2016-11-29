define(function(require) {

    return function(GEPPETTO) {

        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "geppetto/extensions/geppetto-osb/css/OSB.css";
        document.getElementsByTagName("head")[0].appendChild(link);

        //Change this to prompt the user to switch to lines or not
        GEPPETTO.SceneFactory.setLinesUserInput(false);

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
        	tutorial: "https://dl.dropboxusercontent.com/s/puwpjdy9u7bfm2s/osb_tutorial.json?dl=1"
		}, document.getElementById("tutorial"));

        //Loading spinner initialization
        GEPPETTO.Spinner.setLogo("gpt-osb");

        //Save initialization 
        GEPPETTO.ComponentFactory.addComponent('SAVECONTROL', {}, document.getElementById("SaveButton"));

        //Control panel initialization
        GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {}, document.getElementById("controlpanel"), function() {
            var instancesColumnMeta = [
                {
                    "columnName": "path",
                    "order": 1,
                    "locked": false,
                    "visible": true,
                    "displayName": "Path",
                    "source": "$entity$.getPath()"
                },
                {
                    "columnName": "name",
                    "order": 2,
                    "locked": false,
                    "visible": true,
                    "displayName": "Name",
                    "source": "$entity$.getPath()"
                },
                {
                    "columnName": "type",
                    "order": 3,
                    "locked": false,
                    "visible": true,
                    "customComponent": GEPPETTO.ArrayComponent,
                    "displayName": "Type(s)",
                    "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
                    "actions": "G.addWidget(3).setData($entity$).setName('$entity$')"
                },
                {
                    "columnName": "controls",
                    "order": 4,
                    "locked": false,
                    "visible": true,
                    "customComponent": GEPPETTO.ControlsComponent,
                    "displayName": "Controls",
                    "source": "",
                    "actions": "GEPPETTO.ControlPanel.refresh();",
                    "cssClassName": "controlpanel-controls-column"
                }
            ];
            var instancesCols = ['name', 'type', 'controls'];

            var stateVariablesColMeta = [
                {
                    "columnName": "path",
                    "order": 1,
                    "locked": false,
                    "visible": true,
                    "displayName": "Path",
                    "source": "$entity$.getPath()"
                },
                {
                    "columnName": "name",
                    "order": 2,
                    "locked": false,
                    "visible": true,
                    "displayName": "Name",
                    "source": "$entity$.getPath()"
                },
                {
                    "columnName": "type",
                    "order": 3,
                    "locked": false,
                    "visible": true,
                    "customComponent": GEPPETTO.ArrayComponent,
                    "displayName": "Type(s)",
                    "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
                    "actions": "G.addWidget(3).setData($entity$).setName('$entity$')"
                },
                {
                    "columnName": "controls",
                    "order": 4,
                    "locked": false,
                    "visible": true,
                    "customComponent": GEPPETTO.ControlsComponent,
                    "displayName": "Controls",
                    "source": "",
                    "actions": "GEPPETTO.ControlPanel.refresh();",
                    "cssClassName": "controlpanel-controls-column"
                }
            ];
            var stateVariablesCols = ['name', 'type', 'controls'];

            // TODO: add editable value field and what happens upon edit
            var parametersColMeta = [
                {
                    "columnName": "path",
                    "order": 1,
                    "locked": false,
                    "visible": true,
                    "displayName": "Path",
                    "source": "$entity$.getPath()"
                },
                {
                    "columnName": "name",
                    "order": 2,
                    "locked": false,
                    "visible": true,
                    "displayName": "Name",
                    "source": "$entity$.getPath()"
                },
                {
                    "columnName": "type",
                    "order": 3,
                    "locked": false,
                    "visible": true,
                    "customComponent": GEPPETTO.ArrayComponent,
                    "displayName": "Type(s)",
                    "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
                    "actions": "G.addWidget(3).setData($entity$).setName('$entity$')"
                },
                {
                    "columnName": "value",
                    "order": 4,
                    "locked": false,
                    "visible": true,
                    "displayName": "Controls",
                    "source": "",
                    "actions": "",
                }
            ];
            var paramsCols = ['name', 'type', 'value'];

            // TODO: add plot / plot+add for state variable capability
            var customControlsConfiguration = {
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
                    },"visibility": {
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
                "Common": {}
            };

            // whatever gets passed we keep, filtering will happen outside the control panel
            var passThroughDataFilter = function(entities){
                return entities;
            };

            // set initial col meta (instances)
            GEPPETTO.ControlPanel.setColumnMeta(instancesColumnMeta);
            // set initial cols (instances)
            GEPPETTO.ControlPanel.setColumns(instancesCols);
            // set data filter
            GEPPETTO.ControlPanel.setDataFilter(passThroughDataFilter);
            // set controls config
            GEPPETTO.ControlPanel.setControlsConfig(customControlsConfiguration);

            // TODO: configure options button with options and actions
                // TODO: actions will be setColMeta, setCols, setData, should be able to keep data filter and params config
                // TODO: filtering should happen before calling setData to only pass what we need
        });

        //Spotlight initialization
        GEPPETTO.ComponentFactory.addComponent('SPOTLIGHT', {}, document.getElementById("spotlight"), function() {
            GEPPETTO.Spotlight.addSuggestion(GEPPETTO.Spotlight.plotSample, GEPPETTO.Resources.PLAY_FLOW);
        });

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
            menuSize: {
                height: "auto",
                width: 300
            },
            onClickHandler: clickHandler,
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

        //Home button initialization
        GEPPETTO.ComponentFactory.addComponent('CONTROLSMENUBUTTON', {
            configuration: configuration
        }, document.getElementById("ControlsMenuButton"));

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

        window.loadConnections = function() {
            Model.neuroml.resolveAllImportTypes(function() {
                $(".osb-notification-text").html(Model.neuroml.importTypes.length + " projections and " + Model.neuroml.connection.getVariableReferences().length + " connections were successfully loaded.");
            });
        };

        GEPPETTO.on(Events.Model_loaded, function() {
            if (Model.neuroml != undefined && Model.neuroml.importTypes != undefined && Model.neuroml.importTypes.length > 0) {
                $('#mainContainer').append('<div class="alert alert-warning osb-notification alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><span class="osb-notification-text">' + Model.neuroml.importTypes.length + ' projections in this model have not been loaded yet. <a href="javascript:loadConnections();" class="alert-link">Click here to load the connections.</a> (Note: depending on the size of the network this could take some time).</span></div>');
            }
        });

        GEPPETTO.on(Events.Project_loading, function() {
            $('.osb-notification').remove();
        });

        GEPPETTO.G.setIdleTimeOut(-1);

        GEPPETTO.SceneController.setLinesThreshold(20000);

        GEPPETTO.G.autoFocusConsole(false);
    };
});
