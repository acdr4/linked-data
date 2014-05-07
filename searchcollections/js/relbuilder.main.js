var Search = {};
Search.endpoint = "";
Search.url = "";
Search.suggest = "";
Search.select = "";
Search.searchBy = "";
var clickedShowMore = false;
var Results = {};
Results.viewableLimit = 0;
Results.queryLimit = 100;
Results.rowHgt = 200;
Results.numCols = 6;

//set parameters for the search
function initialize() {
	Search.endpoint = RelBuilder.Databases.YCBA.Url;
	var searchBy = RelBuilder.SearchBy;
	$.each(searchBy, function(key, value){
		$("#searchBy").append('<option value="' + key + '">' + value.Label + '</option>');
	});
	
	$("#searchBy").change(function() {
		Search.searchBy = $(this).val();
	});
	
	//sets a limit on the number that can be viewed in the current viewport
	//Gets the limit by multiplying number of viewable rows and number of columns
	Results.viewableLimit = (modifiedViewportHgt()/Results.rowHgt) * Results.numCols;	
}

function setupAutocomplete(element) {
	$(element).keyup(function (e) {
		if (e.keyCode == 13) {
			executeSearch($(element).val());
		}
	});	
	var $input = $( "#" + element ).autocomplete({
		source: function( request, response ) {
			var query = request.term;
			creatorSuggest(query, response);
            /*var suggestFunc =Search.suggest 
			var queryStr = window[suggestFunc](query, Search.url, response);
			querySparql(queryStr, Search.url, displaySuggest, response);*/
			//querySparql(queryStr, endpoint, displayAutocompleteMenu, response);
		},
		minLength: 2,
		select: function(event, ui) { searchSelectedQuery(event, ui); },
		open: function() {
			$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
		},
		close: function() {
			$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
		}
	});
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

function creatorSuggest(query, response) {
	query = query.split(" ");
	query = query.join(":");
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
					PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
					PREFIX crm: <http://erlangen-crm.org/current/> \
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
					PREFIX bmo: <http://collection.britishmuseum.org/id/ontology/> \
					SELECT DISTINCT ?creatorUri ?label ?nationality WHERE { \
						?creatorUri skos:prefLabel ?label . \
						?creatorUri rdf:type crm:E21_Person . \
						<" + query + ":> fts:prefixMatchIgnoreCase ?label. \
						OPTIONAL { \
							?creatorUri bmo:PX_nationality/skos:prefLabel ?nationality  } .\
						 } limit 50";
	querySparql(queryStr, Search.endpoint, displaySuggest, response);	
}

//tired of typing the whole function when debugging :)
function print(str){ javascript:console.log(str);}

function displaySuggest(data, response) {
	$('.ui-autocomplete').empty();
	var itemsArr = new Array();
	var index = 0;
	var moreIsWritten = false;

	data.results.bindings.sort(function(a, b){
		var nameA = a.label.value.toLowerCase(), nameB = b.label.value.toLowerCase()
		if (nameA < nameB) //sort string ascending
		return -1 
		if (nameA > nameB)
		return 1
		return 0 //default return value (no sorting)
	});
	response( $.map( data.results.bindings, function( item ) {
		if(index == 10 && !moreIsWritten) {
			moreIsWritten = true;
			return {
				specialLabel: "show-more-item",
				customHTML: "<div class='autocompleteMenu'>" + 
							"<div class='more'><p>Show More</p></div>" +
							"<div>"
			}		
		}		
		if(!itemDuplicate(itemsArr, item, "creatorUri")){
			itemsArr[index++] = item;
			var label = item.label.value;
			var nationality = "";
			if(typeof(item.nationality) != "undefined")
				nationality = item.nationality.value;
			return {
				label: label,
				value: label,
				nationality: nationality,
				customHTML: "<div class='autocompleteMenu'>" + 
								"<div class='label'><p title='" + label + "'>" + label + "</p></div>" +
								"<div class='dates'><p>" + "1776" + "-" + "1900" + "</p></div>" +
								"<div class='nationality'><p><i>" + nationality + "</p></div>" +
							"</div>"
			}
		}
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
	var extraParam = ui.item ? ui.item.nationality : "";
	if(!clickedShowMore)
		executeSearch(query, extraParam);
}

function executeSearch(query, extraParam) {
	$('div.section2 h1').text("Loading");
	$(".loading").show();
	$('ul.results1').empty();
	
	Results.visible = [];
	Results.hidden = [];
	
	var offset = 0;
	creatorSearch(query, extraParam, offset);
}

function creatorSearch(query, extraParam, offset) {
	//Split search term into mini-terms on space
	//This is because full text search does not support
	//  spaces in search terms
	/*query = query.split("\"");
	query = query.join("");
	query = query.split(" ");
	query = query.join(":");*/
	var nationalityStr = "";
	if(extraParam != "") {
		nationalityStr = "?creatorUri bmo:PX_nationality/skos:prefLabel '" + extraParam + "'.";
	}
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
					PREFIX crm: <http://erlangen-crm.org/current/> \
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					PREFIX bmo: <http://collection.britishmuseum.org/id/ontology/> \
					PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
					PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
					PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
					SELECT DISTINCT ?thumbUrl ?label ?objectTitle ?vufindRecordId ?objectType  WHERE { \
							?objectUri  crm:P108i_was_produced_by/crm:P14_carried_out_by ?creatorUri . \
							?creatorUri skos:prefLabel '" + query + "' .\
							" + nationalityStr + " \
							?objectUri crm:P102_has_title ?titleUri . \
							?titleUri crm:P2_has_type ycba_title:preferred . \
							?titleUri rdfs:label ?objectTitle. \
							?titleUri rdfs:label ?label. \
							?objectUri crm:P1_is_identified_by ?ccdUri . \
							?ccdUri crm:P2_has_type ycba_identifier:ccd . \
							?ccdUri rdfs:label ?vufindRecordId .\
							?objectUri bmo:PX_has_main_representation ?thumbUrl . \
							OPTIONAL { ?objectUri bmo:PX_object_type/skos:prefLabel ?objectType }.\
							} limit " + Results.queryLimit + " offset " + offset;print(queryStr);
	querySparql(queryStr, Search.endpoint, displayResults);	
}

function displayResults(data) {print(data.results.bindings.length +" results retrieved!");
	$(".loading").hide();
	$('div.section2 h1').empty();
	if(data.results.bindings.length == 0) {
		$('div.section2 h1').text("No results found!");
		return;
	}
	var list = $('ul.results1');
	list.empty();
	
	var objectsArr = new Array();
	var objectCount = 0;
	$.each(data.results.bindings, function(index, bs) {
		if(!itemDuplicate(objectsArr, bs, "vufindRecordId")){
			objectsArr[objectCount++] = bs;
			if(objectCount <= Results.viewableLimit) {
				Results.visible.push(bs);
				writeHtml(bs);
			}
			else {
				Results.hidden.push(bs);
			}
		}
	});		
	$("ul.results1").show();
	
	var divHgt = modifiedViewportHgt();
	var numRows = Math.ceil(Results.visible.length/Results.numCols);
	if(numRows < (divHgt/Results.rowHgt))
		divHgt = numRows * Results.rowHgt;
	document.getElementById("resultBox").style.height=divHgt;
	scrollListener();
}

function displayMore() {
	var numVisible = Results.visible.length;
	var count = 0;
	$.each(Results.hidden, function(index, bs) {
		if(numVisible <= Results.viewableLimit) {
			Results.visible.push(bs);
			writeHtml(bs);
			count++;
			numVisible++;
		}
	});	
	Results.hidden.splice(0, count);
	$(".loading-bottom").hide();
	$("ul.results1").show();
	$('#resultBox').waypoint('destroy');
	scrollListener();
}

function scrollListener() {
	$('#resultBox').waypoint(function(direction) {
	  var totalItems = Results.visible.length + Results.hidden.length;
	  if(totalItems > Results.viewableLimit && direction == "down") {
		$(".loading-bottom").show();
		var curHgt = document.getElementById('resultBox').offsetHeight;
		var newHgt = curHgt + modifiedViewportHgt();
		var nrows = Math.ceil(Results.hidden.length/Results.numCols)
		if(nrows < (newHgt/Results.rowHgt)) {
			newHgt = curHgt + nrows * Results.rowHgt;
		}
		document.getElementById("resultBox").style.height=newHgt;		
		var newLimit = (newHgt/Results.rowHgt) * Results.numCols;
		Results.viewableLimit = newLimit > Results.pageLimit ? Results.pageLimit : newLimit;
		displayMore();
	  }
	}, {offset: 'bottom-in-view', });	
}

function writeHtml(item) {
	var list = $('ul.results1');
	var link = RelBuilder.VufindRecordbase + item["vufindRecordId"].value;	
	var objectType = "";
	var thumbUrl = "images/noCover3.gif";
	if(typeof(item["objectType"]) != "undefined")
		objectType = item["objectType"].value + "<br />";	
	if(typeof(item["thumbUrl"]) != "undefined")
		thumbUrl = item["thumbUrl"].value;	
	var html = "<li>" + 
					"<div class='thumb'>" + 
						"<img onerror=\"this.src='images/noCover3.gif';\" src='" + thumbUrl + "'/>" + 
					"</div>" + 
					"<div class='objectInfo' title='" + item["objectTitle"].value + "'>" + 
						objectType +						
						"<i>" + item["objectTitle"].value + "</i><br />" +
						"<a target='_blank' href='" + link + "'>View Record</a>" +
					"</div>" +
				"</li>"
	list.append(html);
}

function modifiedViewportHgt() {
	var viewportHgt = $(window).height();
	var elemHgt = viewportHgt + 106;
	if(elemHgt % Results.rowHgt != 0)
		elemHgt = elemHgt - (elemHgt % Results.rowHgt) + Results.rowHgt;
	return elemHgt;
}

function itemDuplicate(arr, testItem, label) {
	var isItemDuplicate = false;
	if(arr.length > 0) {
		$.each(arr, function(j, arrItem) {
			if(arrItem[label].value == testItem[label].value){
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