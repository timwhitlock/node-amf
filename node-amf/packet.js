
/** dependencies */ 
var amf = require('./amf');
var createHeader  = require('./header').createHeader;
var createMessage = require('./message').createMessage;
var createSerializer = require('./serialize').createSerializer;
var createDeserializer = require('./deserialize').createDeserializer;

 

/** export of factory function */
exports.createPacket = function( src ){
	var Packet;
	if( src ){
		Packet = AMFPacket.deserialize( src );
	}
	if( ! Packet ){
		Packet = new AMFPacket;
	}
	return Packet;
}


// -----------------------------------


/** Constructor */
function AMFPacket( v ){
	if( v == null ){
		v = amf.AMF3;
	}
	this.version = v;
	this.headers = {};
	this.nheaders = 0;
	this.messages = [];
}


/** */
AMFPacket.prototype.toString = function(){
	return '[Object AMFPacket]';
}



/**  */
AMFPacket.prototype.addHeader = function( header, value ){
	if( typeof header === 'string' ){
		header = createHeader( header, value );
	}
	if( this.headers[header.name] ){
		// @todo multiple headers of same name? currently replaces
	}
	else {
		this.nheaders++;
	}
	this.headers[header.name] = header
	return header;
};



/** */
AMFPacket.prototype.addMessage = function( value, requestURI, responseURI ){
	var message = createMessage( value, requestURI, responseURI );
	this.messages.push( message );
	return message;
};



/** */
AMFPacket.prototype.serialize = function(){
	var s = createSerializer( this.version );
	// write version flag 
	s.writeU16( this.version );
	// write packet headers
	s.writeU16( this.nheaders );
	for( var h in this.headers ){
		s.writeHeader( this.headers[h] );
		s.resetRefs();
	}
	// write packet messages
	s.writeU16( this.messages.length );
	for( var i = 0; i < this.messages.length; i++ ){
		s.writeMessage( this.messages[i], this.version );
		s.resetRefs();
	}
	// return serialized string
	return s.toString();
};



/** 
 * @static 
 */
AMFPacket.deserialize = function( src ){
	var Packet = new AMFPacket();
	var d = createDeserializer( src );
	var v = d.readU16();
	if( v !== amf.AMF0 && v !== amf.AMF3 ){
		throw new Error('Invalid AMF packet');
	}
	// read headers
	var nheaders = d.readU16();
	while( 0 < nheaders-- ){
		Packet.addHeader( d.readHeader() );
		d.resetRefs();
	}
	// read messages
	var nmessages = d.readU16();
	while( 0 < nmessages-- ){
		Packet.messages.push( d.readMessage() );
	}
	return Packet;
};




















