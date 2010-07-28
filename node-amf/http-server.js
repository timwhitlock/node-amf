

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
exports.start = function( listenPort, listenHost, methods ){

	var server = http.createServer();
	server.addListener( 'request', onRequest );
	//server.addListener( 'connection', function( conn ){ sys.puts('[server.connection]'); } );
	//server.addListener( 'close', function( errno ){ sys.puts('[server.close]'); } );
	server.listen( listenPort, listenHost );
	sys.puts('AMF gateway listening on : '+listenHost+':'+listenPort);
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
				var requestMessage, responseMessage, func, args, retval;
				for( var m in requestPacket.messages ){
					requestMessage = requestPacket.messages[m];
					try {
						// get function to call and arguments to pass from request message
						func = methods[ requestMessage.requestURI ];
						if( typeof func !== 'function' ){
							throw new Error('No such method "'+requestMessage.requestURI+'"');
						}
						args = requestMessage.value;
						if( typeof args !== 'object' && typeof args.push !== 'function' ){
							throw new Error('Arguments to "'+requestMessage.requestURI+'" must be sent as an array');
						}
						// call function and create response message with return value
						retval = func.apply( null, args );
						responseMessage = amf.message( retval, requestMessage.responseURI+'/onResult', '' );
					}
					// errors respond with an onStatus method request to the client - no responseURI required
					catch( Er ){
						sys.puts('Error: ' + Er.message);
						responseMessage = amf.message( Er.message, requestMessage.responseURI+'/onStatus', '' );
					}
					responsePacket.messages.push( responseMessage );
				}
				// flush HTTP response
				var bin = responsePacket.serialize();
				//sys.puts( utils.hex(bin) );
				//sys.puts( sys.inspect(responsePacket) );
				res.writeHead( 200, {
					'Content-Type': 'application/amf',
					'Content-Length': bin.length 
				} );
				res.write( bin, "binary" );
			}
			catch( e ){
				sys.puts( 'Error: ' + e.message );
				res.writeHead( 500, {'Content-Type': 'text/plain'} );
				res.write( 'Error serializing AMF packet:\n' + e.message );
			}
			res.end();
		} );
	}
	
}


