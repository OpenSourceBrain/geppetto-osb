var resultsMenuConfig = {
    id: "controlsMenuButton",
    openByDefault: false,
    closeOnClick: true,
    label: ' Results',
    iconOn: 'fa fa-caret-square-o-up',
    iconOff: 'fa fa-caret-square-o-down',
    menuPosition: {
        top: 40,
        right: 550
    },
    menuSize: {
        height: "auto",
        width: "auto"
    },
    menuItems: [{
        label: "Plot all recorded variables",
        action: "window.plotAllRecordedVariables();",
        value: "plot_recorded_variables"
    }, {
        label: "Plot activity (continuous/raster/mean)",
        action: "window.showActivitySelector();",
        value: "plot_activity"
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
        label: "Show simulation time",
        action: "G.addWidget(5).then(w => w.setName('Simulation time').setVariable(time));",
        value: "simulation_time"
    }, {
        label: "Show protocol summary",
        action: "window.showProtocolSummary();",
        value: "show_protocol_summary"
    }]
};

window.plotAllRecordedVariables = function(groupingFn) {
    var groupBy = function(xs, key) {
        return xs.reduce(function(rv, x) {
            (rv[key(x)] = rv[key(x)] || []).push(x);
            return rv;
        }, {});
    };

    var watchedVars = Project.getActiveExperiment().getWatchedVariables(true, false);
    if (watchedVars.length > 60) {
        GEPPETTO.ModalFactory.infoDialog("Warning",
                                         "You have recorded " + watchedVars.length + " variables. Please use the control panel (<i class='fa fa-list'></i> icon at left of screen) for plotting.");
    } else {
        var populations = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.population)
            .filter(x => x.getMetaType() !== 'SimpleType');
        if (typeof groupingFn === 'undefined')
            // default: group by populations
            groupingFn = function(v) {
                return populations.filter(p => v.getPath().indexOf(p.getName()) > -1)[0].getName()
            };
        Project.getActiveExperiment().playAll();
        var grouped = groupBy(watchedVars, groupingFn);
        var groups = Object.keys(grouped);
        var colors = populations.map(function(pop) {
            return {[pop.getName()]: GEPPETTO.ModelFactory.getAllInstancesOfType(pop)[0].getColor()};
        }).reduce(function(acc, x) {
            for (var key in x) acc[key] = x[key];
            return acc;
        }, {});
        for (var i=0; i<groups.length; ++i) {
            var group = groups[i];
            (function(group, i) {
                G.addWidget(GEPPETTO.Widgets.PLOT).then(w => {
		    w.setName("Recorded variables: "+group);
                    w.setPosition(100+(i*50), 100+(i*50));
                    // first trace match population color, let plotly assign the rest
                    w.plotData(grouped[group][0], null, {color: colors[group]});
                    for (var j=1; j<grouped[group].length; ++j)
			w.plotData(grouped[group][j], null, {});
                });
            })(group, i, colors)
        }
    }
};

window.showActivitySelector = function() { return activity.showActivitySelector(); }

