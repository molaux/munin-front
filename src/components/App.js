import strtotime from 'strtotime'

import React, { Component } from 'react'

import gql from 'graphql-tag'
import { graphql } from 'react-apollo'

import CssBaseline from '@material-ui/core/CssBaseline'
import 'typeface-roboto'
import Typography from '@material-ui/core/Typography'

import CircularProgress from '@material-ui/core/CircularProgress'
import Drawer from '@material-ui/core/Drawer'
import ListSubheader from '@material-ui/core/ListSubheader'
import List from '@material-ui/core/List'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Grid from '@material-ui/core/Grid'
import Divider from '@material-ui/core/Divider'
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import MenuIcon from '@material-ui/icons/Menu';
import TimerIcon from '@material-ui/icons/Timer';
import TimerOffIcon from '@material-ui/icons/TimerOff';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, DateTimePicker } from 'material-ui-pickers'
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import AccessTime from '@material-ui/icons/AccessTime'
import DateRange from '@material-ui/icons/DateRange'
import DateFnsUtils from '@date-io/date-fns'
import { subDays, addDays } from 'date-fns'

import './App.css'
import logo from './logo.svg'
import Host from './model/Host'
import DomainListItem from './ui/DomainListItem'
import NotificationsDialog from './ui/NotificationsDialog'
import Center from './ui/Center'

// import hideOnScroll from '../lib/hideOnScroll'

