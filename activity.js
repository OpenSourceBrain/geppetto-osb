define(function(require) {
    require("./Activity.less");
    var colorbar = require('./colorbar');
    return  {
        spikeCache: {},
        groupBy: function(xs, key) {
                return xs.reduce(function(rv, x) {
                    (rv[key(x)] = rv[key(x)] || []).push(x);
                    return rv;
                }, {});
        },

        activitySelectorLayout: function() {
            function imgPath(path){
                return 'geppetto/extensions/geppetto-osb/images/' + path;
            }

            var layoutOptions = [
                {id: "continuous", label: 'Continuous activity', description: "", img: imgPath('continuous.svg')},
                {id: "spiking",  label: 'Raster plot', description: "", img: imgPath('raster.svg')},
                {id: "mean", label: 'Mean rate', description: "", img: imgPath('mean.svg')}
            ];
            var container = $('<div>').addClass('card-deck-wrapper');
            $('<p class="card-wrapper-title">How would you like to plot the results?</p>').appendTo(container);
            var deck = $('<div>').addClass('card-deck activity-card-deck').appendTo(container);

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

        showActivitySelector: function(plot, groupId) {
            var that=this;
            var firstClick=false;
            var modalContent=$('<div class="modal fade" id="plot-config-modal" tabindex="-1"></div>')
                .append(this.activitySelectorLayout()[0].outerHTML).modal({keyboard: true});

            function handleFirstClick(event) {
                switch (event.currentTarget.id) {
                case 'mean':
                    that.plotAllMean(plot, groupId);
                    break;
                case 'continuous':
                    that.plotAllContinuous(plot, groupId);
                    break;
                case 'spiking':
                    that.plotAllSpikes(plot, groupId);
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

        plotAllMean: function(plot) {
            var membranePotentials = window.getRecordedMembranePotentials();
            var maxTime = window.time.getTimeSeries()[window.time.getTimeSeries().length-1];
            this.getSpikes(membranePotentials);
            var histogram = {};
            var hwindow = 0.01;
            var n = maxTime/hwindow;
            for (var i=0; i<membranePotentials.length; ++i) {
                var spikes = this.spikeCache[membranePotentials[i].getPath()];
                histogram[membranePotentials[i].getPath()] = [];
                for (var j=0; j<n; ++j) {
                    var t0 = j*hwindow; var t1 = (j+1)*hwindow;
                    histogram[membranePotentials[i].getPath()].push(spikes.filter(x => t0<x && x<t1).length);
                }
            }
            return histogram;
        },

        plotAllContinuous: function(plot, groupId) {
            var that=this;
            this.fetchAllTimeseries(function() {
                var variables = Project.getActiveExperiment().getWatchedVariables(true);
                var groupedVars = that.groupBy(variables, function(x) { return x.id });
                if (typeof groupId == 'undefined')
                    var groups = Object.keys(groupedVars);
                else
                    var groups = [groupId];
                for (var i=0; i<groups.length; ++i) {
                    var data = {colorbar: {title: 'Membrane Potential (v)',
                                           titleside: 'right',
                                           titlefont: {color: 'white'},
                                           autotick: true, tickfont: {color: '#FFFFFF'}, xaxis: {title: 'Value'}},
                                showlegend: false, showscale: true, type: 'heatmap'};
                    var variables = groupedVars[groups[i]];
                    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                    variables.sort((x,y) => collator.compare(y.getPath(),x.getPath()));
                    data.x = window.time.getTimeSeries();
                    data.z = variables.map(x => x.getTimeSeries());
                    data.y = variables.map(x => x.getPath().split('.')[1]);
                    var min = Math.min.apply(Math, data.z.map(d => Math.min.apply(Math, d)));
                    var max = Math.max.apply(Math, data.z.map(d => Math.max.apply(Math, d)));
                    data.colorscale = colorbar.genColorscale(min, max, 100, window.voltage_color(min, max), false);
                    var callback = function(plot, data) {
                        plot.plotGeneric([data]);
                        plot.setOptions({margin: {l: 100, r: 10}});
                        plot.setOptions({xaxis: {title: 'Time (s)'}});
                        plot.setOptions({yaxis: {min: -0.5, max: data.y.length-0.5, tickmode: 'auto', type: 'category'}});
                        plot.setName("Continuous Activity");
                        plot.resetAxes();
                    }
                    if (typeof plot == 'undefined')
                        GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then((function(data, groupId) {
                            return function(plot) {
                                callback(plot, data);
                                plot.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                                    that.showActivitySelector(plot, groupId);
                                }));
                            }
                        })(data, groups[i]));
                    else {
                        plot.datasets = [];
                        callback(plot, data);
                    }
                }
            });
        },

        getSpikes: function(variables) {
            var time = window.time.getTimeSeries();
            for (var i=0; i<variables.length; ++i) {
                var timeSeries = variables[i].getTimeSeries();
                if (!this.spikeCache[variables[i].getPath()]) {
                    this.spikeCache[variables[i].getPath()] = [];
                    for (var j=0; j<timeSeries.length; ++j)
                        if (j > 0 && timeSeries[j] >= 0 && timeSeries[j-1] < 0)
                            this.spikeCache[variables[i].getPath()].push(time[j]);
                }
            }
        },

        plotAllSpikes: function(plot, groupId) {
            var that=this;
            this.fetchAllTimeseries(function() {
                var variables = Project.getActiveExperiment().getWatchedVariables(true);
                var groupedVars = that.groupBy(variables, function(x) { return x.id });
                if (typeof groupId == 'undefined')
                    var groups = Object.keys(groupedVars);
                else
                    var groups = [groupId];
                for (var i=0; i<groups.length; ++i) {
                    var callback = function(plot, variables) {
                        var time = window.time.getTimeSeries();
                        var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                        variables.sort((x,y) => collator.compare(y.getPath(),x.getPath()));
                        var traces = [];
                        that.getSpikes(variables);
                        for (var i=0; i<variables.length; ++i) {
                            var trace = {mode: 'markers', type: 'scatter', marker: {size: 5}};
                            var timeSeries = variables[i].getTimeSeries();
                            trace.x = that.spikeCache[variables[i].getPath()];
                            // FIXME: getting pop needs to be more generic
                            trace.marker.color = eval(variables[i].getPath().split('.').splice(0,2).join('.')).getColor();
                            trace.y = trace.x.slice().fill(variables[i].getPath().split('.')[1]);
                            traces.push(trace);
                        }
                        plot.plotGeneric(traces);
                        plot.setOptions({showlegend: false});
                        plot.yaxisAutoRange = true;
                        plot.xaxisAutoRange = false;
                        plot.setOptions({xaxis: {title: 'Time (s)'}});
                        plot.setOptions({yaxis: {tickmode: 'auto', type: 'category'}});
                        plot.setOptions({margin: {l: 100, r: 10}});
                        plot.limit = time[time.length-1];
                        plot.resetAxes();
                        plot.setName("Raster plot");
                    }
                    var variables = groupedVars[groups[i]];
                    if (typeof plot == 'undefined')
                        GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then((function(data, groupId) {
                            return function(plot) {
                                callback(plot, data);
                                plot.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                                    that.showActivitySelector(plot, groupId);
                                }));
                            }
                        })(variables, groups[i]));
                    else {
                        plot.datasets = [];
                        callback(plot, variables);
                    }
                }
            });
        }
    };
});