window.getSomaVariableInstances = function(stateVar) {
    var instances = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.' + stateVar);
    var instancesToRecord = [];
    for (var i = 0; i < instances.length; i++) {
        var s = instances[i].split('.' + stateVar)[0];
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

window.getRecordedCaConcs = function() {
    var instances = Project.getActiveExperiment().getWatchedVariables(true, false);
    var v = [];
    for (var i = 0; i < instances.length; i++) {
        if (instances[i].getInstancePath().endsWith(".caConc")) {
            v.push(instances[i]);
        }
    }
    return v;
};

window.getRecordedRates = function() {
    var instances = Project.getActiveExperiment().getWatchedVariables(true, false);
    var v = [];
    for (var i = 0; i < instances.length; i++) {
        if (instances[i].getInstancePath().endsWith(".r")) {
            v.push(instances[i]);
        }
    }
    return v;
};

var toggleResultsMenuOptions = function(resultsMenu) {
    return function(){
    if (Project.getActiveExperiment() == null)
        return;

    var caVars = Project.getActiveExperiment().variables.filter((x)=>x.endsWith('.caConc'));
    var vVars = Project.getActiveExperiment().variables.filter((x)=>x.endsWith('.v'));
    var rateVars = Project.getActiveExperiment().variables.filter((x)=>x.endsWith('.r'));
    if (caVars.length > 0) {
        if (resultsMenu.state.configuration.menuItems.map(x=>x.value).indexOf("apply_ca") == -1) {
            resultsMenu.addMenuItem({
                label: "Apply Ca2+ concentration colouring to morphologies",
                radio: true,
                condition: "window.ca",
                value: "apply_ca",
                false: {
                    // not selected
                    action: "window.ca=true; GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());" + "window.setupColorbar(window.getRecordedCaConcs(), window.ca_color, true, 'Ca2+ color scale', 'Amount of substance (mol/m³)');"
                },
                true: {
                    // is selected
                    action: "window.ca=false; GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());"
                }
            });
        }
    }
    else {
        resultsMenu.removeMenuItem("apply_ca");
    }
    
    if (rateVars.length > 0) {
        if (resultsMenu.state.configuration.menuItems.map(x=>x.value).indexOf("apply_rates") == -1) {
            resultsMenu.addMenuItem({
                label: "Apply neural mass rate colouring to populations",
                radio: true,
                condition: "if (window.controlsMenuButton && window.controlsMenuButton.refs && window.controlsMenuButton.refs.dropDown.refs.apply_rates)" +
                    "{ window.controlsMenuButton.refs.dropDown.refs.apply_rates.state.icon != 'fa fa-circle-o' } else { false }",
                value: "apply_rates",
                false: {
                    // not selected
                    action: "GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());" +
                        "GEPPETTO.SceneController.addColorFunction(window.getRecordedRates(), window.rate_color());" +
                        "window.setupColorbar(window.getRecordedRates(), window.rate_color, true, 'Rate color scale', 'Rate (Hz)');"
                },
                true: {
                    // is selected
                    action: "GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());"
                }
            });
        }
    }
    else {
        resultsMenu.removeMenuItem("apply_rates");
    }

    if (vVars.length > 0) {
        if (resultsMenu.state.configuration.menuItems.map(x=>x.value).indexOf("apply_voltage") == -1) {
            resultsMenu.addMenuItem({
                label: "Apply voltage colouring to morphologies",
                radio: true,
                condition: "if (window.controlsMenuButton && window.controlsMenuButton.refs && window.controlsMenuButton.refs.dropDown.refs.apply_voltage)" +
                    "{ window.controlsMenuButton.refs.dropDown.refs.apply_voltage.state.icon != 'fa fa-circle-o' } else { false }",
                value: "apply_voltage",
                false: {
                    // not selected
                    action: "GEPPETTO.SceneController.addColorFunction(window.getRecordedMembranePotentials(), window.voltage_color());" +
                        "window.setupColorbar(window.getRecordedMembranePotentials(), window.voltage_color, true, 'Voltage color scale', 'Membrane Potential (V)');"
                },
                true: {
                    // is selected
                    action: "GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());",
                }
            });

            resultsMenu.addMenuItem({
                label: "Apply soma voltage colouring to entire cell",
                radio: true,
                condition: "if (window.controlsMenuButton && window.controlsMenuButton.refs && window.controlsMenuButton.refs.dropDown.refs.apply_voltage_entire_cell)" +
                    "{ window.controlsMenuButton.refs.dropDown.refs.apply_voltage_entire_cell.state.icon != 'fa fa-circle-o' } else { false }",
                value: "apply_voltage_entire_cell",
                false: {
                    // not selected
                    action: "GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());" +
                        "window.setupColorbar(window.getRecordedMembranePotentials(), window.voltage_color, true, 'Voltage color scale', 'Membrane Potential (V)', undefined, undefined, window.soma_v_entire_cell);"
                },
                true: {
                    // is selected
                    action: "GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());"
                }
            });
        }
    }
    else {
        resultsMenu.removeMenuItem("apply_voltage_entire_cell");
        resultsMenu.removeMenuItem("apply_voltage");
    }
    }
}

module.exports = {
    resultsMenuConfig, toggleResultsMenuOptions
}
