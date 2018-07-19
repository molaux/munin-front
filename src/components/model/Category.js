import React, { Component } from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

import Typography from 'material-ui/Typography'
import { CircularProgress } from 'material-ui/Progress'
import Paper from 'material-ui/Paper'
import { withStyles } from 'material-ui/styles'
import Center from '../ui/Center'
import MuninLineChart from '../ui/MuninLineChart'
import InfoDialog from '../ui/InfoDialog'
import Toolbar from 'material-ui/Toolbar'

class Category extends Component {
  render () {
    const { classes } = this.props
    if (this.props.data.loading) {
      return <div className={classes.root}><Center><CircularProgress /></Center></div>
    } else {
      return this.props.data.domain.host.probesByCategory.map((probe, index) =>
        <Paper key={index} elevation={4} className={classes.paper} >
          <Typography variant='headline' component='h3'>{probe.infos.graph_title.value}</Typography>
          { probe.infos.graph_info ? <Typography component='p'>{probe.infos.graph_info.value}</Typography> : '' }
          <MuninLineChart className={classes.graph} probe={probe} />
          <Toolbar>
            {probe.targets.filter(target => target.infos.info !== undefined).length > 0
              ? <InfoDialog title='Definitions' primary='Help'>
                {probe.targets.map((target, index) =>
                  (target.infos.info
                    ? <div key={index} className={classes.tip} >
                      <Typography variant='subheading' component='h5'>{target.infos.label ? target.infos.label.value : target.name}</Typography>
                      <Typography variant='caption' component='p'>{target.infos.info.value}</Typography>
                    </div>
                    : '')
                )}
              </InfoDialog>
              : ''
            }
            <InfoDialog title='Debug' primary='Debug infos'>
              <pre>{JSON.stringify(probe.infos, null, 2) }</pre>
              { probe.targets.map(({infos, name}, index) => <pre key={name}>{JSON.stringify(infos, null, 2) }</pre>)}
            </InfoDialog>
          </Toolbar>
        </Paper>)
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
                serie(from: $from, to: $to) {
                  values {
                    time,
                    values
                  }
                }
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
  },
  paper: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: theme.spacing.unit * 3
  }),
  tip: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2
  },
  graph: {
    marginTop: theme.spacing.unit * 4,
    marginBottom: theme.spacing.unit * 4
  }
})

export default graphql(STATS_QUERY, {
  options: ({ domain, host, to, from, category }) => ({ variables: {
    hostName: host,
    domainName: domain,
    category: category,
    from: from.toISOString(),
    to: to.toISOString()
  } })
})(withStyles(styles)(Category))
