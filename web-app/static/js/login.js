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

 $("#log_in").submit(function(e) {
   var s = document.getElementById('errorContent_Login');

     e.preventDefault(); // Prevents the page from refreshing
     $.ajax({
       type: "POST",
       url: '/login',
       statusCode: {
         401: function(){
           s.innerHTML = "Credentials entered are incorrect.";
         }
       },
       data: $("#log_in").serialize(),
       success: function(data){
           window.location.href = data;
       }
     });
 });

 $("#sign_up").submit(function(e) {
   var username = document.getElementById('unSignup');
   var password = document.getElementById('pwSignup');
   var password_confirm = document.getElementById('pwConfirm');
   var s = document.getElementById('errorContent');
   e.preventDefault(); // Prevents the page from refreshing

   if(password.value != password_confirm.value){
       //display error
       s.innerHTML = "Passwords don't match.";
       //console.log("not same value");
     }else if(username.value === ""){
       s.innerHTML = "Username cannot be blank.";
     }else{
     $.ajax({
       type: "POST",
       url: '/signup',
       statusCode: {
         401: function(){
           s.innerHTML = "Username is already taken.";
         }
       },
       data: $("#sign_up").serialize(),
       success: function(data){
           window.location.href = data;
       }
     });

   }
 });


});


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
