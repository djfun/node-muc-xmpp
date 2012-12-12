var logged_in = false;


var myDate = {};

myDate.getCurrent = function() {
  var d = new Date();
  var hours = d.getHours();
  hours = hours < 10 ? '0' + hours : hours;
  var minutes = d.getMinutes();
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutes;
};
  
$(document).ready(function() {
  $("#login").click(function() {
     loginFunction();
   });
  $("#send").click(function() {
     sendFunction();
   });
  $("button[name=logout]").click(function() {
     logoutFunction();
   });
  $(".logged_in").addClass('invisible');
});
  
var socket = io.connect('http://localhost:8080', {
  'reconnect': true,
  'reconnection delay': 500,
  'max reconnection attempts': 10
});

socket.on('text', function (data) {
  if (logged_in) {
    $('#chatarea').append(data.htmltext);

    var objDiv = document.getElementById("chatarea");
    objDiv.scrollTop = objDiv.scrollHeight;
  }
});

socket.on('subject', function (data) {

  $("#topic").html(data.subject);

  var objDiv = document.getElementById("chatarea");
  objDiv.scrollTop = objDiv.scrollHeight;
});

socket.on('presence', function (data) {
  // console.log(data);
  // $('#chatarea').append(data.htmltext);
  
});

socket.on('chat_online', function (data) {
  logged_in = true;
  $(".logged_in").removeClass('invisible');
  $(".logged_out").addClass('invisible');
});

socket.on('chat_error', function (data) {
  var error = data.error;
});

loginFunction = function() {
  var jid = $("#jid").val();
  var password = $("#password").val();
  var server = $("#server").val();
  var room = $("#room").val();
  socket.emit('login', { jid: jid, password: password, server: server, room: room });

};

logoutFunction = function() {
  logged_in = false;
  socket.emit('logout');
  $(".logged_in").addClass('invisible');
  $(".logged_out").removeClass('invisible');
};

sendFunction = function() {
  var text = $('#chatmessage').val();
  $('#chatmessage').val('');
  socket.emit('send', { text: text });
};