var Utilities = require('../../utilities');

var runMenuConfig = {
  id: "runMenuButton",
  openByDefault: false,
  closeOnClick: true,
  label: ' Run',
  iconOn: 'fa fa-cogs',
  iconOff: 'fa fa-cogs',
  disableable: true,
  // disabled: true,
  menuPosition: {
    top: 40,
    right: 450
  },
  menuSize: {
    height: "auto",
    width: "auto"
  },
  menuItems: [{
    label: "Run active experiment",
    value: "run_experiment",
  }, {
    label: "Add & run protocol",
    value: "add_protocol",
  }]
};

var runMenuHandler = function (value) {
  switch (value) {
  case "run_experiment":
    runActiveExperiment();
    break;
  case "add_experiment":
    addNewExperiment();
    break;
  case "add_protocol":
    showAddProtocolDialog();
    break;
  }
}

var addNewExperiment = function () {
  if (!Utilities.persistWarning()) {
    Project.getActiveExperiment().clone();
  }
}

var runActiveExperiment = function () {
  if (!Utilities.persistWarning()) {
    GEPPETTO.Flows.onRun('Project.getActiveExperiment().run();');
  }
}

var getPulseGenerators = function () {
  var potentialInstances = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith(".i");
  var currentInstances = [];
  for (var i = 0; i < potentialInstances.length; ++i) {
    try {
      currentInstances.push(Instances.getInstance(potentialInstances[i]));
    } catch (e) {
      break;
    }
  }
  var pulseGenerators = [];
  if (Model.neuroml.pulseGenerator) {
    var types = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.pulseGenerator);
    types.splice(1);
  }
  pulseGenerators = GEPPETTO.ModelFactory.getAllInstancesOfType(Model.neuroml.pulseGenerator);
  return pulseGenerators;
}

var getSomaVariableInstances = function (stateVar) {
  var instances = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.' + stateVar);
  var instancesToRecord = [];
  for (var i = 0; i < instances.length; i++) {
    var s = instances[i].split('.' + stateVar)[0];
    if (s.endsWith("_0") || s.endsWith("]")) {
      instancesToRecord.push(instances[i]);
    }
  }
  return Instances.getInstance(instancesToRecord);
};

