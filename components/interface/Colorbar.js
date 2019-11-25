import React, { Component } from 'react';

export default class Colorbar extends React.Component {
  constructor (props) {
    super(props);
    this.nbars = 100;
    this.data = { type: 'heatmap', showscale: false, colorbar: { autotick: false, tick0: 0, dtick: 1 } };
  }
  voltage_color (min, max) {
    if (max == undefined || min == undefined) {
      min = 0; max = 1; 
    }
    return function (x) {
      x = (x - min) / (max - min);
      var y = (1 - x) / 0.25;
      var i = Math.floor(y);
      var j = y - i;
      var r, g, b;
      switch (i) {
      case 0: r = 1;g = j;b = 0;break;
      case 1: r = 1 - j;g = 1;b = 0;break;
      case 2: r = 0;g = 1;b = j;break;
      case 3: r = 0;g = 1 - j;b = 1;break;
      case 4: r = 0;g = 0;b = 1;break;
      }
      return [r, g, b];
    }
  }

  genColorscale (min, max, n, f, normalize) {
    // Three.js uses float 0-1 RGB values, here we convert to 0-255
    var scalefn_255 = function (scalefn) {
      return function (x){
        if (normalize) {
          x = x / max;
          if (x < 0) {
            x = 0; 
          }
          if (x > 1) {
            x = 1; 
          }
        }
        var r,g,b;
        [r,g,b] = scalefn(x).map(function (y){
          return Math.round(y * 255); 
        });
        return "rgb(" + r + "," + g + "," + b + ")";
      }
    };

    f = scalefn_255(f);
    
    var colorscale = [];
    var step = (max - min) / n;
    var x = min;
    var rgb = [];
    
    for (var i = 0; i < n; ++i) {
      colorscale.push([i / n, f(x)]);
      colorscale.push([(i + 1) / n, f(x)]);
      x += step;
    }

    return colorscale;
  }

  hslToRgb (h, s, l){
    var r, g, b;

    if (s == 0){
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb (p, q, t){
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b];
  }

  hexToRgb (hex) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return [r / 255,g / 255,b / 255]
  }

  setScale (min, max, scalefn, normalize){
    var colorscale = this.genColorscale(min, max, this.nbars, scalefn, normalize);

    var xdata = [];
    for (var i = 0; i < this.nbars; ++i){
      xdata.push(min + (i * (max - min) / this.nbars));
    }

    this.data.x = xdata;
    this.data.z = [[...Array(this.nbars).keys()]];
    if (colorscale != undefined) {
      this.data.colorscale = colorscale;
    }

    return this.data;
  }

  setupColorbar (instances, scalefn, normalize, name, axistitle, left, top, cb) {
    if (instances.length > 0) {
      var that = this;
      G.addWidget('PLOT', { isStateless: true }).then(
        c => {
          c.setName(name);
          c.setSize(125, 350);
          if (typeof top !== 'undefined' && typeof left !== 'undefined') {
            c.setPosition(left, top);
          } else {
            c.setPosition(window.innerWidth - 375, window.innerHeight - 150);
          }

          // c.plotOptions = colorbar.defaultLayout();
          c.setXAxisTitle(axistitle);
          // c.yaxisAutoRange = true; // for correct reseting of axes

          c.colorscaleMenu = [{
            "label": "Rainbow",
            "method": "setScale",
            "arguments": [this.voltage_color, true]
          },{
            "label": "Sequential",
            "method": "setScale",
            "arguments": [window.sequential_color, true]
          },{
            "label": "Sequential 2",
            "method": "setScale",
            "arguments": [window.sequential_color2, true]
          }];
          c.setScale = function (scale, norm) {
            if (norm) {
              scale = scale(c.state.layout.xaxis.range.min, c.state.layout.xaxis.range.max)
            }
            var data = that.setScale(c.state.layout.xaxis.range.min, c.state.layout.xaxis.range.max, scale, false);
            var instances = GEPPETTO.SceneController.getColorFunctionInstances();
            /*
             * manually clear instances to avoid lit entities change event
             * (triggers destroying colorbar in PlotController…)
             */
            this.refs.osbCanvas.engine.colorController.litUpInstances = [];
            for (var i = 0; i < instances.length; ++i) {
              this.refs.osbCanvas.engine.colorController.clearOnNodeUpdateCallback(instances[i]);
            }
            GEPPETTO.SceneController.addColorFunction(instances, scale, false);
            c.addDatasetToPlot(data);
          }.bind(this);
          c.addButtonToTitleBar($("<div class='fa fa-align-left' title='Colorscale'></div>").on('click', function (event) {
            c.showMenu(c.colorscaleMenu, "colorscaleMenu", event);
            event.stopPropagation();
          }));


          var callback = function () {
            for (var instance of instances) {
              c.updateXAxisRange(instance.getTimeSeries().filter(x => !isNaN(x)));
            }
            if (normalize) {
              window.color_norm = scalefn(c.state.layout.xaxis.range.min, c.state.layout.xaxis.range.max);
              GEPPETTO.SceneController.removeColorFunction(GEPPETTO.SceneController.getColorFunctionInstances());
              GEPPETTO.SceneController.addColorFunction(instances, window.color_norm);
            }

            var data = that.setScale(c.state.layout.xaxis.range.min, c.state.layout.xaxis.range.max, normalize ? window.color_norm : scalefn, false);
            c.scalefn = normalize ? window.color_norm : scalefn;
            c.addDatasetToPlot(data);

            if (cb) {
              cb();
            }
          };

          if (Project.getActiveExperiment().status == "COMPLETED") {
            // only fetch instances for which state not already locally defined
            var unfetched_instances = instances.filter(function (x){
              return x.getTimeSeries() == undefined 
            });
            var unfetched_paths = unfetched_instances.map(function (x){
              return x.getPath(); 
            });
            if (unfetched_paths.length > 0) {
              GEPPETTO.ExperimentsController.getExperimentState(Project.getId(), Project.getActiveExperiment().getId(), unfetched_paths, callback);
            } else {
              callback();
            }
          } else {
            GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, "Experiment " + Project.getActiveExperiment().getName() + " with id " + Project.getActiveExperiment().getId() + " isn't completed.");
          }
        });
    }
  }
  render () {
    return (
      <div></div>
    )
  }

}
