/**
 * spa.viewer.js
 * File viewer module
 */

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global $, spa */

window.spa.viewer = (function () {
  'use strict';
  
  var stateMap = {
    $container : null,
    currentFile: null,
    fileList   : [],
    playbackRate: 1.0,
    isLooping  : false,
    imageScale : 1.0,
    isSlideshow: false,
    slideshowTimer: null
  };

  var configMap = {
    main_html : [
      '<div id="spa-viewer" class="viewer hidden">',
        '<header class="viewer__header">',
          '<button id="spa-viewer-close" class="spa-shell__btn">',
            '<i data-lucide="x"></i>',
          '</button>',
          '<div class="spa-shell__title" id="spa-viewer-title"></div>',
          '<div class="spa-shell__actions">',
            '<button id="spa-viewer-slideshow" class="spa-shell__btn" title="Slideshow">',
              '<i data-lucide="play"></i>',
            '</button>',
            '<button id="spa-viewer-info" class="spa-shell__btn">',
              '<i data-lucide="info"></i>',
            '</button>',
            '<button id="spa-viewer-download" class="spa-shell__btn">',
              '<i data-lucide="download"></i>',
            '</button>',
          '</div>',
        '</header>',
        
        '<div id="spa-viewer-content" class="viewer__content">',
          '<button id="spa-viewer-prev" class="viewer__nav viewer__nav--prev">',
            '<i data-lucide="chevron-left"></i>',
          '</button>',
          '<button id="spa-viewer-next" class="viewer__nav viewer__nav--next">',
            '<i data-lucide="chevron-right"></i>',
          '</button>',
        '</div>',

        '<footer id="spa-viewer-footer" class="viewer__footer hidden">',
          '<div class="flex items-center justify-center gap-6">',
            '<button id="spa-viewer-loop" class="spa-shell__btn">',
              '<i data-lucide="repeat"></i>',
            '</button>',
            '<div class="flex items-center gap-2">',
              '<span class="text-xs opacity-60">Speed</span>',
              '<select id="spa-viewer-speed" class="bg-transparent border border-white/20 rounded px-2 py-1 text-sm outline-none text-white">',
                '<option value="0.5" class="bg-zinc-900">0.5x</option>',
                '<option value="1.0" class="bg-zinc-900" selected>1.0x</option>',
                '<option value="1.5" class="bg-zinc-900">1.5x</option>',
                '<option value="2.0" class="bg-zinc-900">2.0x</option>',
              '</select>',
            '</div>',
          '</div>',
        '</footer>',
      '</div>'
    ].join('')
  };

  var updateNavigation = function () {
    var index = stateMap.fileList.indexOf( stateMap.currentFile );
    $('#spa-viewer-prev').toggle( index > 0 );
    $('#spa-viewer-next').toggle( index < stateMap.fileList.length - 1 );
  };

  var renderPreview = function ( file ) {
    var $content = $('#spa-viewer-content');
    var $footer = $('#spa-viewer-footer');
    $content.find('.viewer__media, .viewer__media--image, .viewer__image-container, .viewer__audio-player, .viewer__zoom-controls, .fallback').remove();
    $footer.addClass('hidden');
    stateMap.imageScale = 1.0;

    switch ( file.type ) {
      case 'image':
        var $imgContainer = $('<div class="viewer__image-container"></div>');
        var $img = $('<img src="' + file.url + '" class="viewer__media--image" referrerPolicy="no-referrer">');
        $imgContainer.append($img);
        $content.append($imgContainer);
        
        var $zoomControls = $([
          '<div class="viewer__zoom-controls">',
            '<button class="spa-shell__btn zoom-out"><i data-lucide="zoom-out"></i></button>',
            '<span class="zoom-level flex items-center min-w-[40px] justify-center text-sm font-medium">100%</span>',
            '<button class="spa-shell__btn zoom-in"><i data-lucide="zoom-in"></i></button>',
            '<button class="spa-shell__btn zoom-reset"><i data-lucide="maximize"></i></button>',
          '</div>'
        ].join(''));
        $content.append($zoomControls);
        break;
        
      case 'video':
        $footer.removeClass('hidden');
        var $video = $('<video controls class="viewer__media max-w-[90%] max-h-[90%] object-contain shadow-2xl" autoplay></video>');
        $video.append('<source src="' + file.url + '" type="video/mp4">');
        $video[0].playbackRate = stateMap.playbackRate;
        $video[0].loop = stateMap.isLooping;
        $content.append($video);
        break;
        
      case 'audio':
        $footer.removeClass('hidden');
        var $audioPlayer = $([
          '<div class="viewer__audio-player">',
            '<div class="viewer__record-wrap">',
              '<div class="viewer__record">',
                '<div class="viewer__record-center">',
                  '<i data-lucide="music" class="w-8 h-8"></i>',
                '</div>',
              '</div>',
            '</div>',
            '<div class="viewer__audio-controls">',
              '<audio id="spa-viewer-audio" controls class="w-full"></audio>',
            '</div>',
          '</div>'
        ].join(''));
        
        var $audio = $audioPlayer.find('audio');
        $audio.append('<source src="' + file.url + '" type="audio/mpeg">');
        $audio[0].playbackRate = stateMap.playbackRate;
        $audio[0].loop = stateMap.isLooping;
        
        $audio.on('play', function() { $('.viewer__record').addClass('viewer__record--playing'); });
        $audio.on('pause', function() { $('.viewer__record').removeClass('viewer__record--playing'); });
        
        $content.append($audioPlayer);
        break;
        
      default:
        $content.append([
          '<div class="flex flex-col items-center gap-4 text-white/60 fallback">',
            '<i data-lucide="file-text" class="w-24 h-24"></i>',
            '<p>Preview not available for this file type</p>',
          '</div>'
        ].join(''));
    }

    updateNavigation();
    if ( window.lucide ) {
      window.lucide.createIcons();
    }
  };

  var initModule = function ( $container ) {
    stateMap.$container = $container;
    $container.append( configMap.main_html );

    var $viewer = $('#spa-viewer');
    var $title = $('#spa-viewer-title');

    $('#spa-viewer-close').on('click', function() {
      $viewer.addClass('hidden');
      $('#spa-viewer-content').empty();
      stopSlideshow();
    });

    var nextFile = function () {
      var index = stateMap.fileList.indexOf( stateMap.currentFile );
      if ( index < stateMap.fileList.length - 1 ) {
        stateMap.currentFile = stateMap.fileList[ index + 1 ];
        $title.text( stateMap.currentFile.name );
        renderPreview( stateMap.currentFile );
        return true;
      }
      return false;
    };

    var prevFile = function () {
      var index = stateMap.fileList.indexOf( stateMap.currentFile );
      if ( index > 0 ) {
        stateMap.currentFile = stateMap.fileList[ index - 1 ];
        $title.text( stateMap.currentFile.name );
        renderPreview( stateMap.currentFile );
        return true;
      }
      return false;
    };

    var startSlideshow = function () {
      stateMap.isSlideshow = true;
      $('#spa-viewer-slideshow').addClass('spa-shell__btn--primary');
      stateMap.slideshowTimer = setInterval(function() {
        if (!nextFile()) {
          stopSlideshow();
        }
      }, 3000);
    };

    var stopSlideshow = function () {
      stateMap.isSlideshow = false;
      $('#spa-viewer-slideshow').removeClass('spa-shell__btn--primary');
      if (stateMap.slideshowTimer) {
        clearInterval(stateMap.slideshowTimer);
        stateMap.slideshowTimer = null;
      }
    };

    $('#spa-viewer-prev').on('click', function() {
      stopSlideshow();
      prevFile();
    });

    $('#spa-viewer-next').on('click', function() {
      stopSlideshow();
      nextFile();
    });

    // Image Zoom Handlers
    $container.on('click', '.zoom-in', function() {
      stateMap.imageScale = Math.min(stateMap.imageScale + 0.2, 3.0);
      updateImageTransform();
    });

    $container.on('click', '.zoom-out', function() {
      stateMap.imageScale = Math.max(stateMap.imageScale - 0.2, 0.5);
      updateImageTransform();
    });

    $container.on('click', '.zoom-reset', function() {
      stateMap.imageScale = 1.0;
      updateImageTransform();
    });

    var updateImageTransform = function () {
      $('.viewer__media--image').css('transform', 'scale(' + stateMap.imageScale + ')');
      $('.zoom-level').text(Math.round(stateMap.imageScale * 100) + '%');
    };

    $('#spa-viewer-speed').on('change', function() {
      stateMap.playbackRate = parseFloat( $(this).val() );
      var media = $('#spa-viewer-content').find('video, audio')[0];
      if ( media ) media.playbackRate = stateMap.playbackRate;
    });

    $('#spa-viewer-loop').on('click', function() {
      stateMap.isLooping = !stateMap.isLooping;
      $(this).toggleClass('spa-shell__btn--primary', stateMap.isLooping);
      var media = $('#spa-viewer-content').find('video, audio')[0];
      if ( media ) media.loop = stateMap.isLooping;
    });

    $('#spa-viewer-info').on('click', function() {
      var file = stateMap.currentFile;
      var infoHtml = [
        '<h3 class="modal__title">File Info</h3>',
        '<div class="flex flex-col gap-3 text-sm">',
          '<div class="flex justify-between border-b border-black/5 pb-2">',
            '<span class="opacity-60">Name</span>',
            '<span class="font-medium">', file.name, '</span>',
          '</div>',
          '<div class="flex justify-between border-b border-black/5 pb-2">',
            '<span class="opacity-60">Type</span>',
            '<span class="font-medium">', file.type, '</span>',
          '</div>',
          '<div class="flex justify-between border-b border-black/5 pb-2">',
            '<span class="opacity-60">Size</span>',
            '<span class="font-medium">', file.size, '</span>',
          '</div>',
          '<div class="flex justify-between">',
            '<span class="opacity-60">Date</span>',
            '<span class="font-medium">', file.date, '</span>',
          '</div>',
        '</div>'
      ].join('');
      $(document).trigger('spa-show-modal', infoHtml);
    });

    $('#spa-viewer-download').on('click', function() {
      if (stateMap.currentFile && stateMap.currentFile.url) {
        var link = document.createElement('a');
        link.href = stateMap.currentFile.url;
        link.download = stateMap.currentFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });

    $('#spa-viewer-slideshow').on('click', function() {
      if (stateMap.isSlideshow) {
        stopSlideshow();
      } else {
        startSlideshow();
      }
    });

    $(document).on('spa-file-open', function(e, data) {
      stateMap.currentFile = data.file;
      stateMap.fileList = data.list || [data.file];
      $title.text(stateMap.currentFile.name);
      renderPreview(stateMap.currentFile);
      $viewer.removeClass('hidden');
    });

    $(document).on('spa-file-menu', function(e, id) {
      var file = spa.model.getFileById(id);
      if (!file) return;

      var menuHtml = [
        '<h3 class="modal__title truncate">', file.name, '</h3>',
        '<div class="flex flex-col gap-1">',
          '<button class="menu-action w-full text-left p-3 hover:bg-black/5 rounded-[12px] flex items-center gap-3" data-action="rename" data-id="', id, '">',
            '<i data-lucide="edit-2" class="w-5 h-5"></i> Rename',
          '</button>',
          '<button class="menu-action w-full text-left p-3 hover:bg-black/5 rounded-[12px] flex items-center gap-3 text-red-600" data-action="delete" data-id="', id, '">',
            '<i data-lucide="trash-2" class="w-5 h-5"></i> Delete',
          '</button>',
        '</div>'
      ].join('');
      
      $(document).trigger('spa-show-modal', menuHtml);
    });

    $(document).on('spa-show-modal', function(e, html) {
      spa.shell.showModal(html);
    });

    $(document).on('click', '.menu-action', function() {
      var action = $(this).data('action');
      var id = $(this).data('id');
      
      if (action === 'delete') {
        spa.model.deleteFile(id);
        spa.shell.hideModal();
      } else if (action === 'rename') {
        var file = spa.model.getFileById(id);
        if (!file) return;
        var newHtml = [
          '<h3 class="modal__title">Rename</h3>',
          '<input type="text" id="rename-input" value="', file.name, '" class="modal__input">',
          '<div class="modal__actions">',
            '<button id="modal-cancel" class="modal__btn modal__btn--cancel">Cancel</button>',
            '<button id="rename-confirm" class="modal__btn modal__btn--confirm" data-id="', id, '">Save</button>',
          '</div>'
        ].join('');
        spa.shell.showModal(newHtml);
      }
    });

    $(document).on('click', '#rename-confirm', function() {
      var id = $(this).data('id');
      var newName = $('#rename-input').val();
      if (newName) {
        spa.model.renameFile(id, newName);
        spa.shell.hideModal();
      }
    });
  };

  return { initModule : initModule };
}());
