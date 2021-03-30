<div class="row">
  <div class="col-sm-2 col-xs-12 settings-header">Discord SSO</div>
  <div class="col-sm-10 col-xs-12">
    <div class="alert alert-info">
      <ol>
        <li>
          Create a <strong>Discord Application</strong> via the
          <a href="https://discordapp.com/developers/applications/me">API Console</a> and then paste
          your application details here.
        </li>
        <li>
          Ensure your application's redirect URI matches your NodeBB installation. For example, if your NodeBB lives at
          https://nodebb.example.com/, then you'd supply 'https://nodebb.example.com/auth/discord/callback' as the URI.
        </li>
        <li>
          You can configure this plugin via an <em>environment variables</em>. You can also specify values in the form below,
          and those will be stored in the database.
          <p>
            <pre><code>export SSO_DISCORD_CLIENT_ID="xxxxx"
export SSO_DISCORD_CLIENT_SECRET="yyyyy"</code></pre>
          </p>
        </li>
      </ol>
    </div>
    <form role="form" class="sso-discord-alt-settings">
      <div class="form-group">
        <label for="discord_app_id">Client ID</label>
        <input type="text" id="discord_app_id" name="id" title="Client ID" class="form-control input-lg" placeholder="Client ID">
      </div>
      <div class="form-group">
        <label for="discord_secret">Secret</label>
        <input type="text" id="discord_secret" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret">
      </div>
      <div class="checkbox">
        <label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
          <input type="checkbox" class="mdl-switch__input" name="autoconfirm">
          <span class="mdl-switch__label">Skip email verification for people who register using SSO?</span>
        </label>
      </div>
    </form>
  </div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
  <i class="material-icons">save</i>
</button>
