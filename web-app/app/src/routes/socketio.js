var models = require('../models');
var Sequelize = require('sequelize');


module.exports = function (server) {
	const MILLIS_PER_ROUND =15000;
	const ROUND_COUNT=15;
	var io = require('socket.io')(server);
	
	//A dictionary of active connections indexed by session key
	var connections ={};
	var sessionKeys ={};
	
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
		sessionKeys[socket]=sKey;

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
			submitAnswer(gameId,userId,sessionKey,answer);
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
			voteAnswer(gameId,userId,sessionKey,answerIndex);
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
		initializeGame(gameId);
		
		//TODO
		//getGameMembers.then=>getSessionForGame.then=>
		
		//socketList = connections.map(sessionkeys)

		//TODO prepare all game data in advance=>then
		doSubmissionRound(gameId,socketList);
		
	}

	function initializeGame(gameId)
	{
		games[gameId]={}
		games[gameId]["submissionRoundTriggered"]=false;
		games[gameId]["voteRoundTriggered"]=false;
		games[gameId]["resultRoundTriggered"]=false;

		games[gameId]["roundNumber"]=0;
		games[gameId]["ofRounds"]=ROUND_COUNT;
		games[gameId]["votes"]={};
		games[gameId]["answers"]=[];
	}


	//Functions to check against duplication
	function sessionHasAnswered (answerArray,skey)
	{
		for(var i=0; i<answerArray.length;i++)
		{
			if( answerArray[i]["sessionKey"] == skey)
			{
				return true;
			}
		}
		return false;
	}

	function sessionHasVoted (voteDict,skey)
	{
		return skey in voteDict;
	}

	
	//Functions that handle user actions after they've been authenticated

	//PRE: Authentication and round type checked
	function submitAnswer(gameId,userId,sessionKey,answerText)
	{
		var gameState = games[gameID];
		if  ( sessionHasAnswered(gameState["answers"],sessionKey) )
		{
			return false;
		}

		var answer= {}
		answer["userId"]=userId;
		answer["sessionKey"]=sessionKey;
		answer["answer"]=answerText;
		gameState["answers"].push(answer);
		return true;
	}

	//PRE: Authentication and round type checked
	function voteAnswer(gameId,userId,sessionKey,answerIndex)
	{
		var gameState = games[gameID];
		if  ( sessionHasVoted(gameState["votes"],sessionKey) )
		{
			return false;
		}
		gameState["votes"][sessionKey]=answerIndex;
		return true;
	}

//Functions dtat do main game loop
	function  doSubmissionRound(gameId,socketList)
	{
		var gameState = games[gameID];

		games[gameId]["answers"]=[];

		if (gameState["submissionRoundTriggered"])
		{
			//A timer popped but the vote round was already trigered by another condition
			gameState["submissionRoundTriggered"] = false;
			return;
		}

		models.Question.find({
		order: [
			Sequelize.fn( 'RAND' ),
		]
		}).then(function(result)
		{
			Question.getAnswers().then(function(result)
			{
			var data={};

			result.foreach(e)
			{
				//TODO find real answer and set it in the game state
				//TODO select a fake answer to put in data
			}

			data["roundType"]="input";
			for (s in socketList)
			{
				s.emit("advanceRound",data);
			}
			setTimeout(doVoteRound, MILLIS_PER_ROUND,gameId,socketList);
			});
		});
		
	}
	
	function  doVoteRound(gameId,socketList)
	{
		var gameState = games[gameID];

		if (gameState["voteRoundTriggered"])
		{
			//A timer popped but the vote round was already trigered by another condition
			gameState["voteRoundTriggered"] = false;
			return;
		}
		var data={
				roundType:"vote",
			};
			var fake = gameState["fakeAnswers"];
			var real = gameState["realAnswer"];

		for (s in socketList)
		{
			s.emit("advanceRound",data);
		}
		setTimeout(doVoteRound, MILLIS_PER_ROUND,gameId,socketList);
	}

	function  doResultRound(gameId,socketList)
	{
		var gameState = games[gameID];
		if (gameState["resultRoundTriggered"])
		{
			//A timer popped but the vote round was already trigered by another condition
			gameState["resultRoundTriggered"] = false;
			return;
		}

		for

		for (s in socketList)
		{
			var data={
				roundType:"result",
				
			};

			s.emit("advanceRound","result");
		}
		setTimeout(doSubmissionRound, MILLIS_PER_ROUND,gameId,socketList);
	}

	

	


	

	
};