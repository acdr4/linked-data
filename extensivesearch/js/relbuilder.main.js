var Search = {};
Search.db = "";
Search.url = "";
Search.suggest = "";
Search.select = "";
Search.apikey = "";
var UnselectedDbs = {};
var SelectedDbs = {};
var Suggestions = [];
var SearchResults = [];

var clickedShowMore = false;

//set up the configuration of the app
function initialize() {
	var databases = RelBuilder.Databases;
	var i = 0;
	
	//populate pulldown menu
	$.each(databases, function(key, value){
		UnselectedDbs[key] = value;
		$("#databases").append('<option value="' + key + '">' + value.Label + '</option>');
	});
	
	//triggered when a user selects a database
	$("#databases").change(function() {
		var newlySelected = {};
		var db = $(this).val();
		if(db == "All") {
			$.each(UnselectedDbs, function(key, value){
				newlySelected[key] = value;
			});         
		}
		else {
			newlySelected[db] = databases[db];
		}
		
		//add the selected database to the list of selected databases
		$.each(newlySelected, function(key, value) {
			delete(UnselectedDbs[key]);
			SelectedDbs[key] = value;
			$("#selectedDbList").append('<div id="' + key + '"onclick="unselectDb(' + key + ')"class="selectedDb"><p>' + value.Label + '</p></div>');
		});
		
		//some manipulation to ensure the pulldown menu is updated accordingly
		$("#databases").empty();
		$("#databases").append('<option value=""></option>'); 
		if(Object.keys(UnselectedDbs).length > 1)
			$("#databases").append('<option value="All">All</option>');    
		$.each(UnselectedDbs, function(key, value){
			$("#databases").append('<option value="' + key + '">' + value.Label + '</option>');
		}); 

		//conduct a new search for suggestions across all selected databases including
		// the newly selected one
		$( "#search" ).autocomplete( "search", $( "#search" ).val() );  
	});
        	
}

//removes a database from the selcted databases list
function unselectDb(keyClicked) {
    var dbClicked = keyClicked.id;
    delete(SelectedDbs[dbClicked]);
    var element = document.getElementById(dbClicked);
    element.parentNode.removeChild(element);
	
	//some manipulation to ensure the pulldown menu is updated accordingly
    $("#databases").empty();
    $("#databases").append('<option value=""></option>');   
    UnselectedDbs[dbClicked] = RelBuilder.Databases[dbClicked];
    if(Object.keys(UnselectedDbs).length > 1) {
        $("#databases").append('<option value="All">All</option>'); 
    }    
    $.each(UnselectedDbs, function(key, value){
        $("#databases").append('<option value="' + key + '">' + value.Label + '</option>');
    }); 
	
	//search for suggestions without the unselected database
	//potential improvement: just remove the results from the unselected database
    $( "#search" ).autocomplete( "search", $( "#search" ).val() );                                 
}

//set up the suggestion interface and menu
function setupAutocomplete(element) {
	//do a search if user presses ENTER after typing in search term
	$(element).keyup(function (e) {
		if (e.keyCode == 13) {
			executeSearch($(element).val());
		}
	});	
	
	//set up autocomplete on passed in element
	var $input = $( "#" + element ).autocomplete({
		source: function( request, response ) {
			var query = request.term;
			Suggestions = [];
			//do a search on every selected database
			//functions for different databases are selected based on this formula
			// [DatabaseId}_Suggest e.g YCBA_Suggest
			//therefore, newly added databases must follow this standard
			$.each(SelectedDbs, function(key, value) {
				var suggestFunc = key + "_Suggest";
				var searchObj = value;
				var results = window[suggestFunc](query, searchObj, response);
			});
		},
		minLength: 2,
		select: function(event, ui) { searchSelectedQuery(event, ui); },

	});
	
	//override close method
	//autocomplete menu closes by default when user clicks on an item
	//overriding the function prevents the menu from being closed when the user clicks
	//	"Show More"
	(function(){
	   var originalCloseMethod = $input.data("autocomplete").close;
		$input.data("autocomplete").close = function(event) {
			if (!clickedShowMore){
				//close requested by someone else, let it pass
				originalCloseMethod.apply( this, arguments );
			}
			clickedShowMore = false;
		};
	})();	
}

