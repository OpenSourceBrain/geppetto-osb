var downloadProjectButtonConfig = {
  id: "DownloadProjectButton",
  className : "DownloadProjectButton",
  onClick : function () {
    GEPPETTO.CommandController.execute('Project.download();'); 
  },
  tooltipPosition : { my: "right center", at : "left-5 center" },
  tooltipLabel : "Download your current project",
  icon : "fa fa-download",
  disabled : false,
  hidden : false
};

module.exports = { downloadProjectButtonConfig }
