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
	
	///UTILITIES
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
	
	//http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
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
		
		//Intercept when a user submits a lie
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

		//Intercept when a user picks one of the answers displayed
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

		games[gameId]["totalScore"]={};

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
		gameState["submissionRoundTriggered"]=true;

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
		gameState["voteRoundTriggered"] = true;
			var fake = gameState["fakeAnswers"];
			var real = gameState["realAnswer"];

			//pick one fak answer
			fake = fake[Math.floor(Math.random()*fake.length)];

			//clone user answers
			var ans=gameState["answers"];
			//add fake answer and real answer
			ans.push(fake);
			real.push(real);

			//Overwrite answers since it's important everyone gets them in the same order
			gameState["answers"] = shuffle(ans);

			//NOTE
			//Same answer as real or fake or other player not handled
			//TODO filter answer by player, but start by making MVP

			//remove identifying information from return values
			var clientArr = gameState["answers"].map(function (e)
			{
				return gameState["answers"]["answer"]
			});

			var data=
			{
				roundType:"vote",
				answers:clientArr
			};
			
		for (s in socketList)
		{
			s.emit("advanceRound",data);
		}
		setTimeout(doResultRound, MILLIS_PER_ROUND,gameId,socketList);
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
		gameState["resultRoundTriggered"] = true;

		//count votes on index
		var acc ={};
		for ( v in gameState["votes"] )
		{
			var idx = gameState["votes"][v];
			
			if(idx in acc)
			{
				acc[idx] +=1;
			}
			else
			{
				acc[idx]=1;
			}
		}

		var al = gameState["answers"];

		var deltaScore ={};

		for(var i =0;i<al.length;i++)
		{
			var ans = al[i];
			deltaScore[ans["sessionKey"]]=acc[i];
		}

		updateTotalScore(deltaScore);

		//MAP session keys to Username here because we can't cache them
		//MAP total score and delta score from sessio nkey to usetrname
		//in promise completion add below

		var mappedDeltaScore={};
		var mappedScore={};

		var gameIsOver = gameState["roundNumber"]+1 > gameState["ofRounds"]);
		
		gameState["roundNumber"] +=1;

		for (s in socketList)
		{
			var data={
				roundType:"result",
				deltaScore:mappedDeltaScore,
				totalScore:mappedScore,
				gameOver:gameIsOver
			};

			s.emit("advanceRound",data);
		}
		setTimeout(doSubmissionRound, MILLIS_PER_ROUND,gameId,socketList);
	}

	
};