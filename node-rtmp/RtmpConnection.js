

var sys = require('sys');

var utils = require('../node-amf/utils');

var RtmpHandshake = require('./RtmpHandshake').RtmpHandshake;
var RtmpMessage = require('./RtmpMessage').RtmpMessage;
var RtmpChunk = require('./RtmpChunk').RtmpChunk;

// export single class
exports.RtmpConnection = RtmpConnection;



/**
 * RTMP constructor function
 */
function RtmpConnection( socket ){
	socket.setEncoding("binary");
	this.socket = socket;
	this.handShake = null;
	this.messageStreams = [];
	this.chunkStreams = [];
	// listen for data
	var Conn = this;
	socket.addListener( 'data', function(data){ 
		Conn.onSocketData( data ); 
	} );
	socket.addListener( 'connect', function(){
		sys.puts('socket:connect');
	} );
	socket.addListener( 'end', function(){
		sys.puts('socket.end');
		socket.end();
	} );
	socket.addListener('timeout', function(){
		sys.puts('socket.timeout');
	} );
	socket.addListener('drain', function(){
		sys.puts('socket.drain');
	} ); 
	socket.addListener('close', function( had_error ){
		sys.puts('socket.close, had_error='+had_error);
	} );	
	socket.addListener('error', function( Er ){
		sys.puts('socket.error: '+ Er.message ); // stack,errno,syscall
	} );
}




/**
 * Common socket writing function
 */
RtmpConnection.prototype.write = function( data ){
	this.socket.write( data, 'binary' );
}




/** 
 * Data listener 
 */
RtmpConnection.prototype.onSocketData = function( data ){
	try {
		var response;
		sys.puts('socket.data [length:'+data.length+']');
		// complete handshake if not already
		if( ! this.handShake ){
			sys.puts('# handshake 1');
			this.handShake = new RtmpHandshake();
			//sys.puts( sys.inspect(this.handShake) );
			response = this.handShake.initialize(data);
			return this.write( response );
		}
		if( ! this.handShake.acknowledged ){
			sys.puts('# handshake 2');
			response = this.handShake.acknowledge(data)
			//sys.puts( sys.inspect(this.handShake) );
			this.write( response );
			data = data.slice(1536);
		}
		while( data ){
			sys.puts('# processing chunk, have '+data.length+' bytes');
			sys.puts( utils.hex(data) );
			// process a chunk
			var Chunk = new RtmpChunk( data );
			// add to stream and inherit any known properties
			var Stream = this.chunkStreams[Chunk.chunkStreamId];
			if( Stream ){
				Chunk.inheritStream( Stream );
			}
			else {
				Stream = this.chunkStreams[Chunk.chunkStreamId] = [];
			}
			Stream.push( Chunk );
			// parse chunk returning any leftover chunk data
			data = Chunk.parse( data );
		}
	}
	catch( Er ){
		sys.puts( 'Error onSocketData: '+Er.message );
	}
	// @todo I AM HERE - testing message parsing with first single message chunk
	var Msg = new RtmpMessage( Chunk.message );
	sys.puts( sys.inspect(Chunk) );
	sys.puts( sys.inspect(Msg) );
}







