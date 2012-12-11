var myXmpp = require('../lib/index');
var mucjs = require('../lib/muc');
var xmpp = require('node-xmpp');

exports.testNormalGroupchatMessage = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  
  testMuc.on('groupchat', function(data) {
    test.ok(data.body == 'a test body', "groupchat message should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('message',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'groupchat'
    }).c('body').t('a test body').tree());

  test.done();
};

exports.testHistoryGroupchatMessage = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  
  testMuc.on('groupchat', function(data) {
    test.ok(data.body == 'a delayed test body' &&
      data.delay == '1034553517000', "groupchat message with delay should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('message',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'groupchat'
    }).c('body')
  .t('a delayed test body')
  .up().c('delay', {
    'xmlns': 'urn:xmpp:delay',
    'from': 'test@conference.localhost',
    'stamp': '2002-10-13T23:58:37Z'
  }).tree());

  test.done();
};

exports.testRoomSubjectMessage = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  
  testMuc.on('subject', function(data) {
    test.ok(data.subject == 'Fire Burn and Cauldron Bubble!', "subject should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('message',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'groupchat'
    }).c('subject').t('Fire Burn and Cauldron Bubble!').tree());

  test.done();
};

exports.testEmptyRoomSubjectMessage = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});
  
  testMuc.on('subject', function(data) {
    test.ok(data.subject === '', "emnpty subject message should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('message',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'groupchat'
    }).c('subject').tree());

  test.done();
};


exports.testMessageErrorUnauthorizedSubjectChange = function(test){
  test.expect(1);

  var testMuc = new mucjs.Muc({});

  testMuc.on('error', function(e) {
    test.ok(e.condition == 'forbidden', "error message forbidden should be emitted");
  });

  testMuc.on('subject', function(data) {
    test.ok(false, "no subject message should be emitted");
  });

  testMuc.dispatch(new xmpp.Element('message',
    {
      from: 'test@conference.localhost/fishbot',
      type: 'error'
    }).c('subject').t('Fire Burn and Cauldron Bubble!').up()
    .c('error', {
      'by': 'test@conference.localhost',
      'type': 'auth'
    }).c('forbidden', {
      'xmlns': 'urn:ietf:params:xml:ns:xmpp-stanzas'
    }).tree());

  test.done();
};

// invitation?