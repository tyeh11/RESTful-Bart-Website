var stations = {};
var autoRefresh;
$(document).ready(function(){
	let showData1 = $('#departList');
	let showData2 = $('#destList');
	$.getJSON('/stations', function (data) { //get station names though my api and build selections
	  for(let i = 0; i < data.length; i++){
		let content1 = '<option value="'+ data[i].abbr+'">' + data[i].name + '</option>';
		let content2 = '<option value="'+ data[i].abbr+'">' +data[i].name+ '</option>';
		stations[data[i].abbr] = data[i];
		showData1.append(content1);
		showData2.append(content2);
	  }
	 });
	 autoRefresh = setInterval(function(){ // start timer for autoRefresh per 30s
		 console.log('time up');
		 makeTrip();
	 }, 30000);
});

var count;
function makeTrip(){ //generate train information based on selected source and destination stations
	let source = $('#departList').val();
	let dest = $('#destList').val();
	if (source === 'none' || dest === 'none') return;
	if (source === dest) return;
	getStationInfo(source);
	let tripResult = $('#tripResult'); 
	tripResult.empty();
	tripResult.append('<p>The trip from ' +source+ ' to ' +dest+ ': ');
	tripResult.append('<ul id="tripList"></ul>');
	tripResult = $('#tripList');
	calcRoute();
	$.getJSON('/trips?source='+source+'&dest='+dest, function(data){
		//console.log(data);
		let nextDepartTime;
		let arrivalTime;
		let flag = false;
		for (let i = 0; i < data.length; i++) {
			if (!flag) { //check if train not depart, if yes, start counting down
				nextDepartTime = parseDate(data[i]['@origTimeDate'], data[i]['@origTimeMin']);
				arrivalTime = parseDate(data[i]['@destTimeDate'], data[i]['@destTimeMin']);
				console.log(nextDepartTime);
				clearInterval(count);
				if (nextDepartTime > new Date()) {
					flag = true;
					count = setInterval(function() {
					countingDown(nextDepartTime.getTime(), count);
					}, 1000);
				}
			} 
			//build and display trains information
			let fares = data[i].fares.fare;
			let tempFare = '';
			for (let j = 0; j < fares.length; j++){
				tempFare += (' ' + fares[j]['@name'] + ':' + fares[j]['@amount']) ;
			}
			let travelTime = arrivalTime.getTime() - nextDepartTime.getTime();
			let connectSTA = 'Stations in trip: ' + source;
			for (let j = 0; j < data[i]['leg'].length - 1; j++){
				connectSTA += ' -> ' + data[i]['leg'][j]['@destination'];
			}
			connectSTA += ' -> ' + dest;
			let hours = Math.floor((travelTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			let minutes = Math.floor((travelTime % (1000 * 60 * 60)) / (1000 * 60));
			let aTrip = (('Start Time: ' + data[i]['@origTimeMin'] + ' Arrival Time: ' + data[i]['@destTimeMin']+ ' Travel Time: ' + hours + 'H ' + minutes + 'M'));
			tripResult.append('<li><p>'+connectSTA+'</p><p>'+aTrip+'</p><p>Fares: '+tempFare+'</p></li>');
		}
		calcRoute(nextDepartTime, arrivalTime);
	});
}

function getStationInfo(source) { //build and show source station information though my api
	let routeInfo =  $('#route');
	routeInfo.empty();
	$.getJSON('/station?source='+source, function(data){
		$('#address').html(data.address + ' ' + data.city + ' ' + data.county + ' ' + data.state + ' ' + data.zipcode);
		$('#info').html(data['intro']['#cdata-section']);
		let route = '';
		for (let i = 0; i < data.north_routes.route.length; i++) {
			route += data.north_routes.route[i] + ' ';
		}
		routeInfo.append('<li>North Routes: '+ route +'</li>');
		
		route = '';
		for (let i = 0; i < data.south_routes.route.length; i++) {
			route += data.south_routes.route[i] + ' ';
		}		
		routeInfo.append('<li>South Routes: '+ route +'</li>');
		routeInfo.append('<li>North Platforms: '+ data.north_platforms.platform +'</li>');
		routeInfo.append('<li>South Platforms: '+ data.south_platforms.platform +'</li>');
	});
}

function countingDown(targetTime) {
	let remaining = targetTime - new Date().getTime();
	let hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	let minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
	let seconds = Math.floor((remaining % (1000 * 60)) / 1000);
	$('#remainingTime').html('Time before depart: '+ hours + 'H ' + minutes+ 'M ' + seconds + 'S');
	if (remaining <= 0) {
		clearInterval(count);
		makeTrip();
	}
}

var map;
var directionsDisplay;
var directionsService;
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 22.9876033, lng: 120.229442},
	  zoom: 13.94
	});
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsService = new google.maps.DirectionsService();
	directionsDisplay.setMap(map);
}

function calcRoute(nextDepartTime) {
	let source = $('#departList').val();
	let dest = $('#destList').val();
	console.log(stations[source].gtfs_latitude);
	let request = {
		origin: {lat: parseFloat(stations[source].gtfs_latitude), lng: parseFloat(stations[source].gtfs_longitude)},
		destination: {lat: parseFloat(stations[dest].gtfs_latitude), lng: parseFloat(stations[dest].gtfs_longitude)},
		travelMode: 'TRANSIT',
		transitOptions: {
			modes: ['RAIL'],
			departureTime: nextDepartTime
		}
	};
	directionsService.route(request, function(result, status) {
		if (status == 'OK') {
			directionsDisplay.setDirections(result);
		}	else {
			window.alert('Directions request failed due to ' + status);
		}
	});
}

function parseDate(TimeDate, TimeMin) {  //turn schedule time to javascript date
	let resultDate = new Date(TimeDate);
	let minString = TimeMin.trim();
	let index = minString.indexOf(':');
	let hour = minString.substring(0, index);
	if (minString.endsWith('PM') && hour != '12') {
		resultDate.setHours((parseInt(hour) + 12).toString());
	} else if (minString.endsWith('AM') && hour == '12'){
		resultDate.setHours('00');
	} else {
		resultDate.setHours(hour);
	}
	resultDate.setMinutes(minString.substring(index+1, minString.length-2));
	return resultDate;
}


window.onload = function() { // function of I know you
  if (typeof(Storage) !== "undefined") {
	var visitCount = localStorage.getItem('count');
    if (visitCount) {
	  visitCount = Number(visitCount) + 1;
      localStorage.setItem('count', visitCount);
    } else {
      localStorage.setItem('count', 1) = 1;
    }
    $("#visitCount").html('This is the ' + visitCount + ' time you visit this web site');
  }
}