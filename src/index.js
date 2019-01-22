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
//const httpLink = new HttpLink({ uri: '//node:4000/' })

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
})

// console.log(GRAPHQL_PORT);

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <Switch>
        <Route exact path='/' render={props => <App {...props} />} />
        <Route
          exact
          path='/:domain/:host'
          render={props => <App {...props} />}
        />
        <Route
          exact
          path='/:domain/:host/:category'
          render={props => <App {...props} />}
        />
        <Route
          exact
          path='/:domain/:host/:category/:from/:to'
          render={props => <App {...props} />}
        />
      </Switch>
    </ApolloProvider>
  </BrowserRouter>
  , document.getElementById('root')
)

// ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker()
