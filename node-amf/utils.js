/**
 * Utility functions for use with node-amf module
 */


//var expandUTF8 = require('./utf8').expand;




/** */
exports.leftPad = function( s, n, c ){
	while( s.length < n ){
		s = c + s;
	}
	return s;
}



/** */
exports.reverseString = function( s ){
	var r = '', i = 0, n = - s.length;
	while( i > n ){
		r += s.substr(--i,1);
	}
	return r;
}



/** */
exports.toHex = function ( d, n ){
	var h = d.toString(16).toUpperCase();
	return exports.leftPad( h, 2, '0' );
}



/** 
 * Hex dump function.
 */
exports.hex = function( bin, cols ){
	//bin = expandUTF8( bin );
	cols || ( cols = 24 );
	var s = '', line = [];
	var c, d, i = 0;
	while( bin ){
		c = bin.charAt(0);
		d = bin.charCodeAt(0);
		bin = bin.substr(1);
		// print hex
		s += exports.toHex( d, 2 )+ ' ';
		// add printable to line
		if( d === 9 ){
			line.push(' '); // <- tab
		}
		else if ( d < 32 || d > 126 ) {
			line.push('.'); // <- unprintable // well, non-ascii
		}
		else {
			line.push(c); // <- printable
		}
		// wrap at cols, and print plain text
		if( ++i === cols ){
			s += ' '+line.join('') + '\n';
			line = [];
			i = 0;
		}
		else if( i % 8 === 0 ){
			s += ' ';
		}
	}
	// pick up remainder
	if( line.length ){
		while( i++ < cols ){
			s += '   ';
		}
		s += ' '+line.join('') + '\n';
	} 
	return s;
}