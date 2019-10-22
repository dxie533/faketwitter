function validate(){
	var validationObject = {};
	validationObject.email = document.getElementById("validateEmail").value;
	validationObject.key = document.getElementById("validateCode").value;

	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "error")
				document.getElementById("validationResult").innerHTML = results.error;
			if(results.status === "OK")
				document.getElementById("validationResult").innerHTML = "Successfully validated. You may now login";
		}
	}
	request.open("POST", "/verify",true);
	request.setRequestHeader("Content-Type","application/json");
	request.send(JSON.stringify(validationObject));
}

function createDisabledAccount(){
	var accountObject = {};
	accountObject.username = document.getElementById("registerUsername").value;
	accountObject.password = document.getElementById("registerPassword").value;
	accountObject.email = document.getElementById("registerEmail").value;
	 var request = new XMLHttpRequest();
	 request.onreadystatechange = function(){
                if(this.readyState == 4 && this.status == 200||this.readyState == 4 && this.status == 500){
                	var results = JSON.parse(request.responseText);
			if(results.status === "OK")
                                document.getElementById("registrationResult").innerHTML = "Successfully registered. Registration code will be sent to your email.";
			if(results.status === "error")
				document.getElementById("registrationResult").innerHTML = results.error;
		 }
        }
        request.open("POST", "/adduser",true);
	request.setRequestHeader("Content-Type","application/json");
        request.send(JSON.stringify(accountObject));
}

function validateLogin(){
	var loginObject = {};
	loginObject.username = document.getElementById("loginUsername").value;
	loginObject.password = document.getElementById("loginPassword").value;

	var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200 ||this.readyState == 4 && this.status == 500){
			var results = JSON.parse(request.responseText);
			if(results.status === "OK"){
				document.getElementById("loginResult").innerHTML = "Successfully logged in.";
				document.getElementById("loginForm").submit();
			}
			if(results.status === "error"){
				document.getElementById("loginResult").innerHTML = results.error;
				//event.preventDefault();
			}
		}
	}
	request.open("POST","/login",true);
	request.setRequestHeader("Content-Type","application/json");
	request.send(JSON.stringify(loginObject));
	return false;
}

function logout(){
var request = new XMLHttpRequest();
	request.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200 ||this.readyState == 4 && this.status == 500){
			window.location = "http://helloworld123.cse356.compas.cs.stonybrook.edu/";
		}
	}
	request.open("POST","/logout",true);
	request.setRequestHeader("Content-Type","application/json");
	return false;
}
