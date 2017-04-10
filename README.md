# Awesome Game
CMPT 470 Final Project developed by James Araujo, Jay Svoboda, Lin Cong, Twilight Summerland, Hwayoung Lee, Abram Wiebe.

## Project Checkpoint
For the project checkpoint, the node application will run directly on the host machine with SQLite3 as the database. The final submission will use Vagrant and MySQL.

1. `cd web-app/app`
2. `npm install`
3. `node populateDb.js -q ../static/questions/questions.json`
4. `npm start`

## Project Final

To play you wll need to do the following:
1. Create two accounts
2. Login to both (An easy way to do this is to use private tab or another browser)
3. Have one account create the game
4. Have the other account join
5. Start

Each round
1. You will be prompted for text input, you should put in a belivable lie at this point
2. Some server generated fake answers, a real answer and user answers will be displayed, pick which you think is the real one
3. You will be awarded points for picking the correct answer, your lifetime score is shown in orange, you game score is shown in the leaderboard
4. Repeat until game ends

## Production Mode

### First run
 1. `vagrant up --provision`
 2. Wait a good 10 minutes for it to complete, npm install seems to take a while because one of the package servers is slow.
 3. Site is accessible at `localhost:8888`

### Subsequent runs
After provisioning, you can be spared the indignity of waiting again, just say:
 1. `vagrant up`

This will work at least until someone needs a new package installed

### Updating

#### If you modified a web app item
Nothing this should server automatically

#### If you add a node package
 1. `vagrant ssh`
 2. `cd project/web-app/app`
 3. `npm install`

#### If you modify a chef file
`vagrant up --provision`

#### If you modify the vagrant definition
`vagrant destroy -f && vagrant up --provision`


## Logs

The output of node is logged automatically by systemd, to read the log invoke

1. `vagrant ssh`
2. `sudo journalctl -u gameapp`

To get a live-feed of node's output when running, execute the log with the -f flag

3. `sudo journalctl -u gameapp -f`


## Known Issues

* The filter box on the game list performs no function.
* On occasion you may see a question twice in the same game.
* If a game has no players it may still display as running until it has ended on the server.
* If the user reloads the page during a game or disconnects no reconnection method is available.
* The game will update the score to reflect who scored in a round, but there is no visual indication of which answers were lies and which was the truth.

## File Structure
* Dynamic-Content: `web-app/app/`
* Static-Content: `web-app/static/`
* Provisioning: `chef/`
* VagrantFile: VM definition

## Resources

The Questions JSON File was generated via `https://opentdb.com/api_config.php` and was edited
and stored in the database to suit our particular needs.
