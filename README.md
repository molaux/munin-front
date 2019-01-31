This project aims to provide an alternative web interface for Munin monitoring database.

I developped it initialy in a learning purpose of React / Apollo / Graphql stack.

The project is composed of a React frontend and a GraphQL backend (itself using another project of mine, [munin-db](https://github.com/molaux/munin-db) to access munin data files). It provides interractive SVG graph reprensations of Munin plugins (using recharts). It can be used to visualize historical data by picking end and start datetimes or to follow the last 24h sliding window.

![General Picture](/doc/pictures/general-picture.png)

# Install
On a Munin server :
```bash
git clone https://github.com/molaux/munin-front
cd munin-front
yarn install
yarn build
```
# Start the GraphQL backend
At the present time, the backend expects Munin files to be located at `/var/lib/munin`
```bash
node server/main.js
```
# Start the React frontend

## Install serve
```bash
npm install -g serve
```

## Serve the frontend
```bash
serve -s build
```

## Apache configuration

# Todo
* Complete this doc input
* Create dashboard for warning and criticals summary
* Add push notifications
* Clean code
* Clean dependencies
* Add authentication to backend
* Enhance responsiveness
* Use min / max information to provide more accurate graph reprensentations
* Handle errors...
* Think about more todos
