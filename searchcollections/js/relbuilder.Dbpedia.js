function Dbpedia_Suggest(query, url, response) {
    var queryTerms = query.split(" ");
    var last = queryTerms[queryTerms.length - 1];
    queryTerms = insertQuotes(queryTerms);
    if(typeof(last) != "undefined" && last.length > 4) {
            last = "('" + last + "' OR '" + last + "*')";	
            queryTerms[queryTerms.length - 1] = last;
    }
    else if(queryTerms.length > 1) {
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
                                            ?Subject dbpprop:shortDescription ?type } limit 100";    
    return queryStr;
}

function insertQuotes(strArr) {
    $.each(strArr, function(j, arrItem) {
            strArr[j] = "'" + arrItem + "'";
    });	
    return strArr;
}