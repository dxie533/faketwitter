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

function deleteSelected(){
	var content= document.getElementById("deleteContent").value;
	if(content == ""){
		document.getElementById("deleteResult").innerHTML = "There is no item id listed to delete.";
		return;
	}
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				document.getElementById("addResult").innerHTML = results.error;
				return;
			}
			if(results.status === "OK"){
				document.getElementById("addResult").innerHTML = "Item has been deleted!";
				return;
			}
		}
	}
	request.open("DELETE", "/item/"+content,true);
	request.send();
}

function deletePost(id){
	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error"){
				if(result.error === "No such item exists under your username."){
					document.getElementById(""+id).innerHTML = "Item has already been deleted!";
				}
				return;
			}
			if(results.status === "OK"){
				document.getElementById(""+id).innerHTML = "Item has been deleted!";
				return;
			}
		}
	}
	request.open("DELETE", "/item/"+id,true);
	request.send();
}
