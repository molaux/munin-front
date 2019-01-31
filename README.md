This project aims to provide an alternative web interface for Munin monitoring database.

I developped it initialy in a learning purpose of React / Apollo / Graphql stack.

The project is composed of a React frontend and a graphql backend

# Install

```bash
git clone https://github.com/molaux/munin-front
cd munin-front
yarn install
yarn build
```
# Start graphql backend
```bash
node server/main.js
```
# Start frontend

## Install serve
```bash
npm install -g serve
```

## Serve frontend
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
* Think about more todos
