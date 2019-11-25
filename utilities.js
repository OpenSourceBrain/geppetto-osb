var d3 = require('d3');
define(function (require) {
  return {
    getProtocolExperimentsMap: function (){
      var experiments = Project.getExperiments();
      var protocolExperimentsMap = {};
      for (var i = 0; i < experiments.length; i++){
        if (experiments[i].getName().startsWith('[P]')){
          // parse protocol pattern
          var experimentName = experiments[i].getName();
          var protocolName = experimentName.substring(experimentName.lastIndexOf("[P] ") + 4,experimentName.lastIndexOf(" - "));
          if (protocolExperimentsMap[protocolName] == undefined){
            protocolExperimentsMap[protocolName] = [experiments[i]];
          } else {
            protocolExperimentsMap[protocolName].push(experiments[i]);
          }
        }
      }
      return protocolExperimentsMap;
    },

    persistWarning: function () {
      if (!GEPPETTO.UserController.hasWritePermissions()){
        var message = "";

        if (GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT)){
          message = "You first need to save your project by clicking on the star icon in the top toolbar.";
        } else {
          message = "You don’t have write permissions for this project (read only).";
        }
        GEPPETTO.ModalFactory.infoDialog("Cannot run experiment", message);
        return true;
      } else {
        return false;
      }
    },

    getNodeCustomColormap: function () {
      var cells = GEPPETTO.ModelFactory.getAllInstancesOf(
        GEPPETTO.ModelFactory.getAllTypesOfType(GEPPETTO.ModelFactory.geppettoModel.neuroml.network)[0])[0].getChildren();
      var domain = [];
      var range = [];
      for (var i = 0; i < cells.length; ++i) {
        if (cells[i].getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
          domain.push(cells[i].getName());
        } else {
          domain.push(cells[i].getPath());
        }
        // FIXME: getColor function should exist here but this has occasionally broken
        if (typeof cells[i].getColor === 'function') {
          range.push(cells[i].getColor());
        } else {
          range.push(GEPPETTO.Resources.COLORS.DEFAULT);
        }
      }
      // if everything is default color, use a d3 provided palette as range
      if (range.filter(function (x) {
        return x !== GEPPETTO.Resources.COLORS.DEFAULT; 
      }).length == 0) {
        return d3.scaleOrdinal(d3.schemeCategory20).domain(domain);
      } else {
        return d3.scaleOrdinal(range).domain(domain);
      }
    }
  };
});
