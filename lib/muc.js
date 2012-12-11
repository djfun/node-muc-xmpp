var util = require('util');
var EventEmitter = require('events').EventEmitter;

var STATE_0 = 0,
    STATE_1 = 1;
    
var MUC_NS = 'http://jabber.org/protocol/muc',
    MUC_USER_NS = 'http://jabber.org/protocol/muc#user',
    MUC_ADMIN_NS = 'http://jabber.org/protocol/muc#admin',
    MUC_OWNER_NS = 'http://jabber.org/protocol/muc#owner';

function Muc(params) {
  EventEmitter.call(this);
  this.room = params.room;
  this.roomnick = params.nick;
  this.roompassword = params.password;
  
  this.client = params.client;
  this.xmpp = params.xmpp;
  
  this.state = STATE_0; // we are not in a room
  
  this.role = MucRoleAff.ROLE_NONE;
  this.affiliation = MucRoleAff.AFFILIATION_NONE;
}

util.inherits(Muc, EventEmitter);
exports.Muc = Muc;

Muc.prototype.joinRoom = function() {
  // TODO: if there is a password set, try to use it
  this.client.send(new this.xmpp.Element('presence', { to: this.room + '/' + this.roomnick }).c('x', { xmlns: MUC_NS }));
  this.roster = new Roster(this.room, this.emitPresence.bind(this));
  this.state = STATE_1; // we have tried to enter the room
};

Muc.prototype.leaveRoom = function() {
  this.client.send(new this.xmpp.Element('presence', { to: this.room + '/' + this.roomnick, type: 'unavailable' }));
  this.state = STATE_0;
  this.role = MucRoleAff.ROLE_NONE;
  this.affiliation = MucRoleAff.AFFILIATION_NONE;
};

Muc.prototype.doPresence = function(stanza) {
  var from, affiliation, role, type, status, newnick, jid;
  if (stanza.getChild('x') !== null) {
    // console.log(stanza.getChild('x').attrs.xmlns);
    // console.log('From: ' + stanza.attrs.from);
    // console.log('Type: ' + stanza.attrs.type);
    // console.log(stanza.getChild('x'));
    if (stanza.attrs.type == 'error') {
      if (stanza.getChild('error').getChild('conflict') &&
        stanza.getChild('error').attrs.type == 'cancel') {
        this.emit('error', {condition: 'conflict', message: 'nick conflict'});
      }
      if (stanza.getChild('error').getChild('forbidden') &&
        stanza.getChild('error').attrs.type == 'auth') {
        this.emit('error', {condition: 'forbidden', message: 'banned'});
      }
      if (stanza.getChild('error').getChild('registration-required')) {
        this.emit('error', {condition: 'registration-required', message: 'members only'});
      }
    }

    if (stanza.getChild('x').attrs.xmlns == MUC_USER_NS) {
      affiliation = MucRoleAff.toAffiliation(stanza.getChild('x').getChild('item').attrs.affiliation);
      role = MucRoleAff.toRole(stanza.getChild('x').getChild('item').attrs.role);
      // (Example 19)
      from = stanza.attrs.from;
      type = stanza.attrs.type;
      status = stanza.getChild('x').getChildren('status');
      newnick = stanza.getChild('x').getChild('item').attrs.nick;
      jid = stanza.getChild('x').getChild('item').attrs.jid;
      
      this.roster.update(from, affiliation, role, type, status, newnick, jid);
      // (Example 20)
      if (containsStatusCode(status, '110')) {
        this.affiliation = affiliation;
        this.role = role;
        if (type == 'unavailable' && containsStatusCode(status, '303')) {
          this.roomnick = newnick;
        }
        // console.log('myself: ' + MucRoleAff.toString(affiliation) + '/' + MucRoleAff.toString(role));
      } else {
        // console.log(from + ': ' + MucRoleAff.toString(affiliation) + '/' + MucRoleAff.toString(role));
      }
    }
  }
};
Muc.prototype.doMessage = function(stanza) {
  var from, body, delay, type, subject;
  if ((stanza.attrs.type == 'chat' || stanza.attrs.type == 'groupchat') && stanza.getChild('body')) {
    // (Example 58) (Example 61)
    type = stanza.attrs.type;
    from = stanza.attrs.from;
    body = stanza.getChild('body').getText();
    if (stanza.getChild('delay')) {
      delay = {from: stanza.getChild('delay').attrs.from, stamp: stanza.getChild('delay').attrs.stamp};
    }
    this.useMessage(from, body, type, delay);
  } else if (stanza.getChild('subject')) {
    if (stanza.getChild('delay')) {
      delay = {from: stanza.getChild('delay').attrs.from, stamp: stanza.getChild('delay').attrs.stamp};
    }
    type = stanza.attrs.type;
    from = stanza.attrs.from;
    subject = stanza.getChild('subject').getText();
    if (stanza.attrs.type == 'error') {
      if (stanza.getChild('error').getChild('forbidden') &&
        stanza.getChild('error').attrs.type == 'auth') {
        this.emit('error', {condition: 'forbidden', message: 'unauthorized subject change'});
      }
    } else {
      this.useSubject(from, subject, type, delay);
    }
  }
};

