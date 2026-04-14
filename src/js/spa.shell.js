/**
 * spa.shell.js
 * Shell module for SPA
 */

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global $, spa */

window.spa.shell = (function () {
  'use strict';
  
  var configMap = {
    main_html : [
      '<div class="spa-shell">',
        '<header class="spa-shell__header">',
          '<h1 class="spa-shell__title">Files</h1>',
          '<div class="spa-shell__actions">',
            '<button id="spa-shell-sort" class="spa-shell__btn">',
              '<i data-lucide="arrow-up-down"></i>',
            '</button>',
            '<button id="spa-shell-search-toggle" class="spa-shell__btn">',
              '<i data-lucide="search"></i>',
            '</button>',
            '<button id="spa-shell-add-folder" class="spa-shell__btn spa-shell__btn--primary">',
              '<i data-lucide="plus"></i>',
            '</button>',
          '</div>',
        '</header>',
        
        '<div id="spa-shell-breadcrumb-bar" class="breadcrumb-bar">',
        '</div>',
        
        '<div id="spa-shell-search-bar" class="search-bar hidden">',
          '<input type="text" id="spa-shell-search-input" class="search-bar__input" placeholder="Search files...">',
        '</div>',
        
        '<main class="file-browser" id="spa-shell-content"></main>',
        
        '<div id="spa-shell-modal" class="modal hidden">',
          '<div class="modal__content" id="spa-shell-modal-content"></div>',
        '</div>',
      '</div>'
    ].join('')
  };

  var stateMap = {
    $container : null,
    currentPath: 'root',
    history: []
  };

  var setJqueryMap = function () {
    var $container = stateMap.$container;
    stateMap.jqueryMap = {
      $container : $container,
      $content   : $container.find('#spa-shell-content'),
      $breadcrumbs: $container.find('#spa-shell-breadcrumb-bar'),
      $searchBar : $container.find('#spa-shell-search-bar'),
      $searchInput: $container.find('#spa-shell-search-input'),
      $modal     : $container.find('#spa-shell-modal'),
      $modalContent: $container.find('#spa-shell-modal-content')
    };
  };

  var toggleSearch = function () {
    stateMap.jqueryMap.$searchBar.toggleClass('hidden');
    if (!stateMap.jqueryMap.$searchBar.hasClass('hidden')) {
      stateMap.jqueryMap.$searchInput.focus();
    } else {
      stateMap.jqueryMap.$searchInput.val('');
      $(document).trigger('spa-search', '');
    }
  };

  var showModal = function ( html ) {
    stateMap.jqueryMap.$modalContent.html( html );
    stateMap.jqueryMap.$modal.removeClass('hidden');
    if (window.lucide) { window.lucide.createIcons(); }
  };

  var hideModal = function () {
    stateMap.jqueryMap.$modal.addClass('hidden');
  };

  var initModule = function ( $container ) {
    stateMap.$container = $container;
    $container.html( configMap.main_html );
    setJqueryMap();

    // Initialize feature modules
    window.spa.browser.initModule( stateMap.jqueryMap.$content );
    window.spa.viewer.initModule( $container );

    // Event handlers
    stateMap.jqueryMap.$breadcrumbs.on('click', '.breadcrumb-item', function() {
      var id = $(this).data('id');
      if (id !== stateMap.currentPath) {
        stateMap.currentPath = id;
        $(document).trigger('spa-navigate', id);
      }
    });

    stateMap.jqueryMap.$searchBar.find('#spa-shell-search-toggle').on('click', toggleSearch);
    $container.find('#spa-shell-search-toggle').on('click', toggleSearch);
    
    stateMap.jqueryMap.$searchInput.on('input', function() {
      $(document).trigger('spa-search', $(this).val());
    });

    $container.find('#spa-shell-add-folder').on('click', function() {
      showModal([
        '<h3 class="modal__title">New Folder</h3>',
        '<input type="text" id="new-folder-name" placeholder="Folder name" class="modal__input">',
        '<div class="modal__actions">',
          '<button id="modal-cancel" class="modal__btn modal__btn--cancel">Cancel</button>',
          '<button id="modal-create" class="modal__btn modal__btn--confirm">Create</button>',
        '</div>'
      ].join(''));
    });

    $container.find('#spa-shell-sort').on('click', function() {
      showModal([
        '<h3 class="modal__title">Sort By</h3>',
        '<div class="flex flex-col gap-1">',
          '<button class="sort-action w-full text-left p-3 hover:bg-black/5 rounded-[12px] flex items-center gap-3" data-sort="name">',
            '<i data-lucide="type" class="w-5 h-5"></i> Name',
          '</button>',
          '<button class="sort-action w-full text-left p-3 hover:bg-black/5 rounded-[12px] flex items-center gap-3" data-sort="date">',
            '<i data-lucide="calendar" class="w-5 h-5"></i> Date',
          '</button>',
        '</div>'
      ].join(''));
    });

    stateMap.jqueryMap.$modal.on('click', '.sort-action', function() {
      var sort = $(this).data('sort');
      $(document).trigger('spa-sort', sort);
      hideModal();
    });

    stateMap.jqueryMap.$modal.on('click', '#modal-cancel', hideModal);
    stateMap.jqueryMap.$modal.on('click', '#modal-create', function() {
      var name = $('#new-folder-name').val();
      if (name) {
        $(document).trigger('spa-add-folder', { name: name, parentId: stateMap.currentPath });
        hideModal();
      }
    });

    $(document).on('spa-folder-open', function(e, folder) {
      stateMap.currentPath = folder.id;
      $(document).trigger('spa-navigate', folder.id);
    });

    // Initial render
    $(document).trigger('spa-navigate', 'root');
    
    // Initialize icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  return { 
    initModule : initModule,
    showModal: showModal,
    hideModal: hideModal
  };
}());
