
/**
 * Module dependencies.
 */

var express = require('express'),
	fs = require('fs'),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec;

var app = module.exports = express.createServer();

var pid = null;
var currentSoundFile = '';
var mplayer;
// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
//  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

function stopLastSound() {
	console.log('stop request');
	if(pid != null) {
		//stop
		console.log('stopping last sound: ' + currentSoundFile);
		exec('kill ' + pid, function(error, stdout, stderr) {console.log(stdout);});
		pid = null;
	}
}

// Routes

app.get('/', function(req,res){
	res.redirect('/home.html');
});

app.get('/stop', function(req,res){
	stopLastSound();
	res.send('ok');
});

app.get('/play', function(req,res){
	var file = req.query['file'];
	stopLastSound();

	mplayer=spawn('mplayer', ['./sounds/' + file]);
	mplayer.on('exit', function(code){ pid=null; });

	pid = mplayer.pid;
	currentSoundFile = file;
	console.log('playing sound: ' + file);

	res.send('ok');
	
});

app.get('/list', function(req,res) {
	var files = fs.readdirSync('./sounds');
	
	var response = '<table id="soundLinkTable" width="40%">';
	response += '<thead><tr><th scope="col">Sound Name</th><th scope="col">Delete</th></tr></thead>';
	response += '<tbody>';

	for(var i = 0; i < files.length; ++i) {
		var eFile = escape(files[i]);
		var rowClass = (i%2 == 0) ? 'even' : 'odd';
		
		response += '<tr class="' + rowClass + '">';
		response += '<th scope="row"><a href="javascript: playSound(\'' + eFile + '\')">' + files[i] + '</a></th>';
		response += '<td><a href="javascript: deleteSound(\'' + eFile + '\')">delete</a></td>';
		response += '</tr>';
	}

	response += '<tfoot><tr><td id="status" colspan="2">&nbsp;</td></tr></tfoot>';
	response += '</tbody></table>';

	res.send(response);
});

app.get('/status', function(req,res){
	var status = 'Player Status: ';
	if(pid!=null){
		status += 'Playing - ' + currentSoundFile;
	}
	else {
		status += 'Idle';
	}
	console.log('status ping: ' + status);
	res.send(status);
});

app.get('/deletesound', function(req,res) {
	var file = req.query['file'];
	var files = fs.readdirSync('./sounds');
	var response = 'Failed delete..';
	console.log('delete attempt for file: ' + file);
	console.log('checking against ' + files.length + ' files.');
	for(var i = 0; i < files.length; ++i) {
		console.log('file[' + i + ']: ' + files[i]);
		if(files[i]==file) {
			console.log('[MATCHED] file[' + i + ']: ' + files[i] + ' to ' + file);
			exec('rm -f ./sounds/' + file, function(){console.log('deleted sound file ' + file);});
			response = 'Deleted Sound: ' + file;
		}
	}
	res.send(response);
});

app.post('/soundupload', function (req,res) {
	var serverPath = './sounds/' + req.files.soundfile.name;
	console.log('copying temp file: ' + req.files.soundfile.path);
	console.log('to server path: ' + serverPath);
	require('fs').rename(
		req.files.soundfile.path, 
		serverPath,
		function(error) {
			if(error) {
				res.send({ error: 'There was an error uploading file.' });
				return;
			}

			res.send({ path: req.files.soundfile.name });
		}
	);
	console.log('deleting temp file: ' + req.files.soundfile.path);
	exec('rm -f ' + req.files.soundfile.path, function(){console.log('done deleting.');});
});

app.listen(8000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
