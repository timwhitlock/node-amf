


/** export constructor */
exports.AMFTraits = AMFTraits;



// ----------------------------------


function AMFTraits(){
	this.clss  = 'Object'; // object class
	this.dyn   = false;    // whether object is dynamic (i.e. non strict about members)
	this.props = [];       // class members
}


/** */
AMFTraits.prototype.toString = function(){
	return '[Object AMFTraits]';
}


	
	
	


