import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import NotificationImportant from '@material-ui/icons/NotificationImportant';
import Notifications from '@material-ui/icons/Notifications';
import NotificationsNone from '@material-ui/icons/NotificationsNone';
import Badge from '@material-ui/core/Badge';
import { HashLink as Link } from 'react-router-hash-link';
import { withRouter } from 'react-router'

import { MuiThemeProvider } from '@material-ui/core/styles';

const styles = theme => ({
  margin: {
    margin: theme.spacing.unit * 2,
  },
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  level: {
    ...theme.typography.button,
    backgroundColor: theme.palette.common.white,
    padding: theme.spacing.unit,
    borderRadius: '0.5em',
    '&.critical': {
      backgroundColor: 'red'
    },
    '&.warning': {
      backgroundColor: 'orange'
    },
    '&.unknown': {
      backgroundColor: 'grey'
    }

  }
});

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

class NotificationsDialog extends React.Component {
  state = {
    open: false,
    notifications: [],
    maxLevel: 'ok',
    notificationsEnabled: window.Notification && Notification.permission === "granted"
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleClickGetNotified = () => {
    Notification.requestPermission(status => {
      if (Notification.permission !== status) {
        Notification.permission = status;
      }
      this.setState({notificationsEnabled: status === 'granted'})
    })
  }

  maxNotificationLevel(level1, level2) {
    if (level1 === 'critical' || level2 === 'critical') {
      return 'critical'
    }
    if (level1 === 'warning' || level2 === 'warning') {
      return 'warning'
    }
    if (level1 === 'unknown' || level2 === 'unknown') {
      return 'unknown'
    }
    if (level1 === 'ok' || level2 === 'ok') {
      return 'ok'
    }
    return 'unknown'
  }

  maxDomainsNotificationLevel(domains) {
    return Object.values(domains).reduce((maxLevel, domain) => {
      let domainMaxLevel = Object.values(domain.hosts).reduce((maxLevel, host) => {
        if (host.categories !== undefined) {
          let hostMaxLevel = Object.values(host.categories).reduce((maxLevel, category) => {
            let categoryMaxLevel = category.probes.reduce((maxLevel, probe) => {
              let probeMaxLevel = probe.targets.reduce((maxLevel, target) => {
                return this.maxNotificationLevel(maxLevel, target.state)
              }, 'ok')
              return this.maxNotificationLevel(maxLevel, probeMaxLevel)
            }, 'ok')
            return this.maxNotificationLevel(maxLevel, categoryMaxLevel)
          }, 'ok')
          return this.maxNotificationLevel(maxLevel, hostMaxLevel)
        } else {
          return 'ok'
        }
      }, 'ok')
      return this.maxNotificationLevel(maxLevel, domainMaxLevel)
    }, 'ok')
  }

  getNotifications(domains) {
    return Object.values(domains).map(domain =>
      Object.values(domain.hosts).map(host => {
        if (host.categories !== undefined) {
          return Object.values(host.categories).map((category, categoryName) =>
            category.probes.map(probe =>
              probe.targets.map(target => ({
                domain: domain.name,
                host: host.name,
                category: category.name,
                probe: probe.infos.graph_title.value,
                probeId: probe.name,
                target: (target.infos.label ? target.infos.label.value : target.name),
                state: target.state
              }))
            )
          )
        } else {
          return []
        }
      })).flat(4).filter(notification => notification.state !== 'ok')
  }

  componentWillReceiveProps (props) {
    this.setState({
      maxLevel: this.maxDomainsNotificationLevel(props.domains),
      notifications: this.getNotifications(props.domains)
    })
  }

  render() {
    const { classes, domains, dialogTheme, buttonTheme, from, to } = this.props;
    const NotificationIcon = props => {
      switch (props.level) {
        case 'critical':
          return <NotificationImportant color="error"/>
        case 'warning':
          return <Notifications color="secondary"/>
        default:
        case 'uknown':
          return <Notifications color={props.normalColor} />
        case 'ok':
          return <NotificationsNone color={props.normalColor} />
      }
    }
    return (
      <div>
        <MuiThemeProvider theme={buttonTheme}>
          <Button onClick={this.handleClickOpen}>
            <Badge className={classes.margin} badgeContent={this.state.notifications.length}>
              <NotificationIcon level={this.state.maxLevel} normalColor="inherit"/>
            </Badge>
          </Button>
        </MuiThemeProvider>
        <MuiThemeProvider theme={dialogTheme}>
          <Dialog
            fullScreen
            open={this.state.open}
            onClose={this.handleClose}
            TransitionComponent={Transition}
          >
            <AppBar className={classes.appBar}>
              <Toolbar>
                <IconButton color="inherit" onClick={this.handleClose} aria-label="Close">
                  <CloseIcon />
                </IconButton>
                <Typography variant="h6" color="inherit" className={classes.flex}>
                  Current Notifications
                </Typography>
                { window.Notification && !this.state.notificationsEnabled
                  ? <Button onClick={this.handleClickGetNotified.bind(this)}>
                      Get notified
                    </Button>
                  : '' }
              </Toolbar>
            </AppBar>
            <List>
              {this.state.notifications.map(notification =>
              [<ListItem key="1"
                button
                onClick={this.handleClose}
                component={Link}
                to={{
                  pathname: `/${notification.domain}/${notification.host}/${notification.category}/${from}/${to}`,
                  hash: notification.probeId
                }}

                >
                <NotificationIcon level={notification.state} normalColor="primary"/>
                <ListItemText key="2"
                  primary={`${notification.domain} > ${notification.host}`}
                  secondary={`${notification.category} / ${notification.probe} / ${notification.target}`} />
                <div className={`${classes.level} ${notification.state}`}>{notification.state}</div>
              </ListItem>,
              <Divider key="3" />]
            )}
            </List>
          </Dialog>
        </MuiThemeProvider>
      </div>
    );
  }
}

NotificationsDialog.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(withRouter(NotificationsDialog));
