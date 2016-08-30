var request = require('request');
var fs = require('fs');

var download = function (uri, filename, callback, log){
    request(uri)
        .pipe(fs.createWriteStream(filename))
        .on('close', callback)
        .on('error', function(err){
            console.log(err);
        });
};

module.exports = download;