var RelBuilderApp = angular.module('RelBuilderApp', ['ui.bootstrap']);

RelBuilderApp.directive('fallbackSrc', function () {
	return {
    restrict: 'A',
    link: function(scope, element, attrs){
			if(typeof(attrs.ngSrc) === 'undefined'){
				element.attr('src', attrs.fallbackSrc);
			}
			element.bind('error', function(){
				element.attr('src', attrs.fallbackSrc);
			});
    }
  };
});

RelBuilderApp.controller('MainCtrl', function($scope, $http){
	$scope.initObject = function(obj) {
		obj.endpoint = $scope.conf.Endpoints.ycba;
		obj.autocomplete = "";
		obj.searchselect = "";
		obj.criteriaquery = "";
		obj.criteriaval = "";
		obj.suggest = "";
		obj.selectedQuery = "";
		obj.selectedItems = [];
		obj.stopSignal = false;
	};
	$scope.initRelationship = function(rel) {
		rel.id = "";
		rel.criteria = "";
		rel.suggest = "";
		rel.match = "";
		rel.validtypes = [];
	};
	$scope.init = function(){
		$scope.conf = RelBuilder;
		$scope.object1 = {};
		$scope.object1.id = "object1";
		$scope.object2 = {};
		$scope.object2.id = "object2";
		$scope.predicate = {};
		$scope.updateObj = {endpoint:$scope.conf.Endpoints.ycba, info:'', link:'', linkText:''};
		$scope.resultItems = [];
		$scope.curObject = {};
		$scope.initObject($scope.object1);
		$scope.initObject($scope.object2);
		$scope.initRelationship(predicate);
	}
	
	// initialize scope
	$scope.init();
	
	$scope.update = function(obj){
		// do something here when endpoints are changed
	};
	$scope.showOtherDivs = function() {
		$('#object1Div').animate({width:'toggle'},350);
		$('#object2Div').animate({width:'toggle'},350);
		$('#submitDiv').animate({width:'toggle'},350);
	};
	$scope.getLabels = function(obj, val) {
		$scope.curObject.stopSignal = true;
		$("#suggest").hide();
		var query = val;
		query = query.split("\"");
		query = query.join("");
		query = query.split(" ");
		query = query.join(":");
		var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
			PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
			PREFIX crm: <http://erlangen-crm.org/current/> \
			PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
			PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
			SELECT DISTINCT ?label ?objectType WHERE { \
			GRAPH ?g { \
				?Subject rdfs:label ?label . \
				?Subject rdf:type ?type.\
				<" + query + ":> fts:prefixMatchIgnoreCase ?label.\
				BIND(URI(REPLACE(str(?g), '/graph', '', 'i')) AS ?objectUri).\
				?objectUri crm:P46i_forms_part_of/skos:prefLabel ?objectType . \
				FILTER regex(str(?type), '(E35_Title)|(E42_Identifier)', 'i').\
				FILTER regex(?objectType, '(painting)|(frame)', 'i').\
				}} limit 25";
		var param = $.param({
			action: 'query',
			sparqlStr: queryStr,
			endpoint: obj.endpoint.Url
		  });
		var url = 'http://localhost:'+$scope.conf.ApplicationPort+'/linked-data/relbuilder/proxy.php?'+param;
		return $http.get(url, {}).then(function(res){
		  if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents.results.bindings) === "undefined")
			return [];
		  var objectLabels = [];
		  res = extractResults(res.data.contents);
		  angular.forEach(res, function(item){
			objectLabels.push(item.label);
		  });
		  $scope.curObject.stopSignal = false;
		  return objectLabels;
		});
	  };
	  
	//searches objects with labels matching the selected value
	$scope.searchSelected = function(obj, limit, offset, criteriaStr) {
		//in case stop signal on the object is activated while recursive search is going on
		if(obj.stopSignal) {return;}
		$scope.curObject = obj;
				
		if(typeof(offset) === 'undefined') offset = 0;
		if(typeof(limit) === 'undefined') limit = 1;
		if(typeof(criteriaStr) === 'undefined') criteriaStr = "FILTER regex(?objectType, '(painting)|(frame)', 'i').";
			
		//reset results if search is just starting i.e when offset is zero
		if(offset === 0) {
			$scope.resultItems = [];
		}
		
		//Split search term into mini-terms on space
		//This is because full text search does not support
		//  spaces in search terms
		$(".loading").show();
		var query = obj.selectedQuery;
		query = query.split("\"");
		query = query.join("");
		query = query.split(" ");
		query = query.join(":");
		var searchStr = "?subject  rdfs:label ?label . \
					<" + query + ":> fts:prefixMatchIgnoreCase ?label .";
		
		var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
			PREFIX crm: <http://erlangen-crm.org/current/> \
			PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
			PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
			PREFIX luc: <http://www.ontotext.com/owlim/lucene#>\
			PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesauri/title/> \
			PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
			SELECT DISTINCT ?objectUri ?objectTitle ?objectType ?inventoryNum ?link WHERE { \
				GRAPH ?graphUri { \
					" + searchStr + "\
					BIND(URI(REPLACE(str(?graphUri), '/graph', '', 'i')) AS ?objectUri).\
					?objectUri crm:P102_has_title ?titleUri . \
					?titleUri crm:P2_has_type ycba_title:repository_title . \
					?titleUri rdfs:label ?objectTitle. \
					?objectUri crm:P1_is_identified_by ?ccdUri . \
					?ccdUri crm:P2_has_type ycba_identifier:ccd . \
					?ccdUri rdfs:label ?ccd .\
					BIND(CONCAT('http://collections.britishart.yale.edu/vufind/Record/', ?ccd) AS ?link).\
					?objectUri crm:P48_has_preferred_identifier ?inventoryUri . \
					?inventoryUri crm:P2_has_type ycba_identifier:inventory-number . \
					?inventoryUri rdfs:label ?inventoryNum .\
					?objectUri crm:P46i_forms_part_of/skos:prefLabel ?objectType .\
					" + criteriaStr + "\
				} \
			} LIMIT " + limit + " OFFSET " + offset;
		var param = $.param({
			action: 'query',
			sparqlStr: queryStr,
			endpoint: $scope.curObject.endpoint.Url
		  });
		var url = 'http://localhost:'+$scope.conf.ApplicationPort+'/linked-data/relbuilder/proxy.php?'+param;
		$http.get(url, {}).then(function(res){
		  //in case stop signal on the object is activated while search is going on
		  if(obj.stopSignal) {return;}
		  if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents.results.bindings) === "undefined")
			return [];
		  var objectLabels = [];
		  res = extractResults(res.data.contents);
		  for(var i=0; i<res.length; i++) {
			//in case stop signal on the object is activated while results are being processed
			if(obj.stopSignal) {return;}
			$scope.resultItems.push(res[i]);
		  }
		 
		  //only hide loading animation if no results are returned
		  //ensures everything is retrieved before hiding the animation
		  if(res.length === 0)
			$(".loading").hide();
		  
		  // if the number of results is greater than zero
		  // then try to retrieve more
		  if(res.length > 0)
			$scope.searchSelected(obj, limit, offset+limit);
		});
	};
	
	$scope.suggest = function() {
		$(".loading").show();
		var prevObj = $scope.curObject;
		$scope.resultItems = [];
		var obj = {};
		if($scope.curObject.id==='object1') {
			obj = $scope.object2;
		}
		else if($scope.curObject.id==='object2') {
			obj = $scope.object1;
		}
		else {
			$('#resultsInfo').empty();
			$('#resultsInfo').text('No suggestions available');
			return;
		}
		
		$scope.curObject = obj;
		
		var inventoryNum = prevObj.selectedItems[0].inventoryNum;
		var criteriaStr = "";
		if(prevObj.selectedItems[0].objectType.toLowerCase() === 'frame') inventoryNum = inventoryNum.replace('FR', '');
		else inventoryNum += 'FR';
		
		var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
			PREFIX crm: <http://erlangen-crm.org/current/> \
			PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
			PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
			PREFIX luc: <http://www.ontotext.com/owlim/lucene#>\
			PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesauri/title/> \
			PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
			SELECT DISTINCT ?objectUri ?objectTitle ?objectType ?inventoryNum ?link WHERE { \
				GRAPH ?graphUri { \
					?inventoryUri crm:P2_has_type ycba_identifier:inventory-number . \
					?inventoryUri rdfs:label '" + inventoryNum + "' .\
					?inventoryUri rdfs:label ?inventoryNum .\
					BIND(URI(REPLACE(str(?graphUri), '/graph', '', 'i')) AS ?objectUri).\
					?objectUri crm:P102_has_title ?titleUri . \
					?titleUri crm:P2_has_type ycba_title:repository_title . \
					?titleUri rdfs:label ?objectTitle. \
					?objectUri crm:P1_is_identified_by ?ccdUri . \
					?ccdUri crm:P2_has_type ycba_identifier:ccd . \
					?ccdUri rdfs:label ?ccd .\
					BIND(CONCAT('http://collections.britishart.yale.edu/vufind/Record/', ?ccd) AS ?link).\
					?objectUri crm:P46i_forms_part_of/skos:prefLabel ?objectType .\
				} \
			}";
		var param = $.param({
			action: 'query',
			sparqlStr: queryStr,
			endpoint: $scope.curObject.endpoint.Url
		  });
		var url = 'http://localhost:'+$scope.conf.ApplicationPort+'/linked-data/relbuilder/proxy.php?'+param;
		$http.get(url, {}).then(function(res){
		  if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents.results.bindings) === "undefined")
			return [];
		  var objectLabels = [];
		  res = extractResults(res.data.contents);
		  for(var i=0; i<res.length; i++) {
			$scope.resultItems.push(res[i]);
		  }
		  
		  //suggestions search is done so allow search on the other object
		  prevObj.stopSignal = false;
			
		  //only hide loading animation if no results are returned
		  //ensures everything is retrieved before hiding the animation
		  $(".loading").hide();
		});
	}
	
	$scope.selectItem = function(selectedItem){
		$scope.resultItems = [];
		$scope.curObject.selectedItems = [];
		$scope.curObject.selectedItems.push(selectedItem);
		$(".loading").hide();
		$scope.curObject.stopSignal = true;
		$("#suggest").show();
	};
	
	$scope.updateRepository = function() {
		$scope.updateObj.info = "";
		if($scope.object1.selectedItems.length < 1 &&
			$scope.object2.selectedItems.length < 1) {
			$scope.updateObj.info = "Select objects first!";
			return;
		}
		else if($scope.object1.selectedItems.length < 1) {
			$scope.updateObj.info = "Select object1 first!";
			return;
		}
		else if($scope.object2.selectedItems.length < 1) {
			$scope.updateObj.info = "Select object2 first!";
			return;
		}
		if(typeof($scope.updateObj.endpoint.Url)==="undefined" || $scope.updateObj.endpoint.Url === "") {
			$scope.updateObj.info = "Choose endpoint for update!";
			return;		
		}

		if($scope.updateObj.endpoint.Url !== "http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba") {
			$scope.updateObj.info = "Update not yet enabled for this endpoint!";
			return;		
		}
		
		var object1ID = $scope.object1.selectedItems[0].objectUri.split("/");
		object1ID = object1ID[object1ID.length-1];
		var object2ID = $scope.object2.selectedItems[0].objectUri.split("/");
		object2ID = object2ID[object2ID.length-1];
		//painting ID first followed by frame ID
		var firstID = $scope.object1.selectedItems[0].objectType==='Painting'? object1ID:object2ID;
		var secondID = $scope.object1.selectedItems[0].objectType==='Frame'? object1ID:object2ID;
		var aggregObjUri = "http://collection.britishart.yale.edu/id/" + firstID + "-" + secondID;
		
		var queryStr = "\
			PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
			PREFIX crm: <http://erlangen-crm.org/current/> \
			PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
			SELECT (count(DISTINCT ?prodUri) AS ?prodCount) WHERE{\
				?aggregObjUri crm:P16i_was_used_for <"+$scope.object1.selectedItems[0].objectUri+">;\
					crm:P16i_was_used_for <"+$scope.object2.selectedItems[0].objectUri+">;\
					crm:P108i_was_produced_by ?prodUri.\
			}";
		var param = $.param({
			action: 'query',
			sparqlStr: queryStr,
			endpoint: $scope.updateObj.endpoint.Url
		  });
		var url = 'http://localhost:'+$scope.conf.ApplicationPort+'/linked-data/relbuilder/proxy.php?'+param;
		$http.get(url, {}).then(function(res){
			var prodCount = 0;
			if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents.results.bindings) === "undefined" ||
			res.data.contents.results.bindings.length <= 0)
			prodCount = 0;
			else prodCount = res.data.contents.results.bindings[0].prodCount.value;
			var prodID = ++prodCount;
			var updateStr = "\
				PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
				INSERT DATA{\
					<"+aggregObjUri+"> rdf:type crm:E22_Man-Made_Object;\
						crm:P16i_was_used_for <"+$scope.object1.selectedItems[0].objectUri+">;\
						crm:P16i_was_used_for <"+$scope.object2.selectedItems[0].objectUri+">;\
						crm:P108i_was_produced_by <"+aggregObjUri+"/production/"+prodID+">.\
					<"+aggregObjUri+"/production/"+prodID+"> rdf:type crm:E12_Production.\
				}";

			var param = $.param({
				action: 'update',
				sparqlStr: updateStr,
				endpoint: 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba'
			  });
			var url = 'http://localhost:'+$scope.conf.ApplicationPort+'/linked-data/relbuilder/proxy.php?'+param;
			$http.get(url, {}).then(function(res){
				// 204 status code indicates success
				if(res.data.status.http_code===204) {
					$scope.updateObj.info = "Saved relationship successfully!";
					$scope.updateObj.link = aggregObjUri;
					$scope.updateObj.linkText = "View Aggregate Object";
				}
				else $scope.updateObj.info = "Error saving relationship!";
			});
		});
	};
});

// print str to console
function debug(str) {
	javascript:console.log(str);
}

function extractResults(data, exclude){
  var dataArr = data.results.bindings;
  var varArr = data.head.vars;
  var returnArr = Array();
  for(var i=0; i<dataArr.length; i++){
    var index = returnArr.length;
    returnArr[index] = {};
    for(var j=0; j<varArr.length; j++){
	  if(typeof(dataArr[i][varArr[j]]) !== "undefined")
		returnArr[index][varArr[j]] = dataArr[i][varArr[j]].value;
    }
  }
  return returnArr;
}

function paintingframeMatch(num1, num2) {
	return (num1 != num2) && (num1.split("FR")[0] == num2.split("FR")[0]);	
}