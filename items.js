//var url = "mongodb://localhost:27017/";//This should be a separate microservice which may be later sharded
//this should be its own separate microservice
//login microservice
//general ui microservice
const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
var crypto = require('crypto');	
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var nodemailer = require("nodemailer");
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);
app.use(bodyParser.json());
app.use(cookieParser());
var d = new Date();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var jwt = require('jsonwebtoken');
var secretToken = "helloworld";
app.use(express.static(path.join(__dirname,'/assets')));

router.post("/additem",urlencodedParser,function(req,res){
	var token = (req.cookies && req.cookies.token);
	var itemContent = req.body.content;
	var childType = req.body.childType;
	var responseJSON = {};
	var username = req.body.username;
	if(!itemContent || !username){
		responseJSON.status = "error";
		if(!username)
			responseJSON.error = "Username is missing.";
		if(!itemContent)
			responseJSON.error = "Content of item is missing.";
		res.status(500).send(responseJSON);
		return;
	}
	if(childType){
		if(childType !== "retweet" && childType !== "reply" && childType != null){
			responseJSON.status = "error";
			if(!token){
					responseJSON.error = "Please log in to add an item";
					res.status(500).send(responseJSON);
					return;
			}
			responseJSON.error = "Invalid child type.";
			res.status(500).send(responseJSON);
			return;
		}
	}
			MongoClient.connect(url,function(err,db){
			if(err){
				responseJSON.status = "error";
				responseJSON.error = "Error connecting to database.";
				res.status(500).send(responseJSON);
				return;
			}
			var dbo = db.db("faketwitter");
			var newEntry = {};
				newEntry.username = username;
				newEntry.id = crypto.randomBytes(32).toString('hex');
				if(childType){
					newEntry.childType = childType;
				}
				newEntry.property = {};
				newEntry.property.likes = 0;
				newEntry.retweeted = 0;
				newEntry.content = itemContent;
				newEntry.timestamp = Math.floor(Date.now()/1000);
			dbo.collection("items").insertOne(newEntry,function(err,result){//again this might be a shard later on so we will have to check for ranges of usernames
				if(err){
					responseJSON.status = "error";
					responseJSON.error = "Error inserting a new item.";
					res.status(500).send(responseJSON);
					db.close();
					return;
				}
		
				responseJSON.status = "OK";
				responseJSON.id = newEntry.id;
				res.status(200).send(responseJSON);
				db.close();
				return;
			});
		});

});

router.post("/search",urlencodedParser,function(req,res){
	var timestamp = req.body.timestamp;
	var limit = req.body.limit;
	var searchQuery = req.body.q;
	var usernameQuery = req.body.username;
	var searchJSON = {};
	var responseJSON = {};
	if(!timestamp || timestamp < 0){
		timestamp = Math.floor(Date.now()/1000);
	}
	if(limit){
		if(limit > 100){
			limit = 100;
		}else if(limit < 1){
			limit = 1;
		}
	}
	else
		limit = 25;
	if(searchQuery){
		var splitQuery = searchQuery.split(" ");
		var queryString = "";
		for(var i = 0; i < splitQuery.length-1;i++){
			queryString += "(\b" + splitQuery[i] + "\b)|"; 
		}
		queryString += "(\b" + splitQuery.length-1 + "\b)";
		searchJSON.content = {$regex:queryString};
	}
	if(usernameQuery){
		searchJSON.username = usernameQuery;
	}
	searchJSON.timestamp = {$lte:timestamp};
	
	MongoClient.connect(url,function(err,db){
		if(err){
				responseJSON.status = "error";
				responseJSON.error = "Error connecting to database.";
				res.status(500).send(responseJSON);
				return;
		}
		var dbo = db.db("faketwitter");
		var sortOption = {};
		sortOption.timestamp = -1;
		dbo.collection("items").find({"timestamp":{$lte:timestamp}}).project({_id: 0 }).limit(limit).sort(sortOption).toArray(function(err,result){
			if(err){
					responseJSON.status = "error";
					responseJSON.error = "Error retrieving items.";
					res.send(responseJSON);
					db.close();
					return;
			}
			responseJSON.status = "OK";
			responseJSON.items = result;
			res.status(200).send(responseJSON);
			db.close();
			return;
		});
	});
});

router.get("/item/:id",function(req,res){
	var responseJSON = {};
	var responseItem = {};
	var requestedId = req.params.id;
	//res.send(); if you do this we cant send anything else after this or the server crashes
	MongoClient.connect(url, function(err, db) { 	
		if(err) throw err;
		if(!err){
			var dbo = db.db("faketwitter");
			dbo.collection("items").find({id:requestedId}).project({_id: 0 }).toArray(function(err,result){
				if(err) throw err;
				if(err){
					responseJSON.status = "error";
					responseJSON.error = "Error grabbing items from database.";
					res.status(500).send(responseJSON);
					db.close(); 
					return;
				}
				if(result.length == 0){
					responseJSON.status = "error";
					responseJSON.error = "No such item exists.";
					res.status(500).send(responseJSON);
					db.close();
					return;
				}
				/*responseProperty = {}; no need for this since mongodb returns a json object aka its not mysql
				responseItem.id = result[0].id;
				responseItem.username = result[0].username;
				responseProperty.likes = result[0].likes;
				responseItem.property = responseProperty;
				responseItem.retweeted = result[0].retweeted;
				responseItem.content = result[0].content;
				responseItem.timestamp = result[0].timestamp;
				responseJSON.item = responseItem;*/
				responseJSON.status = "OK";
				responseJSON.item = result[0];
				res.status(200).send(responseJSON);
				db.close();
			});
		}
	});
});


app.use('/', router); 
app.listen(process.env.port || 3000); 
console.log('Running at item microservice on Port 3000');
