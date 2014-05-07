var ycba = {};

ycba.typeahead = function(query) {
	query = query.split("\"");
	query = query.join("");
	query = query.split(" ");
	query = query.join(":");
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
		PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
		PREFIX crm: <http://erlangen-crm.org/current/> \
		PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
		PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
		SELECT DISTINCT ?label WHERE { \
		GRAPH ?g { \
			?Subject rdfs:label ?label . \
			?Subject rdf:type ?type.\
			<" + query + ":> fts:prefixMatchIgnoreCase ?label.\
			?g crm:P2_has_type/skos:prefLabel ?objectType . \
			FILTER(str(?type)!='http://erlangen-crm.org/current/E34_Inscription').\
			FILTER(str(?type)!='http://erlangen-crm.org/current/E31_Document').\
			FILTER(str(?type)!='http://erlangen-crm.org/current/E37_Mark'). \
			FILTER regex(?objectType 'Painting') }} limit 25";
			
	return queryStr;
}


function ycba_autocomplete(query) {
	query = query.split(" ");
	query = query.join(":");
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
					PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
					PREFIX crm: <http://erlangen-crm.org/current/> \
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
					SELECT * WHERE { \
					GRAPH ?g { \
						?Subject rdfs:label ?label . \
						OPTIONAL { ?g crm:P2_has_type/skos:prefLabel ?objectType . \
								   ?Subject rdf:type ?labelType } .\
						<" + query + ":> fts:prefixMatchIgnoreCase ?label. }} limit 100";	
	return queryStr;
}

function ycba_searchselected(query, criteriaLabel, criteriaQuery) {
	//Split search term into mini-terms on space
	//This is because full text search does not support
	//  spaces in search terms
	query = query.split("\"");
	query = query.join("");
	query = query.split(" ");
	query = query.join(":");
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
				PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
				PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
				PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
				SELECT DISTINCT ?objectUri ?thumbUrl ?objectTitle ?vufindRecordId ?objectType ?" + criteriaLabel + " WHERE { \
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
			   ?inventoryUri rdfs:label ?inventoryNum .\
			   OPTIONAL { ?objectUri crm:P2_has_type/skos:prefLabel ?objectType . }\
					} \
				}";
	return queryStr;
}

function ycba_paintingframecriteria() {
	var str = "?inventoryUri crm:P2_has_type ycba_identifier:inventory-number . \
			   ?inventoryUri rdfs:label ?inventoryNum .";
	return str;
}
function ycba_paintingframesuggest(inventoryNum, objectType) {
	var inventoryNumModified = inventoryNum;
	if(objectType == "Frame")
		inventoryNumModified = inventoryNum.split("FR")[0];
	else if(objectType == "Painting")
		inventoryNumModified = inventoryNum + "FR";
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
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
	return queryStr;
}

function ycba_paintingframeupdate(uri1, uri2) {
	var aggregUri = "http://collection.britishart.yale.edu/id/aggregate/guid." + Math.uuid();
	var framEventUri = "http://collection.britishart.yale.edu/id/production/guid." + Math.uuid();
	var triples = "PREFIX crm: <http://erlangen-crm.org/current/> \
				   PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				   PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
				   INSERT DATA{ \
					<" + uri1 + "> crm:P16i_was_used_for <" + aggregUri + "> . \
					<" + uri2 + "> crm:P16i_was_used_for <" + aggregUri + "> . \
					<" + aggregUri + "> crm:P108i_was_produced_by <" + framEventUri + "> ; \
						rdf:type crm:E24_Physical_Thing . \
					<" + framEventUri + "> rdf:type crm:E24_Production . }";
	return triples;
}