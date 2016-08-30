var https = require('https');
var fs = require('fs');
var request = require('request');
var download = require('./module/download');
var vorpal = require('vorpal')();

var logStream = fs.createWriteStream('log.txt', {'flags': 'w+'});

const APP_ID = '1232523328781160134';
const APP_SECRET = '522e50d1dee5af52934c15784cd1d05ff34e';

function makeUrl (albumId) {
    var url = {
        host: 'https://graph.facebook.com/v2.7/',
        albumId: albumId,
        query: '?fields=name,photos{images}',
        auth: '&access_token=' + APP_ID + '|' + APP_SECRET
    }

    return url.host + url.albumId + url.query + url.auth;
}

function requestData (url) {
    https.get(url, function (res) {
        res.setEncoding('utf8');

        var buffer = '';

        res.on('data', function (chunk) {
            buffer += chunk;
        });
        res.on('end', function () {
            processResponse(buffer);
        });
    });
}

var responseCount = 0;
var imageCount = 0
function processResponse (response) {
    responseCount++;
    var imageUrls = [];
    var jsonResponse = JSON.parse(response);
    var albumName = jsonResponse.name.replace(/[^a-z0-9]+|\s+/gmi, " ").trim();
    var imageData = jsonResponse.photos.data;
    var nextSection = jsonResponse.photos.paging.next;

    console.log("Getting image urls for album: \"" + albumName + "\"\n");
    logStream.write('> Processing section: ' + responseCount + '\r\n');
    console.log('processing section: ' + responseCount);

    for (var index = 0; index < imageData.length; index++) {
        imageCount++;
        var image = imageData[index];
        logStream.write(image.images[0].source + '\r\n');
        imageUrls.push({
            name: image.id,
            url: image.images[0].source
        });
    }

    if (nextSection) {
        // Get the next section
        requestData(nextSection);
    } else {
        console.log("Looks like we're done getting the links.");
        console.log("Total images: " + imageCount + "\n");
        logStream.write('\r\n' + 'Total images: ' + imageCount + ' from ' + responseCount + ' section(s)!');
    }

    // Download the images
    downloadAlbum(albumName, imageUrls)
    
}

function downloadAlbum (albumName, imageUrls) {
    //create the folders first
    try {
        fs.statSync('downloads');
    } catch(e) {
        fs.mkdirSync('downloads');
    }
    var albumFolder = 'downloads/' + albumName;
    try {
        fs.statSync(albumFolder);
    } catch(e) {
        fs.mkdirSync(albumFolder);
    }
    
    var counter = 0;
    // Download the photos (All at once)
    // for (var index = 0; index < imageUrls.length; index++) {
    //     var imageUrl = imageUrls[index];
    //     download(imageUrl.url, albumFolder + '/' + encodeURIComponent(imageUrl.name) + '.' + imageUrl.url.split('.').pop().split('?')[0], function(){
    //         counter++;
    //         console.log('Finished downloading image ' + counter + ' of ' + imageUrls.length);
    //     });
    // }

    // Download the photos (One by one)
    downloadImage(imageUrls[counter]);

    function downloadImage (imageUrl) {
        console.log('Downloading image ' + (counter+1) + ' of ' + imageUrls.length);
        download(imageUrl.url, albumFolder + '/' + encodeURIComponent(imageUrl.name) + '.' + imageUrl.url.split('.').pop().split('?')[0], function(){
            counter++;
            console.log('Done.');
            if (counter < imageUrls.length) {
                downloadImage(imageUrls[counter]);
            }
        });
    }
}


vorpal
    .command('download <albumId> ', 'Download the album with the given id')
    .action(function(args, cb) {
        requestData(makeUrl(args.albumId));
    });

vorpal
    .delimiter('downloadAlbum$')
    .show();