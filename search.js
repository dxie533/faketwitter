function search(){
	var searchObject = {};
	var time = document.getElementById("timestamp").value;
	var count = document.getElementById("count").value;
	var searchQuery = document.getElementById("searchQuery").value;
	var followersOnly = document.getElementById("followersOnly");
	var usernameQuery = document.getElementById("usernameOnly").value;
	var parentId = document.getElementById("parentIdSearch").value;
	var reples = document.getElementById("repliesBox");
	var media = document.getElementById("mediaBox");
	var timeStatus = document.getElementById("radioTime");
	var interestStatus = document.getElementById("radioInterest");
	if(followersOnly != undefined){
		searchObject.following = followersOnly.checked;
	}
	if(time != ""){
		searchObject.timestamp = parseInt(document.getElementById("timestamp").value,10);
	}
	if(count != "")
		searchObject.limit = parseInt(document.getElementById("count").value,10);
	if(searchQuery != ""){
		searchObject.q = searchQuery;
	}
	if(parentId != ""){
		searchObject.parent = parentId;
	}
	if(reples != undefined){
		searchObject.replies = reples.checked;
	}
	if(media != undefined){
		searchObject.hasMedia = media.checked;
	}
	if(timeStatus.checked == true){
		searchObject.rank = "time";
	}
	if(interestStatus.checked == true){
		searchObject.rank = "interest";
	}
	if(usernameQuery != ""){
		searchObject.username = usernameQuery;
	}
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("searchResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				if(results.items.length == 0){
					document.getElementById("searchResult").innerHTML = "No posts found.";
					return;
				}
				var response = "";
				for(var i = 0; i < results.items.length; i++){
					var typeString = "";
					var mediaString = "";
					if(results.items[i].childType === "retweet"){
						typeString = "Retweet of post <a href = '/item/" + results.items[i].parent + "'>" + results.items[i].parent + "</a><br/>";
					}
					if(results.items[i].childType === "reply"){
						typeString = "Reply to post <a href = '/item/" + results.items[i].parent + "'>" + results.items[i].parent + "</a><br/>";
					}
					if(results.items[i].media.length > 0){
						for(var j = 0; j < media.length; j++){
							mediaString += "<a href = '/media/'" + results.items[i].media[i] + "'>" + results.items[i].media[i] + "</a><br/>";
						}
					}
					response += "<div id = '"+ results.items[i].id+ "'>"+typeString+"User:" + results.items[i].username + "<br/>" + results.items[i].content + "<br/>"+ "Associated Media:<br/>" + mediaString+"Likes:" + results.items[i].property.likes + " Retweets:" + results.items[i].retweeted + "<br/> Posted on (UNIX Time): " + results.items[i].timestamp + "</div><br/>";
					/*response += "<div>User:" + results.items[i].username + "<br/>" + results.items[i].content + "<br/> Likes:" + results.items[i].property.likes + " Retweets:" + results.items[i].retweeted + "<br/> Posted on (UNIX Time): " + results.items[i].timestamp + "<br /><br/>";*/
				}
				document.getElementById("searchResult").innerHTML = response;
			}
		}
	}
	request.open("POST", "/search",true);
	request.setRequestHeader("Content-Type","application/json");
	request.send(JSON.stringify(searchObject));
}

function getItem(){
	var itemObject = {};
	var item = document.getElementById("itemField").value;
	var returnString = "";
	if(!item || item == ""){
		document.getElementById("itemResult").innerHTML = "No item ID was entered";
		return;
	}
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("itemResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				var response = "";
				response += "<div>User:" + results.item.username + "<br/>" + results.item.content + "<br/> Likes:" + results.item.property.likes + " Retweets:" + results.item.retweeted + "<br/> Posted on (UNIX Time): " + results.item.timestamp + "<br /><br/>";
				document.getElementById("itemResult").innerHTML = response;
			}
		}
	}
	request.open("GET", "/item/"+item,true);
	request.send();
}

function getUser(){
	var userObject = {};
	var user = document.getElementById("userField").value;
	var returnString = "";
	if(!user || user == ""){
		document.getElementById("userResult").innerHTML = "No username was entered";
		return;
	}
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("userResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				var response = "";
				response += "<div>Email: " + results.user.email + "<br/> Followers: " + results.user.followers + "<br/> Following: " + results.user.following;
				document.getElementById("userResult").innerHTML = response;
			}
		}
	}
	request.open("GET", "/user/"+user,true);
	request.send();
}

function getPostsByUser(){
	var postLimit = document.getElementById("postLimit").value;
	var userObject = {};
	var user = document.getElementById("postUserField").value;
	var returnString = "";
	if(!user || user == ""){
		document.getElementById("userPostResult").innerHTML = "No username was entered";
		return;
	}
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("userPostResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				var response = "";
				var i;
				for(i in results.items){
					response += "<div>post id: " + results.items[i] + "<br/>";
				}
				document.getElementById("userPostResult").innerHTML = response;
			}
		}
	}
	request.open("GET", "/user/"+user+"/posts?limit="+postLimit,true);
	request.send();
}

function getFollowersByUser(){
	var followerLimit = document.getElementById("followerLimit").value;
	var userObject = {};
	var user = document.getElementById("followerUserField").value;
	var returnString = "";
	if(!user || user == ""){
		document.getElementById("userFollowerResult").innerHTML = "No username was entered";
		return;
	}
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("userFollowerResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				var response = "";
				var i;
				for(i in results.users){
					response += "<div>Username: " + results.users[i] + "<br/>";
				}
				document.getElementById("userFollowerResult").innerHTML = response;
			}
		}
	}
	request.open("GET", "/user/"+user+"/followers?limit="+followerLimit,true);
	request.send();
}

function getFollowingByUser(){
	var followingLimit = document.getElementById("followingLimit").value;
	var userObject = {};
	var user = document.getElementById("followingUserField").value;
	var returnString = "";
	if(!user || user == ""){
		document.getElementById("userFollowingResult").innerHTML = "No username was entered";
		return;
	}
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("userFollowingResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				var response = "";
				var i;
				for(i in results.users){
					response += "<div>Username: " + results.users[i] + "<br/>";
				}
				document.getElementById("userFollowingResult").innerHTML = response;
			}
		}
	}
	request.open("GET", "/user/"+user+"/following?limit="+followingLimit,true);
	request.send();
}