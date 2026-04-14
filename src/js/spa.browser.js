/**
 * spa.browser.js
 * File browser module
 */

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global $, spa */

window.spa.browser = (function () {
  'use strict';
  
  var stateMap = {
    $container : null,
    currentPath: 'root',
    filter: 'all',
    sort: 'name',
    searchQuery: ''
  };

  var getIcon = function ( type ) {
    switch ( type ) {
      case 'folder': return spa.util.getSvg('folder');
      case 'image':  return spa.util.getSvg('image');
      case 'video':  return spa.util.getSvg('video');
      case 'audio':  return spa.util.getSvg('music');
      default:       return spa.util.getSvg('file-text');
    }
  };

  var render = function () {
    var path = spa.model.getPath( stateMap.currentPath );
    var breadcrumbsHtml = '';
    
    path.forEach( function ( folder, index ) {
      if ( index > 0 ) {
        breadcrumbsHtml += '<span class="breadcrumb-separator">/</span>';
      }
      breadcrumbsHtml += [
        '<button class="breadcrumb-item" data-id="', folder.id, '">',
          folder.name,
        '</button>'
      ].join('');
    });
    
    $('#spa-shell-breadcrumb-bar').html( breadcrumbsHtml );

    var files = stateMap.searchQuery 
      ? spa.model.searchFiles( stateMap.searchQuery )
      : spa.model.getFiles( stateMap.currentPath );

    // Filter
    if ( stateMap.filter !== 'all' ) {
      files = files.filter( function ( f ) { return f.type === stateMap.filter; } );
    }

    // Sort
    files.sort( function ( a, b ) {
      if ( a.type === 'folder' && b.type !== 'folder' ) return -1;
      if ( a.type !== 'folder' && b.type === 'folder' ) return 1;
      
      if ( stateMap.sort === 'name' ) {
        return a.name.localeCompare( b.name );
      } else if ( stateMap.sort === 'date' ) {
        return new Date( b.date ) - new Date( a.date );
      }
      return 0;
    });

    var html = '';
    
    // Only show filters if searching
    if ( stateMap.searchQuery ) {
      html += [
        '<div class="p-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-black/5">',
          '<button class="filter-btn px-4 py-1.5 rounded-full text-sm font-medium ', (stateMap.filter === 'all' ? 'bg-primary text-white' : 'bg-black/5 text-black'), '" data-filter="all">All</button>',
          '<button class="filter-btn px-4 py-1.5 rounded-full text-sm font-medium ', (stateMap.filter === 'image' ? 'bg-primary text-white' : 'bg-black/5 text-black'), '" data-filter="image">Images</button>',
          '<button class="filter-btn px-4 py-1.5 rounded-full text-sm font-medium ', (stateMap.filter === 'video' ? 'bg-primary text-white' : 'bg-black/5 text-black'), '" data-filter="video">Videos</button>',
          '<button class="filter-btn px-4 py-1.5 rounded-full text-sm font-medium ', (stateMap.filter === 'audio' ? 'bg-primary text-white' : 'bg-black/5 text-black'), '" data-filter="audio">Audio</button>',
        '</div>'
      ].join('');
    }

    html += '<div class="file-list">';

    if ( files.length === 0 ) {
      html += '<div class="p-12 text-center opacity-60">No files found</div>';
    } else {
      files.forEach( function ( file ) {
        html += [
          '<div class="file-item" data-id="', file.id, '">',
            '<div class="file-item__icon-wrap">',
              getIcon(file.type),
            '</div>',
            '<div class="file-item__info">',
              '<div class="file-item__name">', file.name, '</div>',
              '<div class="file-item__meta">', file.date, ' • ', file.size, '</div>',
            '</div>',
            '<button class="file-item__action file-menu-btn" data-id="', file.id, '">',
              spa.util.getSvg('more-vertical'),
            '</button>',
          '</div>'
        ].join('');
      });
    }

    html += '</div>';
    stateMap.$container.html( html );
    
    if ( window.lucide ) {
      window.lucide.createIcons();
    }
  };

  var initModule = function ( $container ) {
    stateMap.$container = $container;

    $container.on('click', '.file-item', function(e) {
      if ($(e.target).closest('.file-menu-btn').length) return;
      
      var id = $(this).data('id');
      var files = stateMap.searchQuery 
        ? spa.model.searchFiles( stateMap.searchQuery )
        : spa.model.getFiles( stateMap.currentPath );
      
      var file = files.find( function ( f ) { return f.id == id; } );
      
      if (file.type === 'folder') {
        $(document).trigger('spa-folder-open', file);
      } else {
        $(document).trigger('spa-file-open', {
          file: file,
          list: files.filter(function(f) { return f.type !== 'folder'; })
        });
      }
    });

    $container.on('click', '.filter-btn', function() {
      stateMap.filter = $(this).data('filter');
      render();
    });

    $container.on('click', '.file-menu-btn', function(e) {
      e.stopPropagation();
      var id = $(this).data('id');
      $(document).trigger('spa-file-menu', id);
    });

    $(document).on('spa-navigate', function(e, path) {
      stateMap.currentPath = path;
      stateMap.searchQuery = '';
      render();
    });

    $(document).on('spa-search', function(e, query) {
      stateMap.searchQuery = query;
      render();
    });

    $(document).on('spa-sort', function(e, sort) {
      stateMap.sort = sort;
      render();
    });

    $(document).on('spa-model-update', render);
    
    $(document).on('spa-add-folder', function(e, data) {
      spa.model.addFolder(data.name, data.parentId);
    });
  };

  return { initModule : initModule };
}());
