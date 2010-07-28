
/** dependencies */ 
var amf = require('./amf');


/** export constructor */
exports.AMFHeader = AMFHeader;



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


	
	
	


