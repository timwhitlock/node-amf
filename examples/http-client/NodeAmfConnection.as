/**
 * Extended NetConnection to test AMF requests
 * Set "host" variable to your nodejs http end point
 */



package {
	
	import flash.utils.setTimeout;
	import flash.net.NetConnection;
	import flash.net.ObjectEncoding;
	import flash.net.Responder;
	
	import flash.events.NetStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.AsyncErrorEvent;
	import flash.events.SecurityErrorEvent;
	
	public class NodeAmfConnection extends NetConnection {
		
		private var host:String = 'http://192.168.51.6:8081';
		private var responder:Responder;
		
		/**
		 * Constructor 
		 */
		function NodeAmfConnection(){
			// connect to AMF gateway and be ready to call methods
			responder = new Responder( this.onResponse, this.onFault );
			connect( host );
			this.client = this;
			addEventListener( NetStatusEvent.NET_STATUS, onNetStatus );
			addEventListener( IOErrorEvent.IO_ERROR, onError );
			addEventListener( AsyncErrorEvent.ASYNC_ERROR, onError );
			addEventListener( SecurityErrorEvent.SECURITY_ERROR, onError );
			proxyType = 'HTTP';
			// call all available AMF methods defined by the gateway
			call("test", responder );
			// test a complex structure with all data types
			call( "echo", responder, 
				 //strings
				 'Hello World', 'a£b', 
				 // numbers
				 Number.MIN_VALUE, -1234.5, -20000, -1, 0, 0.0123456, 2000000, 289764372, 1234.5678, Number.MAX_VALUE, Number.NaN,
				 // objects 
				 [ ,,{ test:'OK'}, new Date, new Date(0) ],
				 // other scalars
				 true, false, null, undefined
			);
			// test cyclic references; Array and Object
			var cyclicObj = { test:'ok' };
			cyclicObj.self = cyclicObj;
			var cyclicArr = [ 'hello world' ];
			cyclicArr.push( cyclicArr );
			call( "echo", responder, cyclicObj, cyclicArr );
			// test an async function that cannot return immediately
			call( "testAsync", responder );
			// test a function that will timeout
			//call( "testDead", responder );
		}
		
		
		/** NetStatusEvent handler - print out event info */
		public function onNetStatus( Evt:NetStatusEvent ):void {
			trace('[onNetStatus]');
			for( var s:String in Evt.info ){
				trace( " > "+s+": "+Evt.info[s]);
			}
		}
		
		/** Standard error event handler - print out event info */
		public function onError( Evt:Object ):void {
			trace('[onError]');
			for( var s:String in Evt ){
				trace( " > "+s+": "+String(Evt[s]) );
			}	
		}

		/** User-defined error event handler - this is sent to Flash by custom AMF headers in response packet */
		public function onCustomError( Err:Object ):void {
			trace('[onCustomError]');
			for( var s:String in Err ){
				trace( " > "+s+": "+String(Err[s]) );
			}
		}
		
		/** Successful Response handler - simple trace of top-level response data */
		public function onResponse( returnValue:Object, s:Object = ''):void {
			trace('[onResponse] '+s);
			dump( returnValue, '', '' );
		}
		
		
		/** Failed response handler - simple print out of fault - which is probably scalar */
		public function onFault( f:Object ):void{
			trace('[onFault] `'+ ( f as String ) + '`');
		}
		
		
		/** simple dump function for inspecting returned structures */
		private static function dump( value:*, tab:String = '', name:String = '' ):void {
			var prefix:String = tab;
			if( name ){
				prefix += '['+name+'] ';
			}
			if( value === undefined ){
				return trace( prefix + '(undefined)' );
			}
			if( value === null ){
				return trace( prefix + '(null)' );
			}
			if( value is Number ){
				return trace( prefix + '(Number) '+ value );
			}
			if( value is String ){
				return trace( prefix + '(String) "'+ value+'"' );
			}
			if( value is Boolean ){
				return trace( prefix + '(Boolean) '+ (value?'true':'false') );
			}
			if( value is Date ){
				return trace( prefix + '(Date) '+ (value as Date).toString() );
			}
			if( value.__amfref != null ){
				return trace( prefix + '(Cyclic)' );
			}
			value.__amfref = true;
			if( value is Array || value.length ){
				trace( prefix + '(Array length:'+value.length+') ');
			}
			else {
				trace( prefix + '(Object)');
			}
			for( var s:String in value ){
				if( s !== '__amfref' ){
					dump( value[s], ' . '+tab, s );
				}
			}
		}		
		
		
	}
	
	
	
	
	
	
	
	
	
	
	
	
}