import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'

import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-boost'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { BrowserRouter, Switch, Route } from 'react-router-dom'

const httpLink = new HttpLink({ uri: '//' + window.location.hostname + ':4000/' })

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
})

let basePath = process.env.PUBLIC_URL
basePath = basePath.length > 0 && basePath[basePath.count-1] === '/' ? basePath.substring(0, -1) : basePath

ReactDOM.render(
  <BrowserRouter basename={basePath}>
    <ApolloProvider client={client}>
      <Switch>
        <Route exact path="/" render={props => <App {...props} />} />
        <Route
          exact
          path="/:domain/:host"
          render={props => <App {...props} />}
        />
        <Route
          exact
          path="/:domain/:host/:category"
          render={props => <App {...props} />}
        />
        <Route
          exact
          path="/:domain/:host/:category/:from/:to"
          render={props => <App {...props} />}
        />
      </Switch>
    </ApolloProvider>
  </BrowserRouter>
  , document.getElementById('root')
)

registerServiceWorker()