import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames'
import { withRouter } from 'react-router-dom'

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
  typography: {
    useNextVariants: true,
  },
});

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      domains: {},
      realtime: true,
      selectedHost: null,
      timeRange: {
        start: strtotime('1 days ago'),
        end: new Date()
      },
      mobileOpen: false
    }

    if (props.match.params.domain) {
      this.state.domains[props.match.params.domain] = {
        collapse: false
      }
    }

    if (props.match.params.host) {
      this.state.domains[props.match.params.domain].hosts = {
        [props.match.params.host]: {
          collapse: false
        }
      }
    }

    if (props.match.params.from && props.match.params.to) {
      this.state.timeRange = {
        start: new Date(props.match.params.from),
        end: new Date(props.match.params.to)
      }
    }

  }

  toggleDomainCollapse (domain) {
    this.setState(state => ({
      domains: Object.keys(state.domains)
        .reduce((o, domainName) => {
          o[domainName] = {
            ...state.domains[domainName],
            collapse: domainName === domain.name
              ? !state.domains[domainName].collapse
              : true
          }
          return o
        }, {} )
    }) )
  }

  toggleHostCollapse (domain, host) {
    this.setState(state => {
        state.domains[domain.name].hosts = Object.keys(state.domains[domain.name].hosts)
          .reduce((o, hostName) => {
            o[hostName] = {
              ...state.domains[domain.name].hosts[hostName],
              collapse: hostName === host.name
                ? !state.domains[domain.name].hosts[hostName].collapse
                : true
            }
            return o
          }, {} )
        return state
    } )
  }

  handleCheckRealtime (event) {
    this.setState(state => ({ realtime: !state.realtime }))
    if (this.state.realtime) {
      this.launchAutoRefresh()
    } else {
      this.stopAutoRefresh()
    }
  }

  launchAutoRefresh () {
    this.refreshTimerId = setInterval(
      this.updateTimerangeFromCurrent.bind(this),
      5 * 60 * 1000
    )
    this.updateTimerangeFromCurrent()

  }

  stopAutoRefresh () {
    clearInterval(this.refreshTimerId)
  }

  updateTimerangeFromCurrent () {
    let now = new Date()
    let newState = { timeRange: {
      start: subDays(now, 1),
      end: now
    } }

    this.setState(newState)
  }

  componentWillReceiveProps (props) {
    document.title = props.data.loading ? 'Munin, fetching...' : `Munin on ${props.data.hostname}`
    if (!props.data.loading) {
      let newState = {domains: {}}
      for (let domain of props.data.domains) {
        newState.domains[domain.name] = {
          ...domain,
          collapse: this.state.domains[domain.name] !== undefined ? this.state.domains[domain.name].collapse : true ,
          hosts: {},
        }

        for (let host of domain.hosts) {
          newState.domains[domain.name].hosts[host.name] = {
            collapse: this.state.domains[domain.name] !== undefined && this.state.domains[domain.name].hosts[host.name] !== undefined ? this.state.domains[domain.name].hosts[host.name].collapse : true ,
            categories: {},
            ...host
          }

          for (let probe of host.probes) {
            let category = 'Unknown'

            if (probe.infos.graph_category !== undefined && probe.infos.graph_category.value) {
              category = probe.infos.graph_category.value
              category = category.charAt(0).toUpperCase() + category.substr(1)
            }

            if (Object.keys(newState.domains[domain.name].hosts[host.name].categories).indexOf(category) < 0) {
              newState.domains[domain.name].hosts[host.name].categories[category] = { name: category, probes: [probe] }
            } else {
              newState.domains[domain.name].hosts[host.name].categories[category].probes.push(probe)
            }
          }
        }
      }

      this.setState(newState)
    }
  }

  handleDateChange (type, date) {
    let newState = { timeRange: this.state.timeRange }
    newState.timeRange[type] = date

    if (newState.timeRange.start.getTime() >= newState.timeRange.end.getTime()) {
      if (type === 'start') {
        newState.timeRange.end = addDays(newState.timeRange.start, 1)
      } else if (type === 'end') {
        newState.timeRange.start = subDays(newState.timeRange.end, 1)
      }
    }

    this.setState(newState)

    if (this.props.match.params.from && this.props.match.params.to) {
      this.props.history.push(`/${this.props.match.params.domain}/${this.props.match.params.host}/${this.props.match.params.category}/${newState.timeRange.start.toISOString()}/${newState.timeRange.end.toISOString()}`)
    }
  }

  // Reload periodically list of Domains / Hosts
  componentDidMount() {
    this.refetchTimerId = setInterval(
      () => this.props.data.refetch(),
      5 * 60 * 1000
    )
    if (this.state.realtime) {
      this.launchAutoRefresh()
    }
  }

  componentWillUnmount() {
    clearInterval(this.refetchTimerId)
    clearInterval(this.refreshTimerId)
  }

  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };


  render () {
    let { classes, theme } = this.props

    const drawer = isMobile => (
      <div>
        <div className={classes.toolbar + ' ' + classes.fixedHeightToolbar}>
          <img src={logo} alt='logo' />
        </div>
        <Divider />
        <List
          classes={{subheader: classes.drawerSubheader}}
          component='nav'
          subheader={<ListSubheader component='div'>Domains / hosts</ListSubheader>}>
          {this.state.domains && Object.values(this.state.domains)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((domain, index) => {
            return <DomainListItem
              key={index}
              domain={domain}
              toggleDomainCollapse={this.toggleDomainCollapse.bind(this, domain)}
              toggleHostCollapse={this.toggleHostCollapse.bind(this, domain)}
              onChoice={isMobile ? this.handleDrawerToggle : () => false}
              isMobile={isMobile}
            />
          })}
        </List>
      </div>
    );

    return (
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <div className={classes.root}>
          <CssBaseline />
          <AppBar
            position='absolute'
            className={classNames(classes.appBar)}
          >
            <MuiThemeProvider theme={darkTheme}>
              <Toolbar variant="dense" disableGutters={true}>
                <Grid container spacing={8}>
                  <Hidden mdUp >
                    <Grid item xs={2}>
                      <IconButton
                        color="inherit"
                        aria-label="Open drawer"
                        onClick={this.handleDrawerToggle}
                        className={classes.menuButton}
                      >
                        <MenuIcon />
                      </IconButton>
                    </Grid>
                  </Hidden>
                  <Hidden smDown >
                    <Grid item xs={10}>
                      <Typography variant='h6' color='inherit' noWrap>
                        { this.props.data.loading ? 'Munin-front is attempting to query graphql server...' : `Munin on ${this.props.data.hostname}` }
                      </Typography>
                    </Grid>
                  </Hidden>
                  <Hidden mdUp >
                    <Grid item xs={10} align='right'>
                      <NotificationsDialog
                        domains={this.state.domains}
                        dialogTheme={theme}
                        buttonTheme={darkTheme}
                        from={this.state.timeRange.start.toISOString()}
                        to={this.state.timeRange.end.toISOString()} />
                    </Grid>
                  </Hidden>
                  <Grid item xs={5} md={4}>
                    <DateTimePicker
                      classes={{ root: classes.datetimePicker}}
                      label="Start date / time"
                      disabled={this.state.realtime}
                      key="start"
                      value={this.state.timeRange.start}
                      disableFuture
                      autoOk
                      labelFunc={value => value ? value.toLocaleString() : ''}
                      ampm={false}
                      onChange={this.handleDateChange.bind(this, 'start')}
                      leftArrowIcon={<KeyboardArrowLeft />}
                      rightArrowIcon={<KeyboardArrowRight />}
                      dateRangeIcon={<DateRange />}
                      timeIcon={<AccessTime />}
                    />
                  </Grid>
                  <Grid item xs={5} md={4}>
                    <DateTimePicker
                      classes={{ root: classes.datetimePicker }}
                      label="End date / time"
                      disabled={this.state.realtime}
                      key="end"
                      value={this.state.timeRange.end}
                      disableFuture
                      autoOk
                      labelFunc={value => value ? value.toLocaleString() : ''}
                      ampm={false}
                      onChange={this.handleDateChange.bind(this, 'end')}
                      leftArrowIcon={<KeyboardArrowLeft />}
                      rightArrowIcon={<KeyboardArrowRight />}
                      dateRangeIcon={<DateRange />}
                      timeIcon={<AccessTime />}
                    />
                  </Grid>
                  <Grid item xs={2}  align='right'  >
                    <Hidden smDown implementation="css">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={this.state.realtime}
                            onChange={this.handleCheckRealtime.bind(this)}
                          />
                        }
                        label="Follow last 24h"
                      />
                    </Hidden>
                    <Hidden mdUp implementation="css">
                      <IconButton
                        onClick={this.handleCheckRealtime.bind(this)}>
                        {this.state.realtime
                          ? <TimerIcon />
                          : <TimerOffIcon />}
                      </IconButton>
                    </Hidden>
                  </Grid>
                  <Hidden smDown implementation="css">
                    <Grid item xs={2} >
                      <NotificationsDialog
                        domains={this.state.domains}
                        dialogTheme={theme}
                        buttonTheme={darkTheme}
                        from={this.state.timeRange.start.toISOString()}
                        to={this.state.timeRange.end.toISOString()} />
                    </Grid>
                  </Hidden>
                </Grid>
              </Toolbar>
            </MuiThemeProvider>
          </AppBar>

          <nav className={classes.drawer}>
            {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
            <Hidden mdUp implementation="css">
              <Drawer
                container={this.props.container}
                variant="temporary"
                anchor={theme.direction === 'rtl' ? 'right' : 'left'}
                open={this.state.mobileOpen}
                onClose={this.handleDrawerToggle}
                classes={{
                  paper: classes.drawerPaper,
                }}
              >
                {drawer(true)}
              </Drawer>
            </Hidden>
            <Hidden smDown implementation="css">
              <Drawer
                classes={{
                  paper: classes.drawerPaper,
                }}
                variant="permanent"
                open
              >
                {drawer(false)}
              </Drawer>
            </Hidden>
          </nav>
          <main className={classes.appContent}>
            <div className={classes.toolbar} />
            {this.props.data.loading
              ? <Center><CircularProgress /></Center>
              : (this.props.match.params.host
                ? <Host
                  host={this.state.domains[this.props.match.params.domain].hosts[this.props.match.params.host]}
                  from={this.state.timeRange.start} to={this.state.timeRange.end} />
                : <Center>Welcome ! Please select a host from the list beside.</Center>)
            }
          </main>
        </div>
      </MuiPickersUtilsProvider>
    )
  }
}

