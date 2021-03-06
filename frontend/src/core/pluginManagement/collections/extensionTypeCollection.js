define(function(require) {

  var Backbone = require('backbone');
  var ExtensionTypeModel = require('coreJS/pluginManagement/models/extensionTypeModel');

  var ExtensionTypeCollection = Backbone.Collection.extend({

    model: ExtensionTypeModel,

    url: function (options) {
      var base = 'api/extensiontype';
      if (options && options.base) {
        return base;
      }

      return base + '?showall=1';
    },

    comparator: function(model) {
      return model.get('displayName');
    }

  });

  return ExtensionTypeCollection;

});
