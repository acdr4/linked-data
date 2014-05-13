<?PHP
define('__ROOT__', dirname(dirname(__FILE__))); 
require_once(__ROOT__."/relbuilder/sparql.php");
try
{
	if(isset($_GET['action'])) $action = $_GET['action'];
	else throw new Exception("Action not defined");
	if(isset($_GET['endpoint'])) $endpoint = $_GET['endpoint'];
	else throw new Exception("Endpoint not defined");
	if(isset($_GET['sparqlStr'])) $sparqlStr = $_GET['sparqlStr'];
	else throw new Exception("Sparql string not defined");

	//create sparql object
	$sparql = new Sparql($action, $sparqlStr, $endpoint);

	//execute "query" action
	$sparql->execute();

	//retrieve results from sparql object
	$results = $sparql->results();
	header( 'Content-type: application/x-javascript' );
	$json = json_encode( $results );
	print $json; 
}
catch (Exception $e)
{	
	$data = array();
	$data['status'] = array();
	$data['status']['http_code'] = 400;
	$data['contents'] = $e->getMessage();
	header( 'Content-type: application/x-javascript' );
	$json = json_encode( $data );
	print $json; 
}
?>