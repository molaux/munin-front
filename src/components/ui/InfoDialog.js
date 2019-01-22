import React from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import  DialogActions from '@material-ui/core/DialogActions'
import  DialogContent from '@material-ui/core/DialogContent'
import  DialogTitle from '@material-ui/core/DialogTitle'

class InfoDialog extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      open: false
    }
  }

  handleClickOpen () {
    this.setState({ open: true })
  };

  handleClose () {
    this.setState({ open: false })
  };

  render () {
    return (
      <div>
        <Button color='primary' onClick={this.handleClickOpen.bind(this)}>{this.props.primary}</Button>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose.bind(this)}
          aria-labelledby='info-dialog-title'
          aria-describedby='info-dialog-description'
        >
          <DialogTitle id='info-dialog-title'>{this.props.primary}</DialogTitle>
          <DialogContent>
            {this.props.children}
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose.bind(this)} color='primary' autoFocus>
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

export default InfoDialog
