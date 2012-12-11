var myXmpp = require('../lib/index');
var mucjs = require('../lib/muc');
var xmpp = require('node-xmpp');

exports.testPresenceOwner = function(test){
  test.expect(2);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));
  
  testMuc.on('presence', function(p) {
    test.ok(p.type == 'join', "presence message join should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'owner',
      'role': 'moderator'
    }).tree());

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_OWNER,
      "status should be owner");
  
  test.done();
};

exports.testPresenceAdmin = function(test){
  test.expect(2);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));
  
  testMuc.on('presence', function(p) {
    test.ok(p.type == 'join', "presence message join should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'admin',
      'role': 'moderator'
    }).tree());

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_ADMIN,
      "status should be admin");
  
  test.done();
};

exports.testPresenceMember = function(test){
  test.expect(2);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));
  
  testMuc.on('presence', function(p) {
    test.ok(p.type == 'join', "presence message join should be emitted");
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

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_MEMBER,
      "status should be member");
  
  test.done();
};

exports.testPresenceLeave = function(test){
  test.expect(4);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));
  
  var i = 0;
  testMuc.on('presence', function(p) {
    if (i === 0) {
      test.ok(p.type == 'join', "presence message join should be emitted");
    }
    if (i === 1) {
      test.ok(p.type == 'leave', "presence message leave should be emitted");
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

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_MEMBER,
      "status should be member");

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'unavailable'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'member',
      'role': 'none',
      'jid': 'fishbot@localhost/node'
    }).tree());

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_NONE,
      "status should be none");

  test.done();
};

exports.testPresenceNickChange = function(test){
  test.expect(5);

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

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_MEMBER,
      "status should be member");

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

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/newfishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_MEMBER,
      "status should be member");

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_NONE,
      "status should be none");

  
  test.done();
};

exports.testPresenceKick = function(test){
  test.expect(2);

  var testMuc = new mucjs.Muc({});
  testMuc.roster = new mucjs.Roster('test@conference.localhost', testMuc.emitPresence.bind(testMuc));
  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'member',
      'role': 'participant'
    }).tree());

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_MEMBER,
      "status should be member");

  testMuc.dispatch(new xmpp.Element('presence',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'unavailable'
    }).c('x', {
      'xmlns': 'http://jabber.org/protocol/muc#user'
    }).c('item', {
      'affiliation': 'none',
      'role': 'none'
    }).c('actor', {
      'nick': 'someModerator'
    }).up().c('reason').t('Some Reason').up().up().c('status', {
      'code': '307'
    }).tree());

  test.ok(testMuc.
    roster.
    getStatus('test@conference.localhost/fishbot').
    affiliation == mucjs.MucRoleAff.AFFILIATION_NONE,
      "status should be none");

  test.done();
};