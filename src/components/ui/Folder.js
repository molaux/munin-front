import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withStyles } from 'material-ui/styles'
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails
} from 'material-ui/ExpansionPanel'
import Typography from 'material-ui/Typography'
import ExpandMoreIcon from 'material-ui-icons/ExpandMore'

const styles = theme => ({
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular
  },
  content: {
    flexDirection: 'column'
  }
})

class Folder extends Component {
  render () {
    const { classes } = this.props
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className={classes.heading}>{this.props.title}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.content}>
          {this.props.children}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}

Folder.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Folder)
