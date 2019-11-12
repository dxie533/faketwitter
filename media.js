const express = require('express');
const app = express();
const router = express.Router();
var bodyParser = require('body-parser');
var multer = require('multer');
var GridFsStorage = require("multer-gridfs-storage");
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({extended: false});
var crypto = require("crypto");
var cookieParser = require('cookie-parser');
app.use(urlencodedParser);
app.use(bodyParser.json());
app.use(cookieParser());
var dbUrl = "mongodb://192.168.122.21:27017/media";
var dbConnection = "mongodb://192.168.122.21:27017";
var jwt = require('jsonwebtoken');
var secretToken = "helloworld";
var storage = new GridFsStorage({
	url: dbUrl,
	file: (req,file)=>{
		var name = crypto.randomBytes(32).toString('hex');
		return {
			id: name,
			filename:name
		}
	}
});
var upload = multer({storage});
var mongodb = require("mongodb");

router.get("/",function(req,res){
	res.send("<html><head></head> <body><h1><form action = '/deposit' method = 'POST' enctype='multipart/form-data'><input type = 'file' name = 'contents'></input><input type = 'submit'>Submit</input></form></body></h1></html>");
});

router.post("/addmedia", upload.single('content'), function(req,res){
	var token = (req.cookies && req.cookies.token);
	var username;
	var responseJSON = {};
	if(token){
		jwt.verify(token, secretToken, function(err,decoded){
			if(decoded){
				username = decoded.username;
			}
			if(!decoded){
				responseJSON.status = "error";
				responseJSON.error = "You must be logged in to add media files";
				res.status(500).send(responseJSON);
				return;
			}
		});
	}
	if(req.file == undefined){
		responseJSON.status = "error";
		responseJSON.error = "Error entering media into media server";
		res.status(500).send(responseJSON);
		return;
	}

	mongodb.MongoClient.connect(dbConnection,function(error,db){
		var dbo = db.db("media");
		dbo.collection("fs.files").updateOne({filename:req.file.filename},{$set:{username:username, itemId:"undefined"}}, function(err,result){
				if(err){
					responseJSON.status = "error";
					responseJSON.error = "Error entering metadata into media server";
					res.status(500).send(responseJSON);
					db.close();
					return;
				}
				responseJSON.status = "OK";
				responseJSON.id = req.file.filename;
				res.status(200).send(responseJSON);
		});
	});
});

router.get("/media/:id",function(req,res){
	var fileName = (req.params && req.params.id)
	mongodb.MongoClient.connect(dbConnection,function(error,db){
			var dbo = db.db("media");
			var bucket = new mongodb.GridFSBucket(dbo);
			dbo.collection("fs.files").find({filename:fileName}).toArray(function(err,result){		
				if(result.length == 0){
					res.status(404).send("No such file");
					db.close();
					return;
				}
				bucket.openDownloadStreamByName(fileName).
				 pipe(res).
				on('error', function(error) {
					res.status(404).send();
					db.close();
					return;
				 }).
				on('finish', function() {
					res.status(200).send();
					db.close();
					return;
				});
		});		
	 });
	
});

//maybe just delete from the item delete endpoint
router.get("/delete",function(req,res){
        var fileName = req.query.filename;
	 console.log(fileName);
        mongodb.MongoClient.connect(dbConnection,function(error,db){
                var dbo = db.db("media");
                var bucket = new mongodb.GridFSBucket(dbo);
                dbo.collection("fs.files").find({filename:fileName}).toArray(function(err,result){
	                if(result.length == 0){
        	                res.status(404).send("No such file");
	                        db.close();
                        	return;
                	}
                	bucket.delete(fileName,function(error){
				if(error){
					res.status(500).send("Error deleting file.");
					db.close();
					return;
				}
				else{
					res.status(200).send("OK");
				}
			});
       		 });
         });
});
app.use('/', router); 
app.listen(3000); 
console.log('Running frontend server at Port 3000');

