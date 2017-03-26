$(document).ready(function(){
	var socket = io.connect();
	var $messageButton = $('#btn-chat');
	var $message = $('#btn-input');
	var $chatDisplay = $('#chatDisplay');

	// $("nav li").click(function() {
 //        if ($('ul li:nth-child(1)').hasClass('active')) {
 //            history.pushState(null, null, 'profile');
 //        } else if ($('ul li:nth-child(2)').hasClass('active')) {
 //            history.pushState(null, null, 'lobby');
 //        } else if ($('ul li:nth-child(3)').hasClass('active')) {
 //            history.pushState(null, null, 'friends');
 //        }
 //        return false;
 //    });
	
	$messageButton.click(function(e){
		
		socket.emit('sendMessage', $message.val());
		$message.val('');
	});

	socket.on('newMessage', function(data){

		$chatDisplay.append('<div class="row msg_container base_sent"><div class="col-md-9 col-xs-9"><div class="messages msg_sent"><p>'+data.msg+'</p><time datetime="2009-11-13T20:00">'+data.name+' • 51 min</time></div></div><div class="col-md-3 col-xs-3 avatar"><img src="../../img/avatar.png" class=" img-responsive "></div>');
	})
})