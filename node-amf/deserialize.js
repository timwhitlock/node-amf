/**
 * AMF deserializer
 */

/** dependencies */ 
var amf = require('./amf');
var utils = require('./utils');
var utf8 = require('./utf8');
var bin = require('./bin');


/** export constructor */
exports.AMFDeserializer = AMFDeserializer;



// ----------------------------------

 

/** Constructor */
function AMFDeserializer( src ){
	this.s = src || '';
	this.i = 0;
	this.resetRefs();
	this.beParser = bin.parser( true, true );  // <- big endian binary unpacker
	this.leParser = bin.parser( false, true ); // <- little endian binary unpacker
}



/** */
AMFDeserializer.prototype.resetRefs = function(){
	this.refObj = []; // object references
	this.refStr = []; // string references
	this.refTra = []; // trait references
}



/** */
AMFDeserializer.prototype.shiftBytes = function( n ){
	if( n === 0 ){
		return '';
	} 
	var s = this.s.slice( 0, n );
	if( s.length !== n ){
		throw new Error("Not enough input to read "+n+" bytes, got "+s.length+", offset "+this.i);
	}
	this.s = this.s.slice(n);
	this.i += n;
	return s;
}
	
	
/** */	
AMFDeserializer.prototype.readU8 = function(){
	var s = this.shiftBytes(1);
	return s.charCodeAt(0);
}


/** */
AMFDeserializer.prototype.readU16 = function (){
	var s = this.shiftBytes(2);
	return this.beParser.toWord( s );
}


/** */
AMFDeserializer.prototype.readU32 = function(){
	var s = this.shiftBytes(4);
	return this.beParser.toDWord( s );
}


/** */
AMFDeserializer.prototype.readDouble = function(){
	var s = this.shiftBytes(8);
	if( '\0\0\0\0\0\0\xF8\x7F' === s ){
		return Number.NaN;
	}
	return this.beParser.toDouble( s );
}


/** */
AMFDeserializer.prototype.readU29 = function(){
	var i;
	var n = 0;
	var t = 0;
	while ( true ){
		if( ++t === 5 ){
			throw new Error("U29 range error, offset "+this.i);
		}
		i = this.readU8();
		// final whole byte if fourth bit
		if( 4 === t ){
		    n = i | ( n << 1 );
 		    break;
		}
		// else take just 7 bits
        n |= ( i & 0x7F );
        // next byte is part of the sequence if high bit is set
		if( i & 0x80 ){
		    n <<= 7;
			continue;
		}
		// else is final byte
		else {
    		break;
		}
	}
	return n;
}



/**
 * @return int signed integer
 */
AMFDeserializer.prototype.readInteger = function( version ){
	if( version === amf.AMF0 ){
		return this.readDouble();
	}
	// else AMF3 U29
	return this.readU29();
}





/** */
AMFDeserializer.prototype.readUTF8 = function( version ){
	var str, len;
	// AMF3 supports string references
	if( version === amf.AMF3 || version == null ){
		var n = this.readU29();
		if( n & 1 ){
			len = n >> 1;
			// index string unless empty
			if( len === 0 ){
				return '';
			}
			str = this.shiftBytes( len );
			this.refStr.push( str );
		}
		else {
			var idx = n >> 1;
			if( this.refStr[idx] == null ){
				throw new Error("No string reference at index "+idx+", offset "+this.i);
			}
			str = this.refStr[idx];
		}
	}
	// else simple AMF0 string
	else {
		len = this.readU16();
		str = this.shiftBytes( len );
	}
	return utf8.collapse(str);
}



