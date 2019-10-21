function search(){
	var searchObject = {};
	var time = document.getElementById("timestamp").value;
	var count = document.getElementById("count").value;
	if(time != ""){
		searchObject.timestamp = document.getElementById("timestamp").value;
	}
	if(count != "")
		searchObject.limit = document.getElementById("count").value;
	
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
					response += "<div>User:" + results.items[i].username + "<br/>" + results.items[i].content + "<br/> Likes:" + results.items[i].property.likes + " Retweets:" + results.items[i].retweeted + "<br/> Posted on (UNIX Time): " + results.items[i].timestamp + "<br />";
				}
				document.getElementById("searchResult").innerHTML = response;
			}
		}
	}
	request.open("POST", "/search",true);
	request.setRequestHeader("Content-Type","application/json");
	request.send(JSON.stringify(searchObject));
}