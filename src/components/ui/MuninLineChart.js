import React, { Component } from 'react'
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Area, Line, ReferenceLine } from 'recharts'
import randomcolor from 'randomcolor'
import Color from 'color'
import { withStyles } from '@material-ui/core/styles'

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

class MuninLineChart extends Component {
  constructor (props) {
    super(props)
    this.state = { colors: [], stacks: {}, data: {}, animated: true }
    this.state = {
      colors: this.generateMissingColors(props),
      probe: { ...props.probe,
        targets: props.probe.targets.map(target => ({
          stats: this.getStats(target),
          visible: true,
          ...target
        })),
        data: this.handleData(props.probe),
      },
      animated: true
    }
    this.state.stacks = this.sortTargets(this.state.probe)
  }

  toggleTargetVisibility(target) {
      target.visible = !target.visible
      this.setState({ animated: false, probe: this.state.probe })
  }

  getStats(target) {
    let data = target.serie.filter(timedValue => timedValue.AVERAGE !== undefined && timedValue.AVERAGE !== null)
    return data.reduce((stats, timedValue) => {
      // MIN
      let key = timedValue.MIN !== undefined ? 'MIN' : 'AVERAGE'

      if (timedValue[key] !== undefined && timedValue[key] !== null && (stats.MIN === null || stats.MIN > timedValue[key])) {
        stats.MIN = timedValue[key]
      }

      // MAX
      key = timedValue.MAX !== undefined ? 'MAX' : 'AVERAGE'
      if (timedValue[key] !== undefined && timedValue[key] !== null && (stats.MAX === null || stats.MAX < timedValue[key])) {
        stats.MAX = timedValue[key]
      }

      // AVERAGE
      stats.count ++
      stats.AVERAGE = stats.AVERAGE === null
        ? timedValue.AVERAGE
        : stats.AVERAGE * (stats.count - 1) / stats.count + timedValue.AVERAGE / stats.count

      if (timedValue.AVERAGE !== undefined && timedValue.AVERAGE !== null) {
        stats.current = timedValue.AVERAGE
      }

      return stats
    }, { MIN: null, MAX: null, AVERAGE:null, current: null, count: 0 })
  }

  getColor (target) {
    if (target.infos.negative) {
      // Search for refered one
      let correspondances = this.state.probe.targets.filter(t => t.name === target.infos.negative.value)
      if (correspondances.length === 1) {
        target = correspondances[0]
      }
    }

    return this.state.colors[this.state.probe.targets.indexOf(target)]
  }

  hasNegative (target) {
    return this.props.probe.targets.filter(t => t.infos.negative && target.name === t.infos.negative.value).length > 0
  }

  handleData(probe) {

    let data = {}
    for (let target of probe.targets) {
      let dataKey = target.name
      if (target.infos.negative) {
        dataKey = target.infos.negative.value
      }

      for (let timedValue of target.serie) {
        let values = this.getValues(target, timedValue)
        if (data[timedValue.time] !== undefined) {
          if (data[timedValue.time][dataKey] === undefined) {
            if (values.AVERAGE !== null) {
              data[timedValue.time][dataKey] = values.AVERAGE
            }
          } else {
            data[timedValue.time][dataKey] = data[timedValue.time][dataKey] < values.AVERAGE
              ? [ data[timedValue.time][dataKey], values.AVERAGE ]
              : [ values.AVERAGE, data[timedValue.time][dataKey] ]
          }
        } else {

          data[timedValue.time] = {
            time: (new Date(timedValue.time)).getTime() / 1000,
            [dataKey]: values.AVERAGE
          }
        }
      }
    }

    return data
  }

  componentWillReceiveProps (props) {
    let knownTarget
    let probe = { ...props.probe,
      targets: props.probe.targets.map(target => ({
        stats: this.getStats(target),
        visible: (knownTarget = this.state.probe.targets.filter(knownTarget => knownTarget.name === target.name)).length > 0
          ? knownTarget[0].visible
          : true,
        ...target,
      })),
      data: this.handleData(props.probe) }

    if (this.state.probe.targets.length !== probe.targets.length) {
      this.setState({
        colors: this.generateMissingColors(props),
        stacks: this.sortTargets(probe)
      })
    }

    this.setState({
      animated: false,
      probe: probe,
      stacks: this.sortTargets(probe)
    })

  }

