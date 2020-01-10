'use strict'

const User = require.main.require('./src/user')
const InternalOAuthError = module.parent.require('passport-oauth').InternalOAuthError
const OAuth2Strategy = require.main.require('passport-oauth').OAuth2Strategy
const meta = require.main.require('./src/meta')
const db = require.main.require('./src/database')
const passport = module.parent.require('passport')
const nconf = module.parent.require('nconf')
const winston = module.parent.require('winston')
const async = module.parent.require('async')
const authenticationController = require.main.require('./src/controllers/authentication')
const quickFormat = module.parent.require('quick-format')

function doLog () {
  const args = Array.from(arguments)
  const method = args.splice(0, 1)[0]
  const formatStr = '[sso-discord-alt] ' + args.splice(0, 1)[0]
  method.call(winston, quickFormat([formatStr].concat(args)))
}

function log () {
  doLog.apply(null, [winston.verbose].concat(Array.from(arguments)))
}

function logError () {
  doLog.apply(null, [winston.error].concat(Array.from(arguments)))
}

function logWarn () {
  doLog.apply(null, [winston.warn].concat(Array.from(arguments)))
}

const constants = {
  name: 'discord',
  admin: {
    route: '/plugins/sso-discord-alt',
    icon: 'fa-pied-piper'
  },
    oauth: { // a passport-oauth2 options object
    authorizationURL: 'https://discordapp.com/api/v6/oauth2/authorize',
    tokenURL: 'https://discordapp.com/api/v6/oauth2/token',
    passReqToCallback: true
  },
  userRoute: 'https://discordapp.com/api/v6/users/@me'
}

const DiscordAuth = {}

/**
 * Invoked by NodeBB when initializing the plugin.
 *
 * @param {object} data Provides some context information.
 * @param {function} callback Invokec when initialization is complete.
 */
DiscordAuth.init = function (data, callback) {
  var hostHelpers = require.main.require('./src/routes/helpers');

  function render (req, res, next) {
    res.render('admin/plugins/sso-discord-alt', {
        baseUrl: nconf.get('url'),
    });
  }

  data.router.get('/admin/plugins/sso-discord-alt', data.middleware.admin.buildHeader, render);
  data.router.get('/api/admin/plugins/sso-discord-alt', render);
  
  hostHelpers.setupPageRoute(data.router, '/deauth/discord', data.middleware, [data.middleware.requireUser], function (req, res) {
            res.render('plugins/sso-discord-alt/deauth', {
                service: "discord",
            });
        });
        data.router.post('/deauth/discord', [data.middleware.requireUser, data.middleware.applyCSRF], function (req, res, next) {
            DiscordAuth.deleteUserData({
                uid: req.user.uid,
            }, function (err) {
                if (err) {
                    return next(err);
                }

                res.redirect(nconf.get('relative_path') + '/me/edit');
            });
        });
  


  callback()
}

DiscordAuth.addMenuItem = function (customHeader, callback) {
  log('adding admin menu item')
  customHeader.authentication.push({
    route: constants.admin.route,
    icon: constants.admin.icon,
    name: constants.name
  })

  callback(null, customHeader)
}

DiscordAuth.getStrategy = function (strategies, callback) {
  log('adding authentication strategy')
  const options = constants.oauth
  options.callbackURL = nconf.get('url') + '/auth/' + constants.name + '/callback'

  meta.settings.get('sso-discord-alt', function (err, settings) {
    if (err) return callback(err)
    if (!settings.id || !settings.secret) {
      logWarn('Missing sso-discord-alt configuration. Not enabling authentication strategy.')
      return callback(null, strategies)
    }

    options.clientID = settings.id
    options.clientSecret = settings.secret

    function PassportOAuth () {
      OAuth2Strategy.apply(this, arguments)
    }
    require('util').inherits(PassportOAuth, OAuth2Strategy)

    /**
     * Invoked by the OAuth2Strategy prior to the verify callback being invoked.
     *
     * @param {string} accessToken API access token as returned by the remote service.
     * @param {function} done Callback to be invoked when profile parsing is finished.
     */
    PassportOAuth.prototype.userProfile = function (accessToken, done) {
      log('getting user profile from remote service')
      this._oauth2._useAuthorizationHeaderForGET = true
      this._oauth2.get(constants.userRoute, accessToken, function (err, body, res) {
        if (err) return done(new InternalOAuthError('failed to fetch user profile', err))
        try {
          log('parsing remote profile information')
          const oauthUser = JSON.parse(body)
          done(null, { // user profile for verify function
            id: oauthUser.id,
            displayName: oauthUser.username,
            email: oauthUser.email,
            picture: 'https://cdn.discordapp.com/avatars/' + oauthUser.id + '/' + oauthUser.avatar + '.png',
            provider: constants.name
          })
        } catch (e) {
          done(e)
        }
      })
    }

    const authenticator = new PassportOAuth(options, function verify (req, token, secret, profile, done) {
      log('passport verify function invoked: %j', profile)
      DiscordAuth.login(profile, function (err, user) {
        if (err) return done(err)
        authenticationController.onSuccessfulLogin(req, user.uid)
        done(null, user)
      })
    })
    passport.use(constants.name, authenticator)

    strategies.push({
      name: constants.name,
      url: '/auth/' + constants.name,
      callbackURL: `/auth/${constants.name}/callback`,
      icon: constants.admin.icon,
      scope: ['identify', 'email']
    })
    log('authentication strategy added')

    callback(null, strategies)
  })
}

