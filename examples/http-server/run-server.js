/**
 * Example AMF gateway HTTP server 
 */


// configure for your environment
var listenPort = 8081;
var listenHost = '127.0.0.1';
// maximum length of time server will wait for a method call to callback, defaults to 1000ms
var timeout = 5000;

// require your gateway methods into an object
var methods = require('./amf-methods');

// require the HTTP gateway server, ensuring relative paths are correct
var server = require('../../node-amf/http-server');

// start the server with the required params and gateway methods
server.start( listenPort, listenHost, methods, timeout );




