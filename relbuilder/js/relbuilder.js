var vufindRecordBase = "";
var object1 = {};
object1.uri = "";
object1.inventoryNum = "";
var object2 = {};
object2.uri = "";
object2.inventoryNum = "";
var module = "";
var isRelatedObject = false;
var numAutocompleteItems = 0;
jQuery.get("config/config.txt", function(content) {
	configArr = content.split(new RegExp("\\n"));
	$.each(configArr, function(index, element) {
		elementPieces = element.split(": ");
		if(elementPieces[0] == "vufindRecordBase") {
			vufindRecordBase = elementPieces[1];
		}
	});
});

var exibitionsArray = new Array();

$("#object1").keyup(function (e) {
    if (e.keyCode == 13) {
        alert("Sup boys!");
    }
});

function setupAutocomplete(element) {
	$(element).keyup(function (e) {
		if (e.keyCode == 13) {
			executeSearch($(element).val());
		}
	});	
	$( element ).autocomplete({
		source: function( request, response ) {
			query = request.term.split(" ");
			query = query.join(":");
			endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba';
			queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
						PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
						PREFIX crm: <http://erlangen-crm.org/current/> \
						PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
						PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
						SELECT * WHERE { \
						GRAPH ?g { \
							?Subject rdfs:label ?label . \
							OPTIONAL { ?g crm:P2_has_type/skos:prefLabel ?type . \
									   ?Subject rdf:type ?labelType } .\
							<" + query + ":> fts:prefixMatchIgnoreCase ?label. }} limit 100",
			querySparql(queryStr, endpoint, displayAutocompleteMenu, response);
			module = element;
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
}

function displayAutocompleteMenu(data, response) {
	$('.ui-autocomplete').empty();
	var itemsArr = new Array();
	var index = 0;
	var moreIsWritten = false;
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
		if(!itemDuplicate(itemsArr, item)){
			itemsArr[index++] = item;
			var label = item["label"].value;
			var type = "";
			var labelType = "";
			if(typeof(item["type"]) != "undefined")
				type = item["type"].value
			if(typeof(item["labelType"]) != "undefined")
				labelType = item["labelType"].value			
			return {
				label: label,
				value: label,
				labelType: labelType,
				customHTML: "<div class='autocompleteMenu'>" + 
							"<div class='label'><p title='" + label + "'>" + label + "</p></div>" +
							"<div class='labelType'><p title='" + type + "'><b>" + type + "</b></p><div>" +
							"<div>"
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
	var j = 11;
	for( ; j <= numAutocompleteItems; j++) {
		$('.ui-autocomplete li').eq(j).show();
	}
	$('.ui-autocomplete li').eq(10).hide();
}

function searchSelectedQuery(event, ui) {
	var query = ui.item ? ui.item.label : this.value;
	executeSearch(query);
}

function executeSearch(query) {

	query = query.split("\"");
	query = query.join("");
	query = query.split(" ");
	query = query.join(":");
	
	$('div.section2 h1').text("Loading");
	$(".loading").show();
	$('ul.results1').empty();
	queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
				PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
				PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
				PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
				SELECT DISTINCT ?objectUri ?thumbUrl ?objectTitle ?vufindRecordId ?type ?inventoryNum WHERE { \
					GRAPH ?objectUri { \
						?subject  rdfs:label ?label . \
						<" + query + ":> fts:prefixMatchIgnoreCase ?label . \
						?objectUri crm:P102_has_title ?titleUri . \
						?titleUri crm:P2_has_type ycba_title:preferred . \
						?titleUri rdfs:label ?objectTitle. \
						?objectUri crm:P70_is_documented_in/crm:P70_is_documented_in ?thumbUri . \
						FILTER (CONTAINS(STR(?thumbUri), \"thumb\")) .\
						?thumbUri crm:P1_is_identified_by ?thumbUrl. \
						?objectUri crm:P1_is_identified_by ?ccdUri . \
						?ccdUri crm:P2_has_type ycba_identifier:ccd . \
						?ccdUri rdfs:label ?vufindRecordId .\
						?objectUri crm:P1_is_identified_by ?inventoryUri . \
						?inventoryUri crm:P2_has_type ycba_identifier:inventory-number . \
						?inventoryUri rdfs:label ?inventoryNum . \
						OPTIONAL { ?objectUri crm:P2_has_type/skos:prefLabel ?type . }\
					} \
				}";
	endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba';
	querySparql(queryStr, endpoint, displayResults);		
}

function displayResults(data) {
	$(".loading").hide();
	$('div.section2 h1').empty();
	if(data.results.bindings.length == 0) {
		$('div.section2 h1').text("No results found!");
		return;
	}
	if(isRelatedObject) {
		if(module == "#object1")	
			$('div.section2 h1').text("Suggested object 1:");
		else
			$('div.section2 h1').text("Suggested object 2:");
		isRelatedObject = false;
	}
	else if(module == "#object1")	
		$('div.section2 h1').text("Choose object 1:");
	else
		$('div.section2 h1').text("Choose object 2:");
	list = $('ul.results1');
	list.empty();
	$.each(data.results.bindings, function(index, bs) {
		//if(index == 0)
			//$('div.section2 h1').append(bs["exhibitionTitle"].value);
		var link = vufindRecordBase + bs["vufindRecordId"].value;	
		var type = "";
		if(typeof(bs["type"]) != "undefined")
			type = bs["type"].value;		
		list.append("<li>" + 
						"<div class='thumb'>" + 
							"<a href='#' onclick='selectObject(\"" + bs["objectUri"].value +"\")'>" + 
								"<img onerror=\"this.src='images/noCover3.gif';\" src='" + bs["thumbUrl"].value + "'/>" + 
							"</a>" + 
						"</div>" + 
						"<div class='objectInfo' title='" + bs["objectTitle"].value + "'>" + 
							type + "<br />" +						
							"<i>" + bs["objectTitle"].value + "</i><br />" +
							bs["inventoryNum"].value + "<br />" +
							"<a target='_blank' href='" + link + "'>View Record</a>" +
						"</div>" +
					"</li>");
	});	
	$("ul.results1").show();	
}

function selectObject(objectUri){
	queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX skos:<http://www.w3.org/2004/02/skos/core#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
				PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
				PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
				SELECT DISTINCT ?objectUri ?thumbUrl ?objectTitle ?vufindRecordId ?inventoryNum ?objectType WHERE { \
					GRAPH ?objectUri { \
						<" + objectUri + "> crm:P102_has_title ?titleUri . \
						?titleUri crm:P2_has_type ycba_title:preferred . \
						?titleUri rdfs:label ?objectTitle. \
						?objectUri crm:P70_is_documented_in/crm:P70_is_documented_in ?thumbUri . \
						FILTER (CONTAINS(STR(?thumbUri), \"thumb\")) . \
						?thumbUri crm:P1_is_identified_by ?thumbUrl. \
						?objectUri crm:P1_is_identified_by ?ccdUri . \
						?ccdUri crm:P2_has_type ycba_identifier:ccd . \
						?ccdUri rdfs:label ?vufindRecordId . \
						?objectUri crm:P1_is_identified_by ?inventoryUri . \
						?inventoryUri crm:P2_has_type ycba_identifier:inventory-number . \
						?inventoryUri rdfs:label ?inventoryNum . \
						?objectUri crm:P2_has_type/skos:prefLabel ?objectType . \
					} \
				}";
	endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba';
	querySparql(queryStr, endpoint, displaySelectedObject);		
}

function displaySelectedObject(data) {
	var divElement; 
	var inventoryNum = "";
	var inventoryNumModified = "";
	var objectUri;
	var type = "";
	if(module == "#object1")
		divElement = $("#object1Div div");
	else
		divElement = $("#object2Div div");
	divElement.empty();
	list.empty();
	$("div.section2 h1").empty();
	$.each(data.results.bindings, function(index, bs) {	
		var link = vufindRecordBase + bs["vufindRecordId"].value;	
		if(typeof(bs["objectType"]) != "undefined")
			type = bs["objectType"].value;	
		divElement.append("<li>" + 
						"<div class='thumb'>" + 
							"<img onerror=\"this.src='images/noCover3.gif';\" src='" + bs["thumbUrl"].value + "'/>" + 
						"</div>" + 
						"<div class='objectInfo' title='" + bs["objectTitle"].value + "'>" + 
							type + "<br />" +						
							"<i>" + bs["objectTitle"].value + "</i><br />" +
							bs["inventoryNum"].value + "<br />" +
							"<a target='_blank' href='" + link + "'>View Record</a>" +
						"</div>" +
					"</li>");		
		inventoryNum = bs["inventoryNum"].value;
		if(type == "Painting")
			inventoryNumModified = inventoryNum + "FR";
		else if(type == "Frame")
			inventoryNumModified = inventoryNum.split("FR")[0];
		objectUri = bs["objectUri"].value;
	});	
	
	if(module == "#object1") {
		object1.uri = objectUri;
		object1.inventoryNum = inventoryNum;
		module = "#object2";
	}
	else {
		object2.uri = objectUri;
		object2.inventoryNum = inventoryNum;
		module = "#object1";
		
	}

	queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
				PREFIX skos:<http://www.w3.org/2004/02/skos/core#> \
				PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
				PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
				SELECT DISTINCT ?objectUri ?thumbUrl ?objectTitle ?vufindRecordId ?inventoryNum WHERE { \
					GRAPH ?objectUri { \
						?objectUri crm:P1_is_identified_by ?inventoryUri . \
						?inventoryUri crm:P2_has_type ycba_identifier:inventory-number . \
						?inventoryUri rdfs:label \"" + inventoryNumModified + "\" . \
						?titleUri crm:P2_has_type ycba_title:preferred . \
						?titleUri rdfs:label ?objectTitle. \
						?objectUri crm:P70_is_documented_in/crm:P70_is_documented_in ?thumbUri . \
						FILTER (CONTAINS(STR(?thumbUri), \"thumb\")) . \
						?thumbUri crm:P1_is_identified_by ?thumbUrl. \
						?objectUri crm:P1_is_identified_by ?ccdUri . \
						?ccdUri crm:P2_has_type ycba_identifier:ccd . \
						?ccdUri rdfs:label ?vufindRecordId . \
						?objectUri crm:P1_is_identified_by ?inventoryUri . \
						?inventoryUri crm:P2_has_type ycba_identifier:inventory-number . \
						?inventoryUri rdfs:label ?inventoryNum . \
						OPTIONAL { ?objectUri crm:P2_has_type/skos:prefLabel ?type . }\
					} \
				}";
	endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba';
	if(object1.inventoryNum.split("FR")[0] != object2.inventoryNum.split("FR")[0] && 
		inventoryNumModified != "") {
		isRelatedObject = true;
		querySparql(queryStr, endpoint, displayResults);	
	}
}

function itemDuplicate(arr, testItem) {
	var isItemDuplicate = false;
	if(arr.length > 0) {
		$.each(arr, function(j, arrItem) {
			if(arrItem["label"].value == testItem["label"].value){
				isItemDuplicate = true;;
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

function updateRepository() {
	var info = $("#submitDiv p");
	info.empty();
	if(object1.uri == "" && object2.uri == "") {
		info.text("Select objects first!");
		return;
	}
	else if(object1.uri == "") {
		info.text("Select object 1 first!");
		return;
	}
	else if(object2.uri == "") {
		info.text("Select object 2 first!");
		return;
	}
	if(object1.inventoryNum.split("FR")[0] != object2.inventoryNum.split("FR")[0]) {
		info.text("Inventory numbers do not match!");
		return;
	}	
	var updateString = RB.update.func.apply("", [RB.object1.uri, RB.object2.uri]);
	sparqlUpdate(updateString, RB.update.endpoint, updateFinished);
}

function sparqlUpdate(updateString, endpoint, callback) {
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