  sortTargets (probe) {
    let stacks = {}
    let currentStack = null
    let orderedTargets = probe.infos.graph_order
      ? probe.infos.graph_order.value.split(' ')
      : probe.targets.map(target => target.name)
    for (let t of orderedTargets) {
      // retrieve target
      let targets = probe.targets.filter(target => target.name === t)
      if (targets.length === 1) {
        let target = targets[0]
        if (target.infos.draw && (target.infos.draw.value === 'AREASTACK' || target.infos.draw.value === 'STACK')) {
          if (currentStack === null) {
            // If it happens, create a new stack
            currentStack = target.name
            // create new stack
            stacks[currentStack] = [target]
          } else {
            // add this target to current stack
            stacks[currentStack].push(target)
          }
        } else {
          currentStack = target.name
          // create new stack
          stacks[currentStack] = [target]
        }
      } else {
        console.log(`Found ${targets.length} targets corresponding to ${t}`)
      }
    }

    return stacks
  }

  generateMissingColors (props) {
    return randomcolor({
      seed: props.probe.infos.graph_title.value,
      luminosity: 'dark',
      count: props.probe.targets.length
    })
  }

  getValues (target, timedValue) {
    return Object.keys(timedValue).reduce(
      (yielded, key) => {
        if (key === 'time') {
          yielded[key] = timedValue[key]
        } else {
          yielded[key] = timedValue[key] === null ? null : (this.hasNegative(target) ? -1 : 1) * timedValue[key]
        }
        return yielded
      },
      {})
  }

  selectLine (event) {
    let selectedLine = this.state.selectedLine === event.dataKey ? null : event.dataKey.trim()
    this.setState({selectedLine})
  }

  formatLabel (label) {
    return Array.isArray(label)
      ? `[${label.map(this.formatLabel).join(', ')}]`
      : new Intl.NumberFormat({ maximumSignificantDigits: 3 }).format(label)
  }

