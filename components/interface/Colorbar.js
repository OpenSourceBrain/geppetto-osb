import React, { Component } from 'react';

export default class Colorbar extends React.Component {
    constructor(props) {
        super(props);
    }
    setupColorbar(instances, scalefn, normalize, name, axistitle, left, top, cb) {
            if (instances.length > 0) {
                G.addWidget(GEPPETTO.Widgets.PLOT, {isStateless:true}).then(
                    c => {
                        c.setName(name);
                        c.setSize(125, 350);
                        if (typeof top !== 'undefined' && typeof left !=='undefined')
                            c.setPosition(left, top);
                        else
                            c.setPosition(window.innerWidth - 375, window.innerHeight - 150);

                        c.plotOptions = colorbar.defaultLayout();
                        c.plotOptions.xaxis.title = axistitle;
                        c.yaxisAutoRange = true; // for correct reseting of axes

                        c.colorscaleMenu = [{
                                "label": "Rainbow",
                                "method": "setScale",
                                "arguments": [window.voltage_color, true]
                            },{
                                "label": "Sequential",
                                "method": "setScale",
                                "arguments": [window.sequential_color, true]
                            },{
                                "label": "Sequential 2",
                                "method": "setScale",
                                "arguments": [window.sequential_color2, true]
                            }];
                        c.setScale = function(scale, norm) {
                            if (norm)
                                scale = scale(c.plotOptions.xaxis.min, c.plotOptions.xaxis.max)
                            var data = colorbar.setScale(c.plotOptions.xaxis.min, c.plotOptions.xaxis.max, scale, false);
                            var instances = GEPPETTO.SceneController.getColorFunctionInstances();
                            // manually clear instances to avoid lit entities change event
                            // (triggers destroying colorbar in PlotController…)
                            this.refs.osbCanvas.engine.colorController.litUpInstances = [];
                            for (var i=0; i<instances.length; ++i)
                                this.refs.osbCanvas.engine.colorController.clearOnNodeUpdateCallback(instances[i]);
                            GEPPETTO.SceneController.addColorFunction(instances, scale, false);
                            c.plotGeneric(data);
                        }.bind(this);
                        c.addButtonToTitleBar($("<div class='fa fa-align-left' title='Colorscale'></div>").on('click', function(event) {
                            c.showMenu(c.colorscaleMenu, "colorscaleMenu", event);
                            event.stopPropagation();
		    }));


                        var callback = function() {
                            for (var instance of instances) {
                                c.updateXAxisRange(instance.getTimeSeries().filter(x => !isNaN(x)));
                            }
                            if (normalize) {
                                window.color_norm = scalefn(c.plotOptions.xaxis.min, c.plotOptions.xaxis.max);
                                GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());
                                GEPPETTO.SceneController.addColorFunction(instances, window.color_norm);
                            }

                            var data = colorbar.setScale(c.plotOptions.xaxis.min, c.plotOptions.xaxis.max, normalize ? window.color_norm : scalefn, false);
                            c.scalefn = normalize ? window.color_norm : scalefn;
                            c.plotGeneric(data);

                            if (cb) cb();
                        };

                        if (Project.getActiveExperiment().status == "COMPLETED") {
                            // only fetch instances for which state not already locally defined
                            var unfetched_instances = instances.filter(function(x){ return x.getTimeSeries() == undefined });
                            var unfetched_paths = unfetched_instances.map(function(x){ return x.getPath(); });
                            if (unfetched_paths.length > 0) {
                                GEPPETTO.ExperimentsController.getExperimentState(Project.getId(), Project.getActiveExperiment().getId(), unfetched_paths, callback);
                            } else {
                                callback();
                            }
                        } else {
                            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, "Experiment " + experiment.name + " with id " + experiment.id + " isn't completed.");
                        }
                    });
            }
    }
    render() {
        return (
            <div></div>
        )
    }
}
