$(document).ready(function(){

	window.fbAsyncInit = function() {
      FB.init({
        appId      : '1006722016094891',
        xfbml      : true,
        version    : 'v2.8'
      });
      FB.AppEvents.logPageView();


 };


    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  $(window).ready(function(){
      $('#loadingImg').show().delay(500).fadeOut(600); 
  });


});