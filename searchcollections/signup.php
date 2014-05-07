<?php 
// Author: John Wright
// Website: http://johnwright.me/blog
// This code is live @ 
// http://johnwright.me/code-examples/sparql-query-in-code-rest-php-and-json-tutorial.php
 
 
function getUrlDbpediaAbstract($term)
{
   $format = 'application/sparql-results+json';
 
   $query = 
   "select * where{?s ?p ?o }limit 10";
 
   $searchUrl = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba?'
      .'query='.urlencode($query)
      .'&format='.$format;
	  
   return $searchUrl;
}
 
 
function request($url){
 
   // is curl installed?
   if (!function_exists('curl_init')){ 
      die('CURL is not installed!');
   }
 
   // get curl handle
   $ch= curl_init();
 
   // set request url
   curl_setopt($ch, 
      CURLOPT_URL, 
      $url);
 
   // return response, don't print/echo
   curl_setopt($ch, 
      CURLOPT_RETURNTRANSFER, 
      true);
 
   /*
   Here you find more options for curl:
   http://www.php.net/curl_setopt
   */		
 
   $response = preg_split( '/([\r\n][\r\n])\\1/', curl_exec( $ch ), 2 );
 
   curl_close($ch);
 
   return $response;
}
 
 
function printArray($array, $spaces = "")
{
   $retValue = "";
	
   if(is_array($array))
   {	
      $spaces = $spaces
         ."&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
 
      $retValue = $retValue."<br/>";
 
      foreach(array_keys($array) as $key)
      {
         $retValue = $retValue.$spaces
            ."<strong>".$key."</strong>"
            .printArray($array[$key], 
               $spaces);
      }		
      $spaces = substr($spaces, 0, -30);
   }
   else $retValue = 
      $retValue." - ".$array."<br/>";
	
   return $retValue;
}
 
$term = "Honda_Legend";
 
$requestURL = getUrlDbpediaAbstract($term);
 
$responseArray = request($requestURL);
echo $responseArray[0];
?>
 
