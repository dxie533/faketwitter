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
var url = "mongodb://192.168.122.20:27017/";
var jwt = require('jsonwebtoken');
var secretToken = "helloworld";
app.use(express.static(path.join(__dirname,'/assets')));

router.post("/additem",urlencodedParser,function(req,res){
	var token = (req.cookies && req.cookies.token);
	var itemContent = req.body.content;
	var childType = req.body.childType;
	var media = req.body.media;
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
					if(childType){//perform checking of what type and what actions to take ### hello david you might need to async the db query since we have to grab the content of the parent first otherwise it might add it to the db before we grabbed hte parent content and you might also have to move all the stuff into a separate if else statement so we avoid the above (similar to what i did for media)
						newEntry.childType = childType;
					}
				if(!media && media.length > 0 && (childType == "reply" || childType == null)){
					MongoClient.connect("mongodb://192.168.122.21:27017", async function(err,db2){
							var dbo2 = db2.db("media");
							var queryResult = await dbo2.collection("fs.files").find({username:username,filename:{$in:media},itemId:"undefined"}).toArray();
							if(queryResult.length != media.length){
								responseJSON.status = "error";
								responseJSON.error = "One or more media items do not belong to you or are already assigned to another post.";
								res.status(500).send(responseJSON);
								db.close();
								return;
							}
							newEntry.property = {};
							newEntry.property.likes = 0;
							newEntry.retweeted = 0;
							newEntry.content = itemContent;
							newEntry.usersWhoLiked = [];
							newEntry.media = media;
							newEntry.timestamp = Math.floor(Date.now()/1000);
							dbo2.collection("fs.files").update({filename:{$in:media}},{$set:{itemId:newEntry.id}},{multi:true}, function(err,editResult){
								if(err){
										responseJSON.status = "error";
										responseJSON.error = "Error updating item metadata";
										res.status(500).send(responseJSON);
										dbo2.close();
										return;
								}
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
							}
					}
				}	
				else{
						newEntry.property = {};
						newEntry.property.likes = 0;
						newEntry.retweeted = 0;
						newEntry.content = itemContent;
						newEntry.usersWhoLiked = [];
						newEntry.media = [];
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
				}
			
		});

});

router.post("/search",urlencodedParser, async function(req,res){
	var timestamp = req.body.timestamp;
	var limit = req.body.limit;
	var searchQuery = req.body.q;
	var usernameQuery = req.body.username;
	var followingFilter = req.body.following;
	var searchJSON = {};
	var responseJSON = {};
	var token = (req.cookies && req.cookies.token);
	if(followingFilter == undefined){
		followingFilter = true;
	}
	if(token && followingFilter){
		try{
			var decoded = await jwt.verify(token,secretToken);
			if(decoded){
				if(searchJSON.username == undefined)
					searchJSON.username = {};

				searchJSON.username.$in = decoded.following;
			}
		}catch(err){
			
		}
	}
	
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
		var queryString = "("+searchQuery+")|";
		for(var i = 0; i < splitQuery.length-1;i++){
			queryString = queryString + "(\\b" + splitQuery[i] + "\\b)|"; 
		}
		queryString = queryString + "(\\b" + splitQuery[splitQuery.length-1] + "\\b)";
		searchJSON.content = {$regex:queryString,$options:"i"};
	}
	if(usernameQuery){
		if(searchJSON.username == undefined)
			searchJSON.username = {};
		searchJSON.username.$eq = usernameQuery;
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
		dbo.collection("items").find(searchJSON).project({_id: 0 }).limit(limit).sort(sortOption).toArray(function(err,result){
			if(err){
					responseJSON.status = "error";
					responseJSON.error = "Error retrieving items.";
					res.send(responseJSON);
					db.close();
					return;
			}
			var tempArray = result;
			responseJSON.status = "OK";
				responseJSON.items = tempArray;
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
				responseJSON.status = "OK";
				responseJSON.item = result[0];
				res.status(200).send(responseJSON);
				db.close();
			});
		}
	});
});

router.delete("/item/:id",function(req,res){
	var responseJSON = {};
	var requestedId = req.params.id;
	var username = req.body.username;
	if(!username){
		responseJSON.status = "error";
		responseJSON.error = "You must be logged in to delete a post if you can even delete this post.";
		res.status(500).send(responseJSON);
		db.close(); 
		return;
	}
	MongoClient.connect(url, function(err, db) { 	
		if(err) throw err;
		if(!err){
			var dbo = db.db("faketwitter");
			dbo.collection("items").find({username:username, id:requestedId}).project({_id: 0 }).toArray(function(err,result){
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
				var mediaArray = result[0].media;
				var parentID;
				if(result[0].parent != null && result[0].childType == "retweet"){
					parentID = result[0].parent;
					dbo.collection("items").updateOne({id:parentID},{$inc:{retweeted:-1}})
				}
				dbo.collection("items").deleteOne({username:username, id:requestedId},function(err,result){
					if(err) throw err;
					if(err){
						responseJSON.status = "error";
						responseJSON.error = "Error deleting item from database.";
						res.status(500).send(responseJSON);
						db.close(); 
						return;
					}
					responseJSON.status = "OK";
					res.status(200).send(responseJSON);
					db.close();
					if(mediaArray.length > 0){
						MongoClient.connect("mongodb://192.168.122.21:27017",function(error,db){
							var dbo = db.db("faketwitter");
							var bucket = new mongodb.GridFSBucket(dbo);
							for(var i = 0; i < mediaArray.length; i++){
								bucket.delete(mediaArray[i],function(error){
								});
							}
						});
					}
				});

			});
		}
	});
});

router.get("/user/:username/posts",function(req,res){
	var responseJSON = {};
	var requestedLimit = 50;
	if(req.query.limit && req.query.limit <= 200){
		requestedLimit = req.query.limit;
	}
	else{
		if(req.query.limit && req.query.limit > 200){
			requestedLimit = 200;
		}
	}
	var requestedUser = req.params.username;
	if(!req.params.username){
		responseJSON.error = "No username provided";
		responseJSON.status = "error";
		res.status(500).send(responseJSON);
		return;
	}
	MongoClient.connect(url, function(err, db) { 	
		if(err) throw err;
		if(!err){
			var dbo = db.db("faketwitter");
			dbo.collection("items").find({username:requestedUser}).toArray(function(err,result){
				if(err) throw err;
				if(err){
					responseJSON.status = "error";
					responseJSON.error = "Error finding the username in the database.";
					res.status(500).send(responseJSON);
					db.close(); 
					return;
				}
				if(!result | result.length == 0){
					responseJSON.status = "error";
					responseJSON.error = "User has no posts";
					res.status(500).send(responseJSON);
					db.close();
					return;
				}
				responseJSON.status = "OK";
				var resultList = result.slice(0,requestedLimit);
				responseJSON.items = resultList.map(a => a.id);
				res.status(200).send(responseJSON);
				db.close();
			});
		}
	});
});


app.use('/', router); 
app.listen(process.env.port || 3000); 
console.log('Running at item microservice on Port 3000');
