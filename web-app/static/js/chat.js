$(document).ready(function(){
	var socket = io.connect();
	var $messageButton = $('#btn-chat');
	var $message = $('#btn-input');
	var $chatDisplay = $('#chatDisplay');

	var option = window.location.pathname.substring(1);


	// Javascript to enable link to tab
var url = document.location.toString();
if (url.match('#')) {
    $('.nav-tabs a[href="#' + url.split('#')[1] + '-tab"]').tab('show');
} //add a suffix

// Change hash for page-reload
$('.nav-tabs a').on('shown.bs.tab', function (e) {
    window.location.hash = e.target.hash;
})


	switch (option) {
                case "profile":
                    $('ul li:nth-child(1)').tab('show')
                    break;
                case "lobby":
                    $('ul li:nth-child(2)').tab('show')
                    break;
                case "friends":
                    $('ul li:nth-child(3)').tab('show')
                    break
            }

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

		$chatDisplay.append('<div class="row msg_container base_sent"><div class="col-md-10 col-xs-10"><div class="messages msg_sent"><p>'+data.msg+'</p><time datetime="2009-11-13T20:00">'+data.name+' • 51 min</time></div></div><div class="col-md-2 col-xs-2 avatar"><img src="../../img/avatar.png" class=" img-responsive "></div></div>');
	})
})