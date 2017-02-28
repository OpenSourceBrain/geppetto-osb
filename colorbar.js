define(function(require) {

    // global functions: required for menu actions (ie. eval'd strings...)
    
    window.setupColorbar = function(instances, scalefn, normalize, name, axistitle) {
        if (instances.length > 0) {
            var c = G.addWidget(GEPPETTO.Widgets.PLOT);
            c.setName(name);
            c.setSize(125, 350);
            c.setPosition(window.innerWidth - 375, window.innerHeight - 150);

            c.plotOptions = colorbar.defaultLayout();
            c.plotOptions.xaxis.title = axistitle;

            var callback = function() {
                for (var instance of instances) {
                    c.updateXAxisRange(instance.getTimeSeries());
                }
                // this should be generalized beyond ca
                if (normalize) {
                    window.color_norm = scalefn(c.plotOptions.xaxis.max);
                    //scalefn = window.ca_color;
                    G.removeBrightnessFunctionBulkSimplified(G.litUpInstances);
                    G.addBrightnessFunctionBulkSimplified(window.getRecordedCaConcs(), window.color_norm);
                }

                var data = colorbar.setScale(c.plotOptions.xaxis.min, c.plotOptions.xaxis.max, window.color_norm, false);
                c.plotGeneric(data);
            };

            if (Project.getActiveExperiment().status == "COMPLETED") {
                // only fetch instances for which state not already locally defined
                var unfetched_instances = instances.filter(function(x){ return x.getTimeSeries() == undefined });
                var unfetched_paths = unfetched_instances.map(function(x){ return x.getPath(); });
                if (unfetched_paths.length > 0) {
                    GEPPETTO.ExperimentsController.getExperimentState(Project.getId(), Project.getActiveExperiment().getId(), unfetched_paths, $.proxy(callback, this));
                } else {
                    $.proxy(callback, this)();
                }
            } else {
                GEPPETTO.FE.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, "Experiment " + experiment.name + " with id " + experiment.id + " isn't completed.");
            }
        }
    }

    // to be passed to SceneController.lightUpEntity
    window.voltage_color = function(x) {
        x = (x+0.07)/0.1; // normalization
        if (x < 0) { x = 0; }
        if (x > 1) { x = 1; }
        if (x < 0.25) {
            return [0, x*4, 1];
        } else if (x < 0.5) {
            return [0, 1, (1-(x-0.25)*4)];
        } else if (x < 0.75) {
            return [(x-0.5)*4, 1, 0];
        } else {
            return [1, (1-(x-0.75)*4), 0];
        }
    };

    window.ca_color = function(max) {
        if(max == undefined) { max = 1; }
        return function(x) {
            x = x/max; // normalization
            if (x < 0) { x = 0; }
            if (x > 1) { x = 1; }
            // [0,0.31,0.02]-[0,1,0.02]
            return [0, 0.31+(0.686*x), 0.02];
        };
    };

    return {
        defaultLayout: function() {
            return {
                autosize : true,
                width : '100%',
                height : '100%',
                margin: {
                    l: 0,
                    r: 0,
                    b: 40,
                    t: 0,
                    pad: 4
                },
                xaxis: {
                    title: '',
                    range: [],
                    autotick: true,
                    ticks: 'outside',
                    showticklabels: true,
                    nticks: 8,
                    ticklen: 4,
                    tickcolor: '#000'
                },
                yaxis: {
                    ticks: '',
                    showticklabels: false,
                }
            };
        },

        nbars: 100,
        data: {type: 'heatmap', showscale: false},

        genColorscale: function(min, max, n, f) {
            var colorscale = [];
            var step = (max-min)/n;
            var x = min;
            var rgb = [];
            
            for (var i=0; i<n; ++i) {
                colorscale.push([i/n, f(x)]);
                colorscale.push([(i+1)/n, f(x)]);
                x += step;
            }

            return colorscale;
        },

        setScale: function(min, max, scalefn, normalize){
            // Three.js uses float 0-1 RGB values, here we convert to 0-255
            var scalefn_255 = function(scalefn) {
                return function(x){
                    if (normalize) {
                        x = x/max;
                        if (x < 0) { x = 0; }
                        if (x > 1) { x = 1; }
                    }
                    var r,g,b;
                    [r,g,b] = scalefn(x).map(function(y){ return y*255; });
                    return "rgb(" + r + "," + g + "," + b + ")";
                }
            };
            
            var colorscale = this.genColorscale(min, max, this.nbars, scalefn_255(scalefn));

            var xdata = [];
            for (var i=0; i<this.nbars; ++i){
                xdata.push(min+(i*(max-min)/this.nbars));
            }

            this.data.x = xdata;
            this.data.z = [[...Array(this.nbars).keys()]];
            if (colorscale != undefined) {
                this.data.colorscale = colorscale;
            }

            return this.data;
        }
    };
});
