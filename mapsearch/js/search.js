var vufindRecordBase = "";
var start = 0; 
var offsetTracker = 0;
jQuery.get("config/config.txt", function(content) {
	configArr = content.split(new RegExp("\\n"));
	$.each(configArr, function(index, element) {
		elementPieces = element.split(": ");
		if(elementPieces[0] == "vufindRecordBase") {
			vufindRecordBase = elementPieces[1];
		}
	});
});

function setupAutocomplete() {
	$( "#mapsearch" ).autocomplete({
		source: function( request, response ) {
			$( "#results" ).empty();
			query = request.term.split(" ");
			query = query.join(":");
			endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba_dev';
			queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
						PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
						PREFIX crm: <http://erlangen-crm.org/current/> \
						PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
						PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
						SELECT * WHERE { \
						GRAPH ?g { \
							?Subject rdfs:label ?label . \
							OPTIONAL { ?g crm:P2_has_type/skos:prefLabel ?type . }\
							<" + query + ":> fts:prefixMatchIgnoreCase ?label. }} limit 100",
			querySparql(queryStr, endpoint, displayAutocompleteMenu, response);
		},
		minLength: 2,
		select: searchSelectedQuery,
		open: function() {
			$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
		},
		close: function() {
			$( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
		}
	});
}
function displayAutocompleteMenu(data, response) {
	itemsArr = new Array();
	index = 0;
	response( $.map( data.results.bindings, function( item ) {
		if(!itemDuplicate(itemsArr, item) && index < 10){
			itemsArr[index++] = item;
			label = item["label"].value;
			type = "";
			if(typeof(item["type"]) != "undefined")
				type = item["type"].value
			return {
				label: label,
				value: label,
				customHTML: "<div class='autocompleteMenu'>" + 
							"<div class='label'><p title='" + label + "'>" + label + "</p></div>" +
							"<div class='labelType'><p title='" + type + "'><b>" + type + "</b></p><div>" +
							"<div>"
			}
		}
	}));
	
	//customize autocomplete menu
	_renderItem = function( ul, item) {
		return $( "<li></li>" )
			.data( "item.autocomplete", item )
			.append( $( "<a style = \"height:16px\"></a>" ).html(item.customHTML) )
			.appendTo( ul );
	}	
}

function searchSelectedQuery(event, ui) {
	$(".info").empty();
	$(".info").append("<p>Loading map data...</p>");
	$(".info").show();
	query = ui.item ? ui.item.label : this.value;
	query = query.split("\"");
	query = query.join("");
	query = query.split(" ");
	query = query.join(":");
	queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
				PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
				PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
				SELECT DISTINCT ?objectUri ?latitude ?longitude ?vufindRecordId ?title ?thumbUrl WHERE { \
					GRAPH ?objectUri { \
						?Subject rdfs:label ?label . \
						<" + query + ":> fts:prefixMatchIgnoreCase ?label. \
						?objectUri crm:P102_has_title ?titleUri . \
						?titleUri rdfs:label ?title . \
						?objectUri crm:P70_is_documented_in/crm:P70_is_documented_in ?thumbUri . \
						FILTER (CONTAINS(STR(?thumbUri), \"thumb\")) . \
						?thumbUri crm:P1_is_identified_by ?thumbUrl. \
						?objectUri crm:P67_refers_to/geo:location/geo:Point ?point . \
						?point geo:lat ?latitude . \
						?point geo:long ?longitude . \
						?objectUri crm:P1_is_identified_by ?ccdUri . \
						?ccdUri crm:P2_has_type ycba_identifier:ccd . \
						?ccdUri rdfs:label ?vufindRecordId }} limit 1000 ";
					javascript:console.log(queryStr);	
	endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba_dev';
	querySparql(queryStr, endpoint, displayOnMap);		
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

function displayOnMap(data) {
	var records = new Array();
	offsetTracker++;
	$.each(data.results.bindings, function(index, bs) {
		records[index] = {};
		records[index].Latitude = bs["latitude"].value;
		records[index].Longitude = bs["longitude"].value;
		records[index].Url = vufindRecordBase + bs["vufindRecordId"].value;
		records[index].Title = bs["title"].value;
		if(bs["thumbUrl"])
			records[index].Thumb = bs["thumbUrl"].value;
		else
			records[index].Thumb = "";
	});
	
	$(".newsearch").show();
	$("div .ui-widget").hide();
	
	if(records.length > 0) {
		updateMap(records);
		$(".info").hide();
	}
	else {
		$(".info").empty();
		$(".info").append("<p>Object does not have geodata info</p>");
		$("#map-container").hide();
	}

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
	
function queryAndDisplayAllObjects(offset) {
	start = new Date().getTime();
	queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
				PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
				PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
				PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
				SELECT DISTINCT ?objectUri ?latitude ?longitude ?vufindRecordId ?title ?thumbUrl WHERE { \
					GRAPH ?objectUri { \
						?objectUri crm:P67_refers_to/geo:location/geo:Point ?point . \
						?point geo:lat ?latitude . \
						?point geo:long ?longitude . \
						?objectUri crm:P1_is_identified_by ?ccdUri . \
						?ccdUri crm:P2_has_type ycba_identifier:ccd . \
						?ccdUri rdfs:label ?vufindRecordId .\
						?objectUri crm:P102_has_title ?titleUri . \
						?titleUri crm:P2_has_type ycba_title:preferred . \
						?titleUri rdfs:label ?title . \
						OPTIONAL{\
						?objectUri crm:P70_is_documented_in/crm:P70_is_documented_in ?thumbUri . \
						FILTER (CONTAINS(STR(?thumbUri), \"thumb\")) . \
						?thumbUri crm:P1_is_identified_by ?thumbUrl. }}} limit 2000 offset " + offset + "";
	endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba';
	querySparql(queryStr, endpoint, displayData);
}

function displayData(data) {
	var records = new Array();
	offsetTracker++;
	$.each(data.results.bindings, function(index, bs) {
		records[index] = {};
		records[index].Latitude = bs["latitude"].value;
		records[index].Longitude = bs["longitude"].value;
		records[index].Url = vufindRecordBase + bs["vufindRecordId"].value;
		records[index].Title = bs["title"].value;
		if(bs["thumbUrl"])
			records[index].Thumb = bs["thumbUrl"].value;
		else
			records[index].Thumb = "";
	});
	if(records.length > 0) {
		updateMap(records);
		//queryAndDisplayAllObjects(offsetTracker * 2000);	
	}
	else {
		$(".info").hide();	
	}

}
