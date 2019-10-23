function search(){
	var searchObject = {};
	var time = document.getElementById("timestamp").value;
	var count = document.getElementById("count").value;
	if(time != ""){
		searchObject.timestamp = parseInt(document.getElementById("timestamp").value,10);
	}
	if(count != "")
		searchObject.limit = parseInt(document.getElementById("count").value,10);
	
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
					response += "<div>User:" + results.items[i].username + "<br/>" + results.items[i].content + "<br/> Likes:" + results.items[i].property.likes + " Retweets:" + results.items[i].retweeted + "<br/> Posted on (UNIX Time): " + results.items[i].timestamp + "<br /><br/>";
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
	var item = document.getElementById("itemField");
	var returnString = "";
	if(!item || item == ""){
		document.getElementById("itemResult").innerHTML = "No item ID was entered";
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
	request.setRequestHeader("Content-Type","application/json");
	request.send(JSON.stringify(searchObject));
}