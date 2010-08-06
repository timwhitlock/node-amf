/**
 * A chunk object represents a chunk of data that is part of a chunk stream.
 * Multiple chunks form complete messages, but chunks in the same stream may or may not belong to the same message
 */

var sys = require('sys');

var utils = require('../node-amf/utils');
var amf = require('../node-amf/amf');
var bin = require('../node-amf/bin');



// export single class
exports.RtmpChunk = RtmpChunk;



// utility to unpack numbers
var beParser = bin.parser( true, true );  // big endian binary parser
var leParser = bin.parser( false, true ); // little endian binary parser



/**
 * Constructor
 */
function RtmpChunk( data ){
	// sniff data to determine chunk id
	var b1 = data.charCodeAt(0);
	this.chunkStreamId = b1 & 63; // <- (0-5) 6 bit mask
	// two byte header with 0 @todo TEST ME
	if( this.chunkStreamId === 0 ){
		this.chunkStreamId = data.charCodeAt(1);
		this.offset = 2;
	}	
	// three byte header with 1 @todo TEST ME
	else if( this.chunkStreamId === 1 ){
		this.chunkStreamId = ( data.charCodeAt(1) << 8 ) | data.charCodeAt(2);
		this.offset = 3;
	}
	else {
		this.offset = 1;
	}
	// format always the first two bits
	this.format = b1 & 192;
	if( this.format === 0 ){
		this.headerLen = 11;
	}
	else if( this.format === 1 ){
		this.headerLen = 7;
	}
	else if( this.format === 2 ){
		this.headerLen = 3;
	}
	else if( this.format === 3 ){
		this.headerLen = 0;
	}
	else {
		throw new Error('Unsupported header type: '+sys.inspect(fmt));
	}
}



/** 
 * Inherit properties from an existing Chunk
 * @var Array existing chunks in our stream
 */
RtmpChunk.prototype.inheritStream = function( Stream ){
	// latest chunk in stream should hold all parameters we need
	var Previous = Stream[ Stream.length -1 ];
	// format:0 should only be the first chunk in a stream
	if( this.format === 0 || ! Previous ){
		return;
	}
	// always inherit message stream id
	this.messageStreamId = Previous.messageStreamId;
	// inherit timestamp
	if( this.format === 3 ){
		this.timestamp = Previous.timestamp;
	}
	// inherit message length and message type id
	if( this.format === 2 || this.format === 3 ){
		this.messageLen = Previous.messageLen;
		this.messageType = Previous.messageType;
	}
}



/**
 * 
 */
RtmpChunk.prototype.parse = function( data ){
 	// Parse header according to our format type
	this.header = data.substr( this.offset, this.headerLen );
	// timestamp delta - 3 bytes (always a timestamp, if there's a header at all)
	if( this.format !== 3 ){
		this.timestamp = beParser.decodeInt( this.header.slice(0,3), 24, false );
	}
	else if( this.timestamp == null ){
		throw new Error('Chunk has not inherited timestamp from previous chunk in stream');
	}
	// message length - 3 bytes / 24 bit unsigned
	if( this.format === 0 || this.format === 1 ){
		this.messageLen = beParser.decodeInt( this.header.slice(3,6), 24, false );
	}
	else if( this.messageLen == null ){
		throw new Error('Chunk has not inherited message length from previous chunk in stream');
	}
	// message type id - 1 byte  / 8 bit unsigned
	if( this.format === 0 || this.format === 1 ){
		this.messageType = beParser.toByte( this.header.slice(6,7) );
	}
	else if( this.messageType == null ){
		throw new Error('Chunk has not inherited message type from previous chunk in stream');
	}
	// message stream id - unsigned long - 4 bytes (little Endian)
	if( this.format === 0 ){
		this.messageStreamId = leParser.toDWord( this.header.slice(7,11) );
	}
	else if( this.messageStreamId == null ){
		throw new Error('Chunk has not inherited message stream id from previous chunk in stream');
	}
	// 6.1.3 extended timestamp
	if( this.timestamp === 0x00ffffff ){
		throw new Error('@todo extended timestamp');
	}
	// Snip off the message data, and return the next chunk
	//this.message = data.substr( this.offset + this.headerLen, this.messageLen );
	//return data.slice( this.offset + this.headerLen + this.messageLen );
	
	// @todo really unsure about this, I'm getting message length falling short of bytes available, should be the opposite?
	this.message = data.slice( this.offset + this.headerLen );
	return '';
}




