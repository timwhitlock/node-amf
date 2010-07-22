/**
 * Example AMF gateway HTTP server 
 */


/**
 * configure for your environment.
 * @todo pass these arguments in from the command line
 */
var listenPort = 8081;
var listenHost = '192.168.51.6';

// require your gateway methods into an object
var methods = require('./amf-methods');

// require the HTTP gatway server, ensuring relative paths are correct
var server = require('../../node-amf/http-server');

// start the server with the required params and gatway methods
server.start( listenPort, listenHost, methods );




