This project aims to provide an alternative web interface to Munin html (2.0).

It lays on NodeJS, Webpack, React, Apollo Graphql, Material UI, Recharts... and many more.

The GraphQL backend uses another project of mine, [munin-db](https://github.com/molaux/munin-db) to access munin data files. The frontend provides interractive SVG graph reprensations of Munin plugins (using Recharts). 

It can be used to visualize historical data by picking end and start datetimes or to follow the last 24h sliding window. 
I recently added notifications extracted from munin-limits datafile.

As it is not secured yet, it should be run in a local secured Network.

![General Picture](/doc/pictures/general-picture.png)

## Install
On a Munin server :
```bash
git clone https://github.com/molaux/munin-front
cd munin-front
yarn install
yarn build
```
## Start the GraphQL backend
At the present time, the backend expects Munin files to be located at `/var/lib/munin`
```bash
node server/main.js
```
## Start the React frontend

### Install serve
```bash
npm install -g serve
```

### Serve the frontend
```bash
serve -s build
```



### Apache configuration

## Todo
* Complete this doc input
* Clean code
* Clean dependencies
* Add authentication to backend
* Enhance responsiveness
* Handle errors...
* Think about more todos
