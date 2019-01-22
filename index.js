var express = require('express');
var app = express();
var fs = require('fs');
var youtubedl = require('youtube-dl');
var video = null;
const fetch = require('node-fetch');
var bugsnag = require('@bugsnag/js');
var bugsnagExpress = require('@bugsnag/plugin-express');
var bugsnagClient = bugsnag('29d387a86fd1e0407905366c533ab614');
bugsnagClient.use(bugsnagExpress);

var middleware = bugsnagClient.getPlugin('express');



app.get('/get-video/:video', function (req, res) {
  var host = req.get('host');
  if (!host.trim().toLowerCase().includes("178.128.174.90")) {
    res.send("Token missing in request");
    return;
  }
  var id = req.params.video.trim();
  video = youtubedl('https://www.youtube.com/watch?v=' + id,
    // Optional arguments passed to youtube-dl.
    [],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });



  // Will be called when the download starts.
  video.on('info', function (info) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Content-Type", "video/mp4");
    res.set('Content-disposition', 'attachment; ');
    res.set("Content-Length", info.size);
  });

  video.pipe(res);

  video.on('end', function (data) {
    console.log("Completed");
  });

  video.on('error', function error(err) {
    console.log(err);
    bugsnagClient.notify(err);
    res.redirect('https://soundtima.com?error=45');
    return;
  });
});

app.get('/get-audio/:audio', function (req, res) {
  var host = req.get('host');
  if (!host.trim().toLowerCase().includes("178.128.174.90")) {
    res.send("Token missing in request");
    return;
  }

  var id = req.params.audio.trim();
  youtubedl.exec('https://www.youtube.com/watch?v=' + id, ['-x', '--get-url', '--audio-format', 'mp3'], {}, function (err, output) {
    if (err) {
      bugsnagClient.notify(err);
      res.redirect('https://soundtima.com?error=45');
      return;
    }
    fetch(output[0])
      .then(reso => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Content-Type", "audio/mp3");
        res.set('Content-disposition', 'attachment;');
        reso.body.pipe(res);


      });
  });

});

app.listen(3000);