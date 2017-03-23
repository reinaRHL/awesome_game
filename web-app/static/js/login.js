// login js

$(document).ready(function(){

// swap password text field with basic text to make it 'visible'
$("#password_show_checkbox").click(function () {
 if ($(".password_show").attr("type")=="password") {
   $(".password_show").attr("type", "text");
 }
 else{
   $(".password_show").attr("type", "password");
 }

 });

});

function signupSubmit(){
  //when signup Submit button is pressed
  var s = document.getElementById('errorContent');
  var password = document.getElementById('pwSignup');
  var password_confirm = document.getElementById('pwConfirm');

  if(password.value === password_confirm.value){
    // now submit the values to the DB as a user
    s.innerHTML = "Correct";
  }else{
    // notify the user of incorrect credentials entered
    s.innerHTML = "Passwords don't match.";
  }
}

function open_SignupModal(){
  //clear modal contents for signup everytime button is clicked
  //so the data is only relevant for the time the user can see it
  var uname = document.getElementById('unSignup');
  var password = document.getElementById('pwSignup');
  var password_confirm = document.getElementById('pwConfirm');
  uname.value = "";
  password.value = "";
  password_confirm.value = "";
}

function login_Submit(){
  //user has pressed login button => make request to check
  //if DB credentials match to what user has entered
  var uname = document.getElementById('unLogin');
  var pw = document.getElementById('pwLogin');

  //make request
}