  render () {
    const getMonitoredValueLevel = (value, target) => {
        if (target.infos.critical !== undefined) {
          let [low, high] = target.infos.critical.value.split(':')
          if (value > parseFloat(high) || value < parseFloat(low)) {
            return 'critical'
          }
        }
        if (target.infos.warning !== undefined) {
          let [low, high] = target.infos.warning.value.split(':')
          if (value > parseFloat(high) || value < parseFloat(low)) {
            return 'warning'
          }
        }
        return 'normal'
    }
    const MonitoredValue = ({value, target}) => <span className={this.props.classes[`monitored-${getMonitoredValueLevel(value, target)}`]}>{value}</span>


    const NotAxisTickButLabel = props => {
      return (<g transform={'translate( ' + (props.x + props.dx) + ',' + (props.y + props.dy) + ' )'} >
        <text
          x={0} y={0} dy={10}
          fontFamily='Roboto'
          fontSize='10px'
          textAnchor='end'
          transform={'rotate(' + props.angle + ')'} >
          {props.tickFormatter ? props.tickFormatter(props.payload.value) : props.payload.value}
        </text>
      </g>)
    }

    let i = 0
    return <div>
        <ResponsiveContainer width="100%" maxWidth="100%" height={400}>
          <ComposedChart
            data={Object.values(this.state.probe.data)}
            margin={{top: 20, right: 20, left: 30, bottom: 70}}
            style={{position: 'relative'}}
            className={this.props.classes.graph}
            >
            <CartesianGrid stroke='#ccc' />
            <XAxis
              dataKey='time'
              tick={<NotAxisTickButLabel
                angle={-45}
                dx={-10}
                dy={0}
                tickFormatter={time => (new Date(time * 1000)).toLocaleString()}
              />}
            />
            <YAxis
              label={{
                value: this.state.probe.infos.graph_vlabel ? this.state.probe.infos.graph_vlabel.value : '',
                angle: -90,
                fontSize: 10,
                position: 'inside',
                dx: -50
              }}
              tick={<NotAxisTickButLabel
                dx={-5}
                dy={-7}
                tickFormatter={number => new Intl.NumberFormat({ maximumSignificantDigits: 3 }).format(number)}
                angle={0} />}
            />
            {Object.keys(this.state.stacks).map((stack, index1) =>
              this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.critical !== undefined && target.visible).map((target, index2) =>  <ReferenceLine y={target.infos.critical.value.split(':')[1]} stroke="#faa" strokeDasharray="6 6" />
            ))}
            {Object.keys(this.state.stacks).map((stack, index1) =>
              this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.critical !== undefined && target.visible).map((target, index2) => <ReferenceLine y={target.infos.critical.value.split(':')[0]} stroke="lightblue" strokeDasharray="6 6" />
            ))}
            {Object.keys(this.state.stacks).map((stack, index1) =>
              this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.warning !== undefined && target.visible).map((target, index2) =>  <ReferenceLine y={target.infos.warning.value.split(':')[1]} stroke="#faa" strokeDasharray="3 3" />
            ))}
            {Object.keys(this.state.stacks).map((stack, index1) =>
              this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.warning !== undefined && target.visible).map((target, index2) => <ReferenceLine y={target.infos.warning.value.split(':')[0]} stroke="lightblue" strokeDasharray="3 3" />
            ))}
            <Tooltip
              wrapperStyle={{ fontSize: 10 }}
              formatter={this.formatLabel.bind(this)}
              labelFormatter={time => (new Date(time * 1000)).toLocaleString()} />

            {Object.keys(this.state.stacks).map((stack, index1) =>
              this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.visible).map((target, index2) => {
                let SerieComponent = (this.hasNegative(target) || target.infos.negative) || (target.infos.draw && (target.infos.draw.value === 'AREA' || target.infos.draw.value === 'AREASTACK' || target.infos.draw.value === 'STACK'))
                  ? Area
                  : Line
                return <SerieComponent
                  type='linear'
                  key={i++}
                  connectNulls={false}
                  isAnimationActive={this.state.animated}
                  dataKey={target.name}
                  stroke={this.getColor(target)}
                  stackId={this.hasNegative(target) ? null : stack}
                  fill={Color(this.getColor(target)).alpha(0.7).lighten(0.1).string()}
                  dot={false}
                  name={target.infos.label ? target.infos.label.value : target.name}
                />
              })
            )}
          </ComposedChart>
        </ResponsiveContainer>
        <Table className={this.props.classes.legendTable} padding="dense" >
          <TableHead>
            <TableRow>
              <TableCell>Target</TableCell>
              <TableCell align="right">Currrent value</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Average</TableCell>
              <TableCell align="right">Max</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{
            this.state.probe.targets.filter(target => target.infos.negative === undefined).map((target, index2) => (
              <TableRow key={index2}>
                <TableCell component="th" scope="row">
                  <span onClick={this.toggleTargetVisibility.bind(this, target)} className={this.props.classes.legendIcon+(!target.visible?' '+this.props.classes.legendIconHidden:'')} style={{backgroundColor: this.getColor(target)}} />
                  {target.infos.label ? target.infos.label.value : target.name}
                </TableCell>
                <TableCell align="right">
                  <MonitoredValue
                    target= {target}
                    value={Number.parseFloat(target.stats.current).toFixed(2)}/>
                </TableCell>
                <TableCell align="right">
                  <MonitoredValue
                    target= {target}
                    value={Number.parseFloat(target.stats.MIN).toFixed(2)}/>
                </TableCell>
                <TableCell align="right">
                  <MonitoredValue
                    target= {target}
                    value={Number.parseFloat(target.stats.AVERAGE).toFixed(2)}/>
                </TableCell>
                <TableCell align="right">
                  <MonitoredValue
                    target= {target}
                    value={Number.parseFloat(target.stats.MAX).toFixed(2)}/>
                </TableCell>
              </TableRow>
            ))
          }
          </TableBody>
        </Table>
      </div>
  }
}
const styles = theme => ({
  graph: {
    marginTop: theme.spacing.unit * 4,
    marginBottom: theme.spacing.unit * 4,
    '& .recharts-surface' : {
      // height: '500px'
    },
    '& .recharts-legend-wrapper' : {
    }
  },
  legendTable: {
    maxWidth: '100%',
    position: 'relative'

  },
  legendIcon: {
    display: 'inline-block',
    cursor: 'pointer',
    marginRight: '0.5em',
    marginBottom: '-0.35em',
    position: 'relative',
    height: '1.5em',
    width: '1.5em',
    borderRadius: '1.5em'
  },
  legendIconHidden: {
      opacity: 0.2
  },
  'monitored-critical': {
    color: 'red'
  },
  'monitored-warning': {
    color: 'orange'
  },
  'monitored-normal': {
  }
})
export default withStyles(styles)(MuninLineChart)
