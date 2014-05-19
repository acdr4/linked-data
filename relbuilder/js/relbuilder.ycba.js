//File contains functions specific to the ycba endpoint

EndpointSupport.ycba = {};
EndpointSupport.ycba.Painting_To_Frame = {};

// returns a sparql query string that looks for object labels that match the given search value
EndpointSupport.ycba.Painting_To_Frame.getLabels = function(query) {
	query = query.split("\""); // need to remove double quotes as they'd cause an error in sparql query
	query = query.join("");
	query = query.split(" ");
	query = query.join(":"); // full text searches are usually separated by colons
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
	return queryStr;
}

// returns a sparql string for searching objects that match the query selected by the user
EndpointSupport.ycba.Painting_To_Frame.searchSelected = function(query, offset, limit) {
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
				FILTER regex(?objectType, '(painting)|(frame)', 'i').\
			} \
		} LIMIT " + limit + " OFFSET " + offset;
	return queryStr;
}

// returns the sparql query string for suggesting a related object
EndpointSupport.ycba.Painting_To_Frame.suggest = function(prevObj) {
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
	return queryStr;
}

// returns the aggregate uri and the aggregate object ID
EndpointSupport.ycba.Painting_To_Frame.createAggregUri = function(object1, object2) {
	var object1ID = object1.selectedItems[0].objectUri.split("/");
	object1ID = object1ID[object1ID.length-1];
	var object2ID = object2.selectedItems[0].objectUri.split("/");
	object2ID = object2ID[object2ID.length-1];
	//painting ID first followed by frame ID
	var firstID = object1.selectedItems[0].objectType==='Painting'? object1ID:object2ID;
	var secondID = object1.selectedItems[0].objectType==='Frame'? object1ID:object2ID;
	var aggregObjID = firstID + "-" + secondID;
	var aggregObjUri = "http://collection.britishart.yale.edu/id/object/" + aggregObjID;
	return {aggregObjUri:aggregObjUri, aggregObjID:aggregObjID};
}

// query for counting the number of production events for the aggregation object defined
// the number is zero if the aggregation object is not in the triple store yet
EndpointSupport.ycba.Painting_To_Frame.preUpdateQuery = function(uri1, uri2) {
	var queryStr = "\
		PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
		PREFIX crm: <http://erlangen-crm.org/current/> \
		PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
		SELECT (count(DISTINCT ?prodUri) AS ?prodCount) WHERE{\
			?aggregObjUri crm:P16i_was_used_for <"+uri1+">;\
				crm:P16i_was_used_for <"+uri2+">;\
				crm:P108i_was_produced_by ?prodUri.\
		}";
	return queryStr;
}

EndpointSupport.ycba.Painting_To_Frame.update = function(res, aggregObjUri, uri1, uri2) {
	var prodCount = 0;
	if(typeof(res.data.contents) === "undefined" ||
	typeof(res.data.contents.results) === "undefined" ||
	typeof(res.data.contents.results.bindings) === "undefined" ||
	res.data.contents.results.bindings.length <= 0)
	prodCount = 0;
	else prodCount = res.data.contents.results.bindings[0].prodCount.value;
	var prodID = ++prodCount;
	var prodUri = aggregObjUri+"/production/"+prodID;
	var sparqlStr = "\
		PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
		PREFIX crm: <http://erlangen-crm.org/current/> \
		PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
		INSERT DATA{\
			<"+aggregObjUri+"> rdf:type crm:E22_Man-Made_Object;\
				crm:P16i_was_used_for <"+uri1+">;\
				crm:P16i_was_used_for <"+uri2+">;\
				crm:P108i_was_produced_by <"+prodUri+">.\
			<"+prodUri+"> rdf:type crm:E12_Production.\
		}";
	var rdfStr = '\
<rdf:RDF xmlns:crm="http://erlangen-crm.org/current/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n\
	<rdf:Description rdf:about="' + aggregObjUri + '">\n\
		<rdf:type rdf:resource="http://erlangen-crm.org/current/E22_Man-Made_Object"></rdf:type>\n\
		<crm:P16i_was_used_for rdf:resource="' + uri1 + '"></crm:P16i_was_used_for>\n\
		<crm:P16i_was_used_for rdf:resource="' + uri2 + '"></crm:P16i_was_used_for>\n\
		<crm:P108i_was_produced_by rdf:resource="' + prodUri + '"></crm:P108i_was_produced_by>\n\
	</rdf:Description>\n\
	<rdf:Description rdf:about="'+prodUri+'">\n\
		<rdf:type rdf:resource="http://erlangen-crm.org/current/E12_Production"></rdf:type>\n\
	</rdf:Description>\n\
</rdf:RDF>';
	return {sparqlStr:sparqlStr, rdfStr: rdfStr};
}

// checks whether a painting matches a frame based on the painting-frame criterion
// the criterion is that a frame's accession id is just a painting's accession id appended with "FR"
EndpointSupport.ycba.Painting_To_Frame.match = function(num1, num2) {
	return (num1 != num2) && (num1.split("FR")[0] == num2.split("FR")[0]);	
}




