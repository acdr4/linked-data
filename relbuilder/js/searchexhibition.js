
function queryForExhibition(exhibitionTitle) {
	//escape any quotation marks in title
	titlePieces = exhibitionTitle.split("\"");
	exhibitionTitle = titlePieces.join("\\\"");
	javascript:console.log(exhibitionTitle);
	queryStr = "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> \
				PREFIX crm: <http://erlangen-crm.org/current/> \
				PREFIX ycba_title: <http://collection.britishart.yale.edu/id/thesaurus/title/> \
				PREFIX ycba_identifier: <http://collection.britishart.yale.edu/id/thesauri/identifier/> \
				SELECT DISTINCT ?exhibitionTitle ?thumbUrl ?objectTitle ?vufindRecordId  WHERE { \
					GRAPH ?objectUri { \
						?objectUri  crm:P12i_was_present_at ?exhibition . \
						?exhibition  crm:P3_has_note \"" + exhibitionTitle + "\" . \
						?exhibition  crm:P3_has_note ?exhibitionTitle . \
						?objectUri crm:P102_has_title ?titleUri . \
						?titleUri crm:P2_has_type ycba_title:preferred . \
						?titleUri rdfs:label ?objectTitle. \
						?objectUri crm:P70_is_documented_in/crm:P70_is_documented_in ?thumbUri . \
						FILTER (CONTAINS(STR(?thumbUri), \"thumb\")) .\
						?thumbUri crm:P1_is_identified_by ?thumbUrl. \
						?objectUri crm:P1_is_identified_by ?ccdUri . \
						?ccdUri crm:P2_has_type ycba_identifier:ccd . \
						?ccdUri rdfs:label ?vufindRecordId .\
					} \
				}";
	endpoint = 'http://collection.britishart.yale.edu/openrdf-sesame/repositories/ycba';
	querySparql(queryStr, endpoint, displayExhibition);	
}

function displayExhibition(data) {
	list = $('div.section2 ul.exhibitionObjects');
	$.each(data.results.bindings, function(index, bs) {
		if(index == 0)
			$('div.section2 h1').append(bs["exhibitionTitle"].value);
		list.append("<li><div class='thumb'><a href='" + vufindRecordBase + bs["vufindRecordId"].value + "'><img src='" + bs["thumbUrl"].value + "'/></a></div><div class='objectInfo' title='" + bs["objectTitle"].value + "'>" + bs["objectTitle"].value + "</div></li>");
	});		
}

function getURLParameter() {
	return decodeURI(
		(RegExp('title' + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
	);
}		