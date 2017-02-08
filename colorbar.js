define(function(require) {
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

        setScale: function(min, max, scalefn){
            // Three.js uses float 0-1 RGB values, here we convert to 0-255
            var scalefn_255 = function(scalefn) {
                return function(x){
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
