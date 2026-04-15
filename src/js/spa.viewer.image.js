/**
 * spa.viewer.image.js
 * Image viewer sub-module
 */

/*global $, spa */

window.spa.viewer.image = (function () {
  'use strict';
  
  var stateMap = {
    imageScale: 1.0
  };

  var updateImageTransform = function () {
    $('.viewer__media--image').css('transform', 'scale(' + stateMap.imageScale + ')');
    $('.zoom-level').text(Math.round(stateMap.imageScale * 100) + '%');
  };

  var render = function ( file, $content, handlers ) {
    var $imgContainer = $('<div class="viewer__image-container"></div>');
    var $img = $('<img src="' + file.url + '" class="viewer__media--image" referrerPolicy="no-referrer">');
    $imgContainer.append($img);
    $content.append($imgContainer);
    
    // Swipe Support
    var touchStartX = 0;
    var touchEndX = 0;
    $imgContainer.on('touchstart', function(e) {
      touchStartX = e.originalEvent.touches[0].screenX;
    });
    $imgContainer.on('touchend', function(e) {
      touchEndX = e.originalEvent.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handlers.onNext();
        } else {
          handlers.onPrev();
        }
      }
    });

    var $zoomControls = $([
      '<div class="viewer__zoom-controls">',
        '<button class="spa-shell__btn spa-shell__btn--viewer zoom-out">', spa.util.getSvg('zoom-out'), '</button>',
        '<span class="zoom-level flex items-center min-w-[40px] justify-center text-sm font-medium">100%</span>',
        '<button class="spa-shell__btn spa-shell__btn--viewer zoom-in">', spa.util.getSvg('zoom-in'), '</button>',
        '<button class="spa-shell__btn spa-shell__btn--viewer zoom-reset">', spa.util.getSvg('maximize'), '</button>',
      '</div>'
    ].join(''));
    
    $content.append($zoomControls);
    stateMap.imageScale = 1.0;
    updateImageTransform();

    // Bind zoom events
    $zoomControls.find('.zoom-in').on('click', function() {
      stateMap.imageScale = Math.min(stateMap.imageScale + 0.2, 3.0);
      updateImageTransform();
    });
    $zoomControls.find('.zoom-out').on('click', function() {
      stateMap.imageScale = Math.max(stateMap.imageScale - 0.2, 0.5);
      updateImageTransform();
    });
    $zoomControls.find('.zoom-reset').on('click', function() {
      stateMap.imageScale = 1.0;
      updateImageTransform();
    });
  };

  return { render : render };
}());
