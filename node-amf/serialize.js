/**
 * AMF serializer
 */


/** dependencies */ 
var amf = require('./amf');
var utils = require('./utils');
var utf8 = require('./utf8');
var bin = require('./bin');


exports.AMFSerializer = AMFSerializer;


// ----------------------------------


function AMFSerializer( v ){
	this.version = v;
	this.s = '';
	this.resetRefs();
	this.beParser = bin.parser( true, true );  // <- big endian binary packer
	this.leParser = bin.parser( false, true ); // <- little endian binary packer
}


/** */
AMFSerializer.prototype.toString = function(){
	return this.s;
}



/** */
AMFSerializer.prototype.resetRefs = function(){
	this.refObj = []; // object references
	this.refStr = []; // string references
	this.refTra = []; // trait references
}


/** */
AMFSerializer.prototype.writeHeader = function ( Header ){
	this.resetRefs();
	// header must be AMF0
	var v = this.version;
	this.version = amf.AMF0;
	this.writeUTF8( Header.name );
	this.writeU8( Header.mustunderstand ? 1 : 0 );
	// header of unknown length until serialized (U32)-1
	this.s += '\xFF\xFF\xFF\xFF';
	var s = this.writeValue( Header.value );
	// reinstate version if it wasn't AMF0
	this.version = v;
	return s;
}



/** */
AMFSerializer.prototype.writeMessage = function ( Message, v ){
	this.resetRefs();
	// message wrappers must be AMF0
	var vv = this.version;
	this.version = amf.AMF0;
	this.writeUTF8( Message.requestURI );
	this.writeUTF8( Message.responseURI );
	// message of unknown length until serialized (U32)-1
	this.s += '\xFF\xFF\xFF\xFF';
	// switch version if AMF3
	if( v === amf.AMF3 ){
		this.writeU8( amf.AMF0_AMV_PLUS );
	}
	this.version = v;
	this.writeValue( Message.value );
	this.version = vv;
	return this.s;
}




/**
 * Write any JavaScript value, automatically chooses which data type to use
 * @param mixed
 * @return string
 */
AMFSerializer.prototype.writeValue = function( value ){
	// undefined
	if( value === undefined ){
		return this.writeUndefined();
	}
	// null
	if( value === null ){
		return this.writeNull();
	}
	// strings
	if( 'string' === typeof value ){
		return this.writeUTF8( value, true );
	}
	// numbers
	if( 'number' === typeof value ){
		return this.writeNumber( value, true );
	}
	// booleans
	if( 'boolean' === typeof value ){
		return this.writeBool( value );
	}
	// arrays
	if( 'function' === typeof value.push ){
		return this.writeArray( value );
	}
	// special object types
	if( value instanceof Date ){
		return this.writeDate( value );
	}
	// else write vanilla Object
	return this.writeObject( value );
}



/** */
AMFSerializer.prototype.writeUndefined = function(){
	var marker = this.version === amf.AMF3 ? amf.AMF3_UNDEFINED : amf.AMF0_UNDEFINED;
	return this.writeU8( marker );
}



/** */
AMFSerializer.prototype.writeNull = function(){
	var marker = this.version === amf.AMF3 ? amf.AMF3_NULL : amf.AMF0_NULL;
	return this.writeU8( marker );
}



/** */
AMFSerializer.prototype.writeBool = function( value ){
	// AMF3
	if( this.version === amf.AMF3 ){
		var marker = value ? amf.AMF3_TRUE : amf.AMF3_FALSE;
		return this.writeU8( marker );
	}
	// AMF0
	else {
		this.writeU8( amf.AMF0_BOOLEAN );
		return this.writeU8( value ? 1 : 0 );
	}
}


/** */
AMFSerializer.prototype.writeUTF8 = function( value, writeMarker ){
	if( typeof value !== 'string' ){
		value = '';
	}
	var bin = utf8.expand( value );
	var len = bin.length; 
	// AMF3
	if( this.version === amf.AMF3 ){
		if( writeMarker ){
			this.writeU8( amf.AMF3_STRING );
		}
		var flag = ( len<<1 ) | 1;
		this.writeU29( flag );
	}
	// AMF0
	else {
		if( writeMarker ){
			this.writeU8( amf.AMF0_STRING );
		}
		this.writeU16( len );
	}
	// append string as-is
	return this.s += bin;
}



/** */
AMFSerializer.prototype.writeArray = function( value ){
	var len = value.length;
	// AMF3
	if( this.version === amf.AMF3 ){
		this.writeU8( amf.AMF3_ARRAY );
		// support object references
        var n = this.refObj.indexOf( value );
        if( n !== -1 ){
            return this.writeU29( n << 1 );
        }
		// else index object reference
		this.refObj.push( value );
		// flag with XXXXXXX1 indicating length of dense portion with instance
		var flag = ( len << 1 ) | 1;
		this.writeU29( flag );
		// no assoc values in JavaScript - end with empty string
		this.writeUTF8('');
	}
	// AMF0 strict array
	else {
		this.writeU8( amf.AMF0_STRICT_ARRAY );
		this.writeU32( len );
	}
	// write members (the dense portion - all we need in JS)
	for( var i = 0; i < len; i++ ){
		this.writeValue( value[i] );
	}
	return this.s;
}



