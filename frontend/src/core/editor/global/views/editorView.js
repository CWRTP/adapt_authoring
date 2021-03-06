define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorMenuView = require('editorMenu/views/editorMenuView');
  var EditorPageView = require('editorPage/views/editorPageView');
  /*var EditorCollection = require('editorGlobal/collections/editorCollection');*/
  var EditorModel = require('editorGlobal/models/editorModel');
  /*var EditorCourseModel = require('editorCourse/models/editorCourseModel');*/
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  var EditorArticleModel = require('editorPage/models/editorArticleModel');
  var EditorBlockModel = require('editorPage/models/editorBlockModel');
  var EditorComponentModel = require('editorPage/models/editorComponentModel');
  var EditorClipboardModel = require('editorGlobal/models/editorClipboardModel');
  var EditorComponentTypeModel = require('editorPage/models/editorComponentTypeModel');
  /*var EditorConfigModel = require('editorConfig/models/editorConfigModel');*/
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var EditorView = EditorOriginView.extend({

    settings: {
      autoRender: false
    },

    tagName: "div",

    className: "editor-view",

    events: {
      "click a.page-add-link"   : "addNewPage",
      "click a.load-page"       : "loadPage",
      "mouseover div.editable"  : "onEditableHoverOver",
      "mouseout div.editable"   : "onEditableHoverOut"
    },

    preRender: function(options) {
      this.currentView = options.currentView;
      Origin.editor.pasteParentModel = false;
      this.currentCourseId = Origin.editor.data.course.get('_id');
      this.currentPageId = options.currentPageId;

      this.listenTo(Origin, 'editorView:refreshView', this.setupEditor);
      this.listenTo(Origin, 'editorView:copy', this.addToClipboard);
      this.listenTo(Origin, 'editorView:cut', this.cutContent);
      this.listenTo(Origin, 'editorView:paste', this.pasteFromClipboard);
      this.listenTo(Origin, 'editorCommon:publish', this.publishProject);
      this.listenTo(Origin, 'editorCommon:preview', this.previewProject);

      this.render();
      this.setupEditor();
    },

    postRender: function() {
    },

    onEditableHoverOver: function(e) {
      e.stopPropagation();
      $(e.currentTarget).addClass('hovering');
    },

    onEditableHoverOut: function(e) {
      $(e.currentTarget).removeClass('hovering');
    },

    // checks if data is loaded
    // then create new instances of:
    // Origin.editor.course, Origin.editor.config, Origin.editor.contentObjects,
    // Origin.editor.articles, Origin.editor.blocks
    setupEditor: function() {
      this.renderCurrentEditorView();
    },

    publishProject: function() {

      var canPublish = this.validateCourseContent();

      if (canPublish) {
        window.open('/api/output/adapt/publish/' + this.currentCourseId);
      }

    },

    previewProject: function() {
      
      var canPreview = this.validateCourseContent();

      if (canPreview) {
        window.open('/api/output/adapt/preview/' + this.currentCourseId, 'adapt_preview');
      }

    },

    /*
      Archive off the clipboard
    */
    addToClipboard: function(model) {
      _.defer(_.bind(function() {
        _.invoke(Origin.editor.data.clipboard.models, 'destroy')
      }, this));

      Origin.editor.pasteParentModel = model.getParent();

      var clipboard = new EditorClipboardModel();

      clipboard.set('referenceType', model._siblings);

      var hasChildren = (model._children && Origin.editor.data[model._children].where({_parentId: model.get('_id')}).length == 0) ? false : true;
      var currentModel = model;
      var items = [currentModel];

      if (hasChildren) {
        // Recusively push all children into an array
        this.getAllChildren(currentModel, items);
      }

      // Sort items into their respective types
      _.each(items, function(item) {
        var matches = clipboard.get(item._siblings);
        if (matches) {
          this.mapValues(item);
          matches.push(item);
          clipboard.set(item._siblings, matches);
        } else {
          this.mapValues(item);
          clipboard.set(item._siblings, [item]);
        }
      }, this);

      clipboard.save({_courseId: this.currentCourseId}, {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {
          Origin.editor.data.clipboard.fetch({reset:true});
        }
      });
    },

    mapValues: function(item) {
      if (item.get('_componentType') && typeof item.get('_componentType') === 'object') {
        item.set('_componentType', item.get('_componentType')._id);
      }
    },

    getAllChildren: function (model, list) {
      var that = this;
      var children = model.getChildren();
      if (children && children.models.length) {
        children.each(function(child) {
          list.push(child);
          that.getAllChildren(child, list);
        });
      }
    },

    pasteFromClipboard: function(parentId, sortOrder, layout) {
      var clipboard = Origin.editor.data.clipboard.models[0];
      var topitem = clipboard.get(clipboard.get('referenceType'))[0];
      
      if (topitem._layout) {
        topitem._layout = layout;
      }
      if (topitem._sortOrder) {
        topitem._sortOrder = sortOrder;
      }
      this.createRecursive(clipboard.get('referenceType'), clipboard, parentId, false);
    },

    createRecursive: function (type, clipboard, parentId, oldParentId) {
      var thisView = this;
      var allitems = clipboard.get(type);
      var items = [];

      if (oldParentId) {
        items = _.filter(allitems, function(item) {
          return item._parentId == oldParentId;
        });
      } else {
        items = allitems;
      }

      if (items && items.length) {
        _.each(items, function(childitem) {
          var newModel = thisView.createModel(type);
          var oldPid = childitem._id;
          delete childitem._id;

          childitem._parentId = parentId;

          newModel.save(
            childitem,
            {
              error: function() {
                alert('error during paste');
              },
              success: function(model, response, options) {
                if (newModel._children) {
                  thisView.createRecursive(newModel._children, clipboard, model.get('_id'), oldPid);
                } else {
                  // We're done pasting, no more children to process
                  Origin.trigger('editor:refreshData', function() {
                    Origin.trigger('editorView:refreshView');
                  }, this);
                  
                  
                }
              }
            }
          );
        });
      } else {
        Origin.trigger('editor:refreshData', function() {
          Origin.trigger('editorView:refreshView');
        }, this);
      }
    },

    createModel: function (type) {
      var model = false;
      switch (type) {
        case 'contentObjects':
          model = new EditorContentObjectModel();
          break;
        case 'articles':
          model = new EditorArticleModel();
          break;
        case 'blocks':
          model = new EditorBlockModel();
          break;
        case 'components':
          model = new EditorComponentModel();
          break;
      }
      return model;
    },

    renderCurrentEditorView: function() {
      Origin.trigger('editorView:removeSubViews');

      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }

      Origin.trigger('editorSidebarView:addOverviewView');
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: Origin.editor.data.course
      }).$el);
    },

    renderEditorPage: function() {
      this.$('.editor-inner').html(new EditorPageView({
        model: Origin.editor.data.contentObjects.findWhere({_id: this.currentPageId}),
      }).$el);
    },

    cutContent: function(view) {
      var type = this.capitalise(view.model.get('_type'));
      var collectionType = view.model._siblings;

      this.addToClipboard(view.model);

      // Remove model from collection (to save fetching) and destroy it
      Origin.editor.data[collectionType].remove(view.model);
      view.model.destroy();

      _.defer(function(){
        Origin.trigger('editorView:cut' + type + ':' + view.model.get('_parentId'), view);
      });
    },

    validateCourseContent: function() {

      // Store current course
      var currentCourse = Origin.editor.data.course;

      // Let's do a standard check for at least one child object
      var containsAtLeastOneChild = true;

      function interateOverChildren(model) {

        // Return the function if no children - on components
        if(!model._children) return;

        var currentChildren = model.getChildren();

        // Do validate across each item
        if (!currentChildren.length > 0) {

          containsAtLeastOneChild = false;

          validationError = "There seems to be a " 
            + model.get('_type') 
            + " with the title - '" 
            + model.get('title') 
            + "' with no " 
            + model._children;
          var alertObject = {
            title: "Validation failed",
            body: validationError,
            confirmText: "Ok",
            _callbackEvent: "editor:courseValidation",
            _showIcon: true
          };

          Origin.trigger('notify:alert', alertObject);
          return;

        } else {

          // Go over each child and call validation again
          currentChildren.each(function(childModel) {
            interateOverChildren(childModel);
          });
          
        }

      }

      interateOverChildren(currentCourse);

      return containsAtLeastOneChild;

    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