var showAddProtocolDialog = function (callback) {
  if (!Utilities.persistWarning()) {
    if (getPulseGenerators().length > 0) {
      var formWidget = null;
      var formId = "addProtocolForm";
      var formName = "Add & Run Protocol";
      var schema = {
        type: "object",
        required: [
          "protocolName",
          "pulseStart",
          "pulseStop",
          "ampStart",
          "ampStop",
          "timeStep",
          "simDuration"
        ],
        properties: {
          pulseGenerator: {
            type: "string",
            title: "Current Input",
            enum: GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith(".i"),
            enumNames: GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith(".i"),
            default: GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith(".i")[0],
          },
          protocolName: {
            type: "string",
            title: "Protocol Name"
          },
          pulseStart: {
            type: "number",
            title: "Pulse Start (ms)"
          },
          pulseStop: {
            type: "number",
            title: "Pulse Stop (ms)"
          },
          ampStart: {
            type: "number",
            title: "Amplitude Start (nA)"
          },
          ampStop: {
            type: "number",
            title: "Amplitude Stop (nA)"
          },
          ampStep: {
            type: "number",
            title: "Amplitude Step (nA)"
          },
          timeStep: {
            type: 'number',
            title: 'Time Step (ms)'
          },
          simDuration: {
            type: "number",
            title: "Sim duration (ms)"
          }
        }
      };

      var formData = {
        protocolName: 'Name your protocol',
        pulseStart: 50,
        pulseStop: 550,
        ampStart: -0.1,
        ampStop: 0.3,
        ampStep: 0.05,
        timeStep: 0.02,
        simDuration: 600
      };

      var submitHandler = function (data) {
        var formData = data.formData;

        var experimentNamePattern = "[P] " + formData.protocolName + " - ";

        function experimentCompleteHandler (){
          var protocolExperimentsMap = Utilities.getProtocolExperimentsMap();

          var protocolExperiments = [];
          for (var protocol in protocolExperimentsMap){
            // When an experiment is completed check if all experiments for this protocol are completed
            if (protocol == formData.protocolName){
              protocolExperiments = protocolExperimentsMap[protocol];
            }
          }

          var allCompleted = true;
          for (var i = 0; i < protocolExperiments.length; i++){
            if (protocolExperiments[i].status != "COMPLETED"){
              allCompleted = false;
              break;
            }
          }

          if (allCompleted){
            // FIXME: showProtocolSummary();
            GEPPETTO.off(GEPPETTO.Events.Experiment_completed, experimentCompleteHandler);
          }
        }

        // what does it do when the button is pressed
        GEPPETTO.on(GEPPETTO.Events.Experiment_completed, experimentCompleteHandler);
                
        // build list of paths for variables to watch
        var watchedVars = [];
        if (Project.getActiveExperiment() != undefined){
          watchedVars = Project.getActiveExperiment().getWatchedVariables();
        }
        // concat default paths
        var defaultVars = getSomaVariableInstances('v').map(function (item){
          return item.getPath();
        });
        for (var v = 0; v < defaultVars.length; v++){
          if (!watchedVars.includes(defaultVars[v])){
            watchedVars.push(defaultVars[v]);
          }
        }

        // loop based on amplitude delta / timestep
        var experimentsNo = (formData.ampStop - formData.ampStart) / formData.ampStep;
        var experimentsData = [];
        for (var i = 0; i < experimentsNo; i++){
          // build parameters map
          var amplitude = (formData.ampStart + formData.timeStep * i).toFixed(2) / 1;
          var pulseGenerators = getPulseGenerators();
          var pulseGeneratorPath = "";
          if (pulseGenerators.length > 0) {
            pulseGeneratorPath = pulseGenerators.filter(x => x.getPath() + '.i' === formData.pulseGenerator)[0].getVariable().getPath().split(".").splice(1).join('.');
          }
          var parameterMap = {
            i: { [pulseGeneratorPath + '.amplitude']: amplitude },
            pulseStart: { [pulseGeneratorPath + '.delay']: formData.pulseStart },
            pulseDuration: { [pulseGeneratorPath + '.duration']: formData.pulseStop - formData.pulseStart }
          };

          var simpleModelParametersMap = {};
          // build experiment name based on parameters map
          var experimentName = experimentNamePattern;
          for (var label in parameterMap){
            experimentName += label + "=";
            for (var p in parameterMap[label]){
              experimentName += parameterMap[label][p] + ",";
              simpleModelParametersMap[p] = parameterMap[label][p];
            }
          }

          // keep only the first parameter in te experiment name to avoid making it too long
          experimentName = experimentName.slice(0, experimentName.indexOf(','));

          experimentsData.push({
            name : experimentName,
            modelParameters: simpleModelParametersMap,
            watchedVariables: watchedVars,
            timeStep: formData.timeStep / 1000,
            duration: formData.simDuration / 1000,
            simulator: 'neuronSimulator',
            aspectPath: Instances[0].getInstancePath(true),
            simulatorParameters: { target: Instances[0].getType().getId() }
          });
        }

        var runExperiments = function (){
          // GEPPETTO.trigger('stop_spin_logo');
          GEPPETTO.ModalFactory.infoDialog("Protocol created", "Your protocol has been created and is now running. Open the experiments table to check on progress.");

          // retrieve all protocol experiments and run them all
          var exps = Project.getExperiments();
          for (var e = 0; e < exps.length; e++){
            // check if the experiment name starts with the correct pattern
            if (exps[e].getName().indexOf(experimentNamePattern) == 0){
              // it's part of the protocol, run it
              exps[e].run();
            }
          }
        };

        // GEPPETTO.trigger('spin_logo');
        Project.newExperimentBatch(experimentsData, runExperiments);

        // close widget
        formWidget.destroy();
      };
            
      var errorHandler = function () {
        // error handling
      };

      var changeHandler = function (formObject) {
        // handle any changes on form data
      };

      GEPPETTO.ComponentFactory.addWidget('FORM', {
        id: formId,
        name: formName,
        schema: schema,
        formData: formData,
        submitHandler: submitHandler,
        errorHandler: errorHandler,
        changeHandler: changeHandler
      }).then(() => formWidget = this);
    } else {
      GEPPETTO.ModalFactory.infoDialog("No Pulse Generators", "Cannot add protocol for model with no NeuroML pulseGenerator inputs.");
    }
  }
};

var toggleRunMenuOptions = function (runMenuRef) {
  if (!GEPPETTO.UserController.hasWritePermissions() && !GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT)) {
    runMenuRef.addMenuItem({
      label: "Sign up and log in to run experiments",
      action: "top.window.location = 'http://www.opensourcebrain.org/account/register'",
      value: "add_experiment",
      disabled: false
    });
  }
};

