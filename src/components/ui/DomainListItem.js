import React, { Component } from 'react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Collapse from '@material-ui/core/Collapse'
import Hidden from '@material-ui/core/Hidden';

import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import ShowChart from '@material-ui/icons/ShowChart'
import Computer from '@material-ui/icons/Computer'
import Domain from '@material-ui/icons/Domain'

import { withStyles } from '@material-ui/core/styles'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'

class DomainListItem extends Component {
  render () {
    const { domain, classes } = this.props
    return (
      <div key={`domain-${domain.name}`}>
        <ListItem key={`domain-${domain.name}-li`} button onClick={this.props.toggleDomainCollapse}>
          <ListItemIcon>
            <Domain />
          </ListItemIcon>
          <ListItemText primary={domain.name} />
          {domain.collapse ? <ExpandMore /> : <ExpandLess />}
        </ListItem>
        <Collapse key={`domain-${domain.name}-collapse`} in={!domain.collapse} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            { domain.hosts && Object.values(domain.hosts).sort((a, b) => a.name.localeCompare(b.name)).map((host, index) => [
              <ListItem button
                className={`${this.props.match.params.host === host.name && this.props.match.params.domain === domain.name ? classes.selected : ''} ${classes.nested}`}
                key={`host-${index}`}
                onClick={!this.props.isMobile ? this.props.onChoice.bind(null, host) : this.props.toggleHostCollapse.bind(null, host) }
                component={this.props.isMobile ? 'div' : Link}
                to={!this.props.isMobile ? { pathname: `/${domain.name}/${host.name}` } : null}
              >
                <ListItemIcon className={classes.icon}>
                  <Computer />
                </ListItemIcon>
                <ListItemText classes={{ primary: classes.primary }} primary={host.name} />
                <Hidden mdUp implementation="css">
                  {host.collapse ? <ExpandMore /> : <ExpandLess />}
                </Hidden>
              </ListItem>,
              <Collapse key={`host-${index}-collapse`} in={this.props.isMobile && !host.collapse} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  { host.categories && Object.values(host.categories).sort((a, b) => a.name.localeCompare(b.name)).map((category, index) => <ListItem button
                    className={`${this.props.match.params.category === category.name && this.props.match.params.host === host.name && this.props.match.params.domain === domain.name ? classes.selected : ''} ${classes.nested2}`}
                    key={index}
                    onClick={this.props.onChoice.bind(null, host)}
                    component={Link}
                    to={{ pathname: `/${domain.name}/${host.name}/${category.name}` }}
                  >
                    <ListItemIcon className={classes.icon}>
                      <ShowChart />
                    </ListItemIcon>
                    <ListItemText classes={{ primary: classes.primary }} primary={category.name} />
                  </ListItem>) }
                </List>
              </Collapse>
            ]) }
          </List>
        </Collapse>
      </div>
    )
  }
}

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  nested: {
    paddingLeft: theme.spacing(3)
  },
  nested2: {
    paddingLeft: theme.spacing(4)
  },
  selected: {
    '&, &:hover': {
      backgroundColor: theme.palette.primary.main,
      '& $primary, & $icon': {
        color: theme.palette.common.white
      }
    }
  },

  primary: {},
  icon: {}
})

export default withRouter(withStyles(styles)(DomainListItem))
