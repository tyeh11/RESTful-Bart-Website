//My bart webpage is host by node.js. 
//To start bart webpage, please go to /var/www/html/bartdir and run "sudo node bart.js

var express = require('express');
var app = express();
var fs = require('fs');
var port = process.env.PORT || 3030;
var http = require("http");

app.get('/', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    var html = fs.readFileSync(__dirname + '/bart.html', 'utf8');
    res.end(html);
});


app.get('/stations', function(req, res){ //API:GET /stations
	var stations = [];
	let body = '';
	let req1 = http.get('http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V&json=y', (res1) => {
		res1.setEncoding('utf8');
		res1.on('data', (chunk) => {
			body += chunk;
		});
		res1.on('end', () => {
			let stationList = JSON.parse(body).root.stations.station;
			res.writeHead(200, { 'Content-Type':  'text/plain' });
			res.end(JSON.stringify(stationList));
		});
	});
});

app.get('/trips', function(req, res) { // API: GET /trips?source=<STN_ABBR>&dest=<STN_ABBR>
	let source = req.query.source;
	let dest = req.query.dest;
	//console.log(source);
	//console.log(dest);
	let query = http.get('http://api.bart.gov/api/sched.aspx?cmd=depart&key=MW9S-E7SL-26DU-VV8V&orig='+source+
		'&dest='+dest+'&time=now&date=now&b=0&a=4&l=1&json=y', function(res1){
		let body = '';
		res1.setEncoding('utf8');
		res1.on('data', (chunk) => {
			body += chunk;
		});
		res1.on('end', () => {
			res.writeHead(200, { 'Content-Type':  'text/plain' });
			let trip = JSON.parse(body).root.schedule.request.trip;
			//console.log(body)
			res.end(JSON.stringify(trip));
		});
	});
});

app.get('/station', function(req, res) { //API: GET /station?source=<STN_ABBR>
	let source = req.query.source;
	let query = http.get('http://api.bart.gov/api/stn.aspx?cmd=stninfo&key=MW9S-E7SL-26DU-VV8V&orig='+source+'&json=y', function(res1) {
		let body = '';
		res1.setEncoding('utf8');
		res1.on('data', function(chunk){
			body+=chunk;
		});
		
		res1.on('end', function(){
			res.writeHead(200, {'Content-Type': 'text/plain'});
			let station = JSON.parse(body).root.stations.station;
			res.end(JSON.stringify(station));
		});
	});
});

app.get('/js/*', function(req, res) {
	//console.log(req.path);
	res.writeHead(200, { 'Content-Type': 'application/javascript' });
    var html = fs.readFileSync(__dirname + req.path, 'utf8');
    res.end(html);
});

app.get('/css/*', function(req, res) {
	//console.log(req.path);
	res.writeHead(200, { 'Content-Type': 'text/css' });
    var html = fs.readFileSync(__dirname + req.path, 'utf8');
    res.end(html);
});

app.listen(3030, '127.0.0.1');

