function Dbpedia_Suggest(query, searchObj, response) {
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
    var dataset = "Dbpedia";
	querySparql(queryStr, searchObj.url, displaySuggest, response, dataset);
    /*var params = "url=" + searchObj.url + "query=" + queryStr + "%26Accept=application%2Fsparql-results%2Bjson";
    $.get("proxy.php?" + params, function(data) {
        displaySuggest(data, response);
    });  */  
}

function insertQuotes(strArr) {
    $.each(strArr, function(j, arrItem) {
            strArr[j] = "'" + arrItem + "'";
    });	
    return strArr;
}

function Dbpedia_Select(query, searchObj) {
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
    var dataset = "Dbpedia";
	querySparql(queryStr, searchObj.url, displayResults, dataset);    
}