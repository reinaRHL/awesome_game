$(document).ready(function(){
	var socket = io.connect();
	var $messageButton = $('#btn-chat');
	var $message = $('#btn-input');
	var $chatDisplay = $('#chatDisplay');
	var option = window.location.pathname.substring(1);
	
// toggle tabs based on url
	switch (option) {
                case "profile":
                    $('a[href="#'+ option +'"]').tab('show')
                    break;
                case "lobby":
                    $('a[href="#'+ option +'"]').tab('show')
                    break;
                case "friends":
                    $('a[href="#friendsList"]').tab('show')
                    break
            }
// push tabs to url
    $( "nav li" ).on( "click", function() {
    	switch ($( this ).text()) {
                case "Profile":
                    history.pushState(null, null, 'profile');
                    break;
                case "Lobby":
                    history.pushState(null, null, 'lobby');
                    break;
                case "Friends":
                    history.pushState(null, null, 'friends');
                    break
            }
     })
 
	// sendMessage
	$messageButton.click(function(e){
		
		socket.emit('sendMessage', $message.val());
		$message.val('');
	});

	$("#btn-input").keydown(function(e){
        if(e.which === 13){
            $messageButton.click();
        }
    });

	socket.on('newMessage', function(data){
		var myDate = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
		$chatDisplay.append('<div class="row msg_container base_sent"><div class="col-md-9 col-xs-9"><div class="messages msg_sent"><p>'+data.msg+'</p><time>'+data.name+' • '+myDate+'</time></div></div><div class="col-md-3 col-xs-3 avatar"><img src="../../img/avatar.png" class=" img-responsive "></div>');
		
	})

// onlineusers
	
    socket.on('getUsers', function(data){
        var html = '';
        for (i =0;i <data.length; i++){
            html += '<li><a href="#">'+data[i]+'</a></li><li class="divider"></li>'
            console.log("here" + data)
        }
        $("#friendsDropdown").html(html)
    })
})