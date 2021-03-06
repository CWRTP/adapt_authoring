define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var PluginManagementUploadSidebarView = SidebarItemView.extend({

        events: {
            'click .pluginManagement-upload-sidebar-save-button': 'onSaveButtonClicked',
            'click .pluginManagement-upload-sidebar-cancel-button': 'onCancelButtonClicked'
        },

        onSaveButtonClicked: function() {
            Origin.trigger('pluginManagement:uploadPlugin');
        },

        onCancelButtonClicked: function() {
            Origin.router.navigate('#/pluginManagement', {trigger: true});
        }

    }, {
        template: 'pluginManagementUploadSidebar'
    });

    return PluginManagementUploadSidebarView;

});
