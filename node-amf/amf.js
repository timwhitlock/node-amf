/**
 * Top level entry to AMF library for Node JS
 */

// object prototypes
var AMFTraits = require('./traits').AMFTraits;
var AMFPacket = require('./packet').AMFPacket;
var AMFMessage = require('./message').AMFMessage;
var AMFSerializer = require('./serialize').AMFSerializer;
var AMFDeserializer = require('./deserialize').AMFDeserializer;

 
/**
 * @return AMFPacket
 */
exports.packet = function( src ){
	var Packet;
	if( src ){
		Packet = AMFPacket.deserialize( src );
	}
	if( ! Packet ){
		Packet = new AMFPacket;
	}
	return Packet;
}


/**
 * @return AMFMessage
 */
exports.message = function( value, requestURI, responseURI ){
	return new AMFMessage( value, requestURI, responseURI );
}


/**
 * @return AMFHeader
 */
exports.header = function( value, requestURI, responseURI ){
	return new AMFMessage( value, requestURI, responseURI );
}
 

/**
 * @return AMFDeserializer
 */ 
exports.deserializer = function( src ){
	return new AMFDeserializer( src );
}  


/**
 * @return AMFSerializer
 */ 
exports.serializer = function(){
	return new AMFSerializer( 3 );
} 


/**
 * @return AMFTraits
 */
exports.traits = function(){
	return new AMFTraits;
}



/**
 * pseudo constants
 */
exports.AMF0 = 0;
exports.AMF3 = 3;
// AMF0 markers
exports.AMF0_NUMBER = 0;
exports.AMF0_BOOLEAN = 1;
exports.AMF0_STRING = 2;
exports.AMF0_OBJECT = 3;
exports.AMF0_MOVIECLIP = 4;
exports.AMF0_NULL = 5;
exports.AMF0_UNDEFINED = 6;
exports.AMF0_REFERENCE = 7;
exports.AMF0_ECMA_ARRAY = 8;
exports.AMF0_OBJECT_END = 9;
exports.AMF0_STRICT_ARRAY = 0x0A;
exports.AMF0_DATE = 0x0B;
exports.AMF0_LONG_STRING = 0x0C;
exports.AMF0_UNSUPPORTED = 0x0D;
exports.AMF0_RECORDSET = 0x0E;
exports.AMF0_XML_DOC = 0x0F;
exports.AMF0_TYPED_OBJECT = 0x10;
exports.AMF0_AMV_PLUS = 0x11;
// AMF3 markers
exports.AMF3_UNDEFINED = 0;
exports.AMF3_NULL = 1;
exports.AMF3_FALSE = 2;
exports.AMF3_TRUE = 3;
exports.AMF3_INTEGER = 4;
exports.AMF3_DOUBLE = 5;
exports.AMF3_STRING = 6;
exports.AMF3_XML_DOC = 7;
exports.AMF3_DATE = 8;
exports.AMF3_ARRAY = 9;
exports.AMF3_OBJECT = 0x0A;
exports.AMF3_XML = 0x0B;
exports.AMF3_BYTE_ARRAY = 0x0C;


