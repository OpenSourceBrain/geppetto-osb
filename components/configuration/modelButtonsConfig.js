var modelButtonsConfig = {
    "Connectivity": {
        "actions": [
            "if (GEPPETTO.ModelFactory.geppettoModel.neuroml.network){showConnectivityMatrix($ENTER_ID)}"
        ],
        "icon": "gpt-make-group",
        "label": "Connectivity",
        "tooltip": "Loads the connectivity matrix widget"
    },
    "Model Description": {
        "actions": [
            "showModelDescription(getMainType($ENTER_ID))"
        ],
        "icon": "gpt-pyramidal-cell",
        "label": "Model Description",
        "tooltip": "Information on the model"
    }
};

module.exports = {
    modelButtonsConfig
};
