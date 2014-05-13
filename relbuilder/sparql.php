<?PHP
	/*
	 * Sparql class
	 * Author: Daniel Aineah
	 * Contains basic methods for querying and updating data on a sparql endpoint
	 * Works with openrdf-sesame for now. Will include other graph datastores
	 *	as it becomes necessary.
	 * 
	 * EXAMPLE FOR QUERY
	 * -----------------
	 *		try
	 *		{
	 *			$action = "query";
	 *			$endpoint = "http://collection.britishart.yale.edu/openrdf-sesame/repositories/jobconnect2";
	 *			$sparqlStr = "SELECT * WHERE {?s ?p ?o . LIMIT 10}";
	 
	 *			//create sparql object
	 *			$sparql = new Sparql("query", $sparqlString, $endpoint);
	 *
	 *			//execute "query" action
	 *			$sparql->execute();
	 *
	 *			//retrieve results from sparql object
	 *			$results = $sparql->results();
	 *		}
	 *		catch (Exception $e)
	 *		{
	 *			echo 'Caught exception: ',  $e->getMessage(), "\n";
	 *		}
	 * ------------------------------------------------------------------------------------
	 * EXAMPLE FOR UPDATE:
	 * -------------------
	 *		Same as above example, except for:
	 *		$action = "update";
	 *		$sparqlStr = "PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
	 *				INSERT DATA{<http://dummy> foaf:firstName 'Dummy'.}";
	 * ------------------------------------------------------------------------------------
	 */
	class Sparql 
	{
		const QUERY = "query";
		const UPDATE = "update";
		const QUERY_SUCCESS = 200;
		const UPDATE_SUCCESS = 204;
	
		private $endpoint;
		private $action; // Whether "update" or "query" - case insensitive
		private $sparqlStr;
		private $results;
		private $sucess; // true when successful, otherwise false
		private $http_code;
		
		/*
		 * Constructor for sparql class
		 * action is either "query" or "update". Spelling has to be exact, but case can vary.
		 * sparqlstring is a correctly written sparql string for the specified action.
		 * endpoint refers to the graph database on which the action is to be performed
		 */
		public function __construct($action, $sparqlStr, $endpoint)
		{
			$this->endpoint = $endpoint;
			$this->action = strtolower($action);
			$this->sparqlStr = $sparqlStr;
			$this->results = array();
			$this->http_code = null;
		}
		
		// execute() executes the action specified in the contructor
		public function execute()
		{
			switch($this->action)
			{
				case self::QUERY : $this->executeQuery(); break;
				case self::UPDATE : $this->executeUpdate(); break;
				default : throw new Exception('Unknown action. Valid actions are "query" and "update"');
			}
			
			// throw an exception if execution was unsuccessful
			if(!$this->isSuccess())
				throw new Exception("Execution unsuccessful! Error: ".$this->results['contents']);
		}
		
		// isSucess() returns true if action execution was successful, otherwise false
		private function isSuccess() 
		{
			if ($this->http_code == null) throw new Exception("Run sparql->execute function first!");
			switch($this->action)
			{
				case self::QUERY : return $this->http_code == self::QUERY_SUCCESS;
				case self::UPDATE : return $this->http_code == self::UPDATE_SUCCESS;
			}
		}
		
		// Returns the results of performing the user-specified action
		public function results()
		{
			return $this->results;
		}
		
		// Executes query action
		private function executeQuery()
		{
			$params = "query=".urlencode($this->sparqlStr)."&Accept=".urlencode("application/sparql-results+json");
			$urlStr = "$this->endpoint?$params";
			$this->http_request($urlStr, $params);
		}
		
		// Executes update action
		private function executeUpdate()
		{
			$params = "update=".urlencode($this->sparqlStr);
			$urlStr = "$this->endpoint/statements";
			$_SERVER['REQUEST_METHOD'] = "POST";
			$this->http_request($urlStr, $params);
		}
		
		// Does an http request
		private function http_request($urlStr, $params)
		{
			$ch = curl_init( );
			
			//set request url
			curl_setopt($ch, CURLOPT_URL, $urlStr);
			
			//set post-specific curl options
			if ( strtolower($_SERVER['REQUEST_METHOD']) == 'post' ) {
				$numParams = count(explode("&", $params));
				curl_setopt( $ch, CURLOPT_POST, true );
				curl_setopt($ch,CURLOPT_POST, $numParams);
				curl_setopt($ch,CURLOPT_POSTFIELDS, $params);		
			}
			
			//some other curl options
			curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, true );
			curl_setopt( $ch, CURLOPT_HEADER, true );
			curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
			
			//so curl can work with https
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			
			//execute request
			list( $header, $contents ) = preg_split( '/([\r\n][\r\n])\\1/', curl_exec( $ch ), 2 );
			
			//save status
			$status = curl_getinfo( $ch );
			
			//done with curl so close it now
			curl_close( $ch );
			
			//$data will be serialized into JSON data.
			$data = array();
			$data['status'] = array();
			$data['status']['http_code'] = $status['http_code'];
			$this->http_code = $status["http_code"];
			
			// Set the JSON data object contents, decoding it from JSON if possible.
			$decoded_json = json_decode( $contents, true );//echo "===".$contents."===";
			$data['contents'] = $decoded_json ? $decoded_json : $contents;
			$this->results = $data;
		}
	}
?>




