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
var cookieJar = request.jar();

router.post("/login", urlencodedParser, async function(req,res){
	var responseJSON = {};
	var username = req.body.username;
	var password = req.body.password;
	var token = (req.cookies && req.cookies.token);
	if(token){
		try{
			var decoded = await jwt.verify(token,secretToken);/*,function(err,decoded){
				if(decoded){
					if(decoded.username == username){
						responseJSON.status = "OK";
						res.status(200).send(responseJSON);
						return;
					}
				}
			});*/
			if(decoded){
					if(decoded.username == username){
						responseJSON.status = "OK";
						res.status(200).send(responseJSON);
						return;
					}
			}
		}catch(err){
			
		}
	}
	if(!username || !password){
		responseJSON.status = "error";
		responseJSON.error = "Missing password or username field.";
		res.status(500).send(responseJSON);
		return;
	}
	request.post({
		headers: {'content-type': 'application/json'},
		url: "http://192.168.122.15:3000/login",
		body: JSON.stringify(req.body)
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			var newToken = jwt.sign({username:username,following:body.following},secretToken,{expiresIn: 86400});
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
				res.cookie('token',newToken,{maxAge:1, overwrite: true});
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
		url: "http://192.168.122.15:3000/adduser",
		body: JSON.stringify(req.body)
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			returnJSON.status = "OK";
			res.status(200).send(returnJSON);
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
		url:"http://192.168.122.15:3000/verify",
		body: JSON.stringify(req.body)
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
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
		if(childType !== "retweet" && childType !== "reply" && childType != null){
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
					url: "http://192.168.122.16:3000/additem",
					body: JSON.stringify(req.body)
				}, function (err, response, body){
					body = JSON.parse(body);
					if(body.status === "error"){
						res.status(500).send(body);
						return;
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
		req.body.timestamp = Math.floor(Date.now()/1000)
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
		headers: {'content-type': 'application/json',
		"Cookie":"token="+req.cookies.token
		},
		url:  "http://192.168.122.16:3000/search",
		body: JSON.stringify(req.body)
	}, function (err, response, body){
			body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
	
});

router.get("/item/:id", urlencodedParser,function(req,res){
	var id = (req.params && req.params.id);
	var responseJSON = {};
	if(!id){
		responseJSON.status = "error";
		responseJSON.error = "Missing item ID to get.";
		res.status(500).send(responseJSON);
		return;
	}
	request.get({
		headers: {'content-type': 'application/json'},
		url:  "http://192.168.122.16:3000/item/"+id,
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
});

router.get("/user/:username", urlencodedParser,function(req,res){
	var username = (req.params && req.params.username);
	var responseJSON = {};
	if(!username){
		responseJSON.status = "error";
		responseJSON.error = "Missing username to get.";
		res.status(500).send(responseJSON);
		return;
	}
	request.get({
		headers: {'content-type': 'application/json'},
		url:  "http://192.168.122.15:3000/user/"+username,
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
});

router.get("/user/:username/posts", urlencodedParser,function(req,res){
	var username = (req.params && req.params.username);
	var responseJSON = {};
	if(!username){
		responseJSON.status = "error";
		responseJSON.error = "Missing username to get.";
		res.status(500).send(responseJSON);
		return;
	}
	request.get({
		headers: {'content-type': 'application/json'},
		url:  "http://192.168.122.16:3000/user/"+username +"/posts?limit=" + req.query.limit,
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
});

router.get("/user/:username/followers", urlencodedParser,function(req,res){
	var username = (req.params && req.params.username);
	var responseJSON = {};
	if(!username){
		responseJSON.status = "error";
		responseJSON.error = "Missing username to get.";
		res.status(500).send(responseJSON);
		return;
	}
	request.get({
		headers: {'content-type': 'application/json'},
		url:  "http://192.168.122.15:3000/user/"+username +"/followers?limit=" + req.query.limit,
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
});

router.get("/user/:username/following", urlencodedParser,function(req,res){
	var username = (req.params && req.params.username);
	var responseJSON = {};
	if(!username){
		responseJSON.status = "error";
		responseJSON.error = "Missing username to get.";
		res.status(500).send(responseJSON);
		return;
	}
	request.get({
		headers: {'content-type': 'application/json'},
		url:  "http://192.168.122.15:3000/user/"+username +"/following?limit=" + req.query.limit,
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
});

router.delete("/item/:id", urlencodedParser,async function(req,res){
	var id = (req.params && req.params.id);
	var token = (req.cookies && req.cookies.token);
	var responseJSON = {};
	var usernameJSON = {};
	if(!id){
		responseJSON.status = "error";
		responseJSON.error = "Missing item ID to delete.";
		res.status(500).send(responseJSON);
		return;
	}
	if(!token){
		responseJSON.status = "error";
		responseJSON.error = "You must be logged in to delete items.";
		res.status(500).send(responseJSON);
		return;
	}
	if(token){
		try{
			var decoded = await jwt.verify(token,secretToken);
			if(!decoded){
				responseJSON.status = "error";
				responseJSON.error = "You must be logged in to delete items.";
				res.status(500).send(responseJSON);
				return;
			}
			usernameJSON.username = decoded.username;
		}catch(err){
			responseJSON.status = "error";
			responseJSON.error = "You must be logged in to delete items.";
			res.status(500).send(responseJSON);
			return;
		}
	}
	request.delete({
		headers: {'content-type': 'application/json'},
		url:  "http://192.168.122.16:3000/item/"+id,
		body: JSON.stringify(usernameJSON)
	}, function (err, response, body){
		body = JSON.parse(body);
		if(body.status === "error"){
			res.status(500).send(body);
			return;
		}else{
			responseJSON.status = "OK";
			res.status(200).send(body);
		}
	});
});

router.post("/follow",async function(req,res){
	var responseJSON = {};
	var followJSON = {};
	var username = req.body.username;
	var following = req.body.follow;
	
	if(following == undefined){
		following = true;
	}
	followJSON.direction = following;
	var token = (req.cookies && req.cookies.token);
	if(!username){
		responseJSON.status = "error";
		responseJSON.error = "Username required to follow.";
		res.status(500).send(responseJSON);
		return;
	}
	followJSON.targetUsername = username;
	if(!token){
		responseJSON.status = "error";
		responseJSON.error = "You must be logged in to follow this user.";
		res.status(500).send(responseJSON);
		return;
	}
	var followingArray;
	if(token){
		try{
			var decoded = await jwt.verify(token,secretToken);
			if(!decoded){
				responseJSON.status = "error";
				responseJSON.error = "You must be logged in to follow this user";
				res.status(500).send(responseJSON);
				return;
			}
			followJSON.originUsername = decoded.username;
			followingArray = decoded.following; 
		}catch(err){
			responseJSON.status = "error";
			responseJSON.error = "You must be logged in to follow this user.";
			res.status(500).send(responseJSON);
			return;
		}
	}	
	if(following){
		if(followingArray.includes(username)){
			responseJSON.status = "OK";
			res.status(200).send(responseJSON);
			return;
		}
		else{
			followingArray.push(username);
			followJSON.following = followingArray;
			request.post({
				headers: {'content-type': 'application/json'},
				url:  "http://192.168.122.15:3000/follow",
				body: JSON.stringify(followJSON)
			}, function (err, response, body){
				body = JSON.parse(body);
				if(body.status === "error"){
					res.status(500).send(body);
					return;
				}else{
					var newToken = jwt.sign({username:followJSON.originUsername,following:followingArray},secretToken,{expiresIn: 86400});
					res.cookie('token', newToken, {maxAge: 86400*1000, overwrite: true});
					responseJSON.status = "OK";
					res.status(200).send(body);
				}
			});
		}
	}
	else{
		if(followingArray.includes(username)){
			followingArray.splice(followingArray.indexOf(username),1);
			followJSON.following = followingArray;
			request.post({
				headers: {'content-type': 'application/json'},
				url:  "http://192.168.122.15:3000/follow",
				body: JSON.stringify(followJSON)
			}, function (err, response, body){
				body = JSON.parse(body);
				if(body.status === "error"){
					res.status(500).send(body);
					return;
				}else{
					var newToken = jwt.sign({username:followJSON.originUsername,following:followingArray},secretToken,{expiresIn: 86400});
					res.cookie('token', newToken, {maxAge: 86400*1000, overwrite: true});
					responseJSON.status = "OK";
					res.status(200).send(body);
				}
			});
		}
		else{
			responseJSON.status = "OK";
			res.status(200).send(responseJSON);
			return;
		}
	}
});


//FRONT END GOES DOWN HERE
router.get("/",function(req,res){
	res.send("<html><head><script src = '/verify.js'></script><link rel = \"stylesheet\" type=\"text/css\" href=\"/change.css\"></head> <body><h1>Lightweight Twitter<br/>Login<br/><form action = 'http://helloworld123.cse356.compas.cs.stonybrook.edu/' method = 'post' onsubmit = 'return validateLogin()' id = 'loginForm' >Username:<input type='text' name='name' id = 'loginUsername'><br/>Password:<input type = 'text' name = 'password' id = 'loginPassword'><input type = 'submit'></form><div id = 'loginResult'></div>"
	+ "<br/> Register <br/>Username:<input type = 'text' id ='registerUsername' ></input><br/>Password: <input type = 'text' id = 'registerPassword'></input><br/> Email: <input type = 'text' id = 'registerEmail'></input><button onclick = 'createDisabledAccount()'>Register</button><br/><div id = 'registrationResult'></div>"
	+ "<br /> <br/> Validate <div>Email:<input type = 'text' id = 'validateEmail'></input><br/>Validation Code: <input type = 'text' id = 'validateCode'></input><button onclick = 'validate()'>Validate</button><div id = 'validationResult'></div></div> <br/> <a href = 'http://helloworld123.cse356.compas.cs.stonybrook.edu/searchpage'>Search for posts</a> <a href = 'http://helloworld123.cse356.compas.cs.stonybrook.edu/searchuserspage'>Search for users</a>"
	+ "</body></h1></html>");
});

router.post("/",function(req,res){
	var token = (req.cookies && req.cookies.token);
	var username = req.body.name;
	var searchJSON = {};
	searchJSON.username = username;
	searchJSON.following = false;
	searchJSON.limit = 100;
	if(!token){
		res.status(500).send("Please log in to access this content");
		return;
	}	
	if(token){
		jwt.verify(token,secretToken,function(err,decoded){
			if(decoded){
				username = decoded.username;
					request.post({
						headers: {'content-type': 'application/json',
						"Cookie":"token="+req.cookies.token
						},
						url:  "http://192.168.122.16:3000/search",
						body: JSON.stringify(searchJSON)
					}, function (err, response, results){
							results = JSON.parse(results);
						if(results.status === "error"){
							res.status(500).send(results);
							return;
						}else{
							var generatedPostString = "";
							for(var i = 0; i < results.items.length; i++){
								generatedPostString += "<div id = '"+ results.items[i].id+ "'>User:" + results.items[i].username + "<br/>" + results.items[i].content + "<br/> Likes:" + results.items[i].property.likes + " Retweets:" + results.items[i].retweeted + "<br/> Posted on (UNIX Time): " + results.items[i].timestamp + "<br/><button onclick = 'deletePost(\""+results.items[i].id+"\");'>Delete Post</button>"+"</div><br/>";
							}
							var returnString = "<html><head><script src = '/userPage.js'></script></head><body><a href = 'http://helloworld123.cse356.compas.cs.stonybrook.edu/'>Home</a> <a href = 'http://helloworld123.cse356.compas.cs.stonybrook.edu/searchpage'>Search for posts</a> <button onclick = 'logout()'>Log out</button><br/>Add a new post:<input type = 'text' id = 'content' width = '200px' height = '200px'></input><button onclick = 'addItem()'>Add post</button><br/>Delete specific item with id:<input type = 'text' id = 'deleteContent'></input><button onclick = 'deleteSelected()'>Delete Item</button><br/><div>Follow a specific user:<input type='text' id = 'followField'></input><button onclick = 'follow()'>Follow</button></div><br/><div>Unfollow a specific user:<input type='text' id = 'unfollowField'></input><button onclick = 'unfollow()'>Unfollow</button></div> <div id = 'addResult'></div><br/><div id = 'deleteResult'></div><h1>Your 100 latest posts</h1><div id = 'useritems'>"+generatedPostString+"</div></body></html>";
							res.status(200).send(returnString);
							//res.status(200).send(body);
						}
					});
				return;
			}
			else{
				res.send("Please log in to access this content");
				res.end();
				return;
			}
		});
	}
	
});

router.post("/getPostsFromUser", function(req,res){
	var token = (req.cookies && req.cookies.token);
	if(!token){
				responseJSON.status = "error";
				responseJSON.error = "User not logged in";
				res.status(500).send(responseJSON);
				return;
	}
	if(token){
		jwt.verify(token,secretToken, function(err,decoded){
			if(!decoded){
				responseJSON.status = "error";
				responseJSON.error = "User not logged in";
				res.status(500).send(responseJSON);
				return;
			}
			req.body.username = decoded.username;
			request.post({
					headers: {'content-type': 'application/json'},
					url: "http://192.168.122.16:3000/additem",
					body: JSON.stringify(req.body)
				}, function (err, response, body){
					body = JSON.parse(body);
					if(body.status === "error"){
						res.status(500).send(body);
						return;
					}else{
						responseJSON.status = "OK";
						res.status(200).send(body);
					}
				});
		});
	}
});

router.get("/searchpage",async function(req,res){
	var token = (req.cookies && req.cookies.token);
	var loggedInString = "";
	if(token){
		try{
			var decoded = await jwt.verify(token,secretToken);
			if(decoded){
				loggedInString = "Filter to followed users only:<input type = 'checkbox' id='followersOnly' checked></input><br/>";
			} 
		}catch(err){
			
		}
	}
	var returnString = "<html><head><script src = '/search.js'></script></head><body><a href = 'http://helloworld123.cse356.compas.cs.stonybrook.edu/'>Home</a>	<h1>Search for an individual post</h1>Item ID:<input type = 'text' id = 'itemField'></input><button onclick = 'getItem()'>Search for Item</button><div id = 'itemResult'></div><br/>"+
	"<h1>Search for posts</h1><br/>Search for post with content:<input type = 'text' id = 'searchQuery'></input><br/>Filter search by username:<input type = 'text' id = 'usernameOnly'></input></br>"+loggedInString+"Get all posts on or before unix time:<input type = 'number' id = 'timestamp'</input><br/>Number of items to search for (Max 100):<input type = 'number' max:'100' min:'1' id = 'count' value='25'></input><button onclick = 'search()'>Execute Search</button><br/><h1>Search Result</h1><div id = 'searchResult'></div><br/></body></html>";
	res.send(returnString);
});

router.get("/searchuserspage",async function(req,res){
	var token = (req.cookies && req.cookies.token);
	//MIGHT NOT NEED THIS BECAUSE WE WON'T CARE ABOUT BEING LOGGED IN
	//var loggedInString = "";
	/*if(token){
		try{
			var decoded = await jwt.verify(token,secretToken);
			if(decoded){
				loggedInString = "Filter to followed users only:<input type = 'checkbox' id='followersOnly' checked></input><br/>";
			} 
		}catch(err){
			
		}
	}*/
	//
	var returnString = "<html><head><script src = '/search.js'></script></head><body><a href = 'http://helloworld123.cse356.compas.cs.stonybrook.edu/'>Home</a>	<h1>Search for a user</h1>Username:<input type = 'text' id = 'userField'></input><button onclick = 'getUser()'>Search for User</button><div id = 'userResult'></div><br/>"+
	"List a user's posts:<input type = 'text' id = 'postUserField'></input>Limit(max of 200): <input type = 'number' max:'200' min:'1' id = 'postLimit' value='50'></input><button onclick = 'getPostsByUser()'>Execute Search</button><div id = 'userPostResult'></div><br/>List a user's followers:<input type = 'text' id = 'followerUserField'></input>Limit(max of 200): <input type = 'number' max:'200' min:'1' id = 'followerLimit' value='50'></input><button onclick = 'getFollowersByUser()'>Execute Search</button><div id = 'userFollowerResult'></div><br/>List who a user is following:<input type = 'text' id = 'followingUserField'></input>Limit(max of 200): <input type = 'number' max:'200' min:'1' id = 'followingLimit' value='50'></input><button onclick = 'getFollowingByUser()'>Execute Search</button><div id = 'userFollowingResult'></div><br/></br></body></html>";
	res.send(returnString);
});

app.use('/', router); 
app.listen(process.env.port || 3000); 
console.log('Running frontend server at Port 3000');
