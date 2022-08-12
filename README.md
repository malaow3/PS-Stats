# PS-STATS

PS-STATS is a match tracking tool for [Pokemon Showdown](play.pokemonshowdown.com). It will collect data on matches played while the program, automatically save replays, and display the match summary history on a web page.
![image](https://user-images.githubusercontent.com/20196976/183268590-0632fa4b-8444-4a00-9252-2d43c5ef7998.png)

## How to run

PS-STATS can be run in the following ways:

- [Locally](#locally)
  - [Using Docker (Preferred)](#using-docker)
  - [Out of the box](#out-of-the-box)
- Hosting
  - [Replit](#replit)

### Locally

In order to run locally, the following steps must be followed regardless of method:

1. Clone the repository to your local machine.
2. The config.yml file must be filled out.

#### Using Docker

With docker installed, the command `docker compose up -d --build go` can be used to spin up the program.

If you would like to broadcast your program to be available on other devices (for example, your mobile device), a little more setup must be followed:

- Create an [ngrok](https://ngrok.com/) account.
- Copy your auth token into the docker-compose.yml file
- Run `docker compose up -d --build`

Some notes about ngrok:

- To view the URL for your app, run `docker logs ps_stats-ngrok-1` and look for the line that has a url (e.x: `t=2022-08-09T14:57:20+0000 lvl=info msg="started tunnel" obj=tunnels name=command_line addr=http://go:1323 url=https://e970-96-234-78-201.ngrok.io`)
- Note that if your computer shuts down or restarts, when the service is re-started, your ngrok url **will** change and you will need to re-run the above command to view it again.
- Additionally, most web browsers will flash a warning saying that the ngrok site is "unsafe"; this is because someone could make a clone of something like facebook, host on ngrok, and try to get people to enter real credentials into it; for our use case, this is not a problem, so clicking Details>"visit this unsafe site" is OK. If after viewing the site, you don't see PS-Stats, simply close the tab and double check the URL you entered.

#### Out of the Box

First, move the appropriate binary from the dist folder to the top level.
e.g. If you are on macOS you can run the following command `cp dist/mac/PS-STATS .`
If running out of the box, all you need to do is run `PS-STATS` (or `PS-STATS.exe` if on windows). Then navigate to [127.0.0.1:1323](http://127.0.0.1:1323) in a web browser.

### Replit

Replit.com is a site which allows you to run code online. Setup is a bit different than running locally.

- Create an account (or sign in)
- Create a new repl, and import from github (github.com/malaow3/PS-Stats), set language to Go (optionally, you can fork a repl I have set up: https://replit.com/@malaow3/PSStats )
- Since repl's are public (unless you chose to pay), we DO NOT want to update the config.yml file, and instead add the relevant data as a secret.
  - Click the lock icon on the left sidebar and add the following secrets:

| Key      | Value            |
| -------- | ---------------- |
| USERNAME | your PS username |
| PASSWORD | your PS password |

- Click "Run"

**OPTIONAL STEP**: Repl instances will eventually power down... If you'd like this service to stay on all the time, you can either run locally and keep your machine running, or setup an account on https://uptimerobot.com/ to ping your repl and keep it always running!

- Create an account or login to https://uptimerobot.com/
- Click "Add a new monitor"
- Set type to "http(s)"
- Set the URL (or IP) to be your replit site (e.x. "https://PSStats.malaow3.repl.co"; the "friendly name" field must also be filled out.

## Filtering

Battles can be filtered by entering text inside the "Filter" input box.

Filters are applied in the following ways:

- [Tags](#tags)
- [Plaintext](#plaintext)

### Tags

Tags must be used in the following format < Tag >:< Value > (e.g. format:vgc2022).

The following tags are able to be used:

- format
- opponent
- opponent_team
- your_team

### Plaintext

Performing a plaintext search will simply search to see if the item entered exists in any of the above listed tags. This can lead to some undesired filter behavior. For example, if you are searching for a vgc2022 games where you used kyogre, if you enter "vgc2022 kyogre" into the filter field, it will ALSO return battles in which your opponent used kyogre AND non vgc2022 battles where kyogre was also used. For this reason, it is recommended that filtering with tags is used.
