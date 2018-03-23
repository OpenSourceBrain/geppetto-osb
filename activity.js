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

        activitySelectorLayout: function(plot) {
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

            var binWidth;
            if (typeof plot !== 'undefined' && typeof plot.binWidth !== 'undefined')
                binWidth = plot.binWidth;
            else
                // 30 bins by default
                binWidth = Math.round(10 * Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].length) / 300;
            $('<label>', {for: 'histbin', id: 'binLabel'}).text('Bin width (s):').appendTo($('#mean .card-text', deck));
            $('<input>', {type: 'text', id: 'histbin', name: 'histbin', value: binWidth}).appendTo($('#mean .card-text', deck));
            // need to set explicitly for some reason…
            $('#histbin').val(binWidth);
            return container;
        },

        showActivitySelector: function(plot, groupId) {
            var that=this;
            var firstClick=false;
            var modalContent=$('<div class="modal fade" id="plot-config-modal" tabindex="-1"></div>')
                .append(this.activitySelectorLayout(plot)[0].outerHTML).modal({keyboard: true});

            function handleFirstClick(event) {
                switch (event.currentTarget.id) {
                case 'mean':
                    that.plotAllMean(plot, $('#histbin').val());
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
                if (event.originalEvent.target.id == 'histbin')
                    return true;
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
            // value seems to only ever be updated once if we don't bind this explicitly (why?)
            modalContent.find('#histbin').on('change', function(e) {
                return $('#histbin').val(e.currentTarget.value);
            });
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

        plotAllMean: function(plot, binWidth) {
            var that = this;
            this.fetchAllTimeseries(function() {
                var membranePotentials = window.getRecordedMembranePotentials();
                var popPotentials = that.groupBy(membranePotentials, function(v) {
                    var populations = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.population)
                        .filter(x => x.getMetaType() !== 'SimpleType');
                    return populations.filter(p => v.getPath().indexOf(p.getName()) > -1)[0].getName()
                });
                var maxTime = window.time.getTimeSeries()[window.time.getTimeSeries().length-1];
                that.getSpikes(membranePotentials);
                var histogram = {};
                var hwindow = isNaN(parseFloat(binWidth)) ? 0.01 : parseFloat(binWidth);
                var n = maxTime/hwindow;
                for (var pop in popPotentials) {
                    histogram[pop] = [];
                    for (var j=0; j<n; ++j) {
                        var count = 0;
                        for (var i=0; i<popPotentials[pop].length; ++i) {
                            var spikes = that.spikeCache[popPotentials[pop][i].getPath()];
                            var t0 = j*hwindow; var t1 = (j+1)*hwindow;
                            count += spikes.filter(x => t0<x && x<t1).length;
                        }
                        histogram[pop].push(count/(popPotentials[pop].length*hwindow));
                    }
                }
                var x = [];
                for (var i=0; i<n; ++i)
                    x.push(i*hwindow+(hwindow/2.0));
                var traces = [];
                for (var pop in popPotentials) {
                    var trace = {mode: 'lines+markers', line: {shape: 'spline'}, type: 'scatter', marker: {size: 5}};
                    trace.x = x;
                    trace.y = histogram[pop];
                    trace.line.color = eval(popPotentials[pop][0].getPath().split('.').splice(0,2).join('.')).getColor();
                    trace.name = pop;
                    traces.push(trace);
                }

                var callback = function(plot, traces, variables) {
                    var time = window.time.getTimeSeries();
                    plot.binWidth = binWidth;
                    plot.plotGeneric(traces, variables);
                    plot.yaxisAutoRange = true;
                    plot.xaxisAutoRange = false;
                    plot.xVariable = window.time;
                    plot.dependent = 'x';
                    plot.setOptions({margin: {l: 50, r: 10}});
                    plot.setOptions({xaxis: {title: 'Time (s)'}});
                    plot.setOptions({yaxis: {title: 'Spikes per second (Hz)', tickmode: 'auto', type: 'number'}});
                    plot.limit = time[time.length-1];
                    plot.resetAxes();
                    plot.setName("Mean firing - " + Project.getActiveExperiment().getName());
                }

                if (typeof plot == 'undefined')
                    GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then((function(traces, variables) {
                        return function(plot) {
                            callback(plot, traces, variables);
                            plot.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                                that.showActivitySelector(plot);
                            }));
                        }
                    })(traces, membranePotentials.map(x=>x.getPath()).reduce((obj, k, i) => ({...obj, [k]: membranePotentials[i] }), {})));
                else {
                    plot.datasets = [];
                    callback(plot, traces, membranePotentials.map(x=>x.getPath()).reduce((obj, k, i) => ({...obj, [k]: membranePotentials[i] }), {}));
                }
            });
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
                    var variablePaths = variables.map(x => x.getPath());
                    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                    variables.sort((x,y) => collator.compare(y.getPath(),x.getPath()));
                    data.x = window.time.getTimeSeries();
                    data.z = variables.map(x => x.getTimeSeries());
                    data.y = variables.map(x => x.getPath().split('.')[1]);
                    //data.name = FIXME
                    var min = Math.min.apply(Math, data.z.map(d => Math.min.apply(Math, d)));
                    var max = Math.max.apply(Math, data.z.map(d => Math.max.apply(Math, d)));
                    data.colorscale = colorbar.genColorscale(min, max, 100, window.voltage_color(min, max), false);
                    var callback = function(plot, data, variables) {
                        plot.plotGeneric([data], variables);
                        plot.xVariable = window.time;
                        plot.dependent = 'z';
                        plot.setOptions({margin: {l: 100, r: 10}});
                        plot.setOptions({xaxis: {title: 'Time (s)'}});
                        plot.setOptions({yaxis: {title: '', min: -0.5, max: data.y.length-0.5, tickmode: 'auto', type: 'category'}});
                        plot.setName("Continuous Activity - " + Project.getActiveExperiment().getName());
                        plot.resetAxes();
                    }
                    if (typeof plot == 'undefined')
                        GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then((function(data, groupId, variables) {
                            return function(plot) {
                                callback(plot, data, variables);
                                plot.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                                    that.showActivitySelector(plot, groupId);
                                }));
                            }
                        })(data, groups[i], variablePaths.reduce((obj, k, i) => ({...obj, [k]: variables[i] }), {})));
                    else {
                        plot.datasets = [];
                        callback(plot, data, variablePaths.reduce((obj, k, i) => ({...obj, [k]: variables[i] }), {}));
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
                var variablePaths = Project.getActiveExperiment().getWatchedVariables(false);
                var groupedVars = that.groupBy(variables, function(x) { return x.id });
                if (typeof groupId == 'undefined')
                    var groups = Object.keys(groupedVars);
                else
                    var groups = [groupId];
                for (var i=0; i<groups.length; ++i) {
                    var callback = function(plot, variables) {
                        var time = window.time.getTimeSeries();
                        var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                        var vSorted = Object.values(variables).sort((x,y) => collator.compare(y.getPath(),x.getPath()));
                        var traces = [];
                        that.getSpikes(vSorted);
                        for (var i=0; i<vSorted.length; ++i) {
                            var trace = {mode: 'markers', type: 'scatter', marker: {size: 5}};
                            var timeSeries = vSorted[i].getTimeSeries();
                            trace.x = that.spikeCache[vSorted[i].getPath()];
                            // FIXME: getting pop needs to be more generic
                            trace.marker.color = eval(vSorted[i].getPath().split('.').splice(0,2).join('.')).getColor();
                            trace.y = trace.x.slice().fill(vSorted[i].getPath().split('.')[1]);
                            traces.push(trace);
                        }
                        plot.plotGeneric(traces, variables);
                        plot.setOptions({showlegend: false});
                        plot.yaxisAutoRange = true;
                        plot.xaxisAutoRange = false;
                        plot.xVariable = window.time;
                        plot.dependent = 'x';
                        plot.setOptions({xaxis: {title: 'Time (s)'}});
                        plot.setOptions({yaxis: {title: '', tickmode: 'auto', type: 'category'}});
                        plot.setOptions({margin: {l: 100, r: 10}});
                        plot.limit = time[time.length-1];
                        plot.resetAxes();
                        plot.setName("Raster plot - " + Project.getActiveExperiment().getName());
                    }
                    if (typeof plot == 'undefined')
                        GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then((function(variables, groupId) {
                            return function(plot) {
                                callback(plot, variables);
                                plot.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                                    that.showActivitySelector(plot, groupId);
                                }));
                            }
                        })(variablePaths.reduce((obj, k, i) => ({...obj, [k]: variables[i] }), {}), groups[i]));
                    else {
                        plot.datasets = [];
                        callback(plot, variablePaths.reduce((obj, k, i) => ({...obj, [k]: variables[i] }), {}));
                    };
                }
            });
        }
    };
});