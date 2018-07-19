import React, { Component } from 'react'

import Grid from 'material-ui/Grid'

import { withStyles } from 'material-ui/styles'

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

const styles = theme => ({

})

export default withStyles(styles)(Center)
