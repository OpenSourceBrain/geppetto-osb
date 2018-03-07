define(function(require) {
    require("./Activity.less");
    return  {
        plotSelectorLayout: function() {
            function imgPath(path){
                return 'geppetto/extensions/geppetto-osb/images/' + path;
            }

            var layoutOptions = [
                {id: "traces", label: 'Traces', description: "", img: imgPath('matrix.svg')},
                {id: "continuous", label: 'Continuous activity', description: "", img: imgPath('force.svg')},
                {id: "spiking",  label: 'Raster plot', description: "", img: imgPath('raster.svg')},
            ];
            var container = $('<div>').addClass('card-deck-wrapper');
            $('<p class="card-wrapper-title">How would you like to plot the results?</p>').appendTo(container);
            var deck = $('<div>').addClass('card-deck').appendTo(container);

            function createCard(cardData){
                return $('<div>', {class: 'card', id: cardData.id})
                    .append($('<img>', {
                        class: 'card-img-top center-block',
                        src: cardData.img,
                    }))
                    .append($('<h4>', {
                        class: 'card-title',
                        text: cardData.label
                    }))
                    .append($('<p>', {
                        class: 'card-text',
                        text: cardData.description
                    }));
            }

            for(layout in layoutOptions){
                deck.append(createCard(layoutOptions[layout]));
            }

            return container;
        },

        showPlotSelector: function(plot) {
            var that=this;
            var firstClick=false;
            var modalContent=$('<div class="modal fade" id="plot-config-modal" tabindex="-1"></div>')
                .append(this.plotSelectorLayout()[0].outerHTML).modal({keyboard: true});

            function handleFirstClick(event) {
                switch (event.currentTarget.id) {
                case 'traces':
                    that.plotAllRecordedTraces(plot);
                    break;
                case 'continuous':
                    that.plotAllContinuous(plot);
                    break;
                case 'spiking':
                    that.plotAllSpikes(plot);
                    break;
                }
                firstClick=true;
            }

            function clickHandler(event) {
            	if(!firstClick){
            	    handleFirstClick(event);
            	    setTimeout(function() { firstClick=false;}, 200); //closes the window to click again (dbclick)
                    modalContent.modal('hide');
            	}
            	else{
            	    modalContent.modal('hide');
            	    firstClick=false;
            	}
            }

            modalContent.find('.card').on('click', clickHandler);
        }, 
        fetchAllTimeseries: function(callback) {
            var unfetched = Project.getActiveExperiment().getWatchedVariables(true)
                .filter(x => typeof x.getTimeSeries() == 'undefined');
            if(unfetched.length > 0) {
                GEPPETTO.ExperimentsController.getExperimentState(Project.id, Project.activeExperiment.id, unfetched.map(x => x.getPath()), callback);
            } else {
                callback();
            }
        },

        plotAllContinuous: function(plot) {
            var that=this;
            this.fetchAllTimeseries(function() {
                var data = {colorbar: {autotick: true, tickfont: {color: '#FFFFFF'}, xaxis: {title: 'Value'}},
                            showlegend: false, showscale: true, type: 'heatmap'};
                var variables = Project.getActiveExperiment().getWatchedVariables(true);
                variables = variables.sort(x => x.getPath());
                data.x = window.time.getTimeSeries();
                data.z = variables.map(x => x.getTimeSeries());
                data.y = variables.map(x => x.getPath().split('.')[1]);
                if (typeof plot == 'undefined')
                    GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then(plot => {
                        plot.plotGeneric(data);
                        plot.setOptions({margin: {l: 100, r: 10}});
                        plot.setOptions({yaxis: {min: -0.5, max: data.y.length-0.5}});
                        plot.resetAxes();
                        plot.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                            that.showPlotSelector(plot);
                        }));
                    });
                else {
                    plot.cleanDataSets();
                    plot.plotGeneric(data);
                    plot.setOptions({margin: {l: 100, r: 10}});
                    plot.setOptions({yaxis: {min: -0.5, max: data.y.length-0.5}});
                    plot.resetAxes();
                }
            });
        },

        plotAllSpikes: function(plot) {
            var that=this;
            this.fetchAllTimeseries(function() {
                var cb = function(plot) {
                    var variables = Project.getActiveExperiment().getWatchedVariables(true);
                    variables = variables.sort(x => x.getPath());
                    for (var i=0; i<variables.length; ++i) {
                        var trace = {mode: 'markers', type: 'scatter', marker: {size: 5}};
                        var timeSeries = variables[i].getTimeSeries();
                        trace.x = timeSeries.map((x, i) => {
                            if(i>0 && x>=0 && timeSeries[i-1] < 0) { return 1; } else { return 0; }
                        }).map((x,i) => {if(x==1) { return i }})
                            .filter(x => x!==undefined)
                            .map(x => time.getTimeSeries()[x]);
                        // FIXME: getting pop needs to be more generic
                        trace.marker.color = eval(variables[i].getPath().split('.').splice(0,2).join('.')).getColor();
                        trace.y = trace.x.slice().fill(variables[i].getPath().split('.')[1]);
                        plot.plotGeneric(trace);
                        plot.resetAxes();
                    }
                    plot.setOptions({showlegend: false});
                    plot.yaxisAutoRange = true;
                    plot.xaxisAutoRange = false;
                    plot.setOptions({margin: {l: 100, r: 10}});
                    plot.limit = window.time.getTimeSeries()[window.time.getTimeSeries().length-1];
                    plot.resetAxes();
                }
                if (typeof plot == 'undefined')
                    GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then(plot => {
                        cb(plot);
                        plot.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                            that.showPlotSelector(plot);
                        }));
                    });
                else {
                    plot.cleanDataSets();
                    cb(plot);
                }
            });
        },

        plotAllRecordedTraces: function(groupingFn) {
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
                if (typeof groupingFn === 'undefined')
                    // default: group by populations
                    groupingFn = function(v) {
                        var populations = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.population)
                            .filter(x => x.getMetaType() !== 'SimpleType');
                        return populations.filter(p => v.getPath().indexOf(p.getName()) > -1)[0].getName()
                    }
                this.fetchAllTimeseries(function() {
                    var grouped = groupBy(watchedVars, groupingFn);
                    var groups = Object.keys(grouped);
                    for (var i=0; i<groups.length; ++i) {
                        var group = groups[i];
                        (function(group, i) {
                            G.addWidget(0).then(w => {
		                w.setName("Recorded variables: "+group);
                                w.setPosition(100+(i*50), 100+(i*50));
                                lastPos = w.getPosition();
                                for (var j=0; j<grouped[group].length; ++j)
			            w.plotData(grouped[group][j]);
                                w.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                                    that.showPlotSelector(w);
                    }));
                            });
                        })(group, i)
                    }
                });
            }
        }

    };

});
