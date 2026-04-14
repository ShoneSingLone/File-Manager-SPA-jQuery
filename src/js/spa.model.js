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
    // Root Level
    { id: '1', name: 'Mountain Landscape.jpg', type: 'image', size: '3.2 MB', date: '2024-03-10', url: 'https://picsum.photos/seed/mountain/1200/800', parentId: 'root' },
    { id: '2', name: 'Ocean Waves.mp4', type: 'video', size: '24.5 MB', date: '2024-03-12', url: 'https://www.w3schools.com/html/mov_bbb.mp4', parentId: 'root' },
    { id: '3', name: 'Midnight Jazz.mp3', type: 'audio', size: '5.8 MB', date: '2024-03-15', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', parentId: 'root' },
    { id: '4', name: 'Work Documents', type: 'folder', size: '--', date: '2024-03-01', parentId: 'root' },
    { id: '7', name: 'Travel Photos', type: 'folder', size: '--', date: '2024-03-20', parentId: 'root' },
    { id: '8', name: 'Music Collection', type: 'folder', size: '--', date: '2024-03-22', parentId: 'root' },
    { id: '9', name: 'Project Demo.mp4', type: 'video', size: '42.1 MB', date: '2024-03-25', url: 'https://www.w3schools.com/html/movie.mp4', parentId: 'root' },
    { id: '10', name: 'Readme.txt', type: 'other', size: '12 KB', date: '2024-03-28', parentId: 'root' },

    // Work Documents Folder
    { id: '5', name: 'Q1 Financial Report.pdf', type: 'other', size: '1.1 MB', date: '2024-03-05', parentId: '4' },
    { id: '6', name: 'Product Roadmap.pptx', type: 'other', size: '5.6 MB', date: '2024-03-08', parentId: '4' },
    { id: '11', name: 'Meeting Notes.docx', type: 'other', size: '45 KB', date: '2024-03-09', parentId: '4' },
    { id: '12', name: 'Archive', type: 'folder', size: '--', date: '2023-12-15', parentId: '4' },
    { id: '13', name: 'Old Strategy.pdf', type: 'other', size: '2.3 MB', date: '2023-11-20', parentId: '12' },

    // Travel Photos Folder
    { id: '14', name: 'Paris - Eiffel Tower.jpg', type: 'image', size: '4.1 MB', date: '2024-02-14', url: 'https://picsum.photos/seed/paris/1200/900', parentId: '7' },
    { id: '15', name: 'Tokyo - Shibuya.jpg', type: 'image', size: '3.8 MB', date: '2024-02-20', url: 'https://picsum.photos/seed/tokyo/1200/900', parentId: '7' },
    { id: '16', name: 'New York - Skyline.jpg', type: 'image', size: '5.2 MB', date: '2024-02-25', url: 'https://picsum.photos/seed/nyc/1200/900', parentId: '7' },
    { id: '17', name: 'London - Big Ben.jpg', type: 'image', size: '3.5 MB', date: '2024-03-01', url: 'https://picsum.photos/seed/london/1200/900', parentId: '7' },
    { id: '18', name: 'Rome - Colosseum.jpg', type: 'image', size: '4.7 MB', date: '2024-03-05', url: 'https://picsum.photos/seed/rome/1200/900', parentId: '7' },

    // Music Collection Folder
    { id: '19', name: 'Acoustic Guitar.mp3', type: 'audio', size: '3.4 MB', date: '2024-01-10', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', parentId: '8' },
    { id: '20', name: 'Electronic Pulse.mp3', type: 'audio', size: '4.8 MB', date: '2024-01-15', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', parentId: '8' },
    { id: '21', name: 'Piano Sonata.mp3', type: 'audio', size: '6.2 MB', date: '2024-01-20', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', parentId: '8' },
    { id: '22', name: 'Ambient Rain.mp3', type: 'audio', size: '12.5 MB', date: '2024-01-25', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', parentId: '8' },
    { id: '23', name: 'Lo-fi Study.mp3', type: 'audio', size: '5.1 MB', date: '2024-02-01', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', parentId: '8' }
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
