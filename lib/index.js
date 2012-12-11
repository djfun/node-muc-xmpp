var xmpp = require('node-xmpp');
var mucjs = require('./muc');

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var OFFLINE = 0;
var ONLINE = 1;

var Client = function(params) {
  EventEmitter.call(this);

  this.cl = new xmpp.Client({
    jid: params.jid,
    password: params.password,
    host: params.host,
    port: params.port });

  this.cl.on('online', this.onOnline.bind(this));
  this.cl.on('stanza', this.onStanza.bind(this));
  this.cl.on('error', this.onError.bind(this));

  this.state = OFFLINE;
  this.mucs = {};
  this.mucsArray = [];

};
util.inherits(Client, EventEmitter);
exports.Client = Client;

Client.prototype.getMuc = function(params) {
  var hash = params.room + '/' + params.nick;
  if (!this.mucs[hash]) {
    this.mucs[hash] = new mucjs.Muc({
      room: params.room,
      nick: params.nick,
      client: this.cl,
      xmpp: xmpp });
    this.mucsArray.push(this.mucs[hash]);
  }
  return this.mucs[hash];
};

Client.prototype.onOnline = function() {
  this.emit('online');
};
Client.prototype.onStanza = function(stanza) {
  this.mucsArray.forEach(function(muc) {
    muc.dispatch(stanza);
  });
  this.emit('stanza-all', stanza);
  if (stanza.attrs.type == 'chat') {
    this.emit('stanza', stanza);
  }
};
Client.prototype.onError = function(e) {
  this.emit('error', e);
};