/** */
AMFDeserializer.prototype.readValue = function( version ){
	var marker = this.readU8();
	// support AMV+ switch
	if( version === amf.AMF0 && marker === amf.AMF0_AMV_PLUS ){
		version = amf.AMF3;
		marker = this.readU8();
	}
	switch( version ){
	// AMF 3 types
	case amf.AMF3:
		switch( marker ){
		case amf.AMF3_UNDEFINED:
			return undefined;
		case amf.AMF3_NULL:
			return null;
		case amf.AMF3_FALSE:	
			return false;
		case amf.AMF3_TRUE:
			return true;
		case amf.AMF3_INTEGER:
			return this.readInteger();
		case amf.AMF3_DOUBLE:
			return this.readDouble();
		case amf.AMF3_STRING:
			return this.readUTF8( amf.AMF3 );
		case amf.AMF3_ARRAY:
			return this.readArray();
		case amf.AMF3_OBJECT:
			return this.readObject( amf.AMF3 );
		case amf.AMF3_DATE:
			return this.readDate();
		case amf.AMF3_BYTE_ARRAY:
			throw new Error('ByteArrays not yet supported, sorry');
			//return this.readByteArray();
		default:
			throw new Error('Type error, unsupported AMF3 marker: 0x' +utils.leftPad(marker.toString(16),2,'0')+ ', offset '+this.i);
		}
	// default to AMF0
	default:
		switch( marker ){
		case amf.AMF0_NUMBER:
			return this.readDouble();
		case amf.AMF0_STRING:
			return this.readUTF8( amf.AMF0 );
		case amf.AMF0_UNDEFINED:
			return undefined;
		case amf.AMF0_NULL:
			return null;
		case amf.AMF0_BOOLEAN:
			return this.readBoolean();
		case amf.AMF0_STRICT_ARRAY:
			return this.readStrictArray();
		case amf.AMF0_DATE:
			return this.readDate();	
		case amf.AMF0_OBJECT:
			return this.readObject( amf.AMF0 );			
		default:
			throw new Error('Type error, unsupported AMF0 marker: 0x' +utils.leftPad(marker.toString(16),2,'0')+ ', offset '+this.i);
		}
	}
}


/** */
AMFDeserializer.prototype.readBoolean = function(){
	return Boolean( this.readU8() );
}


/** */
AMFDeserializer.prototype.readStrictArray = function(){
	var a = [];
	var n = this.readU32();
	for( var i = 0; i < n; i++ ){
		a.push( this.readValue( amf.AMF0 ) );
	}
	return a;
}


/** */
AMFDeserializer.prototype.readArray = function(){
	var a = [];
	var n = this.readU29();
	// reference or value
	if( n & 1 ){
		this.refObj.push(a);
		// count dense portion
		var len = n >> 1;
		// iterate over over associative portion, until empty string terminates
	 	var key;
	 	while( key = this.readUTF8(amf.AMF3) ){
	 		a[key] = this.readValue(amf.AMF3);
		}
		// append dense values
		for( var i = 0; i < len; i++ ){
			a.push( this.readValue( amf.AMF3 ) );
		}
	}
	// else is reference index
	else {
		var idx = n >> 1;
		if( this.refObj[idx] == null ){
			throw new Error("No array reference at index "+idx+", offset "+this.i);
		} 
		a = this.refObj[idx];
	}
	return a;
}



