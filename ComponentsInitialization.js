define(function (require) {
    return function (GEPPETTO) {
        var React = require('react');
        var ReactDOM = require('react-dom');
        var Route = require('react-router-dom').Route;
        var Switch = require('react-router-dom').Switch;
        var Redirect = require('react-router-dom').Redirect;
        var Router = require('react-router-dom').BrowserRouter;
        var OSBMain = require('./components/OSBMain').default;

        ReactDOM.render(
                <Router basename={GEPPETTO_CONFIGURATION.contextPath}>
                    <Switch>
                        <Route path="/geppetto" component={OSBMain} />
                        <Redirect from="/" to="/geppetto" />
                    </Switch>
                </Router>
            , document.getElementById('mainContainer'));
    };
});