const ITEMS_QUERY = gql`
  query DomainsQuery {
    hostname
    domains {
      name
      hosts {
        name
        domain {
          name
        }
        probes {
          name
          infos
          targets {
            name
            infos
            state
          }
        }
      }
    }
  }
`

const drawerWidth = 240
const appBarHeight = 110
export default graphql(ITEMS_QUERY)(withStyles(theme => ({
  root: {
    display: 'flex',
    height: '100%',
    width: '100%',
  },
  appBar: {
    marginLeft: drawerWidth,
    flexGrow: 1,
    height: appBarHeight,
    padding: theme.spacing.unit * 2,
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
  drawer: {
    [theme.breakpoints.up('md')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerSubheader: {
    backgroundColor: theme.palette.background.default
  },
  appContent: {
    flexGrow: 1,
    minWidth: 0,
    flexShrink: 1,
    flexBasis:0,
    display: 'flex',
    paddingTop: appBarHeight,
    backgroundColor: theme.palette.background.default
  },
  menuButton: {
    marginRight: 20,
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  fixedHeightToolbar: {
    height: appBarHeight,
    padding: theme.spacing.unit,
    textAlign: 'center',
    '& img': {
      height: appBarHeight - 2 * theme.spacing.unit
    }
  },
  datetimePicker: {
    fontSize: '0.5em'
  },
  flex: {
    flex: 1,
  },
  //   helperText: {
  //     display: 'none'
  //   }
  // }
}), { withTheme: true })(withRouter(App)))