//populates the autocomplete menu with data
//response is an object that returns the data to the menu object
function displaySuggest(data, response, dataset) {
	var results = data.results.bindings;
	
	//insert the data source of every item
	for(i = 0; i < results.length; i++) {
		results[i]["dataset"] = {};
		results[i]["dataset"]["value"] = dataset;
	}
	$('.ui-autocomplete').empty();
	var itemsArr = new Array();
	var index = 0;
	var moreIsWritten = false;
	Suggestions = Suggestions.concat(results);
	response( $.map( Suggestions, function( item ) {
		if(index == 10 && !moreIsWritten) {
			moreIsWritten = true;
			return {
				specialLabel: "show-more-item",
				customHTML: "<div class='autocompleteMenu'>" + 
							"<div class='more'><p>Show More</p></div>" +
							"<div>"
			}		
		}
		//if(!itemDuplicate(itemsArr, item, "label")){
			itemsArr[index++] = item;
			var label = item.label.value;
			var type = "";
			if(typeof(item.type) != "undefined")
				type = item.type.value		
			return {
				label: label,
				value: label,
				type: type,
				customHTML: "<div class='autocompleteMenu'>" + 
								"<div class='label'><p title='" + label + "'>" + label + "</p></div>" +
								"<div class='type'><p><b>" + type + "</b></p></div>" +
								"<div class='dataset'><p><i>" + item.dataset.value + "</p></div>" +
							"</div>"
			}
		//}
	}));
	
	numAutocompleteItems = index;
	var j = 11;
	for( ; j <= index; j++) {
		$('.ui-autocomplete li').eq(j).hide();
	}
	
	$('.ui-autocomplete li').eq(10).click(function(event) { showMore(); });
		
	//customize autocomplete menu
	_renderItem = function( ul, item) {
		return $( "<li></li>" )
			.data( "item.autocomplete", item )
			.append( $( "<a style = \"height:16px\"></a>" ).html(item.customHTML) )
			.appendTo( ul );
	}	
}

function showMore() {
	clickedShowMore = true;
	var j = 11;
	for( ; j <= numAutocompleteItems; j++) {
		$('.ui-autocomplete li').eq(j).show();
	}
	$('.ui-autocomplete li').eq(10).hide();
}

function searchSelectedQuery(event, ui) {
	var query = ui.item ? ui.item.label : this.value;
	var filter = {};
	filter.type = ui.item ? ui.item.type : "";
	if(!clickedShowMore)
		executeSearch(query, filter);
}

function executeSearch(query, filter) {
	/*var endpoint = Search.endpoint;
	var getQueryStr = Search.searchselect;
	var queryStr = getQueryStr.apply("", [query]);*/        
	$('div.section2 h1').text("Loading");
	$(".loading").show();
	$('ul.results1').empty();
	SearchResults = [];
	$.each(SelectedDbs, function(key, value) {
		var selectFunc = key + "_Select";
		var searchObj = value;
		var results = window[selectFunc](query, searchObj, filter); 
	});              	
	//querySparql(queryStr, endpoint, displayResults);		
}

function displayResults(data, dataset) {
	var results = data.results.bindings;
	for(i = 0; i < results.length; i++) {
		results[i]["dataset"] = {};
		results[i]["dataset"]["value"] = dataset;
	}

	$(".loading").hide();
	$('div.section2 h1').empty();
	SearchResults = SearchResults.concat(results);
	if(SearchResults.length == 0) {
		$('div.section2 h1').text("No results found!");
		return;
	}

	var list = $('ul.results1');
	list.empty();
	
	var objectsArr = new Array();
	var objectCount = 0;
	$.each(SearchResults, function(index, bs) {
		//if(!itemDuplicate(objectsArr, bs, "objectTitle")){
		
			objectsArr[objectCount++] = bs;
		
			var uri = "";
			var objectType = "";
			var thumbUrl = "images/noCover3.gif";
			var link = "";
			if(typeof(bs["objectType"]) != "undefined")
				objectType = bs["objectType"].value;	
			if(typeof(bs["thumbUrl"]) != "undefined")
				thumbUrl = bs["thumbUrl"].value;
			if(typeof(bs["link"]) != "undefined")
				link = "<a target='_blank' href='" + bs["link"].value + "'>View Record</a><br />";				
			var html = "<li>" + 
							"<div class='thumb'>" + 
								"<a href='#' >" + 
									"<img onerror=\"this.src='images/noCover3.gif';\" src='" + thumbUrl + "'/>" + 
								"</a>" + 
							"</div>" + 
							"<div class='objectInfo' title='" + bs["objectTitle"].value + "'>" + 
								objectType + "<br />" +						
								"<i>" + bs["objectTitle"].value + "</i><br />" +
								link +
								"Dataset: " + bs.dataset.value + "<br />" +
							"</div>" +
						"</li>"
			list.append(html);
		//}
	});	
	$("ul.results1").show();	
}

function itemDuplicate(arr, testItem, property) {
	var isItemDuplicate = false;
	if(arr.length > 0) {
		$.each(arr, function(j, arrItem) {
			if(arrItem[property].value == testItem[property].value){
				isItemDuplicate = true;;
			}
		});
	}
	return isItemDuplicate;
}

function querySparql(queryStr, endpoint, callback, response, dataset) {
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
		success: function(data) { callback(data, response, dataset); }, 
	});	
}

//tired of typing javascript:console.log when debugging in chrome
function print(str) { javascript:console.log(str); }