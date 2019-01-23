import React, { Component } from 'react'
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Area, Line, ReferenceLine } from 'recharts'
import randomcolor from 'randomcolor'
import Color from 'color'

class MuninLineChart extends Component {
  constructor (props) {
    super(props)
    this.state = { colors: [], stacks: {}, data: {} }
    this.state = {
      colors: this.generateMissingColors(props),
      stacks: this.sortTargets(props),
      probe: { ... props.probe, data: this.handleData(props.probe) }
    }
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
      for (let timedValue of target.serie.values) {
        let dataKey = target.name

        if (target.infos.negative) {
          dataKey = target.infos.negative.value
        }
        let value = this.getValue(target, timedValue)
        if (data[timedValue.time] !== undefined) {
          if (data[timedValue.time][dataKey] === undefined) {
            if (value !== null) {
              data[timedValue.time][dataKey] = value
            }
          } else {
            let v = this.getValue(target, timedValue)
            data[timedValue.time][dataKey] = data[timedValue.time][dataKey] < v
              ? [ data[timedValue.time][dataKey], value ]
              : [ value, data[timedValue.time][dataKey] ]
          }
        } else {

          data[timedValue.time] = {
            time: (new Date(timedValue.time)).getTime() / 1000,
            [dataKey]: value
          }
        }
      }
    }

    return data
  }

  componentWillReceiveProps (props) {
    if (this.state.probe.targets.length !== props.probe.targets.length) {
      this.setState({
        colors: this.generateMissingColors(props),
        stacks: this.sortTargets(props)
      })
    }


    this.setState({
      probe: { ...this.state.probe, data: this.handleData(props.probe)}
    })
  }

  sortTargets (props) {
    let stacks = {}
    let currentStack = null
    let orderedTargets = props.probe.infos.graph_order
      ? props.probe.infos.graph_order.value.split(' ')
      : props.probe.targets.map(target => target.name)
    for (let t of orderedTargets) {
      // retrieve target
      let targets = props.probe.targets.filter(target => target.name === t)
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

  getValue (target, timedValue) {
    let value = Object.values(timedValue.values)[0]
    return value === null ? null : (this.hasNegative(target) ? -1 : 1) * Object.values(timedValue.values)[0]
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
    return (
      <ResponsiveContainer width='100%' height={500} className={this.props.className} >
        <ComposedChart
          data={Object.values(this.state.probe.data)}
          margin={{top: 20, right: 30, left: 50, bottom: 100}}
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
            this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.critical !== undefined).map((target, index2) =>  <ReferenceLine y={target.infos.critical.value.split(':')[1]} stroke="#faa" strokeDasharray="6 6" />
          ))}
          {Object.keys(this.state.stacks).map((stack, index1) =>
            this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.critical !== undefined).map((target, index2) => <ReferenceLine y={target.infos.critical.value.split(':')[0]} stroke="lightblue" strokeDasharray="6 6" />
          ))}
          {Object.keys(this.state.stacks).map((stack, index1) =>
            this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.warning !== undefined).map((target, index2) =>  <ReferenceLine y={target.infos.warning.value.split(':')[1]} stroke="#faa" strokeDasharray="3 3" />
          ))}
          {Object.keys(this.state.stacks).map((stack, index1) =>
            this.state.stacks[stack].filter(target => target.infos.negative === undefined && target.infos.warning !== undefined).map((target, index2) => <ReferenceLine y={target.infos.warning.value.split(':')[0]} stroke="lightblue" strokeDasharray="3 3" />
          ))}
          <Tooltip
            wrapperStyle={{ fontSize: 10 }}
            formatter={this.formatLabel.bind(this)}
            labelFormatter={time => (new Date(time * 1000)).toLocaleString()} />
          <Legend wrapperStyle={{ position: 'absolute', bottom: 10, fontSize: 10 }} />
          {Object.keys(this.state.stacks).map((stack, index1) =>
            this.state.stacks[stack].filter(target => target.infos.negative === undefined).map((target, index2) => {
              let SerieComponent = (this.hasNegative(target) || target.infos.negative) || (target.infos.draw && (target.infos.draw.value === 'AREA' || target.infos.draw.value === 'AREASTACK' || target.infos.draw.value === 'STACK'))
                ? Area
                : Line
              return <SerieComponent
                type='linear'
                key={i++}
                connectNulls={false}
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
    )
  }
}

export default MuninLineChart
