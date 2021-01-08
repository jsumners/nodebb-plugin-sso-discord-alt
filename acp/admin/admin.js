/* global define, $, app, socket */
define('admin/plugins/sso-discord-alt', ['settings'], function (Settings) {
  'use strict'

  const ACP = {}

  ACP.init = function () {
    Settings.load('sso-discord-alt', $('.sso-discord-alt-settings'))

    $('#save').on('click', function () {
      Settings.save('sso-discord-alt', $('.sso-discord-alt-settings'), function () {
        app.alert({
          type: 'success',
          alert_id: 'sso-discord-alt-saved',
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
