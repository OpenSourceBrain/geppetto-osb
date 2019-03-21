define(function(require) {
    return {
        persistWarning: function() {
            if(!GEPPETTO.UserController.hasWritePermissions()){
                var message = "";

                if(GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT)){
                    message = "You first need to save your project by clicking on the star icon in the top toolbar.";
                } else {
                    message = "You don’t have write permissions for this project (read only).";
                }
                GEPPETTO.ModalFactory.infoDialog("Cannot run experiment", message);
                return true;
            } else {
                return false;
            }
        }
    };
});
