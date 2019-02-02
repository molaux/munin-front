import React, { Component } from 'react'

import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'
import MuninLineChart from '../ui/MuninLineChart'
import InfoDialog from '../ui/InfoDialog'
import Toolbar from '@material-ui/core/Toolbar'

class Probe extends Component {

  render () {
    const { probe, classes } = this.props

    return <Paper id={probe.name} elevation={4} className={classes.paper}>
        <Typography variant='h5' component='h4'>{probe.infos.graph_title.value}</Typography>
        { probe.infos.graph_info ? <Typography component='p'>{probe.infos.graph_info.value}</Typography> : '' }
        <MuninLineChart probe={probe} />

        <Toolbar>
          {probe.targets.filter(target => target.infos.info !== undefined).length > 0
            ? <InfoDialog title='Definitions' primary='Help'>
              {probe.targets.map((target, index) =>
                (target.infos.info
                  ? <div key={index} className={classes.tip} >
                    <Typography variant='h5' component='h5'>{target.infos.label ? target.infos.label.value : target.name}</Typography>
                    <Typography variant='caption' component='p'>{target.infos.info.value}</Typography>
                  </div>
                  : '')
              )}
            </InfoDialog>
            : ''
          }
          <InfoDialog title='Debug' primary='Debug infos'>
            <Typography variant="h5">{probe.name}</Typography>
            <pre>{JSON.stringify(probe.infos, null, 2) }</pre>
            { probe.targets.map(({infos, name}, index) => <div key={name}>
                <Typography variant="h6">{name}</Typography>
                <pre>{JSON.stringify(infos, null, 2) }</pre>
              </div>)}
          </InfoDialog>
        </Toolbar>
      </Paper>
  }
}

const styles = theme => ({
  paper: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: theme.spacing.unit * 3
  }),
  tip: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2
  }
})

export default withStyles(styles)(Probe)
