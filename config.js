var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.gadget.skillManager = finesse.gadget.skillManager || {};

finesse.gadget.skillManager.Config = (function () {
    var _prefs = new gadgets.Prefs();

    /** @scope finesse.gadget.Config */
    return {
        authorization: _prefs.getString("authorization"),
        country: _prefs.getString("country"),
        language: _prefs.getString("language"),
        locale: _prefs.getString("locale"),
        host: _prefs.getString("host"),
        hostPort: _prefs.getString("hostPort"),
        extension: _prefs.getString("extension"),
        mobileAgentMode: _prefs.getString("mobileAgentMode"),
        mobileAgentDialNumber: _prefs.getString("mobileAgentDialNumber"),
        xmppDomain: _prefs.getString("xmppDomain"),
        pubsubDomain: _prefs.getString("pubsubDomain"),
        restHost: _prefs.getString("restHost"),
        scheme: _prefs.getString("scheme"),
        localhostFQDN: _prefs.getString("localhostFQDN"),
        localhostPort: _prefs.getString("localhostPort"),
        clientDriftInMillis: _prefs.getInt("clientDriftInMillis")
    };
}());


finesse.gadget.skillManager.appserver = {
    ip: "192.168.10.30"
   
};

