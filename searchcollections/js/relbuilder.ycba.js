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

function ycba_searchselected(query ) {
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
				SELECT DISTINCT ?objectUri ?thumbUrl ?objectTitle ?vufindRecordId ?objectType WHERE { \
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
						OPTIONAL { ?objectUri crm:P2_has_type/skos:prefLabel ?objectType . }\
					} \
				}";
	return queryStr;
}

function dbp_autocomplete(query) {
	var queryTerms = query.split(" ");
	var last = queryTerms[queryTerms.length - 1];
	queryTerms = insertQuotes(queryTerms);
	if(typeof(last) != "undefined" && last.length > 4) {
		last = "('" + last + "' OR '" + last + "*')";	
		queryTerms[queryTerms.length - 1] = last;
	}
	else {
		var index = queryTerms.indexOf("'" + last + "'");
		queryTerms.splice(index, 1);
	}
	queryTerms = queryTerms.join(" AND ");

	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
					PREFIX dbpprop:<http://dbpedia.org/property/> \
					PREFIX dbpedia-owl:<http://dbpedia.org/ontology/> \
					PREFIX dc: <http://purl.org/dc/elements/1.1/> \
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					SELECT * WHERE { \
						?Subject rdfs:label ?label . \
						?label bif:contains \"" + queryTerms + "\" . \
						FILTER(LANG(?label) = \"en\") . \
						?Subject dbpprop:shortDescription ?objectType } limit 100";
	return queryStr;
}

function dbp_searchselected(query) {
	//Split search term into mini-terms on space
	//This is because full text search does not support
	//  spaces in search terms
	query = query.split("\"");
	query = query.join("");
	query = query.split(" ");
	query = insertQuotes(query);
	query = query.join(" AND ");
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
					PREFIX dbpprop:<http://dbpedia.org/property/> \
					PREFIX dbpedia-owl:<http://dbpedia.org/ontology/> \
					PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
					PREFIX dc: <http://purl.org/dc/elements/1.1/> \
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					SELECT ?objectUri ?label ?objectTitle ?thumbUrl ?objectType WHERE { \
						?objectUri rdfs:label ?label . \
						?label bif:contains \"" + query + "\" . \
						FILTER(LANG(?label) = \"en\") . \
						{?objectUri  dbpprop:name ?objectTitle} \
						UNION {?objectUri  foaf:name ?objectTitle} . \
						OPTIONAL{ ?objectUri dbpedia-owl:thumbnail ?thumbUrl } . \
						?objectUri dbpprop:shortDescription ?objectType } limit 10";
	return queryStr;	
}

function insertQuotes(strArr) {
	$.each(strArr, function(j, arrItem) {
		strArr[j] = "'" + arrItem + "'";
	});	
	return strArr;
}

function bm_autocomplete(query) {
	query = query.split(" ");
	query = query.join(":");
	var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
					PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
					PREFIX crm: <http://erlangen-crm.org/current/> \
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
					PREFIX bmo: <http://collection.britishmuseum.org/id/ontology/>\
					SELECT * WHERE { \
						?Subject rdfs:label ?label . \
						?Subject rdf:type crm:E22_Man-Made_Object . \
						OPTIONAL { ?Subject bmo:PX_object_type/skos:prefLabel ?objectType } .\
						<" + query + ":> fts:prefixMatchIgnoreCase ?label. } limit 100";	
	return queryStr;
}

function bm_searchselected(query) {
	//Split search term into mini-terms on space
	//This is because full text search does not support
	//  spaces in search terms
	query = query.split("\"");
	query = query.join("");
	query = query.split(" ");
	query = query.join(":");
	var queryStr = "PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
					PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
					PREFIX crm: <http://erlangen-crm.org/current/>\
					PREFIX bmo: <http://collection.britishmuseum.org/id/ontology/>\
					PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\
					SELECT ?objectUri ?objectTitle ?objectType ?thumbUrl WHERE {\
						?objectUri rdfs:label ?label .\
						?objectUri crm:P102_has_title/rdfs:label ?title .\
						?objectUri rdf:type crm:E22_Man-Made_Object . \
						?objectUri bmo:PX_object_type/skos:prefLabel ?objectType .\
						?objectUri bmo:PX_has_main_representation ?thumbUrl .\
						<" + query + ":> fts:prefixMatchIgnoreCase ?label .\
					}";
	return queryStr;
}
