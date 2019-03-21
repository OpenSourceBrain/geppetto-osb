import React, { Component } from 'react';

export default class ProjectionsDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = { show: false, loadLink: true, msg: '' };
        this.loadConnections = this.loadConnections.bind(this);
    }

    loadConnections (e) {
        e.preventDefault();
        Model.neuroml.resolveAllImportTypes(function() {
            this.setState({msg: window.Model.neuroml.importTypes.length +
                           " projections and " +
                           window.Model.neuroml.connection.getVariableReferences().length +
                           " connections were successfully loaded.",
                           loadLink: false});
        }.bind(this));
    }

    render() {
        return (
            <div>
                { this.state.show ?
                  <div className="alert alert-warning osb-notification alert-dismissible" role="alert">
                  <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                  </button>
                  <span className="osb-notification-text">{this.state.msg}</span>
                  { this.state.loadLink ? <span><a href="#" onClick={this.loadConnections} className="alert-link">Click here to load the connections.</a>  (Note: depending on the size of the network, loading connections may take up to two minutes).</span> : null }
                  </div>
                  : null }
            </div>
        )
    }
}
