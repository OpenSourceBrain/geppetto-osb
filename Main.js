global.jQuery = require("jquery");
global.GEPPETTO_CONFIGURATION = require('./GeppettoConfiguration.json');

jQuery(function () {  
  require('geppetto-client-initialization');
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Route = require('react-router-dom').Route;
  var Switch = require('react-router-dom').Switch;
  var Redirect = require('react-router-dom').Redirect;
  var Router = require('react-router-dom').BrowserRouter;
  var OSB = require('./components/OSB').default;

  ReactDOM.render(
    <Router basename={GEPPETTO_CONFIGURATION.contextPath}>
      <Switch>
        <Route path="/geppetto" component={OSB} />
        <Redirect from="/" to="/geppetto" />
      </Switch>
    </Router>
    , document.getElementById('mainContainer'));
});
