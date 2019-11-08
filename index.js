const express = require('express');
const app = express();
const router = express.Router();
var bodyParser = require('body-parser');
var multer = require('multer');
var GridFsStorage = require("multer-gridfs-storage");
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({extended: false});
var crypto = require("crypto");
app.use(urlencodedParser);
app.use(bodyParser.json());
var dbUrl = "mongodb://localhost:27017/testIndexStore";
var dbConnection = "mongodb://localhost:27017";
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

router.post("/deposit", upload.single('contents'), function(req,res){
	console.log(req.file.filename);
	console.log(req.file.contentType);
	res.send();
});

router.get("/retrieve",function(req,res){
	var fileName = req.query.filename;
 
	console.log(fileName);
	mongodb.MongoClient.connect(dbConnection,function(error,db){
		var dbo = db.db("testIndexStore");
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
	   	assert.ifError(error); 
			console.log(error);
			res.status(404).send();
			db.close();
			return;
	 	 }).
	  	on('finish', function() {
	    	console.log('done!');
	    	res.status(200).send();
		db.close();
		return;
	});
	});		
	 });
	
});

router.get("/delete",function(req,res){
        var fileName = req.query.filename;
	 console.log(fileName);
        mongodb.MongoClient.connect(dbConnection,function(error,db){
                var dbo = db.db("testIndexStore");
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

