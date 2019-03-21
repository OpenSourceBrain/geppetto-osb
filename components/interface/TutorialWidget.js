import React, { Component } from 'react';
import Tutorial from '../../../../js/components/interface/tutorial/Tutorial';
import WidgetCapability from '../../../../js/components/widgets/WidgetCapability';

var osbDefaultTutorial = require('../../osbTutorial.json');
var GEPPETTO = require('geppetto');

export default class TutorialWidget extends React.Component {

    constructor(props) {
        super(props);

        this.closeHandler = this.closeHandler.bind(this);
    }

    closeHandler() {
        this.props.tutorialHandler();
    }

    render() {
        var TutorialWidget = WidgetCapability.createWidget(Tutorial);

        var tutorialsList = [
            "/org.geppetto.frontend/geppetto/extensions/geppetto-osb/osbTutorial.json"]
        return (
                <TutorialWidget
                    id={'widgetTutorial'}
                    componentType={'TUTORIAL'}
                    tutorialData={osbDefaultTutorial}
                    closeByDefault={false}
                    position={{left: 100, top: 70, position: "absolute"}}
                    size={{height: 300, width: 350}}
                    tutorialMessageClass="tutorialMessage"
                    showMemoryCheckbox={true}
                    tutorialsList={tutorialsList}
                    closeHandler={this.closeHandler}
                    isStateLess={true}
                    resizable={true}
                    draggable={true}
                    fixPosition={false}
                    help={true}
                    showHistoryIcon={true}
                    closable={true}
                    minimizable={true}
                    maximizable={true}
                    collapsable={true}
                    ref="tutorialRef" />
        );
    }
}
