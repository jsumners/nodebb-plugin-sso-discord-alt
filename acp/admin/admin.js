/* global define, $, app, socket, require */
define('admin/plugins/sso-discord', ['settings'], function (Settings) {
  'use strict'

  var ACP = {}

  ACP.init = function () {
    Settings.load('sso-discord', $('.sso-discord-settings'))

    $('#save').on('click', function () {
      Settings.save('sso-discord', $('.sso-discord-settings'), function () {
        app.alert({
          type: 'success',
          alert_id: 'sso-discord-saved',
          title: 'Settings Saved',
          message: 'Please reload your NodeBB to apply these settings',
          clickfn: function () {
            socket.emit('admin.reload')
          }
        })
      })
    })
  }

  return ACP
})
