# Awesome Game
CMPT 470 Final Project developed by James Araujo, Jay Svoboda, Lin Cong, Twilight Summerland, Hwayoung Lee, Abram Wiebe.

## Project Checkpoint
For the project checkpoint, the node application will run directly on the host machine with SQLite3 as the database. The final submission will use Vagrant and MySQL.

1. `cd web-app/app`
2. `npm install`
3. `node populateDb.js -q ../static/questions/questions.json`
4. `npm start`

## File Structure
* Server-side: `web-app/app/`
* Client-side: `web-app/static/`
* Chef: `chef/`
