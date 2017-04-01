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