function BritishMuseum_Suggest(query, searchObj, response) {
    query = query.split(" ");
    query = query.join(":");
    var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
                    PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
                    PREFIX crm: <http://erlangen-crm.org/current/> \
                    PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					PREFIX bmo: <http://collection.britishmuseum.org/id/ontology/> \
                    PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
                    SELECT DISTINCT * WHERE { \
						{\
							SELECT DISTINCT ?label ?type  {\
								?objectUri crm:P102_has_title/rdfs:label ?label .\
								<" + query + ":> fts:prefixMatchIgnoreCase ?label.\
								?objectUri bmo:PX_object_type/skos:prefLabel ?type .\
							}\
						}\
						UNION\
						{\
							SELECT DISTINCT ?label ?type  {\
								?objectUri1 crm:P108i_was_produced_by/crm:P14_carried_out_by/skos:prefLabel ?label .\
								<" + query + ":> fts:prefixMatchIgnoreCase ?label.\
								BIND('Creator' AS ?type) .\
							}\
						}\
                    } limit 50";//print(queryStr);
	var dataset = "British Museum";
	querySparql(queryStr, searchObj.url, displaySuggest, response, dataset);
}

function BritishMuseum_Select(query, searchObj, filter) {
    //Split search term into mini-terms on space
    //This is because full text search does not support
    //  spaces in search terms
    /*query = query.split("\"");
    query = query.join("");
    query = query.split(" ");
    query = query.join(":");*/
	var filterStr = "";
	if(filter.type == "Creator") {
		filterStr = "?objectUri  crm:P108i_was_produced_by/crm:P14_carried_out_by ?creatorUri ." +
					"?creatorUri skos:prefLabel '" + query + "' .";
	}
	else if(filter.type != "") {
		filterStr = "?objectUri crm:P102_has_title ?titleUri ." +
					"?titleUri rdfs:label '" + query + "'." +
					"?objectUri bmo:PX_object_type/skos:prefLabel '" + filter.type + "'.";
	}	
    var queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
                    PREFIX crm: <http://erlangen-crm.org/current/> \
                    PREFIX fts: <http://www.ontotext.com/owlim/fts#> \
                    PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
					PREFIX bmo: <http://collection.britishmuseum.org/id/ontology/> \
                    PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
                    PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
                    SELECT DISTINCT ?objectTitle ?thumbUrl ?objectType ?link WHERE { \
						" + filterStr + "\
						?objectUri crm:P102_has_title ?titleUri . \
						?titleUri crm:P2_has_type ycba_title:preferred . \
						?titleUri rdfs:label ?objectTitle. \
						?objectUri bmo:PX_object_type/skos:prefLabel ?objectType . \
						?objectUri crm:P1_is_identified_by ?ccdUri . \
						?ccdUri crm:P2_has_type ycba_identifier:ccd . \
						?ccdUri rdfs:label ?vufindRecordId .\
						BIND(CONCAT('" + RelBuilder.VufindRecordbase + "', ?vufindRecordId) AS ?link) . \
						OPTIONAL { ?objectUri bmo:PX_has_main_representation ?thumbUrl . } \
						} limit 100";print(queryStr);
    var dataset = "British Museum";
	querySparql(queryStr, searchObj.url, displayResults, dataset);    
}
