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
	$scope.conf = RelBuilder;
	$scope.object1 = {};
	$scope.object1.id = "object1";
	$scope.object2 = {};
	$scope.object2.id = "object2";
	$scope.predicate = {};
	$scope.updateObj = {info:''};
	$scope.resultItems = [];
	$scope.curObject = {};
	
	$scope.initObject = function(obj) {
		obj.endpoint = "";
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
	$scope.initObject($scope.object1);
	$scope.initObject($scope.object2);
	$scope.initRelationship(predicate);

	$scope.update = function(obj){
		debug(obj);
	};
	$scope.showOtherDivs = function() {
		$('#object1Div').animate({width:'toggle'},350);
		$('#object2Div').animate({width:'toggle'},350);
		$('#submitDiv').animate({width:'toggle'},350);
	};
	$scope.getLabels = function(val) {
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
			query: queryStr,
			Accept: 'application/sparql-results+json'
		  });
		var url = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba?'+param;
		debug(url);
		return $http.get('http://cia-bam.yu.yale.edu:8080/linked-data/relbuilder/proxy.php?'+$.param({url:url}), {
		  /*params: {
			query: queryStr,
			Accept: 'application/sparql-results+json'
		  }*/
		}).then(function(res){
			
		  if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents) === "undefined")
			return [];
		  var objectLabels = [];
		  res = extractResults(res.data.contents);
		  angular.forEach(res, function(item){
			objectLabels.push(item.label);
		  });
		  debug('oh yeah');
		  debug(res);
		  return objectLabels;
		});
	  };
	  
	$scope.searchSelected = function(obj, limit, offset, criteriaStr) {
		//if current object is not the same as the passed in object,
		//  then don't do search because another search is going on
		//if($scope.curObject.id !== obj.id) return;
		//change current object to the object passed in
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
		var str = '';
		for(var i=0; i<query.length; i++) {
			str += "?subject luc:myTestIndex '" + query[i] + "*' . ";
		}
		query = query.join(":");
		var str2 = "?subject  rdfs:label ?label . \
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
					" + str2 + "\
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
			} LIMIT " + limit + " OFFSET " + offset;debug(queryStr);
		var param = $.param({
			query: queryStr,
			Accept: 'application/sparql-results+json'
		  });
		var url = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba?'+param;
		$http.get('http://cia-bam.yu.yale.edu:8080/linked-data/relbuilder/proxy.php?'+$.param({url:url}), {
		  /*params: {
			query: queryStr,
			Accept: 'application/sparql-results+json'
		  }*/
		}).then(function(res){
		  if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents.results.bindings) === "undefined")
			return [];
		  var objectLabels = [];debug(res);
		  res = extractResults(res.data.contents);
		  for(var i=0; i<res.length; i++) {
			$scope.resultItems.push(res[i]);
		  }
		  debug($scope.resultItems);
		 
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
		$scope.resultItems = [];
		var obj = {};
		if($scope.object1.selectedItems.length > 0) {
			obj = $scope.object2;
		}
		else if($scope.object2.selectedItems.length > 0) {
			obj = $scope.object1;
		}
		else {
			$('#resultsInfo').empty();
			$('#resultsInfo').text('No suggestions available');
			return;
		}
		var prevObj = $scope.curObject;
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
			query: queryStr,
			Accept: 'application/sparql-results+json'
		  });
		var url = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba?'+param;
		debug(url);
		$http.get('http://cia-bam.yu.yale.edu:8080/linked-data/relbuilder/proxy.php?'+$.param({url:url}), {
		  /*params: {
			query: queryStr,
			Accept: 'application/sparql-results+json'
		  }*/
		}).then(function(res){
		  if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents.results.bindings) === "undefined")
			return [];
		  var objectLabels = [];debug(res);
		  res = extractResults(res.data.contents);
		  for(var i=0; i<res.length; i++) {
			$scope.resultItems.push(res[i]);
		  }
		  debug($scope.resultItems);
		 
		  //only hide loading animation if no results are returned
		  //ensures everything is retrieved before hiding the animation
		  if(res.length === 0)
			$(".loading").hide();
		});
	}
	
	$scope.selectItem = function(selectedItem){
		$scope.curObject.selectedItems = [];
		$scope.curObject.selectedItems.push(selectedItem);
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
		if($scope.updateObj.endpoint === "") {
			$scope.updateObj.info = "Choose endpoint for update!";
			return;		
		}
		if($scope.updateObj.endpoint !== "http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba") {
			$scope.updateObj.info = "Update not yet enabled for this endpoint!";
			return;		
		}
	};
});

function updateRepository() {
	
	if(RB.object1.uri == "" && RB.object2.uri == "") {
		info.text("Select objects first!");
		return;
	}
	else if(RB.object1.uri == "") {
		info.text("Select object1 first!");
		return;
	}
	else if(RB.object2.uri == "") {
		info.text("Select object2 first!");
		return;
	}
	var num1 = RB.object1.criteriaval;
	var num2 = RB.object2.criteriaval;
	if(!RB.rel.match.apply("", [num1, num2])) {
		info.text("Criteria does not match!");
		return;		
	}
	if(RB.update.endpoint == "") {
		info.text("Choose endpoint for update!");
		return;		
	}
	if(RB.update.endpoint != "http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba") {
		info.text("Update not yet enabled for this endpoint!");
		return;		
	}
	var updateString = RB.update.func.apply("", [RB.object1.uri, RB.object2.uri]);
	sparqlUpdate(updateString, RB.update.endpoint, updateFinished, info);
}

function sparqlUpdate(updateString, endpoint, callback, info) {
	$.ajax({
		url: endpoint + "/statements",
		type: "POST",
		data: "update=" + encodeURIComponent(updateString),
		dataType: "application/x-www-form-urlencoded",
		sucess: callback(info),
	});
}

function updateFinished(info) {
	info.text("Update Successful!");
	$("#submitDiv #updateButton").hide();
	$("#submitDiv").append("<button class='button' id='updateButton' onclick='location.reload();'>New Update</button>");		
}

function itemDuplicate(arr, testItem) {
	var isItemDuplicate = false;
	if(arr.length > 0) {
		$.each(arr, function(j, arrItem) {
			if(arrItem["label"].value == testItem["label"].value){
				isItemDuplicate = true;
			}
		});
	}
	return isItemDuplicate;
}

function querySparql(queryStr, endpoint, callback, response) {
	response = response || "";
	$.ajax({
		url: endpoint,
		dataType: 'json', 
		data: { 
			//queryLn: 'SPARQL', server assumes it is SPARQL, can be SeRQL
			query: queryStr,
		 //   limit: '10',  //limit is part of sparql query not sesame api
		 //   infer: 'true',
			Accept: 'application/sparql-results+json'
		},
		success: function(data) { callback(data, response); }, 
	});	
}

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