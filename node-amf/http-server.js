

// Require system libraries
var sys = require('sys');
var http = require('http');


// Require node-amf module libraries
var amf = require('./amf');
var utils = require('./utils');


/**
 * @param Number port on which to listen
 * @param String address on which to listen
 * @param Object an object containing available gateway methods
 * @return bool
 */
exports.start = function( listenPort, listenHost, methods, timeout ){

	var server = http.createServer();
	server.addListener( 'request', onRequest );
	//server.addListener( 'connection', function( conn ){ sys.puts('[server.connection]'); } );
	//server.addListener( 'close', function( errno ){ sys.puts('[server.close]'); } );
	server.listen( listenPort, listenHost );
	sys.log('AMF gateway listening on : '+listenHost+':'+listenPort);
	return true;
	
	/** 
	 * Request handler:
	 * - deserializes request packet
	 * - calls AMF service
	 * - serializes response packet
	 */
	function onRequest( req, res ){
	
		// we must work in binary, UTF-8 strings will be handled by deserializer
		req.setEncoding('binary');

		// collect body on data events
		var body = '';
		req.addListener('data', function( chunk ){
			body += chunk;
		} );
		
		// ready for processing when body fully collected
		req.addListener('end', function(){
			//sys.puts( utils.hex(body) );
			try {
				var requestPacket = amf.packet(body);
				if( requestPacket.version !== amf.AMF0 && requestPacket.version !== amf.AMF3 ){
					throw new Error('Bad AMF request packet, sorry');
				}
				//sys.puts( sys.inspect(requestPacket) );

				// prepare response packet with the same AMF version
				var responsePacket = amf.packet();
				responsePacket.version = requestPacket.version;

				// process all messages as function calls
				var requestMessage, responseMessage, func, args, uri;
				// queue up all web service calls to be executed asynchronously
				var queue = [];
				for( var m in requestPacket.messages ){
					requestMessage = requestPacket.messages[m];
					try {
						// get function to call and arguments to pass from request message
						func = methods[ requestMessage.requestURI ];
						args = requestMessage.value;
						uri = requestMessage.responseURI;
						if( typeof func !== 'function' ){
							throw new Error('No such method "'+requestMessage.requestURI+'"');
						}
						if( typeof args !== 'object' && typeof args.push !== 'function' ){
							throw new Error('Arguments to "'+requestMessage.requestURI+'" must be sent as an array');
						}
						queue.push( [ uri, func, args ] );
					}
					// errors respond with an onStatus method request to the client - no responseURI required
					catch( Er ){
						console.warn('Error on request message "'+requestMessage.requestURI+'": ' + Er.message);
						responseMessage = amf.message( Er.message, uri+'/onStatus', '' );
						responsePacket.messages.push( responseMessage );
					}
				}
				// execute all web services, responding only when all are complete
				function shiftQueue(){
					var q = queue.shift();
					var uri = q[0], func = q[1], args = q[2];
					function callback( value, func ){
						func = func || 'onResult';
						// ensure callback isn't executed twice
						if( uri !== null ){ 
							clearTimeout(t);
							responseMessage = amf.message( value, uri+'/'+func, '' );
							responsePacket.messages.push( responseMessage );
							url = null;
							if( ++processed === qlen ){
								respond();
							}
						}
					}
					function onTimeout(){
						callback('method timeout', 'onStatus');
					}
					// hand off to method - any return value other than undefined assume to be a syncronous method
					try {
						args.unshift( callback );
						var t = setTimeout( onTimeout, timeout || 10000 );
						var value = func.apply( null, args );
						if( value !== undefined ){
							callback( value );
						}
					}
					catch( Er ){
						console.warn('Error on AMF method: ' + Er.message);
						callback( Er.message, 'onStatus' );
					}
				}
				// final response when all messages have been processed
				function respond(){
					// flush HTTP response
					var bin = responsePacket.serialize();
					//sys.puts( utils.hex(bin) );
					//sys.puts( sys.inspect(responsePacket) );
					res.writeHead( 200, {
						'Content-Type': 'application/x-amf',
						'Content-Length': bin.length 
					} );
					res.write( bin, "binary" );
					res.end();
				}
				// process queue without a recursive call stack
				var qlen = queue.length, processed = 0;
				for( var i = 0; i < qlen; i++ ){
					setTimeout( shiftQueue, 0 );
				}
				if( ! qlen ){
					throw new Error('no messages to process');
				}
			}
			catch( e ){
				console.warn( 'Error: ' + e.message );
				res.writeHead( 500, {'Content-Type': 'text/plain'} );
				res.write( 'Error on AMF packet:\n' + e.message );
				res.end();
			}
		} );
	}
	
}


