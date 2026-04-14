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
          '<button id="spa-viewer-close" class="spa-shell__btn spa-shell__btn--viewer">',
            spa.util.getSvg('x'),
          '</button>',
          '<div class="spa-shell__title" id="spa-viewer-title"></div>',
          '<div class="spa-shell__actions">',
            '<button id="spa-viewer-slideshow" class="spa-shell__btn spa-shell__btn--viewer" title="Slideshow">',
              spa.util.getSvg('play'),
            '</button>',
            '<button id="spa-viewer-info" class="spa-shell__btn spa-shell__btn--viewer">',
              spa.util.getSvg('info'),
            '</button>',
            '<button id="spa-viewer-download" class="spa-shell__btn spa-shell__btn--viewer">',
              spa.util.getSvg('download'),
            '</button>',
          '</div>',
        '</header>',
        
        '<div id="spa-viewer-content" class="viewer__content">',
          '<button id="spa-viewer-prev" class="viewer__nav viewer__nav--prev">',
            spa.util.getSvg('chevron-left'),
          '</button>',
          '<button id="spa-viewer-next" class="viewer__nav viewer__nav--next">',
            spa.util.getSvg('chevron-right'),
          '</button>',
        '</div>',

        '<footer id="spa-viewer-footer" class="viewer__footer hidden">',
          '<div class="flex items-center justify-center gap-6">',
            '<button id="spa-viewer-loop" class="spa-shell__btn spa-shell__btn--viewer">',
              spa.util.getSvg('repeat'),
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

  var formatTime = function ( seconds ) {
    var min = Math.floor( seconds / 60 );
    var sec = Math.floor( seconds % 60 );
    return ( min < 10 ? '0' + min : min ) + ':' + ( sec < 10 ? '0' + sec : sec );
  };

  var createCustomPlayer = function ( $media, type ) {
    var $player = $([
      '<div class="media-player">',
        '<div class="media-player__progress-container">',
          '<div class="media-player__progress-bar"></div>',
        '</div>',
        '<div class="media-player__controls">',
          '<div class="media-player__group">',
            '<button class="spa-shell__btn spa-shell__btn--viewer player-play">', spa.util.getSvg('play'), '</button>',
            '<div class="media-player__time">00:00 / 00:00</div>',
          '</div>',
          '<div class="media-player__group">',
            '<div class="media-player__volume">',
              spa.util.getSvg('volume-2', 'w-4 h-4'),
              '<div class="media-player__volume-slider">',
                '<div class="media-player__volume-level"></div>',
              '</div>',
            '</div>',
            (type === 'video' ? '<button class="spa-shell__btn spa-shell__btn--viewer player-fullscreen">' + spa.util.getSvg('maximize') + '</button>' : ''),
          '</div>',
        '</div>',
      '</div>'
    ].join(''));

    var media = $media[0];
    var $playBtn = $player.find('.player-play');
    var $progress = $player.find('.media-player__progress-bar');
    var $time = $player.find('.media-player__time');
    var $volumeLevel = $player.find('.media-player__volume-level');

    var $volumeIcon = $player.find('.media-player__volume i');

    $playBtn.on('click', function() {
      if ( media.paused ) {
        media.play();
      } else {
        media.pause();
      }
    });

    $player.find('.media-player__volume svg').on('click', function() {
      media.muted = !media.muted;
      $(this).parent().html(spa.util.getSvg(media.muted ? 'volume-x' : 'volume-2', 'w-4 h-4') + '<div class="media-player__volume-slider"><div class="media-player__volume-level"></div></div>');
      // Re-bind volume slider after HTML replacement
      $volumeLevel = $player.find('.media-player__volume-level');
      $player.find('.media-player__volume-slider').on('click', function(e) {
        var rect = this.getBoundingClientRect();
        var x = e.pageX - rect.left;
        var percent = x / rect.width;
        media.volume = percent;
        $volumeLevel.css('width', (percent * 100) + '%');
      });
    });

    $media.on('play', function() {
      $playBtn.html(spa.util.getSvg('pause'));
      if ( type === 'audio' ) $('.viewer__record').addClass('viewer__record--playing');
      if ( stateMap.isSlideshow ) stopSlideshow();
    });

    $media.on('pause', function() {
      $playBtn.html(spa.util.getSvg('play'));
      if ( type === 'audio' ) $('.viewer__record').removeClass('viewer__record--playing');
    });

    $media.on('timeupdate', function() {
      var percent = ( media.currentTime / media.duration ) * 100;
      $progress.css('width', percent + '%');
      $time.text( formatTime(media.currentTime) + ' / ' + formatTime(media.duration || 0) );
    });

    $player.find('.media-player__progress-container').on('click', function(e) {
      var rect = this.getBoundingClientRect();
      var x = e.pageX - rect.left;
      var percent = x / rect.width;
      media.currentTime = percent * media.duration;
    });

    $player.find('.media-player__volume-slider').on('click', function(e) {
      var rect = this.getBoundingClientRect();
      var x = e.pageX - rect.left;
      var percent = x / rect.width;
      media.volume = percent;
      $volumeLevel.css('width', (percent * 100) + '%');
    });

    if ( type === 'video' ) {
      $player.find('.player-fullscreen').on('click', function() {
        if ( media.requestFullscreen ) media.requestFullscreen();
      });
    }

    return $player;
  };

  var renderPreview = function ( file ) {
    var $content = $('#spa-viewer-content');
    var $footer = $('#spa-viewer-footer');
    var $viewer = $('#spa-viewer');
    
    $content.find('.viewer__media, .viewer__media--image, .viewer__image-container, .viewer__audio-player, .viewer__zoom-controls, .fallback').remove();
    $footer.addClass('hidden');
    $viewer.removeClass('viewer--image viewer--video viewer--audio');
    $viewer.addClass('viewer--' + file.type);
    stateMap.imageScale = 1.0;

    switch ( file.type ) {
      case 'image':
        var $imgContainer = $('<div class="viewer__image-container"></div>');
        var $img = $('<img src="' + file.url + '" class="viewer__media--image" referrerPolicy="no-referrer">');
        $imgContainer.append($img);
        $content.append($imgContainer);
        
        var $zoomControls = $([
          '<div class="viewer__zoom-controls">',
            '<button class="spa-shell__btn spa-shell__btn--viewer zoom-out">', spa.util.getSvg('zoom-out'), '</button>',
            '<span class="zoom-level flex items-center min-w-[40px] justify-center text-sm font-medium">100%</span>',
            '<button class="spa-shell__btn spa-shell__btn--viewer zoom-in">', spa.util.getSvg('zoom-in'), '</button>',
            '<button class="spa-shell__btn spa-shell__btn--viewer zoom-reset">', spa.util.getSvg('maximize'), '</button>',
          '</div>'
        ].join(''));
        $content.append($zoomControls);
        break;
        
      case 'video':
        $footer.removeClass('hidden');
        var $video = $('<video class="viewer__media max-w-[90%] max-h-[80%] object-contain shadow-2xl" autoplay></video>');
        $video.append('<source src="' + file.url + '" type="video/mp4">');
        $video[0].playbackRate = stateMap.playbackRate;
        $video[0].loop = stateMap.isLooping;
        
        var $player = createCustomPlayer($video, 'video');
        $content.append($video).append($player);
        break;
        
      case 'audio':
        $footer.removeClass('hidden');
        var $audioPlayer = $([
          '<div class="viewer__audio-player">',
            '<div class="viewer__record-wrap">',
              '<div class="viewer__record">',
                '<div class="viewer__record-center">',
                  spa.util.getSvg('music', 'w-8 h-8'),
                '</div>',
              '</div>',
            '</div>',
          '</div>'
        ].join(''));
        
        var $audio = $('<audio></audio>');
        $audio.append('<source src="' + file.url + '" type="audio/mpeg">');
        $audio[0].playbackRate = stateMap.playbackRate;
        $audio[0].loop = stateMap.isLooping;
        
        var $player = createCustomPlayer($audio, 'audio');
        $audioPlayer.append($player);
        $content.append($audioPlayer).append($audio);
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
      // Filter list to only include same type files from the same directory
      stateMap.fileList = (data.list || []).filter(function(f) {
        return f.type === data.file.type;
      });
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
