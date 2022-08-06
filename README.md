# PS_STATS

PS_STATS is a match tracking tool for [Pokemon Showdown](play.pokemonshowdown.com). It will collect data on matches played while the program, automatically save replays, and display the match summary history on a web page.

## How to run
PS_STATS can be run in the following ways:

 - [Locally](#locally)
	 - [Out of the box](#out-of-the-box)
	 -  [Using Docker](#using-docker)
- Hosting
	- [Replit](#replit)


### Locally
In order to run locally, the following steps must be followed regardless of method:
1. Clone the repository to your local machine.
2. Move the appropriate binary from the dist folder to the top level. 
	e.g. If you are on macOS you can run the following command `cp dist/mac/PS_STATS .`
3. The config.yml file must be filled out.
#### Out of the Box
If running out of the box, all you need to do is run `PS_STATS` (or `PS_STATS.exe` if on windows). Then navigate to [127.0.0.1:1323](http://127.0.0.1:1323) in a web browser. 
#### Using Docker
With docker installed, the command `docker compose up -d --build` can be used to spin up the program.

NOTE: when running locally, the service cannot be accessed on mobile unless both the device running PS_STATS and the mobile device are on the same WiFi network; If they are, you can navigate to the site on mobile by using your devices local IP address. Additionally a service like [ngrok](https://ngrok.com/) can be used to expose your local instance of the website (however for ease-of-use, I would recommend using the hosting method detailed below unless you are tech-savvy)

### Replit
Replit.com is a site which allows you to run code online. Setup is a bit different than running locally. 

- Create an account (or sign in)
- Create a new repl, and import from github (github.com/malaow3/PS_Stats), set language to Go
- Since repl's are public (unless you chose to pay), we DO NOT want to update the config.yml file, and instead add the relevant data as a secret.
	- Click the lock icon on the left sidebar and add the following secrets:

| Key      	| Value            	|
|----------	|------------------	|
| USERNAME 	| your PS username 	|
| PASSWORD 	| your PS password 	|

 
- Click "Run"

**OPTIONAL STEP**: Repl instances will eventually power down... If you'd like this service to stay on all the time, you can either run locally and keep your machine running, or setup an account on https://uptimerobot.com/ to ping your repl and keep it always running!
- Create an account or login to https://uptimerobot.com/
- Click "Add a new monitor"
- Set type to "http(s)"
- Set the URL (or IP) to be your replit site (e.x. "https://PSStats.malaow3.repl.co"; the "friendly name" field must also be filled out. 

