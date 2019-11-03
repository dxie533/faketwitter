function addItem(parentID,type){
	var itemObject = {};
	var content= document.getElementById("content").value;
	if(parentID){
		itemObject.parent = parentID;
	}
	if(type){
		itemObject.childType = type;
	}
	if(content == ""){
		document.getElementById("addResult").innerHTML = "There is no content to add.";
		return;
	}
	itemObject.content = content;
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("addResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				document.getElementById("addResult").innerHTML = "Item has been added! Generated item id: " + results.id;
				return;
			}
		}
	}
	request.open("POST", "/additem",true);
	request.setRequestHeader("Content-Type","application/json");
	request.send(JSON.stringify(itemObject));
}

function logout(){
var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200 ||this.readyState == 4 && this.status == 500){
			window.location = "http://helloworld123.cse356.compas.cs.stonybrook.edu/";
		}
	}
	request.open("POST","/logout",true);
	request.send();
}

function getItems(){
	
}
