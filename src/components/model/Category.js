import React, { Component } from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

import CircularProgress from '@material-ui/core/CircularProgress'
import { withStyles } from '@material-ui/core/styles'
import Center from '../ui/Center'
import Probe from './Probe'

class Category extends Component {
  constructor (props) {
    super(props)

    this.state = {
      probes: props.data.loading ? [] : this.sortProbes(props.data),
      loading: props.data.loading,
      category: props.category
    }
  }

  sortProbes (data) {
    return data.domain.host.probesByCategory.slice().sort((a, b) =>   a.infos.graph_title.value.localeCompare(b.infos.graph_title.value))
  }

  componentWillReceiveProps (props) {
    if (! props.data.loading || this.state.category !== props.category) {
      this.setState({
        probes:   props.data.loading ? [] : this.sortProbes(props.data),
        loading: props.data.loading,
        category: props.category
      })
    }
  }

  render () {
    const { classes } = this.props
    if (this.state.loading) {
      return <div className={classes.root}><Center><CircularProgress /></Center></div>
    } else {
      return this.state.probes.map((probe, index) =>
        <Probe key={`${this.props.domain}_${this.props.host}_${this.props.category}_${index}`} probe={probe} />
      )
    }
  }
}

const STATS_QUERY = gql`
    query HostStats($domainName: String!, $hostName: String!, $from: String!, $to: String!,  $category: String!){
      domain(name: $domainName) {
        name
        host(name: $hostName) {
          name
          probesByCategory(category: $category) {
            name
            infos
            targets {
              name
              infos
              serie(from: $from, to: $to)
            }
          }
        }
      }
    }
`

const styles = theme => ({
  root: {
    display: 'flex',
    position: 'relative',
    height: '100%'
  }
})

export default graphql(STATS_QUERY, {
  options: ({ host, to, from, category }) => ({ variables: {
    hostName: host.name,
    domainName: host.domain.name,
    category: category,
    from: from.toISOString(),
    to: to.toISOString()
  } })
})(withStyles(styles)(Category))
