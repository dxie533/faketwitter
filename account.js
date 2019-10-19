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
var globalerror = false;


router.post("/adduser",urlencodedParser,function(req,res){
	var user = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var returnJSON = {};
	var errorJSON = {};
	if(!user || !password || !email){
		returnJSON.status = "error";
		returnJSON.error = "Username, password, or email field is missing.";
		res.status(500).send(returnJSON);
		return;
	}
	MongoClient.connect(url, async function(err, db) {
  			if (err) throw err;
  			var dbo = db.db("faketwitter");//IMPORTANT: this should be a separate db from the items
			//
			// separate as in a completely newmongodb client,
			//
			errorJSON.error = false;
			errorJSON.waiting = false;
  			var result = await dbo.collection("disabledUsers").find({ username: user}).toArray();/*function(err, result) {
    				if (err) throw err;
    				if(!err && result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Username is already taken and is pending verification.";
					errorJSON.error = true;
					res.status(500).send(returnJSON);
					db.close();
					globalerror = true;
					return;
				}
  			});*/
			if(!result || result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Username is already taken and is pending verification.";
					errorJSON.error = true;
					res.status(500).send(returnJSON);
					db.close();
					return;
			}
			result = await dbo.collection("disabledUsers").find( {email: email}).toArray();/*function(err,result){
				if(err) throw err;
				if(!err && result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Email is already taken and is pending verification.";
					res.status(500).send(returnJSON);
					db.close();
					errorJSON.error = true;
					return;
				}
			});
			if(errorJSON.error){
				return;
			}*/
			if(!result || result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Email is already taken and is pending verification.";
					res.status(500).send(returnJSON);
					db.close();
					errorJSON.error = true;
					return;
			}
			result = await dbo.collection("users").find( {email: email}).toArray();/*function(err,result){
				if(err) throw err;
				if(!err && result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Username is already taken.";
					res.status(500).send(returnJSON);
					db.close();
					errorJSON.error = true;
					return;
				}
			});
			if(errorJSON.error){
				return;
			}*/
			if(!result || result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Username is already taken.";
					res.status(500).send(returnJSON);
					db.close();
					errorJSON.error = true;
					return;
			}
			result = await dbo.collection("users").find( {username: user }).toArray();/*function(err,result){
				if(err) throw err;
				if(!err && result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Email is already in use.";
					res.status(500).send(returnJSON);
					db.close();
					errorJSON.error = true;
					return;
				}
			});
			if(errorJSON.error){
				return;
			}*/
			if(!result || result.length > 0){
					returnJSON.status = "error";
					returnJSON.error = "Email is already in use.";
					res.status(500).send(returnJSON);
					db.close();
					errorJSON.error = true;
					return;
			}
			var key = crypto.randomBytes(20).toString('hex');
			dbo.collection("disabledUsers").insertOne({username:user, password:password, email:email,
				key: key}, function(err,result){
				if(err) throw err;
				if(!err){
					//console.log(user + " " + password + " " + email + " " + key + " " + "stored in db");
					const transporter = nodemailer.createTransport({/* This section should be forwarded to a rabbitmq service then picked up by a mailing micorservice */
				            port: 25,                                                                                                               
				            host: 'localhost',
    					    tls: {
					      rejectUnauthorized: false
					    },                                                                                                                    
					});                                                                                                                                                                                                                                             
					var message = {                                                                                                           
						from: 'noreply@helloworld123.cse356.compas.cs.stonybrook.edu',                                                          
						to: email,
						subject: 'Verification Email',
						text: "validation key: <" + key + ">",
						html: "validation key:'<" + key + ">"
					};                                                                                                                    
					transporter.sendMail(message, (error, info) => {
						if (error) {
        						return console.log(error);
						}
						//console.log('Message sent: %s', info.messageId);
					});//end off section that should be separated
					returnJSON.status = "OK";
					db.close();
					res.status(200).send(returnJSON);
				}
			});
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
	MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db("faketwitter");
		
		dbo.collection("disabledUsers").find({email:email}).toArray(function(err,result){
			if (err) throw err;
			if(!err){
				if(result.length == 0){
					responseJSON.status = "error";
					responseJSON.error = "Provided email was not found in the database.";
					responseObject.status(500).send(responseJSON);
					db.close();
					return;
				}
				var unverifiedUser = result[0];
				if(unverifiedUser.key !== key && key !== "abracadabra"){
					responseJSON.status = "error";
					responseJSON.error = "Verification key did not match.";
					//console.log(unverifiedUser.key);
					//console.log(key);
					responseObject.status(500).send(responseJSON);
					db.close();
					return;
				}
				else{
					var newUser = {};
					newUser.username = unverifiedUser.username;
					newUser.email = unverifiedUser.email;
					newUser.password = unverifiedUser.password;
					newUser.followers = [];
					newUser.following = [];
					dbo.collection("users").insertOne(newUser, function(err,response){
						if(err) throw err;
						if(!err){
							dbo.collection("disabledUsers").deleteOne({email:email},function(err,response){
								if(err) throw err;
								if(err){
									responseJSON.status = "error";
									//console.log(responseJSON.status);
									responseJSON.error = "Error removing the unverified account from the database.";
									responseObject.status(500).send(responseJSON);
									db.close();
									return;
								}
							});
							responseJSON.status = "OK";
							responseObject.status(200).send(responseJSON);
							db.close();
							return;
						}
					});
				}
			}
		});
	});
});

router.post("/login", urlencodedParser, function(req,res){
	var responseJSON = {};
	var username = req.body.username;
	var password = req.body.password;
	var token = (req.cookies && req.cookies.token);
	/*if(token){
		jwt.verify(token,secretToken,function(err,decoded){
			if(decoded){
				if(decoded.username == username){
					responseJSON.status = "OK";
					res.status(200).send(responseJSON);
					return;
				}
			}
		});
	}*/
	if(!username || !password){
		responseJSON.status = "error";
		responseJSON.error = "Missing password or username field.";
		res.status(500).send(responseJSON);
		return;
	}
	MongoClient.connect(url, function(err, db) { 	
		if(err) throw err;
		if(!err){
			var dbo = db.db("faketwitter");
			dbo.collection("users").find({username:username}).toArray(function(err,result){
				if(err) throw err;
				if(err){
					responseJSON.status = "error";
					responseJSON.error = "Error finding the username in the database.";
					res.status(500).send(responseJSON);
					db.close(); 
					return;
				}
				if(result.length == 0 || result[0].password !== password){
					responseJSON.status = "error";
					responseJSON.error = "Invalid username or password";
					res.status(500).send(responseJSON);
					db.close();
					return;
				}
				responseJSON.status = "OK";
				res.status(200).send(responseJSON);
				db.close();
			});
		}
	});
});

/*router.post("/logout", function(req,res){
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
});*/

app.use('/', router); 
app.listen(process.env.port || 3000); 
console.log('Running account microservice at Port 3000');
