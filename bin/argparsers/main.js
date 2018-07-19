/* jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true */
(function () {
  'use strict'

  exports.create = function (parser) {
    parser.addArgument(
      ['-i', '--interface']
      , {
        help: 'The interface to bind to',
        metavar: '<interface>',
        defaultValue: 'auto'
      }
    )

    parser.addArgument(
      [ '-p', '--port' ]
      , {
        action: 'store',
        type: 'integer',
        metavar: 'PORT',
        help: 'Starts server listening on specified port',
        defaultValue: 4444
      }
    )
  }
}())
