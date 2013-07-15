var readline = require('readline'),
    path     = require('path'),
    fs       = require('fs'),
    async    = require('async');

var generateisDirectoryCheckerFunction = function(baseDirectory, file) {
  return function(callback){
            fs.stat(baseDirectory + file, function(err, stats) {
              if (err) {
                callback(err, null);
              }
              else {
                // var result = {};
                // result[file] = stats.isDirectory();
                callback(err, stats.isDirectory());
              }
            });
          };
};

var generateisDirectoryCheckerFunctions = function (baseDirectory, files) {
  var functions = [];
  if (baseDirectory[baseDirectory.length - 1] != '/') {
    baseDirectory += '/';
  }
  for (var i = 0; i < files.length; i++) {
    functions.push(generateisDirectoryCheckerFunction(baseDirectory, files[i]));
  }
  return functions;
};

var readdir = function (directoryPath, callback) {
  fs.readdir(directoryPath , function (err, files) {
    var isDirectoryFunctions = generateisDirectoryCheckerFunctions (directoryPath, files);
    async.parallel(isDirectoryFunctions, function (err, results) {
      var filesAndDirectories = {};
      for (var i = 0; i < results.length; i++) {
        filesAndDirectories[files[i]] = results[i];
      }
      callback(err, filesAndDirectories);
    });
  });
};

var generateChoices = function (linePartial, callback) {
  var absolutePath = path.resolve(linePartial);
  fs.stat(absolutePath, function (err, stats) {
    var pathToCheck = absolutePath,
        options     = [];
    if (err && err.code === 'ENOENT') {
      pathToCheck = path.dirname(absolutePath);
    }
    else if (linePartial === '..') {
      pathToCheck = path.resolve('.');
    }
    else if (err) {
      throw err;
    }

    if (!stats || stats.isDirectory()) {
      readdir(pathToCheck, function(err, filesAndDirectories) {
        if (linePartial === '.') {
          options.push('./');
          options.push('../');
        }
        else if (linePartial === '..') {
          options.push('../');
        }

        for (var name in filesAndDirectories) {
          if (filesAndDirectories[name]) {
            name += '/';
          }

          if (name.indexOf(linePartial) === 0) {
            options.push(name);
          }
        }

        callback(null, [options, linePartial]);
      });
    }
    else {
      callback(null, [[], linePartial]);
    }
  });
};

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: generateChoices
});

rl.setPrompt('>> ');
rl.resume();
rl.prompt();
