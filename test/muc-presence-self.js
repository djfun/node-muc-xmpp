var myXmpp = require('../lib/index');
var mucjs = require('../lib/muc');
var xmpp = require('node-xmpp');

exports.testPresenceErrorMembersOnly = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));

  testMuc.on('error', function(e) {
    test.ok(e.condition == 'registration-required', "error message registration-required should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'error'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc'
    }).up().c('error', {
      'by': 'test@conference.localhost'
    }).c('registration-required', {
      'xmlns': 'urn:ietf:params:xml:ns:xmpp-stanzas'
    }).tree());

  test.done();
};

exports.testPresenceErrorBanned = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));

  testMuc.on('error', function(e) {
    test.ok(e.condition == 'forbidden', "error message forbidden should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'error'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc'
    }).up().c('error', {
      'by': 'test@conference.localhost',
      'type': 'auth'
    }).c('forbidden', {
      'xmlns': 'urn:ietf:params:xml:ns:xmpp-stanzas'
    }).tree());

  test.done();
};

exports.testPresenceErrorNickConflict = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));

  testMuc.on('error', function(e) {
    test.ok(e.condition == 'conflict', "error message conflict should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'error'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc'
    }).up().c('error', {
      'by': 'test@conference.localhost',
      'type': 'cancel'
    }).c('conflict', {
      'xmlns': 'urn:ietf:params:xml:ns:xmpp-stanzas'
    }).tree());

  test.done();
};

exports.testPresenceJoinResponse = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));

  testMuc.on('error', function(e) {
    test.ok(e.condition == 'conflict', "error message conflict should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'member',
      'role': 'participant'
    }).up().c('status', {
      'code': '110'
    }).tree());

  test.ok(testMuc.affiliation == mucjs.MucRoleAff.AFFILIATION_MEMBER &&
    testMuc.role == mucjs.MucRoleAff.ROLE_PARTICIPANT, "own affiliation and role should be meber/participant");

  test.done();
};

exports.testPresenceSelfNickChange = function(test){
  test.expect(3);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));
  
  var i = 0;
  testMuc.on('presence', function(p) {
    if (i === 0) {
      test.ok(p.type == 'join', "presence message join should be emitted");
    }
    if (i === 1) {
      test.ok(p.type == 'nickchange', "presence message nickchange should be emitted");
    }
    if (i === 2) {
      test.ok(false, "there should only be 2 presence messages");
    }
    i++;
  });

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'member',
      'role': 'participant'
    }).tree());


  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'unavailable'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'member',
      'role': 'participant',
      'nick': 'newfishbot'
    }).up().c('status', {
      code: '303'
    }).up().c('status', {
      code: '110'
    }).tree());

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/newfishbot'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'member',
      'role': 'participant'
    }).tree());

  test.ok(testMuc.roomnick == 'newfishbot', "own nickname should be newfishbot");

  
  test.done();
};