# Awesome Game
CMPT 470 Final Project developed by James Araujo, Jay Svoboda, Lin Cong, Twilight Summerland, Hwayoung Lee, Abram Wiebe.

## Project Checkpoint
For the project checkpoint, the node application will run directly on the host machine with SQLite3 as the database. The final submission will use Vagrant and MySQL.

1. `cd web-app/app`
2. `npm install`
3. `node populateDb.js -q ../static/questions/questions.json`
4. `npm start`


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


## File Structure
* Dynamic-Content: `web-app/app/`
* Static-Content: `web-app/static/`
* Provisioning: `chef/`
* VagrantFile: VM definition
