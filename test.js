/**
 * This is not a server.
 * This is simply a test script to ensure the node-amf libraries are working.
 */

// require system libraries 
var sys = require('sys'); 

// require node-amf module libraries from relative directory path
var amf = require('./node-amf/amf');
var utils = require('./node-amf/utils');


// data types to test with human-readable description
var tests = [
	// strings
	['empty string', ''],
	['ascii string', 'Hello World'],
	['unicode string', '£今\u4ECA"\u65E5日'],
	// numbers
	['zero',  0 ],
    ['integer in 1 byte u29 range', 0x7F ],
    ['integer in 2 byte u29 range', 0x00003FFF ],
    ['integer in 3 byte u29 range', 0x001FFFFF ],
    ['integer in 4 byte u29 range', 0x1FFFFFFF ],
    ['large integer', 4294967296 ],
    ['large negative integer', -4294967296 ],
	['small negative integer', -1 ],
	['small floating point', 0.123456789 ],
	['small negative floating point', -0.987654321 ],
	['Number.MIN_VALUE', Number.MIN_VALUE ],
	['Number.MAX_VALUE',  Number.MAX_VALUE ],
	['Number.NaN', Number.NaN],
	// other scalars
	['Boolean false', false],
	['Boolean true', true ],
	['undefined', undefined ],
	['null', null],
	// Arrays
	['empty array', [] ],
	['sparse array', [undefined,undefined,undefined,undefined,undefined,undefined] ],
	['multi-dimensional array',  [[[],[]],[],] ],
	// special objects
	['date object (epoch)', new Date(0) ],
	['date object (now)', new Date() ],
	// plain objects
	['empty object', {} ],
	['keyed object', { foo:'bar', 'foo bar':'baz' } ],
	['refs object', { foo: _ = { a: 12 }, bar: _ } ]
];



// Test each type individually through serializer and then deserializer
// note that this doesn't prove it works with Flash, just that it agrees with itself.
sys.puts('Serializing and deserializing '+tests.length+' test values');

for( var t = 0, n = 0; t < tests.length; t++ ){
	try {
		var descr = tests[t][0];
		var value = tests[t][1];
		var s = sys.inspect(value).replace(/\n/g,' ');
		sys.puts( ' > ' +descr+ ': ' + s);
		// serializing twice must not affect results
		amf.serializer().writeValue( value );
		// serialize and show AMF packet
		var Ser = amf.serializer();
		var bin = Ser.writeValue( value );
		//sys.puts( utils.hex(bin,16) );
		// deserialize and compare value
		var Des = amf.deserializer( bin );
		var value2 = Des.readValue( amf.AMF3 );
		var s2 =  sys.inspect(value2).replace(/\n/g,' ');
		// simple value test if value is scalar
		if( typeof value2 !== typeof value ){
			throw new Error('deserialized value of wrong type; ' + s2);
		}
		if( s !== s2 ){
			throw new Error('deserialized value does not match; ' + s2);
		}
		sys.puts('   OK');
		n++;
	}
	catch( Er ){
		sys.puts('**FAIL** ' + Er.message );
	}
}
sys.puts('Tests '+n+'/'+tests.length+' successful\n');





// Test a full AMF packet with headers and messages
sys.puts('Testing a full AMF packet');


// initialize a new response packet
try {
	var Packet = amf.packet();
	
	// add a simple header with a name and string value
	Packet.addHeader( 'header 1', 'Example header 1' );
	Packet.addHeader( 'header 2', 'Example header 2' );
	
	// Dummy request/response URIs
	var requestURI = '/1/onResult';
	var responseURI = '/1';
	
	// add construct as a single AMF message and return serialized, binary string
	for( var t = 0, n = 0; t < tests.length; t++ ){
		var struct = {};
		var descr = tests[t][0];
		var value = tests[t][1];
		struct[descr] = value;
		Packet.addMessage( struct, requestURI, responseURI ); 
	}
	
	// dump test packet in hex display
	var bin = Packet.serialize();
    sys.puts(' > Packet serialization ok');
    //sys.puts( utils.hex( bin ) );
}
catch( Er ){
	sys.puts('***FAIL*** error serializing packet: ' + Er.message );
	return;
}


// now attempt to deserialize the packet and get the data back
try {
	Packet = amf.packet( bin );
    sys.puts(' > Packet deserialization ok');
	//sys.puts( sys.inspect(Packet) );
}
catch( Er ){
	sys.puts('***FAIL*** error deserializing packet: ' + Er.message );
	return;
}











