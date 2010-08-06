/**
 * node-amf Test RTMP application.
 */



package {
	
	import flash.display.MovieClip;
	import NodeRtmpConnection;
	import flash.display.LoaderInfo;
	
	public class NodeRtmpDocument extends MovieClip {
		
		public function NodeRtmpDocument(){
			var conn:NodeRtmpConnection = new NodeRtmpConnection();
			//trace( this.loaderInfo.url );
			//trace( this.loaderInfo.url.length );
		}
				
	}
	
}