<?PHP
define('__ROOT__', dirname(dirname(__FILE__))); 
require_once(__ROOT__."/relbuilder/sparql.php");
try
{
	if(isset($_GET['rdfStr'])) $rdfStr = $_GET['rdfStr'];
	else throw new Exception("rdfStr not defined");
	if(isset($_GET['rdfStr'])) $id = $_GET['id'];
	else throw new Exception("id not defined");
	
	$ini_array = parse_ini_file("config/config.ini");
	
	$file = $ini_array["RDFPath"]."$id.rdf";
	file_put_contents($file, $rdfStr);
	$data = array();
	$data['status'] = array();
	$data['status']['http_code'] = 204;
	header( 'Content-type: application/x-javascript' );
	$json = json_encode( $data );
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