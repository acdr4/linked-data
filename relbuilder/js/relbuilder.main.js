var EndpointSupport = {};
var RelBuilderApp = angular.module('RelBuilderApp', ['ui.bootstrap']);

// for showing a default image in case an image link is broken or empty
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

// the main controller for the applicaiton
RelBuilderApp.controller('MainCtrl', function($scope, $http){

	// sets the initial state of objects that the app uses
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
	
	// initializes the relationship
	$scope.initRelationship = function(rel) {
		rel.id = "";
		rel.criteria = "";
		rel.suggest = "";
		rel.match = "";
		rel.validtypes = [];
	};
	
	// sets the initial state of objects and relationship
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
	
	// show the other divs when the user selects a relationship to build
	$scope.showOtherDivs = function() {
		$('#object1Div').animate({width:'toggle'},350);
		$('#object2Div').animate({width:'toggle'},350);
		$('#submitDiv').animate({width:'toggle'},350);
	};
	
	// returns items for the autocomplete menu as a user types
	$scope.getLabels = function(obj, val) {
		$scope.curObject.stopSignal = true;
		$("#suggest").hide();
		var query = val;
		var param = $.param({
			action: 'query',
			sparqlStr: EndpointSupport[obj.endpoint.id][$scope.predicate.id].getLabels(query),
			endpoint: obj.endpoint.Url
		  });
		var url = '/linked-data/relbuilder/sparqlrequests.php?'+param;
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
	  
	// searches objects with labels matching the selected value
	$scope.searchSelected = function(obj, limit, offset, criteriaStr) {
		// in case stop signal on the object is activated while recursive search is going on
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
		
		var param = $.param({
			action: 'query',
			sparqlStr: EndpointSupport.ycba.Painting_To_Frame.searchSelected(query, offset, limit),
			endpoint: $scope.curObject.endpoint.Url
		  });
		var url = '/linked-data/relbuilder/sparqlrequests.php?'+param;
		$http.get(url, {}).then(function(res){
		  //in case stop signal on the object is activated while search is going on
		  if(obj.stopSignal) {return;}
		  if(typeof(res.data.contents) === "undefined" ||
			typeof(res.data.contents.results) === "undefined" ||
			typeof(res.data.contents.results.bindings) === "undefined")
			return [];
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
	
	// return objects related to a particular object based on the defined relationship
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
		
		var param = $.param({
			action: 'query',
			sparqlStr: EndpointSupport.ycba.Painting_To_Frame.suggest(prevObj),
			endpoint: $scope.curObject.endpoint.Url
		  });
		var url = '/linked-data/relbuilder/sparqlrequests.php?'+param;
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
	
	// triggered when an item is selected
	// the item is added to the selected items for the current object
	// the stop signal is triggered so that if search for the current object was still going on, it is stopped
	$scope.selectItem = function(selectedItem){
		$scope.resultItems = [];
		$scope.curObject.selectedItems = [];
		$scope.curObject.selectedItems.push(selectedItem);
		$(".loading").hide();
		$scope.curObject.stopSignal = true;
		$("#suggest").show();
	};
	
	// sends the relationship triples to the chosen triple store
	$scope.updateRepository = function() {
		$scope.updateObj.info = "";
		//ensure that both object1 and object2 have been selected
		if($scope.object1.selectedItems.length < 1 &&
			$scope.object2.selectedItems.length < 1) {
			$scope.updateObj.info = "Select objects first!";
			return;
		}
		//ensure object1 has been selected
		else if($scope.object1.selectedItems.length < 1) {
			$scope.updateObj.info = "Select object1 first!";
			return;
		}
		// ensure object2 has been selected
		else if($scope.object2.selectedItems.length < 1) {
			$scope.updateObj.info = "Select object2 first!";
			return;
		}
		// ensure the endpoint for update has been chosen
		if(typeof($scope.updateObj.endpoint.Url)==="undefined" || $scope.updateObj.endpoint.Url === "") {
			$scope.updateObj.info = "Choose endpoint for update!";
			return;		
		}
		// ensure the endpoint is supported
		if($scope.updateObj.endpoint.Url !== "http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba") {
			$scope.updateObj.info = "Update not yet enabled for this endpoint!";
			return;		
		}
		
		//generating the uri for the aggregate object
		var aggregObjIdentify = EndpointSupport.ycba.Painting_To_Frame.createAggregUri($scope.object1, $scope.object2);
		var aggregObjID = aggregObjIdentify.aggregObjID;
		var aggregObjUri = aggregObjIdentify.aggregObjUri;
		
		
		// query for counting the number of production events for the aggregation object defined
		// the number is zero if the aggregation object is not in the triple store yet
		var param = $.param({
			action: 'query',
			sparqlStr: EndpointSupport.ycba.Painting_To_Frame.preUpdateQuery($scope.object1.selectedItems[0].objectUri, $scope.object2.selectedItems[0].objectUri),
			endpoint: $scope.updateObj.endpoint.Url
		  });
		var url = '/linked-data/relbuilder/sparqlrequests.php?'+param;
		$http.get(url, {}).then(function(results){
			var updateStrings = EndpointSupport.ycba.Painting_To_Frame.update(results, aggregObjUri, $scope.object1.selectedItems[0].objectUri, $scope.object2.selectedItems[0].objectUri);
			var url = '/linked-data/relbuilder/saverdf.php?'+$.param({rdfStr:updateStrings.rdfStr, id: aggregObjID});
			$http.get(url, {}).then(function(res){
				// 204 status code indicates success
				if(res.data.status.http_code===204) {
					var param = $.param({
					action: 'update',
					sparqlStr: updateStrings.sparqlStr,
					endpoint: $scope.updateObj.endpoint.Url
				  });
				var url = '/linked-data/relbuilder/sparqlrequests.php?'+param;
				$http.get(url, {}).then(function(res){
					// 204 status code indicates success
					if(res.data.status.http_code===204) {
						$scope.updateObj.info = "Saved relationship successfully!";
						$scope.updateObj.link = aggregObjUri;
						$scope.updateObj.linkText = "View Aggregate Object";
					}
					else $scope.updateObj.info = "Error saving relationship!";
				});
				}
				else $scope.updateObj.info = "Error saving relationship!";
			});
		});
	};
});

// print str to console
// for easier debugging instead of typing javascript:console.log(str) again and again
function debug(str) {
	javascript:console.log(str);
}

// extract data from sparql results
// instead of arrayElement.property.value, one can get the value by arrayElement.property
function extractResults(data, exclude){
  var dataArr = data.results.bindings;
  var varArr = data.head.vars;
  var returnArr = Array();
  for(var i=0; i<dataArr.length; i++){
    var index = returnArr.length;
    returnArr[index] = {};
	//iterate for each property
    for(var j=0; j<varArr.length; j++){
	  if(typeof(dataArr[i][varArr[j]]) !== "undefined")
		returnArr[index][varArr[j]] = dataArr[i][varArr[j]].value;
    }
  }
  return returnArr;
}






