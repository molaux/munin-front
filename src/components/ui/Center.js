import React, { Component } from 'react'

import Grid from '@material-ui/core/Grid'

class Center extends Component {
  render () {
    const { height } = this.props

    return (
      <Grid
        className={this.props.className}
        container
        alignItems='center'
        justify='center'
        style={{ height: height, margin: 0 }}>
        <Grid item>
          {this.props.children}
        </Grid>
      </Grid>
    )
  }
}

export default Center
