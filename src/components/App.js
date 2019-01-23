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

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider, DateTimePicker } from 'material-ui-pickers'
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import AccessTime from '@material-ui/icons/AccessTime'
import DateRange from '@material-ui/icons/DateRange'
import DateFnsUtils from 'material-ui-pickers/utils/date-fns-utils'
import { subDays, addDays } from 'date-fns'

import './App.css'
import logo from './logo.svg'
import Host from './model/Host'
import DomainListItem from './ui/DomainListItem'
import Center from './ui/Center'

import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames'
import { withRouter } from 'react-router-dom'

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
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
      }
    }

    if (props.match.params.domain) {
      this.state.domains[props.match.params.domain] = { collapse: false }
    }

    if (props.match.params.from && props.match.params.to) {
      this.state.timeRange = {
        start: new Date(props.match.params.from),
        end: new Date(props.match.params.to)
      }
    }

  }

  toggleDomainCollapse (domain) {
    let state = { domains: {} }
    for (let d in this.state.domains) {
      if (d === domain) {
        state.domains[d] = { collapse: !this.state.domains[d].collapse }
      } else {
        state.domains[d] = { collapse: true }
      }
    }

    this.setState(state)
  }

  handleCheckRealtime (event) {
    this.setState({ realtime: event.target.checked })
    if (event.target.checked) {
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
        newState.domains[domain.name] = { collapse: this.state.domains[domain.name] !== undefined ? this.state.domains[domain.name].collapse : true }
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

  render () {
    let { classes } = this.props
    return (
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <div className={classes.root}>
          <CssBaseline />
          <AppBar
            position='absolute'
            className={classNames(classes.appBar)}
          >
            <MuiThemeProvider theme={darkTheme}>
              <Toolbar>
                <Grid container spacing={8}>
                  <Grid item xs={12}>
                    <Typography variant='h6' color='inherit' noWrap>
                      { this.props.data.loading ? 'Munin-front is attempting to query graphql server...' : `Munin on ${this.props.data.hostname}` }
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <DateTimePicker
                      helperText="Start date / time"
                      disabled={this.state.realtime}
                      key={this.state.timeRange.start.getTime()}
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
                  <Grid item xs={4}>
                    <DateTimePicker
                      helperText="End date / time"
                      disabled={this.state.realtime}
                      key={this.state.timeRange.end.getTime()}
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
                  <Grid item xs={4} >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={this.state.realtime}
                          onChange={this.handleCheckRealtime.bind(this)}
                        />
                      }
                      label="last 24h, sliding realtime"
                    />
                  </Grid>
                </Grid>
              </Toolbar>
            </MuiThemeProvider>
          </AppBar>
          <Drawer
            variant='permanent'
            classes={{ paper: this.props.classes.drawerPaper }}>
            <div className={classes.toolbar + ' ' + classes.fixedHeightToolbar}>
              <img src={logo} alt='logo' />
            </div>
            <Divider />
            <List
              component='nav'
              subheader={<ListSubheader component='div'>Domains / hosts</ListSubheader>}>
              {this.props.data.domains && this.props.data.domains.slice().sort((a, b) => a.name.localeCompare(b.name)).map((domain, index) => {
                return <DomainListItem
                  key={index}
                  domain={domain}
                  toggleCollapse={this.toggleDomainCollapse.bind(this, domain.name)}
                  collapse={this.state.domains[domain.name].collapse}
                />
              })}
            </List>
          </Drawer>
          <main className={classes.appContent}>
            <div className={classes.toolbar} />
            {this.props.data.loading
              ? <Center><CircularProgress /></Center>
              : (this.props.match.params.host
                ? <Host domain={this.props.match.params.domain} host={this.props.match.params.host} from={this.state.timeRange.start} to={this.state.timeRange.end} />
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
      }
    }
  }
`

const drawerWidth = 240
const appBarHeight = 110
export default graphql(ITEMS_QUERY)(withStyles(theme => ({
  root: {
    display: 'flex',
    height: '100%'
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    flexGrow: 1,
    height: appBarHeight,
    padding: theme.spacing.unit * 2
  },
  drawerPaper: {
    position: 'relative',
    width: drawerWidth
  },
  appContent: {
    flexGrow: 1,
    display: 'flex',
    paddingTop: appBarHeight,
    backgroundColor: theme.palette.background.default
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

}), { withTheme: true })(withRouter(App)))
