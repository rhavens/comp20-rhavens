/* Assignment 3 */
/* Sophie Dasinger */

var express = require('express');
var bodyParser = require('body-parser');
var url = require('url');
var app = express();
var requests =require('request');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb'; 
var mongo = require('mongodb');
var db = mongo.Db.connect(mongoUri, function (error, databaseConnection) {
  db = databaseConnection;
});


/* Post Request: Takes a submission and enters it to the database. Returns a JSON of characters and students */
app.post('/sendLocation', function (request, response) {
  response.set('Content-Type', 'application/json');

    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "X-Requested-With");

    var login = request.body.login;
    var lat = parseFloat(request.body.lat);
    var lng = parseFloat(request.body.lng);
    var date = new Date();
    var created_at = date.toUTCString();
    
    /* Check whether all parameters have been submitted */
    if (login == undefined || request.body.lat == undefined || request.body.lng == undefined) {
    	response.send("Bad input");
    }
    else {
	    var toInsert = {
		"login": login,
		"lat": lat,
		"lng": lng,
		"created_at": created_at
	    };
	 
	    db.collection('locations', function(er, collection) {
		var id = collection.insert(toInsert, function(err, saved) {
			if (err) {
				response.send(500);
			}
		    	else {
				/* Sort and convert to array */
				collection.find().sort( {_id : -1} ).limit(100).toArray(function(error, array){  
					if (error) {
				    		response.send(500);
					}
				            else {
				            	var json = {
				            		"characters": [],
				            		"students": array
				            	}
					  	response.send(json);
				      	}
				 });
			}											
		});
	    });
	}
});
 

/* Get Request: Returns a JSON of check-ins based upon the login submitted */
app.get('/locations.json', function (request, response) {
	response.set('Content-Type', 'application/json');

	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");

	var url_parts = request.url.split("=");
	var query = url_parts[1];

	db.collection('locations', function(er, collection) {
	    	if (er) {
	    		response.send(500);
	    	}
	    	else {
		    collection.find( {login: query} ).toArray(function(err, cursor) {
		    		if (err) {
		    			response.send([]);
		    		}
		    		else {
		    			response.send(cursor);
		    		}
		    });
		}
	});
});


/* Get Request (index): Displays the ordered check-ins */
app.get('/', function (request, response) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");

	response.set('Content-Type', 'text/html');
	var indexPage = '';
	db.collection('locations', function(er, collection) {
		collection.find().sort( {_id : -1} ).toArray(function(err, cursor) {
			if (!err) {
				console.log(cursor);
				indexPage += "<!DOCTYPE HTML><html><head><title>Assignment 3</title></head><body><h1>Check-Ins</h1>";
				for (var count = 0; count < cursor.length; count++) {
					var login = cursor[count]['login'];
					var lat = cursor[count]['lat'];
					var lng = cursor[count]['lng'];
					var time =  cursor[count]['created_at'];
					indexPage += "<p>Student: " + login + " " + lat + " " + lng + " " + time + "</p>";
				}
				indexPage += "</body></html>"
				response.send(indexPage);
			} else {
				response.send('<!DOCTYPE HTML><html><head><title>Assignment 3</title></head><body><h1>Having Issues</h1></body></html>');
			}
		});
	});
});


/* Get Request (redline): Retrieves the JSON from the MBTA Redline API */
app.get('/redline.json', function (request, response) { 
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");
	response.set('Content-Type', 'application/json');

	var url = "http://developer.mbta.com/lib/rthr/red.json";

	requests({
	    url: url,
	    json: true
	}, function (error, r1, body) {

	    if (!error && r1.statusCode === 200) {
	        response.send(body);2
	    }
	})

});

		


app.listen(process.env.PORT || 3000, function(){
});
