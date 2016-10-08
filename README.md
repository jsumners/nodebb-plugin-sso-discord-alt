# NodeBB Discord OAuth2 SSO

This plugin for [NodeBB](https://github.com/NodeBB/NodeBB/) provides a way to register/authenticate users against
[Discord](https://discordapp.com/). When enabled, and configured properly, there will be a
[Pied Piper](http://fontawesome.io/icon/pied-piper/) icon available on the login screen. Click that icon to authenticate
against Discord.

## Config

1. Create an application -- https://discordapp.com/developers/applications/me
2. Ensure the application's URI ends with `/auth/discord/callback`
3. Fill in the id and secret for the application via the NodeBB admin control panel (under "Social Authentication")

## Acknowledgements

This plugin is based on the excellent skeleton at
[https://github.com/julianlam/nodebb-plugin-sso-oauth](https://github.com/julianlam/nodebb-plugin-sso-oauth). It is
further based on the `nodebb-plugin-sso-google` by the same author. Without these plugins to learn from this one would
not exist (at least not from me).

## License

[MIT License](http://jsumners.mit-license.org/)