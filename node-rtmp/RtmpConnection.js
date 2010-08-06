

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
	// temporary buffer for incomplete packets
	this.buffer = '';
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
	return this.socket.write( data, 'binary' );
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
			// wait for full 1537 bytes
			this.buffer += data;
			if( this.buffer.length < 1537 ){
				return;
			}
			sys.puts('# handshake 1');
			this.handShake = new RtmpHandshake();
			//sys.puts( sys.inspect(this.handShake) );
			response = this.handShake.initialize( this.buffer );
			this.buffer = '';
			return this.write( response );
		}
		if( ! this.handShake.acknowledged ){
			// wait for at least 1536 bytes
			this.buffer += data;
			if( this.buffer.length < 1536 ){
				return;				
			}
			sys.puts('# handshake 2');
			response = this.handShake.acknowledge( this.buffer );
			//sys.puts( sys.inspect(this.handShake) );
			this.write( response );
			data = this.buffer.slice(1536);
			this.buffer = '';
		}
		
		sys.puts('# processing chunk, have '+data.length+' bytes');
		//sys.puts( utils.hex(data,16) );
		// process a chunk
		var Chunk = new RtmpChunk( data );
		// add to stream and inherit any known properties
		var Previous = this.chunkStreams[Chunk.chunkStreamId];
		if( Previous ){
			Chunk.inheritPrevious( Previous );
		}
		else {
			this.chunkStreams[Chunk.chunkStreamId] = Previous;
		}
		Chunk.parse( data );
		if( Chunk.payload.length >= Chunk.messageLen ){
			sys.puts('# processing message, have '+Chunk.payload.length+'/'+Chunk.messageLen+' bytes');
			var Msg = new RtmpMessage( Chunk.payload, Chunk.messageLen );
		}
	}
	catch( Er ){
		sys.puts( 'Error onSocketData: '+Er.message );
	}
}







