"use strict";


var GameSession = function( notifier )
{

}

GameSession.prototype.participants=[];

GameSession.prototype.getParticipants = function () {
  return [{session:"XYZ",id:1,username:"Alice"},
  {session:"XYZ",id:1,username:"Bob",channel:"aSocketInstnace"}
  ]
}

GameSession.prototype.addParticipants = function (session,username,channel) 
{
 //TODO scan participants and return false if a session is duplicated
 //
}

GameSession.prototype.broadcast =function(stringifyable)
{
	//for each channel send stringifiable
}

GameSession.prototype.unicastUsername = function(username,stringifyable)
{
	
}

GameSession.prototype.unicastId =function(userid)
{
	
}

GameSession.prototype.unicastSession =function(sessionkey)
{
	
}

GameSession.prototype.broadcastState =function()
{
	
}

GameSession.prototype.getState =function()
{
	
}

GameSession.prototype.advanceState=function()
{
	//go to the next game state
}

module.exports = GameSession;