/** */
AMFSerializer.prototype.writeObject = function( value ){
	if( this.version !== amf.AMF3 ){
		throw new Error("This library doesn't support AMF0 objects, use AMF3");
	}
	this.writeU8( amf.AMF3_OBJECT );
	// support object references
    var n = this.refObj.indexOf( value );
    if( n !== -1 ){
        return this.writeU29( n << 1 );
    }
	// else index object reference
	this.refObj.push( value );
	// flag with instance, no traits, no externalizable
	this.writeU29( 11 );
	this.writeUTF8('Object');
	// write serializable properties
	for( var s in value ){
		if( typeof value[s] !== 'function' ){
			this.writeUTF8(s);
			this.writeValue( value[s] );
		}
	}
	// terminate dynamic props with empty string
	return this.writeUTF8('');
}



/** */ 
AMFSerializer.prototype.writeDate = function( d ){
	if( this.version !== amf.AMF3 ){
		throw new Error("This library doesn't support AMF0 objects, use AMF3");
	}
	this.writeU8( amf.AMF3_DATE );	
	this.writeU29( 1 );
	return this.writeDouble( d.getTime() );
}





/** */
AMFSerializer.prototype.writeNumber = function( value, writeMarker ){
	// serialize as integers if possible
	var n = parseInt( value );
	if( n === value && n >= 0 && n < 0x20000000 ){
		return this.writeU29( value, writeMarker );
	}
	return this.writeDouble( value, writeMarker );
}

	


/** */
AMFSerializer.prototype.writeDouble = function( value, writeMarker ){
	if( writeMarker ){
		var marker = this.version === amf.AMF3 ? amf.AMF3_DOUBLE : amf.AMF0_NUMBER;
		this.writeU8( marker );
	}
	// support for NaN as double "00 00 00 00 00 00 F8 7F"
	if( isNaN(value) ){
		this.s += '\0\0\0\0\0\0\xF8\x7F';
	}
	else {
		this.s += this.beParser.fromDouble( value );
	}
	return this.s;
}



/** */
AMFSerializer.prototype.writeU8 = function( n ){
	return this.s += this.beParser.fromByte(n); 
}



/** */
AMFSerializer.prototype.writeU16 = function( n ){
	return this.s += this.beParser.fromWord(n); 
}



/** */
AMFSerializer.prototype.writeU32 = function( n ){
	return this.s += this.beParser.fromDWord(n); 
}



/** AMF3 only */
AMFSerializer.prototype.writeU29 = function( n, writeMarker ){
	// unsigned range: 0 -> pow(2,29)-1; 0 -> 0x1FFFFFFF
	// signed range: -pow(2,28) -> pow(2,28)-1; -0x10000000 -> 0x0FFFFFFF
	if( n < 0 ){
        throw new Error('U29 range error, '+n+' < 0');
        //n += 0x20000000;
	}
	var a, b, c, d;
	if( n < 0x00000080 ){
		// 0AAAAAAA
		a = n;
	}
	else if( n < 0x00004000 ){
		//                      0x80-FF  0x00-7F    
		// 00AAAAAA ABBBBBBB -> 1AAAAAAA 0BBBBBBB
		b = n & 0x7F;
		a = 0x80 | ( n>>7 & 0x7F ); 
	}
	else if( n < 0x00200000 ){
		//                               0x80-FF  0x80-FF  0x00-7F
		// 000AAAAA AABBBBBB BCCCCCCC -> 1AAAAAAA 1BBBBBBB 0CCCCCCC
		c = n & 0x7F;
		b = 0x80 | ( (n>>=7) & 0x7F ); 
		a = 0x80 | ( (n>>=7) & 0x7F );
	}
	else if( n < 0x20000000 ){
		//                                        0x80-FF  0x80-FF  0x80-FF  0x00-FF
		// 000AAAAA AABBBBBB BCCCCCCC DDDDDDDD -> 1AAAAAAA 1BBBBBBB 1CCCCCCC DDDDDDDD
		d = n & 0xFF;
		c = 0x80 | ( (n>>=8) & 0x7F ); 
		b = 0x80 | ( (n>>=7) & 0x7F );
		a = 0x80 | ( (n>>=7) & 0x7F );
	}
	else {
		throw new Error('U29 range error, '+n+' > 0x1FFFFFFF');
	}
	if( writeMarker ){
		this.writeU8( amf.AMF3_INTEGER );
	}
	this.writeU8( a );
	if( b != null ){
		this.writeU8( b );
		if( c != null ){
			this.writeU8( c );
			if( d != null ){
				this.writeU8( d );
			}
		}
	}
	return this.s;
}















