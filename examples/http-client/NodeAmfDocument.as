/**
 * node-amf Test Flash application.
 * simply fires an AMF request when movie is initialized
 */



package {
	
	import flash.display.MovieClip;
	import NodeAmfConnection;
	
	public class NodeAmfDocument extends MovieClip {
		
		public function NodeAmfDocument(){
			var conn:NodeAmfConnection = new NodeAmfConnection();
		}
				
	}
	
}