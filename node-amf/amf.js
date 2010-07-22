/**
 * Top level entry to AMF library for Node JS
 */
var createPacket = require('./packet').createPacket; 

 
/**
 * @return AMFPacket
 */
exports.packet = function( src ){
	return createPacket( src );
}
 


function define( name, value ){
	exports[name] = value;
};


define('AMF0',0);
define('AMF3',3);

define('AMF0_NUMBER', 0 );
define('AMF0_BOOLEAN', 1 );
define('AMF0_STRING', 2 );
define('AMF0_OBJECT', 3 );
define('AMF0_MOVIECLIP', 4 );
define('AMF0_NULL', 5 );
define('AMF0_UNDEFINED', 6 );
define('AMF0_REFERENCE', 7 );
define('AMF0_ECMA_ARRAY', 8 );
define('AMF0_OBJECT_END', 9 );
define('AMF0_STRICT_ARRAY', 0x0A );
define('AMF0_DATE', 0x0B );
define('AMF0_LONG_STRING', 0x0C );
define('AMF0_UNSUPPORTED', 0x0D );
define('AMF0_RECORDSET', 0x0E );
define('AMF0_XML_DOC', 0x0F );
define('AMF0_TYPED_OBJECT', 0x10 );
define('AMF0_AMV_PLUS', 0x11 );

define('AMF3_UNDEFINED', 0 );
define('AMF3_NULL', 1 );
define('AMF3_FALSE', 2 );
define('AMF3_TRUE', 3 );
define('AMF3_INTEGER', 4 );
define('AMF3_DOUBLE', 5 );
define('AMF3_STRING', 6 );
define('AMF3_XML_DOC', 7 );
define('AMF3_DATE', 8 );
define('AMF3_ARRAY', 9 );
define('AMF3_OBJECT', 0x0A );
define('AMF3_XML', 0x0B );
define('AMF3_BYTE_ARRAY', 0x0C );








/** Simple traits object */
exports.Traits = function(){
	this.clss  = 'Object'; // object class
	this.dyn   = false;    // whether object is dynamic (i.e. non strict about members)
	this.props = [];       // class members
}



