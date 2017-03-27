
// Facebook share dialog feature

$(document).ready(function(){

  // Facebook JS SDK initialization
	window.fbAsyncInit = function() {
    	FB.init({
        	appId      : '1006722016094891',
        	xfbml      : true,
        	version    : 'v2.8'
      	});
      	
      	FB.AppEvents.logPageView();

      // Share button on index page
    	$('#shareBtn').click(function(){
			FB.ui({
		      method: 'share',
		      display: 'popup',
		      href: 'http://imgur.com/1UuGwBL',
		      description: "This is awesome game! We can replace the link once game is hosted."
    		}, function(response){});
      	});

    // Share the result button. 
    // Will be added later.  
		$('#shareResultBtn').click(function(){
			FB.ui({
		      method: 'share',
		      display: 'popup',
		      href: 'http://imgur.com/424rzw1',
		      description: "I won! We can replace the link once game is hosted."
    		}, function(response){});
      	});   
  	};


    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  	
});

