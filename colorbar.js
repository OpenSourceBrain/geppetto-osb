define(function(require) {

    // global functions: required for menu actions (ie. eval'd strings...)
    function hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r, g, b];
    }

    function hexToRgb(hex) {
        var bigint = parseInt(hex, 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;

        return [r/255,g/255,b/255]
    }

    // to be passed to SceneController.lightUpEntity
    window.voltage_color = function(min, max) {
        if(max == undefined || min == undefined) { min = 0; max = 1; }
        return function(x) {
            x = (x-min)/(max-min);
            var y=(1-x)/0.25;
            var i=Math.floor(y);
            var j=y-i;
            var r, g, b;
            switch(i)
            {
                case 0: r=1;g=j;b=0;break;
                case 1: r=1-j;g=1;b=0;break;
                case 2: r=0;g=1;b=j;break;
                case 3: r=0;g=1-j;b=1;break;
                case 4: r=0;g=0;b=1;break;
            }
            return [r, g, b];
        }
    };
    
    window.sequential_color = function(min, max) {
        if(max == undefined || min == undefined) { min = 0; max = 1; }
        return function(x) {
            x = (x-min)/(max-min);
            var c = ["fafcfe", "f5f9fd", "f0f6fc", "ebf3fb", "e6f0fb", "e1edfa", "ddeaf9", "d8e7f8", "d4e4f8", "cfe2f7", "cbdff6", "c7ddf6", "c3daf5", "bfd8f4", "bbd5f4", "b7d3f3", "b3d0f2", "afcef2", "abccf1", "a7c9f0", "a4c7f0", "a0c5ef", "9dc3ee", "99c1ee", "96bfed", "92bcec", "8fbaec", "8bb8eb", "88b6ea", "85b4e9", "82b2e8", "7fb0e7", "7caee7", "78ace6", "75aae5", "73a8e4", "70a7e3", "6da5e1", "6aa3e0", "67a1df", "649fde", "629ddd", "5f9bdb", "5c99da", "5a97d8", "5795d7", "5593d5", "5291d4", "508fd2", "4e8dd0", "4b8bce", "4989cc", "4787ca", "4585c8", "4383c6", "4181c4", "3f7fc2", "3d7dbf", "3b7bbd", "3979ba", "3877b8", "3675b5", "3472b2", "3370af", "326ead", "306ca9", "2f69a6", "2e67a3", "2d64a0", "2c629c", "2a6099", "2a5d95", "295b92", "28588e", "27568a", "265386", "255082", "254e7e", "244b79", "234875", "224570", "22436c", "214067", "203d62", "1f3a5e", "1e3759", "1e3454", "1d314f", "1c2e4a", "1b2b44", "19283f", "18253a", "172234", "161f2f", "141b29", "131824", "11151e", "0e1119", "0a0c13", "05060b"];

            var i = Math.round((x*100)-1);
            if (i<0) i = 0
            return hexToRgb(c[i]);
            /*var y=(1-x)/0.1;
            var i=Math.floor(y);
            //var j=y-i;
            var r, g, b;
            
            switch(i)
            {
                case 0: r=0;g=1;b=0;break;
                case 1: r=0;g=0.8;b=0;break;
                case 2: r=0;g=0.6;b=0;break;
                case 3: r=0;g=0.4;b=0;break;
                case 4: r=0;g=0.2;b=0;break;
            }
            return [1/(i+i), 0, 0];*/
        }
    };

    window.ca_color = function(min, max) {
        if(max == undefined || min == undefined) { min = 0; max = 1; }
        return function(x) {
            x = (x-min)/(max-min); // normalization
            return hslToRgb((120-(90*x))/255.0, 0.5+(0.5*x), 0.2+(0.4*x));
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
                    tickcolor : 'rgb(255, 255, 255)',
		    tickfont: {
			family: 'Helvetica Neue, sans-serif',
			size : 11,
			color: 'rgb(255, 255, 255)'
		    },
		    titlefont : {
			family: 'Helvetica Neue, sans-serif',
			size : 12,
			color: 'rgb(255, 255, 255)'
		    },
                },
                yaxis: {
                    ticks: '',
                    showticklabels: false
                },
                paper_bgcolor: 'rgba(66, 59, 59, 0.90)',
		plot_bgcolor: 'transparent'
            };
        },

        nbars: 100,
        data: {type: 'heatmap', showscale: false, colorbar: {autotick: false, tick0: 0, dtick: 1}},

        genColorscale: function(min, max, n, f, normalize) {
            // Three.js uses float 0-1 RGB values, here we convert to 0-255
            var scalefn_255 = function(scalefn) {
                return function(x){
                    if (normalize) {
                        x = x/max;
                        if (x < 0) { x = 0; }
                        if (x > 1) { x = 1; }
                    }
                    var r,g,b;
                    [r,g,b] = scalefn(x).map(function(y){ return Math.round(y*255); });
                    return "rgb(" + r + "," + g + "," + b + ")";
                }
            };

            f = scalefn_255(f);
            
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
            var colorscale = this.genColorscale(min, max, this.nbars, scalefn, normalize);

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
