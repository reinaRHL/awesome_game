var models = require('../models');
var Sequelize = require('sequelize');


module.exports = function (server) {
	const MILLIS_PER_ROUND =15000;
	var io = require('socket.io')(server);
	
	//A dictionary of active connections indexed by session key
	var connections ={};
	
	//A dicitonary of games indexed by gameID
	var games ={};

	//io user Authentication
	function extractCookie(cookie, cname) {
		var name = cname + "=";
		var ca = cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	function getSocketSessionKey(socket)
	{
		return extractCookie(socket.client.request.headers.cookie,"session");
	}

	//Begin socket session
	io.on('connection', function(socket)
	{
		var skey = getSocketSessionKey(socket);
		var userId = userIdFromSessionKey(skey);
		console.log('a user connected'+ getSocketSessionKey(socket));
		
		connections[skey]=socket;

		io.on('disconnect', function(socket)
		{
			console.log('a user connected'+userId +" "+skey);
		});

		
		//Client event handlers
		socket.on('startGame', function(data)
		{
			if(!userIsInGame(userId,gameId))
			{
				socket.emit('error',"You are not in this game");
				return;
			}
			if( ! startGame(data,gameId) )
			{
				var state = getGameState(gameId);
				if(state == "running")
				{
					socket.emit('error',"Game Already running");
				}
				else if(state == "running")
				{
					socket.emit('error',"Game Already over");
				}
				
			}
			startGame(gameId);

		});
		
		socket.on('submitAnswer', function(data)
		{
			var gameId=data.gameId;
			
			//Check permissions
			if(!userIsInGame(userId,gameId))
			{
				socket.emit('error',"You are not in this game");
				return;
			}
			
			if(!gameIsSubmissionRound(gameId))
			{
				socket.emit('error',"Prof Oak's advice: That's not the time to use that");
				return;
			}

			var answer = data.answer;
			submitAnswer(gameId,userId,answer);
			socket.emit("wait");
		});

		socket.on('pickAnswer', function(data)
		{
			gameId=data.gameId;
			
			//Check permissions
			if(!userIsInGame(userId,gameId))
			{
				socket.emit('error',"You are not in this game");
				return;
			}

			if(!gameIsVotingRound(gameId))
			{
				socket.emit('error',"Prof Oak's advice: That's not the time to use that");
				return;
			}

			answerIndex=data.index;
			voteAnswer(gameId,userId,answerIndex);
			socket.emit("wait");
		});

		socket.on('sync', function(data)
		{
			var gameId = data.gameId;
			//TODO voluntarily update game state
		});

	});



	function startGame(gameId)
	{
		//TODO update db
		
		var roundNumber=0;
		var ofRounds=15;
		
		//TODO
		//getGameMembers.then=>getSessionForGame.then=>
		
		//socketList = connections.map(sessionkeys)
		doSubmissionRound(gameId,socketList);
		
	}

	function  doSubmissionRound(gameId,socketList)
	{
		for (s in socketList)
		{
			s.emit("advanceRound","input");
		}
		setTimeout(doVoteRound, MILLIS_PER_ROUND,gameId,socketList);
	}
	
	function  doVoteRound(gameId,socketList)
	{
		for (s in socketList)
		{
			s.emit("advanceRound","vote");
		}
		setTimeout(doVoteRound, MILLIS_PER_ROUND,gameId,socketList);
	}

	function  doResultRound(gameId,socketList)
	{
		for (s in socketList)
		{
			s.emit("advanceRound","vote");
		}
		setTimeout(doSubmissionRound, MILLIS_PER_ROUND,gameId,socketList);
	}

	

	


	

	
};