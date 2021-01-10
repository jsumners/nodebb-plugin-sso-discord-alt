/* global define, $, config */
'use strict'

$(window).on('action:script.load', function (ev, data) {
  data.scripts.push('sso-discord-alt/login')
})

define('sso-discord-alt/login', function () {
  const Login = {}

  Login.init = function () {
    const replaceEl = $('.alt-logins .discord a i')
    const replacement = document.createElement('img')
    replacement.src = config.relative_path + '/plugins/nodebb-plugin-sso-discord-alt/images/button_discord_login.svg'
    replacement.style = 'height:42px;margin-top:4px;'
    replaceEl.replaceWith(replacement)
  }

  return Login
})
