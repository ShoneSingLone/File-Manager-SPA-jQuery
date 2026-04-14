/**
 * spa.model.js
 * Model module
 */

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global $ */

window.spa.model = (function () {
  'use strict';
  
  var fs = [
    { id: '1', name: 'Vacation Photo.jpg', type: 'image', size: '2.4 MB', date: '2024-03-10', url: 'https://picsum.photos/seed/vacation/800/600', parentId: 'root' },
    { id: '2', name: 'Nature.mp4', type: 'video', size: '15.8 MB', date: '2024-03-12', url: 'https://www.w3schools.com/html/mov_bbb.mp4', parentId: 'root' },
    { id: '3', name: 'Chill Beats.mp3', type: 'audio', size: '4.2 MB', date: '2024-03-15', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', parentId: 'root' },
    { id: '4', name: 'Work Documents', type: 'folder', size: '--', date: '2024-03-01', parentId: 'root' },
    { id: '5', name: 'Report.pdf', type: 'other', size: '1.1 MB', date: '2024-03-05', parentId: '4' },
    { id: '6', name: 'Presentation.pptx', type: 'other', size: '5.6 MB', date: '2024-03-08', parentId: '4' }
  ];

  var getFiles = function ( parentId ) {
    return fs.filter( function ( f ) { return f.parentId === parentId; } );
  };

  var addFolder = function ( name, parentId ) {
    var id = String( Date.now() );
    fs.push({ id: id, name: name, type: 'folder', size: '--', date: new Date().toISOString().split('T')[0], parentId: parentId });
    $(document).trigger('spa-model-update');
  };

  var deleteFile = function ( id ) {
    fs = fs.filter( function ( f ) { return f.id !== id; } );
    $(document).trigger('spa-model-update');
  };

  var renameFile = function ( id, newName ) {
    var file = fs.find( function ( f ) { return f.id === id; } );
    if ( file ) {
      file.name = newName;
      $(document).trigger('spa-model-update');
    }
  };

  var searchFiles = function ( query ) {
    if ( !query ) return [];
    return fs.filter( function ( f ) { return f.name.toLowerCase().indexOf( query.toLowerCase() ) !== -1; } );
  };

  var getFileById = function ( id ) {
    return fs.find( function ( f ) { return f.id === id; } );
  };

  var getPath = function ( id ) {
    var path = [];
    var currentId = id;
    
    while ( currentId && currentId !== 'root' ) {
      var folder = fs.find( function ( f ) { return f.id === currentId; } );
      if ( folder ) {
        path.unshift( folder );
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    
    path.unshift({ id: 'root', name: 'Files' });
    return path;
  };

  return {
    getFiles: getFiles,
    addFolder: addFolder,
    deleteFile: deleteFile,
    renameFile: renameFile,
    searchFiles: searchFiles,
    getFileById: getFileById,
    getPath: getPath
  };
}());
