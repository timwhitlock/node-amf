
/** dependencies */ 
var amf = require('./amf');

 

/** export constructor */
exports.AMFPacket = AMFPacket;



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
		header = amf.header( header, value );
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
	var message = amf.message( value, requestURI, responseURI );
	this.messages.push( message );
	return message;
};



/** */
AMFPacket.prototype.serialize = function(){
	var s = amf.serializer( this.version );
	// write version flag 
	s.writeU16( this.version );
	// write packet headers
	s.writeU16( this.nheaders );
	for( var h in this.headers ){
		s.writeHeader( this.headers[h] );
	}
	// write packet messages
	s.writeU16( this.messages.length );
	for( var i = 0; i < this.messages.length; i++ ){
		s.writeMessage( this.messages[i], this.version );
	}
	// return serialized string
	return s.toString();
};



/** 
 * @static 
 */
AMFPacket.deserialize = function( src ){
	var Packet = new AMFPacket();
	var d = amf.deserializer( src );
	var v = d.readU16();
	if( v !== amf.AMF0 && v !== amf.AMF3 ){
		throw new Error('Invalid AMF packet');
	}
	// read headers
	var nheaders = d.readU16();
	while( 0 < nheaders-- ){
		Packet.addHeader( d.readHeader() );
	}
	// read messages
	var nmessages = d.readU16();
	while( 0 < nmessages-- ){
		Packet.messages.push( d.readMessage() );
	}
	return Packet;
};




















