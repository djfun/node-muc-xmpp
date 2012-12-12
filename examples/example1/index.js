var node_static = require('node-static');

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');

var file = new(node_static.Server)('./public');

app.listen(8080);

var myDate = {};

myDate.getCurrent = function(timestamp) {
  var d = new Date();
  if (timestamp) {
    d.setTime(timestamp);
  }
  var hours = d.getHours();
  hours = hours < 10 ? '0' + hours : hours;
  var minutes = d.getMinutes();
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var seconds = d.getSeconds();
  seconds = seconds < 10 ? '0' + seconds : seconds;
  return hours + ':' + minutes + ':' + seconds;
};

function handler (req, res) {
  req.addListener('end', function () {
    file.serve(req, res);
  });
}

var xmpp = require('../../lib/index');

io.set('log level', 1);

io.sockets.on('connection', function (socket) {
  socket.on('login', function(data) {
    var cl = new xmpp.Client({
      jid: data.jid + '/nodejs',
      password: data.password,
      host: data.server,
      port: '5222' });

    var username = data.jid.substr(0, data.jid.indexOf('@'));
                      
    var muc = cl.getMuc({
      room: data.room,
      nick: username});

    cl.on('online',
        function() {
            muc.joinRoom();
            socket.emit('chat_online');
    });
    cl.on('error',
        function(e) {
            console.log(e);
            socket.emit('chat_error');
    });

    socket.on('send', function(data) {
      muc.sendGroupMessage(data.text);
    });
    
    muc.on('groupchat', function(data) {
      var nick = data.from.substr(data.from.indexOf('/') + 1);
      data.htmltext = '<span>[' + myDate.getCurrent(data.delay) + '] ' + nick + ':</span> ' + data.body + '<br />';
      socket.emit('text', data);
    });

    muc.on('presence', function(data) {
      socket.emit('presence', data);

      var type = data.type;
      var user = data.user.substr(data.user.indexOf('/') + 1);

      if (type == 'join') {
        data.htmltext = '[' + myDate.getCurrent(data.delay) + '] ' + user + ' joins the room.' + '<br />';
      }
      if (type == 'nickchange') {

        var actor = data.actor;
        data.htmltext = '[' + myDate.getCurrent(data.delay) + '] ' + user + ' is now known as ' + actor + '<br />';
      }
      if (type == 'leave') {
        data.htmltext = '[' + myDate.getCurrent(data.delay) + '] ' + user + ' leaves the room.' + '<br />';
      }
      socket.emit('text', data);

    });

    muc.on('subject', function(data) {
      data.subject = data.subject;
      socket.emit('subject', data);

      var nick = data.from.substr(data.from.indexOf('/') + 1);
      data.htmltext = '[' + myDate.getCurrent(data.delay) + '] ' + nick + ' changes the topic to ' + data.subject + '<br />';
      socket.emit('text', data);
    });

    muc.on('error',
        function(e) {
            console.log(e);
            socket.emit('muc_error', e);
    });

    socket.on('logout', function () {
      muc.leaveRoom();
    });

    socket.on('disconnect', function () {
      muc.leaveRoom();
    });
  });
});