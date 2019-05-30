import React, { Component } from 'react';
import ReactPlotly from 'react-plotly.js';
import WidgetCapability from '../../../../js/components/widgets/WidgetCapability';

var Plotly = require('plotly.js/lib/core');
var AbstractComponent = require('../../../../js/components/AComponent');

/*var React = require('react');
var AbstractComponent = require('../../AComponent');
var CreateClass = require('create-react-class');*/

class Plot extends AbstractComponent {
    constructor(props) {
        super(props);
        this.state = { data: [], layout: {
	    autosize: true,
	    showgrid: false,
	    showlegend: true,
	    xaxis: { autorange: true, showgrid: false, showline: true, zeroline: false, mirror: true, ticklen: 0, tickcolor: 'rgb(255, 255, 255)', linecolor: 'rgb(255, 255, 255)', tickfont: { family: 'Helvetica Neue, Helvetica, sans-serif', size: 11, color: 'rgb(255, 255, 255)'}, titlefont: { family: 'Helvetica Neue, Helevtica, sans-serif', size: 12, color: 'rgb(255, 255, 255)'}, ticks: 'outside' },
	    yaxis: { autorange: true, showgrid: false, showline: true, zeroline: false, mirror: true, ticklen: 0, tickcolor: 'rgb(255, 255, 255)', linecolor: 'rgb(255, 255, 255)', tickfont: { family: 'Helvetica Neue, Helevtica, sans-serif', size : 11, color: 'rgb(255, 255, 255)'}, titlefont: { family: 'Helvetica Neue, Helevtica, sans-serif', size: 12, color: 'rgb(255, 255, 255)'}, ticks: 'outside'},
	    margin: { l: 50, r: 0, b: 40, t: 10 },
	    legend : {
	        xanchor : "auto",
	        yanchor : "auto",
	        font: {
		    family: 'Helvetica Neue, Helevtica, sans-serif',
		    size: 12,
		    color : '#fff'
	        },
	        x : 1,
	    },
	    transition: {
	        duration: 0
	    },
	    frame: {
	        duration: 0,
	        redraw: false
	    },
            paper_bgcolor: 'rgb(66, 59, 59, 0.9)',
	    plot_bgcolor: 'transparent',
	    playAll : false,
	    hovermode : 'none'
        }, frames: [], config: {} };
    }

    addDatasetToPlot(dataset) {
        //this.state.data = this.state.data.concat(dataset);
        //this.setState({data: dataset});
    }

    render() {
        return (
                <ReactPlotly
                  data={this.state.data}
            useResizeHandler={true}
            style={{width: "100%", height: "100%"}}
            onInitialized={(figure) => this.setState(figure)}
            onUpdate={(figure) => this.setState(figure)}
            layout={this.state.layout}
                />
        )
    }
}

export default class PlotWidget extends React.Component {
    constructor(props) {
        super(props);
        this.PlotWidget = WidgetCapability.createWidget(Plot);
    }

    resize(width, height) {
        Plotly.relayout($("#" + this.refs.plotWidget.props.id + "> .js-plotly-plot")[0], {width: width, height: height});
    }

    update(event, parameters) {
        return 1;
    }

    componentDidMount() {
        this.refs.plotWidget.dialog.on("resize", function (event, data) {
            this.resize(data.width, data.height);
        }.bind(this));
    }

    addDatasetToPlot(dataset) {
        this.refs.plotWidget.setState({data: this.refs.plotWidget.state.data.concat(dataset)});//addDatasetToPlot(dataset);
    }

    plotTimeSeries(timeSeries) {
        
    }

    plotStateVariable(projectId, experimentId, path) {
        var inst = Instances.getInstance(path);
        if (typeof inst !== 'undefined' && typeof inst.getTimeSeries() !== 'undefined')
            this.plotTimeSeries(inst.getTimeSeries())
        else {
            GEPPETTO.ExperimentsController.getExperimentState(projectId, experimentId, [path], function(){
                this.plotTimeSeries(Instances.getInstance(path).getTimeSeries());
            }.bind(this));
        }
            
      /*if(
            window.Project.getId() == projectId &&
                window.Project.getActiveExperiment() != undefined &&
                window.Project.getActiveExperiment().getId() == experimentId
        ){
            var inst = undefined;
            try {
                inst = window.Instances.getInstance(path);
            } catch (e) {}

            // make line same color as instance unless already a trace with this color
            if (typeof lineOptions == 'undefined' ||
                typeof lineOptions.color == 'undefined') {
                var parent = inst;
                var colors = new Set();
                if (typeof plotWidget != 'undefined' && typeof plotWidget.datasets != 'undefined')
                    colors = new Set(plotWidget.datasets.map(d => d.line.color));
                while (typeof parent.getColor == 'undefined' &&
                       typeof parent.getParent != 'undefined')
                    parent = parent.getParent();
                if (typeof parent.getColor != 'undefined') {
                    if (typeof lineOptions == 'undefined')
                        lineOptions = {};
                    if ((typeof plotWidget != 'undefined' && typeof plotWidget.datasets == 'undefined') || !colors.has(parent.getColor()))
                        lineOptions.color = parent.getColor();
                }
            }

            if (inst != undefined && inst.getTimeSeries() != undefined) {
                // plot, we have data
                this.plotTimeSeries(inst.getTimeSeries(), null, lineOptions);
                plotWidget.updateAxis(inst.getInstancePath());
            } else {
                //var widget = await G.addWidget(0);
                widget.plotData(inst, null, lineOptions).setName(path);
                widget.updateAxis(path);
            }
        } else {
            var cb = function(){
                var i = window.Instances.getInstance(path);
                if(plotWidget != undefined){
                    plotWidget.plotData(i, null, lineOptions);
                    plotWidget.updateAxis(i.getInstancePath());
                } else {
                    //var plot =  G.addWidget(0);
                    plot.plotData(i, null, lineOptions).setName(path);
                    plot.updateAxis(path);
                }
            };*/
        // trigger get experiment data with projectId, experimentId and path, and callback to plot
        
    }

    render() {
        return (
            <this.PlotWidget
              ref="plotWidget"
              id="Plot1"
              componentType="PLOT"
              position={{left: 100, top: 70, position: "absolute"}}
              resizable={true}
              draggable={true}
              fixPosition={false}
              help={true}
              showHistoryIcon={true}
              closable={true}
              minimizable={true}
              maximizable={true}
              collapsable={true} />
        )
    }
}
