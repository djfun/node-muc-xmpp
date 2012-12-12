node-muc-xmpp
=============

a MUC (multi user chat) library for [nodejs](http://nodejs.org) that uses [node-xmpp](https://github.com/astro/node-xmpp).

It is not production ready but the basics should work.

Example 1
---------
A simple chat with websockets. Needs [socket.io](https://github.com/LearnBoost/socket.io) and [node-static](https://github.com/cloudhead/node-static).
To start just go to the `examples/example1` directory and start `node index.js`. Then go to [http://localhost:8080](http://localhost:8080) in your browser, type in your login data (e.g. testuser@localhost, mysupersecurepassword, localhost, mychat@conference.localhost) and you should be able to chat.

Tests
-----
In the `test` folder there are some unit tests that can be run with [nodeunit](https://github.com/caolan/nodeunit).