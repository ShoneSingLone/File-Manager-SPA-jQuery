/**
 * spa.viewer.list.js
 * Thumbnail list sub-module
 */

/*global $, spa */

window.spa.viewer.list = (function () {
  'use strict';

  var render = function ( fileList, currentFile, handlers ) {
    var $listInner = $('.viewer__list-inner');
    if ( $listInner.length === 0 ) return;

    var html = '';
    fileList.forEach( function ( file ) {
      var isActive = file.id === currentFile.id;
      html += [
        '<div class="viewer__list-item ', (isActive ? 'active' : ''), '" data-id="', file.id, '">',
          file.type === 'image' 
            ? '<img src="' + file.url + '" class="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer">'
            : '<div class="w-full h-full flex items-center justify-center bg-white/10 rounded-lg">' + spa.util.getSvg(file.type === 'audio' ? 'music' : 'video', 'w-6 h-6') + '</div>',
        '</div>'
      ].join('');
    });
    $listInner.html( html );
    
    // Scroll active item into view
    var $active = $listInner.find('.active');
    if ( $active.length ) {
      var scrollLeft = $active.position().left + $listInner.scrollLeft() - ($listInner.width() / 2) + ($active.width() / 2);
      $listInner.animate({ scrollLeft: scrollLeft }, 200);
    }

    // Bind click events
    $listInner.off('click', '.viewer__list-item').on('click', '.viewer__list-item', function() {
      var id = $(this).data('id');
      var file = fileList.find( function ( f ) { return f.id == id; } );
      if ( file && file.id !== currentFile.id ) {
        handlers.onSelect(file);
      }
    });
  };

  return { render : render };
}());