window.showExecutionDialog = function (callback) {
  var formCallback = callback;

  var formId = "exptRunForm";

  var formName = "Run experiment";

  var temperatureVar = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.network)[0].getVariables().filter(x => x.getId() === 'temperature')

  var schema = {
    type: "object",
    required: ["experimentName", "timeStep", "length", "simulator", "numberProcessors"],
    properties: {
      experimentName: {
        type: "string",
        title: "Experiment Name"
      },
      timeStep: {
        type: 'number',
        title: 'Time Step (s)'
      },
      length: {
        type: 'number',
        title: 'Length (s)'
      },
      simulator: {
        type: "string",
        title: "Simulator",
        enum: ["neuronSimulator", "netpyneSimulator", "jneuromlSimulator", "neuronNSGSimulator", "netPyNENSGSimulator"],
        enumNames: ["Neuron on OSB", "NetPyNE on OSB", "jNeuroML on OSB", "Neuron on NSG", "NetPyNE on NSG"]
      },
      numberProcessors: {
        type: 'number',
        title: 'Number of Processors'
      },
      randomSeed: {
        type: 'number',
        title: 'Random seed'
      },
      ...(temperatureVar.length > 0)
                && {
                  'temperature': {
                    type: 'number',
                    title: 'Temperature'
                  }
                },
      dropboxUpload: {
        type: 'boolean',
        title: 'Upload results to Dropbox on completion'
      }
    }
  };

  var uiSchema = {
    dropboxUpload: {
      classNames: "dropbox-check",
      ...(!GEPPETTO.UserController.getDropboxToken()) && { 'ui:disabled': 'false' }
    }
  };

  var formData = {
    experimentName: Project.getActiveExperiment().getName(),
    numberProcessors: 1,
    randomSeed: 123,
    temperature: temperatureVar[0] ? temperatureVar[0].getInitialValue() : undefined
  };

  // figure out aspect configuration path ref
  var pathRef = null;
  if (Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()] != undefined){
    pathRef = window.Instances[0].getId();
  } else if (Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getInstancePath(true)] != undefined) {
    pathRef = window.Instances[0].getInstancePath(true);
  }

  if (pathRef != null) {
    // dt and length can be overriden by neuroml property tags. replace this if you know a better way to extract the info
    var network_type = GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.network)[0];
    // var instance = GEPPETTO.ModelFactory.getAllInstancesOfType(network_type)[0];
    var properties = network_type.getChildren()
      .filter(x => x.getName() === "Property").map(x => x.getAnonymousTypes()).map(x => x[0].tag.getWrappedObj().initialValues[0].value.text);
    var values = network_type.getChildren()
      .filter(x => x.getName() === "Property").map(x => x.getAnonymousTypes()).map(x => x[0].value.getWrappedObj().initialValues[0].value.text);

    if (properties.indexOf("recommended_dt_ms") > -1) {
      formData['timeStep'] = parseFloat(values[properties.indexOf("recommended_dt_ms")]) / 1000;
    } else {
      formData['timeStep'] = Project.getActiveExperiment().simulatorConfigurations[pathRef].getTimeStep();
    }

    if (properties.indexOf("recommended_duration_ms") > -1) {
      formData['length'] = parseFloat(values[properties.indexOf("recommended_duration_ms")]) / 1000;
    } else {
      formData['length'] = Project.getActiveExperiment().simulatorConfigurations[pathRef].getLength();
    }

    formData['simulator'] = Project.getActiveExperiment().simulatorConfigurations[pathRef].getSimulator();
  }

  var submitHandler = function (data, t) {
    var formData = data.formData;
    GEPPETTO.Flows.showSpotlightForRun(formCallback);
    formWidget.destroy();
    $("#exptRunForm").remove()
    var thisExp = Project.getActiveExperiment();
    function experimentCompleteHandler () {
      if (formData.dropboxUpload) {
        thisExp.uploadResults(
          GEPPETTO.ModelFactory.getAllTypesOfType(Model.neuroml.network)[0].getName(),
          "GEPPETTO_RECORDING"
        );
      }
    }
    GEPPETTO.on(GEPPETTO.Events.Experiment_completed, experimentCompleteHandler);
  };

  var errorHandler = function () {

  };

  var processorLimits = { "netPyNENSGSimulator": 256, "neuronSimulator": 1, "netpyneSimulator": 1, "jneuromlSimulator": 1, "neuronNSGSimulator": 1 };

  var changeHandler = function (formObject) {
    var nProc = formObject.formData['numberProcessors'];
    var procLimit = processorLimits[formObject.formData['simulator']];

    if ((Project.getActiveExperiment().getWatchedVariables().length * formObject.formData['length']) / formObject.formData['timeStep'] > 4e6
            && GEPPETTO.UserController.getUserPrivileges().indexOf("ADMIN") == -1) {
      $("#procWarning").show().text("Experiment too large: reduce number of watched variables, length, or increase timestep.");
      $("#exptRunForm button[type='submit']").prop('disabled', true);
    } else if (nProc > procLimit) {
      $("#procWarning").show().text("Number of processors currently cannot exceed " + procLimit + " for: " + formObject.formData['simulator']);
      $("#exptRunForm button[type='submit']").prop('disabled', true);
    } else {
      $("#procWarning").hide();
      $("#exptRunForm button[type='submit']").prop('disabled', false);
    }

    for (var key in formObject.formData) {
      if (formObject.formData[key] != this.formData[key]) {
        if (key == 'experimentName') {
          $("#experimentsOutput").find(".activeExperiment").find("td[name='name']").html(formObject.formData[key]).blur();
        } else if (key == 'timeStep') {
          $("#experimentsOutput").find(".activeExperiment").find("td[name='timeStep']").html(formObject.formData[key]).blur();
        } else if (key == 'length') {
          $("#experimentsOutput").find(".activeExperiment").find("td[name='length']").html(formObject.formData[key]).blur();
        } else if (key == 'numberProcessors') {
          if (nProc > procLimit) {
            Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].setSimulatorParameter('numberProcessors', procLimit);
          } else {
            Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].setSimulatorParameter('numberProcessors', nProc);
          }
        } else if (key == 'simulator') {
          $("#experimentsOutput").find(".activeExperiment").find("td[name='simulatorId']").html(formObject.formData[key]).blur();
        } else if (key == 'randomSeed') {
          Project.getActiveExperiment().saveExperimentProperties({ "SP$randomSeed": formObject.formData[key], "aspectInstancePath": window.Instances[0].getId() });
        } else if (key == 'temperature' && temperatureVar[0]) {
          Project.getActiveExperiment().saveExperimentProperties({ "SP$temperature": formObject.formData[key], "aspectInstancePath": window.Instances[0].getId() });
        }
        this.formData[key] = formObject.formData[key];
      }
    }
  };

  var formWidget = null;

  GEPPETTO.ComponentFactory.addWidget('FORM', {
    id: formId,
    name: formName,
    schema: schema,
    uiSchema: uiSchema,
    formData: formData,
    submitHandler: submitHandler,
    errorHandler: errorHandler,
    changeHandler: changeHandler
  }, function () {
    formWidget = this;
    this.setName(formName);
    $("label[for='root_numberProcessors']").append("<p id='procWarning'></p>");
    $("select#root_simulator").width("33%");
    $("select#root_simulator").after("<button type='button' class='btn btn-info' id='procInfo'>?</button>");
    $("#procInfo").click(function () {
      GEPPETTO.ModalFactory.infoDialog("Simulator info", "<b>Neuron on OSB</b>, <b>jNeuroML on OSB</b>, and <b>NetPyNE on OSB</b> simulation options run on the OSB platform's own server. Limitations on the size and duration of simulations apply.<br/><br/> \
                                                                                                      <b>Neuron on NSG</b> and <b>NetPyNE on NSG</b> run on the <a href=\"http://www.nsgportal.org/\"  target=\"_blank\">Neuroscience Gateway Portal</a>. <b>NetPyNE on NSG</b> simulations can be run on up to 256 processors."); 
    });
    if (!GEPPETTO.UserController.getDropboxToken()) {
      $(".dropbox-check").append("<a href='https://www.dropbox.com/oauth2/authorize?locale=en_US&client_id=kbved8e6wnglk4h&response_type=code' target='_blank' class='btn btn-info config-dropbox'>Link Dropbox…</button>");
      $(".config-dropbox").click(function () {
        var callback = function () {
          GEPPETTO.Spinner.hideSpinner();
          $("#root_dropboxUpload").attr("disabled", false);
          $(".config-dropbox").css("display", "none");
        };
        GEPPETTO.ModalFactory.inputDialog("Authorize Dropbox", "Please enter your code",
          "OK", function () {
            GEPPETTO.Spinner.showSpinner();
            G.linkDropBox(this.state.text, callback);
            $("#root_dropboxUpload").attr("disabled", false);
          },
          "Cancel", function (){},
          true)
      });
    }
  });
};

GEPPETTO.Flows.addCompulsoryAction('window.showExecutionDialog', GEPPETTO.Resources.RUN_FLOW);

module.exports = { runMenuConfig, runMenuHandler, toggleRunMenuOptions }
