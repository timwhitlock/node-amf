
/** dependencies */ 
var amf = require('./amf');


exports.createHeader = function( name, value ){
	return new AMFHeader( name, value );
}


// ----------------------------------


function AMFHeader( name, value ){
	this.mustunderstand = false;
	this.name = name;
	this.value = value;
}


/** */
AMFHeader.prototype.toString = function(){
	return '[Object AMFHeader]';
}


	
	
	


