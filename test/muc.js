var myXmpp = require('../lib/index');
var mucjs = require('../lib/muc');
var xmpp = require('node-xmpp');

exports.testMessageDispatch = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  testMuc.doMessage = function(stanza) {
    test.ok(stanza.is('message'), "message should be dispatched");
  };
  testMuc.dispatch(new xmpp.Element('message', {type: 'groupchat', to: 'test@conference.localhost'}).c('body').t('Greetings').tree());
  test.done();
};

exports.testPresenceDispatch = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  testMuc.doPresence = function(stanza) {
    test.ok(stanza.is('presence'), "presence should be dispatched");
  };
  testMuc.dispatch(new xmpp.Element('presence', { to: 'test@conference.localhost/fishbot' }).tree());
  test.done();
};