DiscordAuth.getAssociation = function (data, callback) {
  log('determining if user is associated with discord')
  User.getUserField(data.uid, 'discordId', function (err, discordId) {
    if (err) return callback(err, data)

    if (discordId) {
      log('user is associated with discord')
      data.associations.push({
        associated: true,
        url: 'https://discordapp.com/channels/@me',
        deauthUrl: nconf.get('url') + '/deauth/discord',
        name: constants.name,
        icon: constants.admin.icon
      })
    } else {
      log('user is not asscociated with discord')
      data.associations.push({
        associated: false,
        url: nconf.get('url') + '/auth/discord',
        name: constants.name,
        icon: constants.admin.icon
      })
    }

    callback(null, data)
  })
}

DiscordAuth.login = function (profile, callback) {
  log('login invoked: %j', profile)
  DiscordAuth.getUidByOAuthid(profile.id, function (err, uid) {
    if (err) {
      logError('could not determine uid from OAuthId: %s', profile.id)
      return callback(err)
    }

    // Existing User
    if (uid !== null) {
      log('user already exists: %s', uid)
      User.setUserField(uid, 'username', profile.displayName)
      User.setUserField(uid, 'uploadedpicture', profile.picture)
      User.setUserField(uid, 'picture', profile.picture)
      return callback(null, {uid})
    }

    // New User
    log('determing if new user: %s', uid)
    const success = function (uid) {
      log('updating user record with remote service data: (%s, %s)', profile.id, uid)
      // Save provider-specific information to the user
      User.setUserField(uid, constants.name + 'Id', profile.id)
      db.setObjectField(constants.name + 'Id:uid', profile.id, uid)
      User.setUserField(uid, 'username', profile.displayName)
      User.setUserField(uid, 'uploadedpicture', profile.picture)
      User.setUserField(uid, 'picture', profile.picture)
      callback(null, {uid})
    }

    User.getUidByEmail(profile.email, function (err, uid) {
      if (err) {
        logError('could not lookup user by email %s: %s', profile.email, err.message)
        return callback(err)
      }
      if (uid) {
        log('user with email address already exists, merging: %s', profile.email)
        // TODO: this seems easily exploitable
        return success(uid)
      }

      log('creating new user: %s', uid)
      const userFields = {
        username: profile.displayName,
        picture: profile.picture,
        uploadedpicture: profile.picture,
        email: profile.email
      }
      User.create(userFields, function (err, uid) {
        if (err) {
          logError('could not create user %s: %s', uid, err.message)
          return callback(err)
        }
        log('user created')
        success(uid)
      })
    })
  })
}

DiscordAuth.getUidByOAuthid = function (oAuthid, callback) {
  db.getObjectField(constants.name + 'Id:uid', oAuthid, function (err, uid) {
    if (err) {
      logError('could not get object field from database %s: %s', oAuthid, err.message)
      return callback(err)
    }
    callback(null, uid)
  })
}

DiscordAuth.deleteUserData = function (idObj, callback) {
  log('deleteUserData invoked: %j', idObj)
  const operations = [
    async.apply(User.getUserField, idObj.uid, constants.name + 'Id'),
    function (oAuthIdToDelete, next) {
      log('deleting oAuthId: %s', oAuthIdToDelete)
      db.deleteObjectField(constants.name + 'Id:uid', oAuthIdToDelete, next)
    },
    function (next) {
      db.deleteObjectField('user:' + idObj.uid, constants.name + 'Id', next)
    },
  ]
  async.waterfall(operations, function (err) {
    if (err) {
      logError('Could not remove OAuthId data for uid %j. Error: %s', idObj.uid, err.message)
      return callback(err)
    }
    log('finished deleting user: %s', idObj.uid)
    callback(null, idObj.uid)
  })
}

module.exports = DiscordAuth
