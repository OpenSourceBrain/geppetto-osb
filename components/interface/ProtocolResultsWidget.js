import React, { Component } from 'react';
import WidgetCapability from 'geppetto-client/js/components/widgets/WidgetCapability';
import AbstractComponent from 'geppetto-client/js/components/AComponent';

var Utilities = require('../../utilities.js');
// var AbstractComponent = require('../../../../js/components/AComponent');

class ProtocolResultsAbstract extends AbstractComponent {

  constructor (props) {
    super(props);
    this.state = { protocols: Utilities.getProtocolExperimentsMap() };
  }

  /*
   *
   * // create markup for the protocol with protocol name and a 'plot results' shortcut link
   * var markup = '';
   * for(var protocol in protocolExperimentsMap){
   * var exps = protocolExperimentsMap[protocol];
   * // foreach protocol create markup
   * markup += "<p style='float:left; color:white; margin-right:5px;'>[P] {0} ({1} experiments) </p>".format(protocol, exps.length);
   * var buttonsMarkup = "<a class='btn fa fa-area-chart' title='Plot data' onclick='window.plotProtocolResults({0}, event)'></a>".format('"'+protocol+'"');
   * buttonsMarkup += "<a class='btn fa fa-trash-o' title='Plot data' onclick='window.deleteProtocol({0}, event)'></a>".format('"'+protocol+'"');
   * hmarkup += "<p style='margin-top:-3px;'>" + buttonsMarkup + "</p>";
   * }
   *
   * // create popup and set markup if any
   * if(markup == ''){
   * markup = "<p>No protocols found for this project.</p>"
   * }
   * popup.setMessage(markup);
   * };
   *
   */

  componentDidMount () {
    var dialog = this.dialog.parent();
    var closeButton = dialog.find("button.ui-dialog-titlebar-close");
    closeButton.off("click");
    closeButton.click(this.close.bind(this));
  }

  close () {
    this.props.closeHandler();
  }

  updateProtocols (protocols) {
    this.setState(protocols);
  }

  renderListItem (name, expts, i) {
    return <li key={i}><span style={{ float: 'left', color: 'white', marginRight:'5px' }}>{"[P] {0} ({1} experiments)".format(name, expts)}</span><a className="btn fa fa-area-chart" title="Plot data"></a></li>
  }

  render () {
    if (Object.keys(this.state.protocols).length == 0) {
      return <p>No protocols found for this project.</p>
    } else {
      return (
        <ul>
          {Object.keys(this.state.protocols).map(function (x,i) {
            {this.renderListItem(x, this.state.protocols[x], i)}
          }.bind(this))}
        </ul>
      )
    }
  }
}

export default class ProtocolResultsWidget extends React.Component {
  constructor (props) {
    super(props);
    this.closeHandler = this.closeHandler.bind(this);
    this.ProtocolResultsWidget = WidgetCapability.createWidget(ProtocolResultsAbstract);
  }

  closeHandler () {
    this.props.closeHandler();
  }
  updateProtocols (protocols) {
    this.refs.widgetRef.updateProtocols(protocols);
  }
  show () {
    if (this.refs.widgetRef.visible) {
      this.refs.widgetRef.shake();
    } else {
      this.refs.widgetRef.show();
    }
  }

  render () {
    return (
      <this.ProtocolResultsWidget
        id="widgetProtocolResults"
        ref="widgetRef"
        title="Protocol Summary"
        componentType="PROTOCOLRESULTS"
        closeHandler={this.closeHandler}
        closeByDefault={true}
        position={{ left: 100, top: 70, position: "absolute" }}
        size={{ height: 300, width: 350 }}
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
