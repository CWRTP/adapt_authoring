define(function(require) {

	var Origin = require('coreJS/app/origin');
	var EditorView = require('editorGlobal/views/editorView');
	var EditorModel = require('editorGlobal/models/editorModel');
	var EditorMenuSidebarView = require('editorMenu/views/editorMenuSidebarView');

	var EditorPageSidebarView = require('editorPage/views/editorPageSidebarView');
	var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');

	var EditorPageEditView = require('editorPage/views/editorPageEditView');
	var EditorPageEditSidebarView = require('editorPage/views/editorPageEditSidebarView');

  var EditorArticleModel = require('editorPage/models/editorArticleModel');

  var EditorArticleEditView = require('editorPage/views/editorArticleEditView');
  var EditorArticleEditSidebarView = require('editorPage/views/editorArticleEditSidebarView');

  var EditorBlockModel = require('editorPage/models/editorBlockModel');

  var EditorBlockEditView = require('editorPage/views/editorBlockEditView');
  var EditorBlockEditSidebarView = require('editorPage/views/editorBlockEditSidebarView');

  var EditorComponentModel = require('editorPage/models/editorComponentModel');

  var EditorComponentEditView = require('editorPage/views/editorComponentEditView');
  var EditorComponentEditSidebarView = require('editorPage/views/editorComponentEditSidebarView');

  var EditorExtensionsEditView = require('editorExtensions/views/editorExtensionsEditView');
  var EditorExtensionsEditSidebarView = require('editorExtensions/views/editorExtensionsEditSidebarView');

  var EditorConfigEditView = require('editorConfig/views/editorConfigEditView');
  var EditorConfigEditSidebarView = require('editorConfig/views/editorConfigEditSidebarView');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorConfigCollection = require('editorConfig/collections/editorConfigCollection');

  var EditorThemeEditView = require('editorTheme/views/editorThemeEditView');
  var EditorThemeEditSidebarView = require('editorTheme/views/editorThemeEditSidebarView');

  var EditorMenuSettingsEditView = require('editorMenuSettings/views/editorMenuSettingsEditView');
  var EditorMenuSettingsEditSidebarView = require('editorMenuSettings/views/editorMenuSettingsEditSidebarView');

  var EditorComponentListView = require('editorPage/views/editorComponentListView');
  var EditorComponentListSidebarView = require('editorPage/views/editorComponentListSidebarView');

  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorCourseModel = require('editorCourse/models/editorCourseModel');
  var EditorCollection = require('editorGlobal/collections/editorCollection');
  var EditorClipboardModel = require('editorGlobal/models/editorClipboardModel');
  var EditorComponentTypeModel = require('editorPage/models/editorComponentTypeModel');
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/project/views/projectDetailView');
  var ProjectDetailEditSidebarView = require('coreJS/project/views/projectDetailEditSidebarView');

  var dataIsLoaded = false;

  Origin.on('editor:refreshData', function(callback, context) {
    dataIsLoaded = false;
    var loadedData = {
      clipboard: false,
      course: false,
      config: false,
      componentTypes: false,
      extensionTypes: false, 
      contentObjects: false,
      articles: false,
      blocks: false,
      components: false
    };
    Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function(loadedObject) {

      loadedData[loadedObject] = true;
      
      var allDataIsLoaded = _.every(loadedData, function(item) {
        return item === true;
      });

      if (allDataIsLoaded) {

        Origin.off('editorCollection:dataLoaded editorModel:dataLoaded');
        Origin.trigger('editor:dataLoaded');
        dataIsLoaded = true;
        if (callback) {
            callback.apply(context);
        }
      }

    });

    // // Not implemented for the time being
    // Origin.editor.data.config.on('change:_enabledExtensions', function() {
    //   Origin.socket.emit('project:build', { id: this.currentCourseId });
    // });
    
    _.each(Origin.editor.data, function(object) {
      object.fetch({reset:true,
        error: function(model, response, options) {
          alert('*****   Oops, something went wrong!  *****');
        }
      });
    });  

  });

	Origin.on('router:editor', function(route1, route2, route3, route4) {

    // Check if data has already been loaded for this project
    if (dataIsLoaded && Origin.editor.data.course && Origin.editor.data.course.get('_id') === route1) {
      return routeAfterDataIsLoaded(route1, route2, route3, route4);
    }

    var loadedData = {
      clipboard: false,
      course: false,
      config: false,
      componentTypes: false,
      extensionTypes: false, 
      contentObjects: false,
      articles: false,
      blocks: false,
      components: false
    };

    Origin.on('editorCollection:dataLoaded editorModel:dataLoaded', function(loadedObject) {

      loadedData[loadedObject] = true;
      
      var allDataIsLoaded = _.every(loadedData, function(item) {
        return item === true;
      });

      if (allDataIsLoaded) {

        Origin.off('editorCollection:dataLoaded editorModel:dataLoaded');
        Origin.trigger('editor:dataLoaded');
        dataIsLoaded = true;
        routeAfterDataIsLoaded(route1, route2, route3, route4);

      }

    });

    setupEditorData(route1, route2, route3, route4);

	});

  function setupEditorData(route1, route2, route3, route4) {
    Origin.editor.data.course = new EditorCourseModel({_id: route1});
    Origin.editor.data.config = new EditorConfigModel({_courseId: route1});

    Origin.editor.data.contentObjects = new EditorCollection(null, {
      model: EditorContentObjectModel,
      url: '/api/content/contentobject?_courseId=' + route1,
      _type: 'contentObjects'
    });
    
    Origin.editor.data.articles = new EditorCollection(null, {
      model: EditorArticleModel,
      url: '/api/content/article?_courseId=' + route1,
      _type: 'articles'
    });
    
    Origin.editor.data.blocks = new EditorCollection(null, {
      model: EditorBlockModel,
      url: '/api/content/block?_courseId=' + route1,
      _type: 'blocks'
    });

    Origin.editor.data.components = new EditorCollection(null, {
      model: EditorComponentModel,
      url: '/api/content/component?_courseId=' + route1,
      _type: 'components'
    });

    Origin.editor.data.clipboard = new EditorCollection(null, {
      model: EditorClipboardModel,
      url: '/api/content/clipboard?_courseId=' + route1 + '&createdBy=' + Origin.sessionModel.get('id'),
      _type: 'clipboard'
    });

    // Store the component types
    Origin.editor.data.componentTypes = new EditorCollection(null, {
      model : EditorComponentTypeModel,
      url: '/api/componenttype',
      _type: 'componentTypes'
    });
    
    Origin.editor.data.componentTypes.comparator = function(model) {
      return model.get('displayName');
    };
    
    // Store the extensions types
    Origin.editor.data.extensionTypes = new EditorCollection(null, {
      model : ExtensionModel,
      url: '/api/extensiontype',
      _type: 'extensionTypes'
    });
  }

  function routeAfterDataIsLoaded(route1, route2, route3, route4) {

    if (route2 === 'article' && route4 === 'edit') {
      var articleModel = new EditorArticleModel({_id: route3});
      articleModel.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Editing article - ' + articleModel.get('title')});
          Origin.sidebar.addView(new EditorArticleEditSidebarView({model: articleModel}).$el);
          Origin.editingOverlay.addView(new EditorArticleEditView({model: articleModel}).$el);
        }
      });
      return;
    }

    if (route2 === 'block' && route4 === 'edit') {
      var blockModel = new EditorBlockModel({_id: route3});
      blockModel.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Editing block - ' + blockModel.get('title')});
          Origin.sidebar.addView(new EditorBlockEditSidebarView({model: blockModel}).$el);
          Origin.editingOverlay.addView(new EditorBlockEditView({model: blockModel}).$el);
        }
      });
      return;
    }

    if (route2 === 'block' && route4 === 'add') {
      // If adding a new component
      // Find block so we can get layout options
      var containingBlock = Origin.editor.data.blocks.findWhere({_id: route3});

      var layoutOptions = containingBlock.get('layoutOptions');

      var componentSelectModel = new Backbone.Model({
        title: window.polyglot.t('app.addcomponent'),
        body: window.polyglot.t('app.pleaseselectcomponent'),
        _parentId: route3,
        componentTypes: Origin.editor.data.componentTypes.toJSON(),
        layoutOptions: layoutOptions
      });

      Origin.sidebar.addView(new EditorComponentListSidebarView({
        model: componentSelectModel
      }).$el);
      Origin.editingOverlay.addView(new EditorComponentListView({
        model: componentSelectModel
      }).$el);
    }

    if (route2 === 'component') {
      // Display editing a component
      var componentModel = new EditorComponentModel({_id: route3});
      componentModel.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Editing ' + componentModel.get('_componentType').displayName.toLowerCase() + ' component - ' + componentModel.get('title')});
          Origin.sidebar.addView(new EditorComponentEditSidebarView({model: componentModel}).$el);
          Origin.editingOverlay.addView(new EditorComponentEditView({model: componentModel}).$el);
        }
      });
      return;
    }

    switch (route2) {
      case 'settings':
        var project = new ProjectModel({_id: route1});
        
        project.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Edit course'});
            Origin.editingOverlay.addView(new ProjectDetailView({model: project}).$el);
            Origin.sidebar.addView(new ProjectDetailEditSidebarView().$el);
          }
        });
        break;

      case 'config':
        // route2 is the courseid
        // var collection = new EditorConfigCollection();
        // collection.findWhere({_courseId: location});

        var configModel = new EditorConfigModel({_courseId: route1});

        configModel.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Edit configuration'});
            Origin.sidebar.addView(new EditorConfigEditSidebarView().$el);
            Origin.editingOverlay.addView(new EditorConfigEditView({model: configModel}).$el);
          }
        });
        break;

      case 'theme':
        var configModel = new EditorConfigModel({_courseId: route1});

        configModel.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Select theme'});
            Origin.sidebar.addView(new EditorThemeEditSidebarView().$el);
            Origin.editingOverlay.addView(new EditorThemeEditView({model: configModel}).$el);
          }
        });
        break;

      case 'menusettings':
        var configModel = new EditorConfigModel({_courseId: route1});

        configModel.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Select menu'});
            Origin.sidebar.addView(new EditorMenuSettingsEditSidebarView().$el);
            Origin.editingOverlay.addView(new EditorMenuSettingsEditView({model: configModel}).$el);
          }
        });
        break;

      case 'extensions':
        Origin.trigger('location:title:update', {title: 'Manage extensions'});

        var extensionsModel = new Backbone.Model({_id: route1});

        // Setup back button breadcrumb

        // Check whether the user came from the page editor or menu editor
        var backButtonRoute = "/#/editor/" + route1 + "/menu";
        var backButtonText = "Back to course structure";

        if (Origin.previousLocation.route2 === "page") {
            backButtonRoute = "/#/editor/" + route1 + "/page/" + Origin.previousLocation.route3;
            backButtonText = "Back to page";
        }

        var optionsObject = {
            "backButtonText": backButtonText,
            "backButtonRoute": backButtonRoute
        };

        Origin.sidebar.addView(new EditorExtensionsEditSidebarView().$el, optionsObject);
        Origin.editingOverlay.addView(new EditorExtensionsEditView({model: extensionsModel}).$el);

        break;

      case 'menu':

        // Edit the menu item
        if (route4 === "edit") {
          var contentObjectModel = new EditorContentObjectModel({_id: route3});
          contentObjectModel.fetch({
            success: function() {
              Origin.trigger('location:title:update', {title: 'Editing menu - ' + contentObjectModel.get('title')});
              Origin.sidebar.addView(new EditorPageEditSidebarView({model: contentObjectModel}).$el);
              Origin.editingOverlay.addView(new EditorPageEditView({model: contentObjectModel}).$el);
            }
          });
          return;
        }

        // Update page title
        Origin.trigger('location:title:update', {title: 'Course structure'});
        // Create Editor menu view
        Origin.router.createView(EditorView, {
          currentCourseId: route1,
          currentView: 'menu',
          currentPageId: (route3 || null)
        });

        // update sidebar view
        Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
          "backButtonText": "Back to courses",
          "backButtonRoute": "/#/dashboard"
        });
        break;
      case 'page':

        // Edit the page item
        if (route4 === "edit") {
          var contentObjectModel = new EditorContentObjectModel({_id: route3});
          contentObjectModel.fetch({
            success: function() {
              Origin.trigger('location:title:update', {title: 'Editing page - ' + contentObjectModel.get('title')});
              Origin.sidebar.addView(new EditorPageEditSidebarView({model: contentObjectModel}).$el);
              Origin.editingOverlay.addView(new EditorPageEditView({model: contentObjectModel}).$el);
            }
          });
          return;
        }
        // Update page title
        Origin.trigger('location:title:update', {title: 'Page editor'});

        // Create Editor page view
        Origin.editor.scrollTo = 0;
        Origin.router.createView(EditorView, {
          currentCourseId: route1,
          currentView: 'page',
          currentPageId: (route3 || null)
        });
        // update sidebar view
        Origin.sidebar.addView(new EditorPageSidebarView().$el, {
          "backButtonText": "Back to course structure",
          "backButtonRoute": "/#/editor/" + route1 + "/menu"
        });
        break;
    }
  }

});
