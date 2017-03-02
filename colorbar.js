define(function(require) {

    // global functions: required for menu actions (ie. eval'd strings...)
    
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
                    l: 10,
                    r: 10,
                    b: 40,
                    t: 10,
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
