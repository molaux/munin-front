import React, { Component } from 'react'
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import Collapse from 'material-ui/transitions/Collapse'
import ExpandLess from 'material-ui-icons/ExpandLess'
import ExpandMore from 'material-ui-icons/ExpandMore'
import Computer from 'material-ui-icons/Computer'
import Domain from 'material-ui-icons/Domain'
import { withStyles } from 'material-ui/styles'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'

class DomainListItem extends Component {
  render () {
    const { domain, classes } = this.props

    return (
      <div>
        <ListItem button onClick={this.props.toggleCollapse}>
          <ListItemIcon>
            <Domain />
          </ListItemIcon>
          <ListItemText inset primary={domain.name} />
          {this.props.collapse ? <ExpandMore /> : <ExpandLess />}
        </ListItem>
        <Collapse in={!this.props.collapse} timeout='auto' unmountOnExit>
          <List component='div' disablePadding>
            { domain.hosts && domain.hosts.map((host, index) =>
              <ListItem button
                className={`${this.props.match.params.host === host.name && this.props.match.params.domain === domain.name ? classes.selected : ''} ${classes.nested}`}
                key={index}
                // onClick={this.props.handleSelection.bind(null, host)}
                component={Link}
                to={{ pathname: `/${domain.name}/${host.name}` }}
              >
                <ListItemIcon className={classes.icon}>
                  <Computer />
                </ListItemIcon>
                <ListItemText classes={{ primary: classes.primary }} inset primary={host.name} />
              </ListItem>
            )}
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
    paddingLeft: theme.spacing.unit * 4
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
