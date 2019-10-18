//var url = "mongodb://localhost:27017/";//This should be a separate microservice which may be later sharded
//this should be its own separate microservice
//login microservice
//general ui microservice


router.post("/additem",urlencodedParser,function(req,res)){
	var token = (req.cookies && req.cookies.token);
	var itemContent = req.body.content;
	var childType = req.body.childType;
	var responseJSON = {};
	var username;
	if(!token || !itemContent){
		responseJSON.status = "error";
		if(!token)
			responseJSON.error = "User not logged in.";
		if(!itemContent)
			responseJSON.error = "Content of item is missing.";
		res.status(500).send(responseJSON);
		return;
	}
	if(childType){
		if(childType !== "retweet" || childType !== "reply" || childType != null){
			responseJSON.status = "error";
			if(!token)
				responseJSON.error = "error";
			if(!itemContent)
				responseJSON.error = "Invalid child type.";
			res.status(500).send(responseJSON);
			return;
		}
	}
	if(token){
		jwt.verify(token,secretToken, function(err,decoded){
			if(!decoded){
				responseJSON.status = "error";
				responseJSON.error = "Session has expired. Please log in again.";
				res.status(500).send(responseJSON);
				return;
			}
			username = decoded.username;
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
				newEntry.timestamp = Date.now();
			dbo.collection("items").insertOne(newEntry,function(err,result){//again this might be a shard later on so we will have to check for ranges of usernames
				if(err){
					responseJSON.status = "ERROR";
					responseJSON.error = "Error inserting a new item.";
					res.send(responseJSON);
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
		}
	}
}

router.post("/search",urlencodedParser,function(req,res){
	var timestamp = req.body.timestamp;
	var limit = req.body.limit;
	var responseJSON = {};
	if(!timestamp){
		timestamp = Date.now();
	}
	if(limit){
		if(limit > 100){
			limit = 100;
		}else if(limit < 1){
			limit = 1;
		}
	}
	else
		childType = 25;
	
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
		dbo.collection("items").find().limit(limit).sort(sortOption).toArray(function(err,result){
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