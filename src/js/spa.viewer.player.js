/**
 * spa.viewer.player.js
 * Media player sub-module
 */

/*global $, spa */

window.spa.viewer.player = (function () {
  'use strict';

  var formatTime = function ( seconds ) {
    var min = Math.floor( seconds / 60 );
    var sec = Math.floor( seconds % 60 );
    return ( min < 10 ? '0' + min : min ) + ':' + ( sec < 10 ? '0' + sec : sec );
  };

  var create = function ( $media, type, handlers ) {
    var $player = $([
      '<div class="media-player">',
        '<div class="media-player__row media-player__row--top">',
          '<div class="media-player__time player-time-current">00:00</div>',
          '<div class="media-player__progress-container">',
            '<div class="media-player__progress-bar"></div>',
          '</div>',
          '<div class="media-player__time player-time-duration">00:00</div>',
        '</div>',
        '<div class="media-player__row media-player__row--middle">',
          '<button class="player-nav-btn player-prev" title="Previous">', spa.util.getSvg('skip-back'), '</button>',
          '<button class="player-play-btn player-play" title="Play/Pause">', spa.util.getSvg('play'), '</button>',
          '<button class="player-nav-btn player-next" title="Next">', spa.util.getSvg('skip-forward'), '</button>',
        '</div>',
        '<div class="media-player__row media-player__row--bottom">',
          '<div class="player-setting">',
            '<span class="text-[10px] uppercase opacity-40 mr-1">Speed</span>',
            '<select class="player-speed bg-transparent border-none text-xs outline-none text-white/70 cursor-pointer">',
              '<option value="0.5" class="bg-zinc-900">0.5x</option>',
              '<option value="1.0" class="bg-zinc-900" selected>1.0x</option>',
              '<option value="1.5" class="bg-zinc-900">1.5x</option>',
              '<option value="2.0" class="bg-zinc-900">2.0x</option>',
            '</select>',
          '</div>',
          '<button class="player-setting-btn player-loop" title="Toggle Loop">',
            spa.util.getSvg('repeat', 'w-4 h-4'),
          '</button>',
          (type === 'video' ? '<button class="player-setting-btn player-fullscreen" title="Fullscreen">' + spa.util.getSvg('maximize', 'w-4 h-4') + '</button>' : ''),
        '</div>',
      '</div>'
    ].join(''));

    var media = $media[0];
    var $playBtn = $player.find('.player-play');
    var $progress = $player.find('.media-player__progress-bar');
    var $timeCurrent = $player.find('.player-time-current');
    var $timeDuration = $player.find('.player-time-duration');
    var $loopBtn = $player.find('.player-loop');

    $playBtn.on('click', function() {
      if ( media.paused ) { media.play(); } else { media.pause(); }
    });

    $player.find('.player-prev').on('click', handlers.onPrev);
    $player.find('.player-next').on('click', handlers.onNext);

    $player.find('.player-speed').on('change', function() {
      media.playbackRate = parseFloat($(this).val());
    });

    $loopBtn.on('click', function() {
      media.loop = !media.loop;
      $(this).toggleClass('text-primary', media.loop);
    });

    $media.on('play', function() {
      $playBtn.html(spa.util.getSvg('pause'));
      if ( type === 'audio' ) $('.viewer__record').addClass('viewer__record--playing');
      handlers.onPlay();
    });

    $media.on('pause', function() {
      $playBtn.html(spa.util.getSvg('play'));
      if ( type === 'audio' ) $('.viewer__record').removeClass('viewer__record--playing');
    });

    $media.on('timeupdate', function() {
      var percent = ( media.currentTime / media.duration ) * 100;
      $progress.css('width', percent + '%');
      $timeCurrent.text( formatTime(media.currentTime) );
      $timeDuration.text( formatTime(media.duration || 0) );
    });

    $player.find('.media-player__progress-container').on('click', function(e) {
      var rect = this.getBoundingClientRect();
      media.currentTime = ((e.pageX - rect.left) / rect.width) * media.duration;
    });

    if ( type === 'video' ) {
      $player.find('.player-fullscreen').on('click', function() {
        if ( media.requestFullscreen ) media.requestFullscreen();
      });
    }

    return $player;
  };

  return { create : create };
}());
