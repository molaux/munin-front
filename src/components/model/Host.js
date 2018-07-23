import React, { Component } from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

import Drawer from 'material-ui/Drawer'
import ListSubheader from 'material-ui/List/ListSubheader'
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import ShowChart from 'material-ui-icons/ShowChart'
import { CircularProgress } from 'material-ui/Progress'
import { withStyles } from 'material-ui/styles'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'

import Center from '../ui/Center'
import Category from './Category'

class Host extends Component {
  constructor (props) {
    super(props)
    this.state = {
      categories: {},
      selectedCategory: null
    }
  }

  componentWillReceiveProps (props) {
    if (props.host !== this.props.host || props.domain !== this.props.domain) {
      this.setState({ selectedCategory: null })
    }

    if (!props.data.loading) {
      let newState = { categories: {}, selectedCategory: this.state.selectedCategory }
      for (let probe of props.data.domain.host.probes) {
        let category = 'Unknown'

        if (probe.infos.graph_category !== undefined && probe.infos.graph_category.value) {
          category = probe.infos.graph_category.value
          category = category.charAt(0).toUpperCase() + category.substr(1)
        }

        if (Object.keys(newState.categories).indexOf(category) < 0) {
          newState.categories[category] = { name: category, probes: [probe] }
        } else {
          newState.categories[category].probes.push(probe)
        }
      }

      this.setState(newState)
    }
  }

  handleCategorySelection (category) {
    this.setState({selectedCategory: category})
  }

  render () {
    const { classes, host, domain } = this.props
    return (this.props.data.loading
      ? (<div className={classes.root}>
        <Center>
          <CircularProgress />
        </Center>
      </div>)
      : (<div className={classes.root}>
        <Drawer
          variant='permanent'
          classes={{paper: classes.drawerPaper}}>
          <List
            component='nav'
            subheader={<ListSubheader component='div' className={classes.drawerTitle}>Categories</ListSubheader>}>
            {this.state.categories && Object.values(this.state.categories).slice().sort((a, b) => a.name.localeCompare(b.name)).map((category, index) =>
              <ListItem
                key={index}
                onClick={this.handleCategorySelection.bind(this, category)}
                className={`${this.props.match.params.category === category.name ? classes.selected : ''}`}
                component={Link}
                to={{ pathname: `/${domain}/${host}/${category.name}/${this.props.from.toISOString()}/${this.props.to.toISOString()}` }}
                button>
                <ListItemIcon className={classes.icon}>
                  <ShowChart />
                </ListItemIcon>
                <ListItemText inset classes={{primary: classes.primary}} primary={category.name} />
              </ListItem>
            )}
          </List>
        </Drawer>
        {this.props.match.params.category
          ? (<main className={classes.appContent}>
            <Category
              category={this.props.match.params.category}
              host={this.props.host}
              domain={this.props.domain}
              from={this.props.from}
              to={this.props.to} />
          </main>)
          : (<Center>Welcome ! Please select a category from the list beside.</Center>)}
      </div>)
    )
  }
}

const PROBES_QUERY = gql`
query HostStats($domainName: String!, $hostName: String!){
  domain(name: $domainName) {
      name
      host(name: $hostName) {
        name
        domain {
            name
        }
        probes {
          infos
        }
      }
  }
}
`

const drawerWidth = 240
const styles = theme => ({
  root: {
    display: 'flex',
    position: 'relative',
    flexGrow: 1
  },
  drawerPaper: {
    position: 'relative',
    width: drawerWidth,
    maxHeight: '100%'
  },
  drawerTitle: {
    'background-color': theme.palette.common.white
  },
  appContent: {
    flexGrow: 1,
    overflow: 'auto',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing.unit * 3
  },
  toolbar: theme.mixins.toolbar,
  selected: {
    '&, &:hover': {
      backgroundColor: theme.palette.primary.main,
      '& $primary, & $icon': {
        color: theme.palette.common.white
      }
    }
  },
  icon: {},
  primary: {}
})

export default graphql(PROBES_QUERY, {
  options: ({ host, domain }) => ({ variables: {
    hostName: host,
    domainName: domain
  } })
})(withStyles(styles)(withRouter(Host)))
