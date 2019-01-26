import React, { Component } from 'react'

import Drawer from '@material-ui/core/Drawer'
import ListSubheader from '@material-ui/core/ListSubheader'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import ShowChart from '@material-ui/icons/ShowChart'
import { withStyles } from '@material-ui/core/styles'
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router'

import Center from '../ui/Center'
import Category from './Category'

class Host extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedCategory: null
    }
  }

  componentWillReceiveProps (props) {
    if (props.host.name !== this.props.host.name || props.host.domain.name !== this.props.host.domain.name) {
      this.setState({ selectedCategory: null })
    }
  }

  handleCategorySelection (category) {
    this.setState({selectedCategory: category})
  }

  render () {
    const { classes } = this.props
    return (<div className={classes.root}>
        <Drawer
          variant='permanent'
          classes={{paper: classes.drawerPaper}}>
          <List
            component='nav'
            subheader={<ListSubheader component='div' className={classes.drawerTitle}>Categories</ListSubheader>}>
            {Object.values(this.props.host.categories).sort((a, b) => a.name.localeCompare(b.name)).map((category, index) =>
              <ListItem
                key={index}
                onClick={this.handleCategorySelection.bind(this, category)}
                className={`${this.props.match.params.category === category.name ? classes.selected : ''}`}
                component={Link}
                to={{ pathname: `/${this.props.host.domain.name}/${this.props.host.name}/${category.name}/${this.props.from.toISOString()}/${this.props.to.toISOString()}` }}
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
              from={this.props.from}
              to={this.props.to} />
          </main>)
          : (<Center>Welcome ! Please select a category from the list beside.</Center>)}
      </div>)

  }
}

const drawerWidth = 240
const styles = theme => ({
  root: {
    display: 'flex',
    position: 'relative',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
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
    padding: theme.spacing.unit * 3,
    maxWidth: '100%',
    flexShrink: 1,
    flexBasis: 0
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

export default withStyles(styles)(withRouter(Host))
