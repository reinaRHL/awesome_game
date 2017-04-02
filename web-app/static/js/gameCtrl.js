(function(){
    //begin game
    var game = new Game();
});
class Game {
    constructor(){
        this.round = 1;
        this.roundEnds;
        this.id;
        this.players = [];
        this.questions = [];
    }
    newRound(){
        //update ui begin a new round

    }
    
}



/// Sombody's template
function joinGame()
{
    $.ajax({url: "/api/game/"+id+"/notify", success:serverBeganRound
    });
}

function startGame()
{
    $.ajax({url: "/api/game/+"id+"/start", success:serverRequestedVotes
    });
}

function serverBeganRound(data)
{
//Display card and prompt input
//Reset gui timer
    $.ajax({url: "/api/game/+"id+"/notify", success:serverRequestedVotes
    });
}

function serverRequestedVotes(data)
{
//Display card and prompt input
//Reset gui timer
    $.ajax({url: "/api/game/"+id+"/notify", success:serverGaveResults
    });
}

function serverGaveResults(data)
{
    //get scores delta scores and who lied about what out of data
    if(endOFGame)
    {
        //things
    }
    else
    {
        $.ajax({url: "/api/game/"+id+"/notify", success:serverBeganRound
        });
    }

}