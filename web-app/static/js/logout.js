// logout js
var socket = io.connect();
$(document).ready(function(){


 $("nav ul").on('click', "#log_out", function(e) {
    
     $.ajax({
       type: "DELETE",
       url: '/logout',
       statusCode: {
         401: function(){
          //  alert("You are not authorized")
         }
       },
       
       data: "name=" + $("#profile > div.panel-body > h1").text().split('  ')[1],
       success: function(data){
           window.location.href = data
       }
     });
     socket.emit('logOutUser', $("#profile > div.panel-body > h1").text().split('  ')[1])
 });

 



});
