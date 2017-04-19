var express = require('express');
var app = express();
var path = require('path');
var env = require('dotenv').config();
var imageSearch = require('node-google-image-search');
var MongoClient = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI;

var results;
var object;
var answer = [];
var searches = [];

function error () {
    return console.log('error');
}

MongoClient.connect(url, function(err, db) {
    if (err) return console.log(err);
  createValidated(db, function() {
    db.close();
  });
});


var createValidated = function(db, callback) {
  db.createCollection("queries", 
	   {
	      'validator': { '$and':
	         [
	            { 'term': { '$type': "string" } },
	            { 'when': { '$type': "date"} },
	         ]
	      }
	   },	   
    function(err, results) {
        if (!err) {
      console.log("Collection created.");
      callback();
        }
        else {
            error();
        }
    }
  );
};


function queryTerms (input) {
   var d = new Date();
   object = {
        term: input,
        when: d.toISOString()
    };
}


function storeQuery () {
    MongoClient.connect(url, function(err, db) {
    if (!err) {
     db.collection('queries').insert(object);
        
    }
    else {
        error();
    }
    db.close();
    });
}

app.get('/imagesearch/:search', function (req, res) {
    var request = req.params.search;
    var offset = req.query.offset;
    queryTerms(request);
    storeQuery();
    answer = [];
    results = imageSearch(request, objectify, offset, 10);
    function objectify(results) {
     for (var i=0; i<10; i++) {
         answer.push({
             "url": results[i].link,
             "snippet": results[i].snippet,
             "thumbnail": results[i].image.thumbnailLink,
             "context": results[i].image.contextLink
         });
    }
    res.send(answer);
    }
});

app.get('/latest', function (req, res) {
    MongoClient.connect(url, function(err, db) {
        if (!err) {
        var searches = db.collection('queries').find({}, {_id:0}).toArray(function(err, documents) {
            if (!err) {
            res.send(documents);
            }
            else {error();}
        });
        
        }
         else {error();}
         db.close();
    });
});

app.get('', function (req, res) {
    res.send("Enter a query!");
});

app.listen(process.env.PORT||8080);