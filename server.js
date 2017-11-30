
// init project
var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var shortid = require('shortid');
var validUrl = require('valid-url');
//var shortLink = require('./shortLink');


app.use(express.static('public'));

app.route("/").get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    });

app.get("/new/:url(*)", function(request,response) {
  //response.send(request.params.url);
  MongoClient.connect(process.env.DB_PATH, function(err, db) {
    if(err) {
      response.send("Failed connetc to DB! Error: " + err);
    }
    var collection = db.collection('links'); //set up collection
    console.log(request.headers);
    var params = request.params.url; // set up url parameter
    var shortLink = function (db,callback) {
      if(validUrl.isUri(params)){
        collection.findOne({"url": params}, {short: 1, _id: 0}, function (err, doc){
          if(doc != null) {
            response.json({original_URL: params, short_Url: request.headers.referer + doc.short})
          } else {
            let shortCode = shortid.generate();
            let newUrl = { url: params, short: shortCode};
            collection.insert([newUrl]);
            response.json({ original_URL: params, short_Url:request.headers.referer + newUrl.short});
          }
        });

      } else {
        response.json({ error : "Wrong url format, make sure you have a valid protocol and real site."});
      }
    };
      
    shortLink(db, function() {db.close();});
    
  });
})

app.get("/:short", function (request, response) {
  MongoClient.connect(process.env.DB_PATH, function(err, db) {
    if(err) {
      response.send("Failed connetc to DB! Error: " + err);
    }
    var collection = db.collection('links'); //open collection
    var params = request.params.short; // set up url parameter
    
    collection.findOne({"short" : params}, {url: 1, _id: 0}, function (err, doc) {
      if(doc != null){
        response.redirect(doc.url);
      } else {
        response.json({ error: "No corresponding shortlink found in the database."});
      }
    });
    
    db.close();
  });
  
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
