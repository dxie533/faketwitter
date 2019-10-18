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
var url = "mongodb://localhost:27017/";//again this should be its own service
var jwt = require('jsonwebtoken');
var secretToken = "helloworld";
app.use(express.static(path.join(__dirname,'/assets')));
var request = require('request');


router.post("/login", urlencodedParser, function(req,res){
	var responseJSON = {};
	var username = req.body.username;
	var password = req.body.password;
	var token = (req.cookies && req.cookies.token);
	if(token){
		jwt.verify(token,secretToken,function(err,decoded){
			if(decoded){
				if(decoded.username == username){
					responseJSON.status = "OK";
					res.status(200).send(responseJSON);
					return;
				}
			}
		});
	}
	if(!username || !password){
		responseJSON.status = "error";
		responseJSON.error = "Missing password or username field.";
		res.status(500).send(responseJSON);
		return;
	}
	request.post({
		headers: {'content-type': 'application/json'},
		url: //address of login microservice
		body: JSON.stringify(req.body);
	}, function (err, response, body){
		if(body.status === "error"){
			res.status(500).send(body);
		}else{
			var newToken = jwt.sign({username:username},secretToken,{expiresIn: 86400});
			res.cookie('token', newToken, {maxAge: 86400*1000, overwrite: true});
			responseJSON.status = "OK";
			res.status(200).send(responseJSON);
		}
	});
});

router.post("/logout", function(req,res){
	var token = (req.cookies && req.cookies.token);
	var responseJSON = {};
	if(!token){
		responseJSON.status = "OK";
		res.status(200).send(responseJSON);
		return;
	}
	if(token){
		jwt.verify(token, secretToken, function(err,decoded){
			if(decoded){
				var newToken = jwt.sign({username:undefined},secretToken,{expiresIn:1});
				res.cookie('token',newToken,{maxAge:100000, overwrite: true});
			}
			responseJSON.status = "OK";
			res.status(200).send(responseJSON);
		});
	}
});

router.post("/adduser",urlencodedParser,function(req,res){
	var user = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var returnJSON = {};
	if(!user || !password || !email){
		returnJSON.status = "error";
		returnJSON.error = "Username, password, or email field is missing.";
		res.status(500).send(returnJSON);
		return;
	}
	request.post({
		headers: {'content-type': 'application/json'},
		url: //address of login microservice services
		body: JSON.stringify(req.body);
	}, function (err, response, body){
		if(body.status === "error"){
			res.status(500).send(body);
		}else{
			responseJSON.status = "OK";
			res.status(200).send(responseJSON);
		}
	});
});

router.post("/verify",urlencodedParser, function(req, res){
	var responseJSON = {};
	var responseObject = res;
	var email = req.body.email;
	var key = req.body.key;
	if(!email || !key){
		responseJSON.status = "error";
		responseJSON.error = "No email or key provided.";
		res.status(500).send(responseJSON);
		return;
	}
	request.post({
		headers: {'content-type': 'application/json'},
		url: //address of login microservice services
		body: JSON.stringify(req.body);
	}, function (err, response, body){
		if(body.status === "error"){
			res.status(500).send(body);
		}else{
			responseJSON.status = "OK";
			res.status(200).send(responseJSON);
		}
	});
});

router.post("/additem",urlencodedParser,function(req,res){
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
			req.body.username = decoded.username;
			request.post({
					headers: {'content-type': 'application/json'},
					url: //address of item microservice services
					body: JSON.stringify(req.body);
				}, function (err, response, body){
					if(body.status === "error"){
						res.status(500).send(body);
					}else{
						responseJSON.status = "OK";
						res.status(200).send(body);
					}
				});
		});
	}
});

router.post("/search",urlencodedParser,function(req,res){
	var timestamp = req.body.timestamp;
	var limit = req.body.limit;
	var responseJSON = {};
	if(!timestamp){
		req.body.timestamp = Date.now();
	}
	if(limit){
		if(limit > 100){
			req.body.limit = 100;
		}else if(limit < 1){
			req.body.limit = 1;
		}
	}
	else
		req.body.limit = 25;
	request.post({
		headers: {'content-type': 'application/json'},
		url: //address of item microservice services
		body: JSON.stringify(req.body);
	}, function (err, response, body){
		if(body.status === "error"){
			res.status(500).send(body);
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
	
});
app.use('/', router); 
app.listen(process.env.port || 3000); 
console.log('Running frontend server at Port 3000');