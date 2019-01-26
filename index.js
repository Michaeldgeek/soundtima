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
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const slugify = require('@sindresorhus/slugify');

app.get('/get-video/:video', function (req, res) {
  var host = req.get('host');
  if (!host.trim().toLowerCase().includes("178.128.174.90")) {
    res.send("Token missing in request");
    return;
  }
  var id = req.params.video.trim();
  video = youtubedl('https://www.youtube.com/watch?v=' + id,
    // Optional arguments passed to youtube-dl.
    ['--restrict-filenames'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });



  // Will be called when the download starts.
  video.on('info', function (info) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Content-Type", "video/" + info.ext);
    res.set('Content-disposition', 'attachment; filename=' + info._filename);
    res.set("Content-Length", info.size);
  });

  video.pipe(res);

  video.on('end', function (data) {
  });

  video.on('error', function error(err) {
    bugsnagClient.notify(err);
    res.redirect('https://soundtima.com?error=45');
    return;
  });
});

app.get('/get-audio/:audio/:title', function (req, res) {
  var host = req.get('host');
  if (!host.trim().toLowerCase().includes("178.128.174.90")) {
    res.send("Token missing in request");
    return;
  }

  var id = req.params.audio.trim();
  var title = req.params.title.trim();
  let stream = ytdl(id, {
    quality: 'highestaudio',
    //filter: 'audioonly',
  });


  var command = ffmpeg(stream)
    .audioBitrate(128)
    .format('mp3')
    .on('start', function (params) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Content-Type", "audio/mp3");
      res.set('Content-disposition', 'attachment; filename=' + slugify(title).toLowerCase().replace("official", "").replace("audio", "").replace("video", "") + ".mp3");

    })
    .on('error', function (err, stdout, stderr) {
      bugsnagClient.notify(err);
    })
    .on('end', () => {

    }).pipe(res, { end: true });

});

app.get('/', function (req, res) {
  res.send("Token missing in request");

});


app.listen(3000);