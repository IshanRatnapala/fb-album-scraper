var request = require('request');
var Stream = require('stream').Transform;
var fs = require('fs');

var download = function (uri, filename, callback, log){
    request.head(uri, function(err, res, body){
        // console.log('content-type:', res.headers['content-type']);
        // console.log('content-length:', res.headers['content-length']);
        try {
            request(uri)
                .pipe(fs.createWriteStream(filename))
                .on('close', callback)
                .on('error', function(err){console.log(err);});
        } catch (e) {
            console.log(e);
        }
        
    });
};

module.exports = download;