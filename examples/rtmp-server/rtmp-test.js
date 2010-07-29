/**
 * Test RTMP socket - unstable - do not use
 */
var sys = require('sys');
var net = require('net');

var utils = require('../../node-amf/utils');
var amf = require('../../node-amf/amf');
var bin = require('../../node-amf/bin');
var pack = require('../../node-amf/pack').pack;


// Global variables
var binParser = bin.parser( true, true );
var server = net.createServer();


/** */
server.addListener('connection', function(socket) {
	try {
		// handshake states
		var versionSent, ackSent;
		// variables stored during handshake
		var clientRandom, serverRandom = randomness(1528);
		var clientEpochStr, clientEpoch, serverEpochStr = '\0\0\0\0', serverEpoch = 0;
		var serverBench, clientBench;
		
		// prepare the socket/stream for events
		socket.setEncoding("binary");
		sys.puts('server.connection');
	
		/** Data listener - */
		socket.addListener( 'data', function( data ) {
			try {
				sys.puts('socket.data [length:'+data.length+']');
				
				// Start handshake if version not sent yet
				if( ! versionSent ){
					// take a benchmark straight away
					serverBench = ( new Date ).getTime();
					if( data.length !== 1537 ){
						throw new Error('Expecting 1537 octets, got ' + data.length);
					}
					// 5.2 C0 and S0
					if( 3 !== data.charCodeAt(0)){
						// @todo should we abandon the connectipon or reply with \3? spec contradicts itself
						throw new Error('Unexpected version, Only version 3 is supported');
						socket.write( '\3', 'binary' );
						return;
					}
					// 5.3 - C1 and S1 - 
					// Send S1 before recieving C1 as per handshake diagram 5.5 
					var S1 = '\3' + serverEpochStr + '\0\0\0\0' + serverRandom;
					socket.write( S1, 'binary' );
					// recieve C1
					if( '\0\0\0\0' !== data.slice(5,9) ){
						throw new Error('Handshake error: zeroed string expected');
					}
					clientEpochStr = data.slice(1,5);
					clientEpoch = binParser.toInt( clientEpochStr );
					clientRandom = data.slice(9);
					// next chunk recieved should be C2
					versionSent = true;
					return;
				}

				// Continue Handshake if acknowledgement not sent yet
				if( ! ackSent ){
					// Send S2 before recieving C2 as per handshake diagram 5.5 
					var S2 = clientEpochStr + pack('N',serverBench) + clientRandom;
					socket.write( S2, 'binary' );
					// recieve C2
					if( serverRandom !== data.slice( 8, 1536 ) ){
						throw new Error('Handshake error: server random echo does not match');
					}
					if( serverEpochStr !== data.slice(0,4) ){
						throw new Error('Handshake error: server epoch echo does not match');
					}
					clientBench = binParser.toInt( data.slice(4,8) ); // always seems to be zero?
					// Handshake done
					ackSent = true;
					// continue to the standard message handling code below
					data = data.slice(1536);
					if( ! data ){
						return;
					}
				}

				// have message data
				sys.puts( utils.hex(data) );
				// 6.1.1. Chunk Basic Header
				// id in range 2-63
				var b1 = data.charCodeAt(0);
				var id = b1 & 63; // <- (0-5) 6 bit mask
				// two byte header with 0 @todo TEST ME
				if( id === 0 ){
					id = data.charCodeAt(1);
				}	
				// three byte header with 1 @todo TEST ME
				else if( id === 1 ){
					id = ( data.charCodeAt(1) << 8 ) | data.charCodeAt(2);
				}
				// format always the first two bits
				var fmt = b1 & 192;
				sys.puts('id = '+id);
				sys.puts('fmt = '+fmt);
				// 6.1.2 Chunk message header
				// types dictated by fmt are one of four formats
				var len;
				if( fmt === 0 ){
					len = 11;
					
				}
				if( fmt === 1 ){
					len = 7;
				}
				if( fmt === 2 ){
					len = 3;
				}
				if( fmt === 3 ){
					len = 0;
				}
				else {
					throw new Error('Unsupported header type');
				}
				// End received data chunk
			}
			catch( Er ){
				sys.puts('Error in socket data handler: '+Er.message );
				socket.end();
			}
		} );
		/** */
		socket.addListener( 'connect', function(){
			try {
				sys.puts('socket:connect');
			}
			catch( Er ){
				sys.puts('Error in socket connect handler: '+Er.message );
			}
		} );
		/** */
		socket.addListener( 'end', function(){
			try {
				sys.puts('socket.end');
				socket.end();
			}
			catch( Er ){
				sys.puts('Error in socket end handler: '+Er.message );
			}
		} );
		/** */
		socket.addListener('timeout', function(){
			try {
				sys.puts('socket.timeout');
			}
			catch( Er ){
				sys.puts('Error in socket timeout handler: '+Er.message );
			}
		} );
		/** */
		socket.addListener('drain', function(){
			try {
				sys.puts('socket.drain');
			}
			catch( Er ){
				sys.puts('Error in socket drain handler: '+Er.message );
			}
		} ); 
		/** */
		socket.addListener('close', function( had_error ){
			try {
				sys.puts('socket.close, had_error='+had_error);
			}
			catch( Er ){
				sys.puts('Error in socket close handler: '+Er.message );
			}
		} );	
		/** */
		socket.addListener('error', function( Er ){
			try {
				sys.puts('socket.error: '+ Er.message ); // stack,errno,syscall
			}
			catch( Er ){
				sys.puts('Error in socket error handler: '+Er.message );
			}
		} );
	}
	catch( Er ){
		sys.puts('Error in server connect handler: '+Er.message );
	}
} );



/** */
server.addListener('close', function(errno) {
	try {
		sys.puts('server:close '+errno);
	}
	catch( Er ){
		sys.puts('Error in server close handler: '+Er.message );
	}
} );



server.listen( 1935, "192.168.51.6" );
sys.puts('Server ready');




// utility
function randomness( len ){
	var s = '';
	for( var i = 0; i < len; i++ ){
		 s += String.fromCharCode( Math.round( 255 * Math.random() ) );
	}
	return s;
}