Muc.prototype.useMessage = function(from, body, type, delay) {
  /*if (type == 'groupchat' && body == '!status' && !delay) {
    this.sendGroupMessage('I am currently in ' +
        this.room +
        '. My affiliation is ' +
        MucRoleAff.toString(this.affiliation) +
        '. My role is ' +
        MucRoleAff.toString(this.role) +
        '.');
  }
  if (type == 'groupchat' && body == '!roster' && !delay) {
    var rosterString = 'Roster:\n';
    var rosterArray = this.roster.getArray();
    for (var i = 0; i < rosterArray.length; i++) {
      rosterString+= rosterArray[i].nick +
          ': ' +
          MucRoleAff.toString(rosterArray[i].affiliation) +
          '/' +
          MucRoleAff.toString(rosterArray[i].role);
      if (i < rosterArray.length - 1) {
        rosterString+='\n';
      }
    }
    this.sendGroupMessage(rosterString);
  }*/
  var delayDate;
  if (delay) {
    delayDate = Date.parse(delay.stamp);
  }
  if (type =='groupchat') {
    this.emit('groupchat', { from: from, body: body, delay: delayDate});
  }
};

Muc.prototype.useSubject = function(from, subject, type, delay) {
  var delayDate;
  if (delay) {
    delayDate = Date.parse(delay.stamp);
  }
  this.emit('subject', { from: from, subject: subject, delay: delayDate });
};

Muc.prototype.sendGroupMessage = function(body) {
  var payload = {
    to: this.room,
    type: 'groupchat'
  };
  this.client.send(new this.xmpp.Element('message', payload).c('body').t(body));
};

Muc.prototype.dispatch = function(stanza) {
  if(stanza.is('message')) {
    // message
    this.doMessage(stanza);
  } else if(stanza.is('presence')) {
    // presence
    this.doPresence(stanza);
  } else if(stanza.is('iq')) {
    // iq
  }
};

Muc.prototype.emitPresence = function(type, actor, user) {
  this.emit('presence', {type: type, actor: actor, user: user});
};

var MucRoleAff = {};
MucRoleAff.ROLE_NONE = 0,
MucRoleAff.ROLE_VISITOR = 1,
MucRoleAff.ROLE_PARTICIPANT = 2,
MucRoleAff.ROLE_MODERATOR = 3,
MucRoleAff.AFFILIATION_NONE = 4,
MucRoleAff.AFFILIATION_OUTCAST = 5,
MucRoleAff.AFFILIATION_MEMBER = 6,
MucRoleAff.AFFILIATION_ADMIN = 7,
MucRoleAff.AFFILIATION_OWNER = 8;

MucRoleAff.toRole = function(s) {
  if (s == 'none') return this.ROLE_NONE;
  if (s == 'visitor') return this.ROLE_VISITOR;
  if (s == 'participant') return this.ROLE_PARTICIPANT;
  if (s == 'moderator') return this.ROLE_MODERATOR;
  return this.ROLE_NONE;
};

MucRoleAff.toAffiliation = function(s) {
  if (s == 'none') return this.AFFILIATION_NONE;
  if (s == 'outcast') return this.AFFILIATION_OUTCAST;
  if (s == 'member') return this.AFFILIATION_MEMBER;
  if (s == 'admin') return this.AFFILIATION_ADMIN;
  if (s == 'owner') return this.AFFILIATION_OWNER;
  return this.AFFILIATION_NONE;
};

MucRoleAff.toString = function(v) {
  if (v == this.ROLE_NONE) return "none";
  if (v == this.ROLE_VISITOR) return "visitor";
  if (v == this.ROLE_PARTICIPANT) return "participant";
  if (v == this.ROLE_MODERATOR) return "moderator";
  if (v == this.AFFILIATION_NONE) return "none";
  if (v == this.AFFILIATION_OUTCAST) return "outcast";
  if (v == this.AFFILIATION_MEMBER) return "member";
  if (v == this.AFFILIATION_ADMIN) return "admin";
  if (v == this.AFFILIATION_OWNER) return "owner";
};

function Roster(room, callback) {
  this.room = room;
  this.callback = callback;
  this.count = 0;
  this.object = {};
}
Roster.prototype.getArray = function() {
  var returnArray = [];
  for (var nick in this.object) {
    var obj = {
      nick: nick,
      affiliation: this.object[nick].affiliation,
      role: this.object[nick].role,
      jid: this.object[nick].jid
    };
    returnArray[returnArray.length] = obj;
  }
  return returnArray;
};

function containsStatusCode(status, code) {
  for (var i = 0; i < status.length; i++) {
    if (code == status[i].attrs.code) {
      return true;
    }
  }
  return false;
}

Roster.prototype.update = function(nick, affiliation, role, type, status, newnick, jid) {
  if (this.object[nick]) {
    // nick is already in roster, just update it
    this.object[nick].affiliation = affiliation;
    this.object[nick].role = role;
    if (jid) {
      this.object[nick].jid = jid;
    }
  } else {
    // new nick
    this.count++;
    this.object[nick] = {nick: nick, affiliation: affiliation, role: role, jid: jid};
    this.callback('join', null, nick);
  }
  if (role == MucRoleAff.ROLE_NONE) {
    // leaving the room
    delete this.object[nick];
    this.count--;
    this.callback('leave', null, nick);
  }

  if (type == 'unavailable' && containsStatusCode(status, '303')) {
    // nickchange
    delete this.object[nick];
    this.object[this.room + '/' + newnick] = {nick: this.room + '/' + newnick, affiliation: affiliation, role: role, jid: jid};
    this.callback('nickchange', newnick, nick);
  }
};
Roster.prototype.getStatus = function(nick) {
  if (this.object[nick]) {
    return {
        nick: nick,
        affiliation: this.object[nick].affiliation,
        role: this.object[nick].role,
        jid: this.object[nick].jid
      };
  } else {
    return {
        nick: nick,
        affiliation: MucRoleAff.AFFILIATION_NONE,
        role: MucRoleAff.ROLE_NONE,
        jid: null
      };
  }
};

exports.Roster = Roster;
exports.MucRoleAff = MucRoleAff;