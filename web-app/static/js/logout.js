// logout js

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
       
       data: document.cookie,
       success: function(data){
           window.location.href = document.cookie;
       }
     });
 });



});
