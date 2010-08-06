/**
 * Unicode string operations
 */
	


/**
 * Decode native AS string to string of single byte characters.
 * @link http://en.wikipedia.org/wiki/UTF-8
 * @param String native UTF-8 string
 * @return String decoded string
 */
exports.expand = function( u ) {
	var s = '';
	for( var i = 0; i < u.length; i++ ){
		var n = u.charCodeAt(i);
		s += exports.chr( n );
	}
	return s;		
}



/**
 * Convert UTF-8 codepoint to multi-byte sequence
 * @param integer utf-8 code point
 * @return string sequence of [one to four] single byte characters
 */
exports.chr = function chr( n ) {
	// 7 bit ASCII character - transparent to Unicode
	if( n < 0x80 ){
		return String.fromCharCode( n );
	}
	// compile 1-4 byte string depending on size of code point.
	// this could be more compact but shows the algorithms nicely ;)
	var w = null;
	var x = null;
	var y = null;
	var z = null;
	// Double byte sequence
	// 00000yyy yyzzzzzz ==> 110yyyyy 10zzzzzz
	if( n < 0x800 ){
		z = n & 63; // get z bits
		y = n >> 6; // get y bits
		y |= 192; // "110yyyyy"
		z |= 128; // "10zzzzzz"
	}
	// Triple byte sequence
	// xxxxyyyy yyzzzzzz ==> 1110xxxx 10yyyyyy 10zzzzzz
	else if( n < 0x10000 ){
		z = n & 63; // get z bits
		y = ( n >>= 6 ) & 63; // get y bits
		x = ( n >>= 6 ) & 15; // get x bits
		z |= 128; // prefix "10zzzzzz"
		y |= 128; // prefix "10yyyyyy"
		x |= 224; // prefix "1110xxxx"
	}
	// Four byte sequence
	// 000wwwxx xxxxyyyy yyzzzzzz ==>	11110www 10xxxxxx 10yyyyyy 10zzzzzz
	else if( n <= 0x10FFFF ){
		z = n & 63; // get z bits
		y = ( n >>= 6 ) & 63; // get y bits
		x = ( n >>= 6 ) & 63; // get x bits
		w = ( n >>= 6 ) & 7;  // get w bits
		z |= 128; // prefix "10zzzzzz"
		y |= 128; // prefix "10yyyyyy"
		x |= 128; // prefix "10xxxxxx"
		w |= 240; // prefix "11110www"
	}
	else {
		// UTF allows up to 1114111
		trace('UTF8 code points cannot be greater than 0x10FFFF [0x'+n.toString(16)+']');
		return '?';
	}
	// compile multi byte sequence 
	var s = '';
	( w == null ) || ( s += String.fromCharCode(w) );
	( x == null ) || ( s += String.fromCharCode(x) );
	( y == null ) || ( s += String.fromCharCode(y) );
	( z == null ) || ( s += String.fromCharCode(z) );	
	return s;
}	
	
	
	

/**
 * Collapse a multibyte sequence to native UTF-8
 * @param String
 * @return String
 */
exports.collapse = function( s ){

	// inner peeking function for skipping over multi-byte sequence
	function peek(){
		var n = s.charCodeAt( ++i );
		if( isNaN(n) ){
			throw new Error("Unexpected end of string, offset "+i);
		}
		return n;
	}

	// make a code point from a leading byte and aribitrary number of following bytes
	function make( t, num ) {
		for( var j = 0; j < num; j++ ){
			// get trailing 10xxxxxx byte
			var m = peek();
			if( ( m & 192 ) !== 128 ){
				throw new Error('Invalid byte 0x'+m.toString(16).toUpperCase()+' "'+String.fromCharCode(m)+'" at offset '+i);
			}
			t <<= 6;
			t |= ( m & 63 ); 
		}
		return String.fromCharCode(t);
	}

	// start iteration, skipping multibyte sequences wwhen leading byte found
	var u = '';
	for( var i = 0; i < s.length; i++ ){
		var n = s.charCodeAt(i);
		// 7-bit ASCII is transparent to Unicode
		if( ( n & 128 ) === 0 ){
			u += String.fromCharCode( n );
			continue;
		}
		// check for leading byte in UTF8 sequence, most likely first for speed
		if( ( n & 224 ) === 192 ){
			// is leading char in 2 byte sequence "110xxxxx"
			u += make( n & 31, 1 );
		}
		else if( ( n & 192 ) === 128 ){
			// is a solitary 10xxxxxx character - technically invalid, but common!
			// - todo - map Windows-1252 special cases in range 128-159
			u += String.fromCharCode( n );
		}
		else if( ( n & 240 ) === 224 ){
			// is leading char in 3 byte sequence "1110xxxx"
			u += make( n & 15, 2 );
		}
		else if( ( n & 248 ) === 240 ){
			// is leading char in 4 byte sequence "11110xxx"
			u += make( n & 7, 3 );
		}
		else {
			throw new Error( 'Invalid character "'+String.fromCharCode(n)+'" at offset '+ i );
			u += '?';
		}
	}
	return u;
}	


	

/**
 * Calculate real byte size of multibyte character string
 * @param String
 * @return Number
 */
exports.size = function( s ) {
	var b = 0;
	for( var i = 0; i < s.length; i++ ){
		var n = s.charCodeAt(i);
		if( n < 0x80 ){
			b += 1;
		}
		else if( n < 0x800 ){
			b += 2;
		}
		else if( n < 0x10000 ){
			b += 3;
		}
		else if( n <= 0x10FFFF ){
			b += 4;
		}
	}
	return b;
}	
	
	 
	 