/** */
AMFDeserializer.prototype.readObject = function( version ){
	var prop, Obj = {};
	// support AMF0 objects
	if( version === amf.AMF0 ){
		while( prop = this.readUTF8( amf.AMF0 ) ){
			Obj[prop] = this.readValue( amf.AMF0 );
		}
		// next must be object end marker
		var end = this.readU8();
		if( end !== amf.AMF0_OBJECT_END ){
			throw new Error('Expected object end marker, got 0x'+end.toString(16) );
		}
		return Obj;
	}
	// else assume AMF3
	var Traits;
	// check if instance follows (U29O-traits)
	var n = this.readU29();
	if( n & 1 ){
		// check if trait data follows
		if( n & 2 ){
			Traits = amf.traits();
			this.refTra.push( Traits );			
			// check if traits externalizable follows (U29O-traits-ext)
			if( n & 4 ){
				Traits.clss = this.readUTF8( amf.AMF3 );
				// follows an indeterminable number of bytes
				// Extenalizable server-side class must perform custom deserialization
				// @todo Externalizable class deserializing
				throw new Error('Externalizable classes not yet supported, sorry');
			}
			else {
				Traits.dyn = Boolean( n & 8 );
				Traits.clss = this.readUTF8( amf.AMF3 );
				// iterate over declared member names
				var proplen = n >> 4;
				for( var i = 0, prop; i < proplen; i++ ){
					prop = this.readUTF8( amf.AMF3 );
					Traits.props.push( prop );
				}
			}
		}
		// else trait reference (U29O-traits-ref)
		else {
			var idx = n >> 2;
			if( this.refTra[idx] == null ){
				throw new Error("No traits reference at index "+idx+", offset "+this.i);
			}
			Traits = this.refTra[idx];
		}
		// Have traits - Construct instance
		// @todo support class mapping somehow?
		this.refObj.push( Obj );	
		for( var i = 0; i < Traits.props.length; i++ ){
			prop = Traits.props[i];
			Obj[prop] = this.readValue( amf.AMF3 );
		}
		// iterate over dynamic properties until empty string
		if( Traits.dyn ){
			while( prop = this.readUTF8( amf.AMF3 ) ){
				Obj[prop] = this.readValue( amf.AMF3 );
			}
		}
	} 
	// else object reference ( U29O-ref )
	else {
		var idx = n >> 1;
		if( this.refObj[idx] == null ){
			throw new Error("No object reference at index "+idx+", offset "+this.i);
		}
		Obj = this.refObj[idx];
	}
	return Obj;
}


/** */
AMFDeserializer.prototype.readDate = function(){
	var u, d;
	// check if instance follows (U29O-ref)
	var n = this.readU29();
	if( n & 1 ){
		// create and index a new date object
		u = this.readDouble();
		d = new Date( u );
		this.refObj.push( d );
	}
	else {
		var idx = n >> 1;
		if( this.refObj[idx] == null || ! this.refObj[idx] instanceof Date ){
			throw new Error("No date object reference at index "+idx+", offset "+this.i);
		}
		d = this.refObj[idx];
	}
	return d;
}





/* @todo port byte array object to JS? - below is PHP
AMFDeserializer.prototype.readByteArray = function(){
	$n = $this->read_U29();
	// test if instance follows
	if( $n & 1 ){
		$len = $n >> 1;
		$raw = $this->shift_bytes( $len );
		$Obj = new AMFByteArray( $raw );
		// index byte array, even if zero length
		$this->ref_obj[] = $Obj;
	}
	// else object reference ( U29O-ref )
	else {
		$idx = $n >> 1;
		if( ! isset($this->ref_obj[$idx]) ){
			throw new Error("No byte array reference at index $idx, offset $this->i");
		} 
		$Obj = $this->ref_obj[$idx];
	}
	return $Obj;
}
*/


/**
 * @return AMFHeader
 */
AMFDeserializer.prototype.readHeader = function(){
	this.resetRefs();
	var name = this.readUTF8( amf.AMF0 );
	var Header = amf.header( name, '' );
	Header.mustunderstand = Boolean( this.readU8() );
	var len = this.readU32(); // we won't actually use the length
	// @todo lazy creation of header by storing known header byte length
	Header.value = this.readValue( amf.AMF0 );
	return Header;
}



/**
 * @return AMFMessage
 */
AMFDeserializer.prototype.readMessage = function(){
	this.resetRefs();
	var Msg = amf.message('','','');
	// request URI - AMF0 UTF-8
	Msg.requestURI = this.readUTF8( amf.AMF0 );
	// response URI - AMF0 UTF-8
	Msg.responseURI = this.readUTF8( amf.AMF0 );
	// message length, which may be -1, shall be ignored
	var len = this.readU32(); // we won't actually use the length
	// message value always AMF0 even in AMF3
	Msg.value = this.readValue( amf.AMF0 );
	return Msg;
}




	
	
