function Europeana_Suggest(query, searchObj, response) {
    var returnedData = {};
    returnedData.results = {};
    var params = "url=" + searchObj.url + "/suggestions.json?rows=12%26query=" + query + "%26phrases=false";
    $.get("proxy.php?" + params, function(data) {
        returnedData.results.bindings = [];
        var i = 0;
        data.contents.items.forEach(function(item){
            returnedData.results.bindings[i] = {};
            returnedData.results.bindings[i].label = {}
            returnedData.results.bindings[i].label.value = item.term;
            returnedData.results.bindings[i].type = {};
            returnedData.results.bindings[i++].type.value = item.field;
        });
		var dataset = "Europeana";
        displaySuggest(returnedData, response, dataset);
        return returnedData;
    });
}

function Europeana_Select(query, searchObj) {
     var returnedData = {};
    returnedData.results = {};
    var params = "url=" + searchObj.url + "/search.json?wskey=" + searchObj.apikey + "%26rows=12%26query=" + query + "%26start=1";
    $.get("proxy.php?" + params, function(data) {
        returnedData.results.bindings = [];
        var i = 0;
        data.contents.items.forEach(function(item){
            returnedData.results.bindings[i] = {};
            returnedData.results.bindings[i].objectTitle = {}
            returnedData.results.bindings[i].objectTitle.value = item.title;
            returnedData.results.bindings[i].objectType = {}
            returnedData.results.bindings[i].objectType.value = item.type;            
            returnedData.results.bindings[i].thumbUrl = {};
            returnedData.results.bindings[i++].thumbUrl.value = item.edmPreview;
        });
		var dataset = "Europeana";
        displayResults(returnedData, dataset);
        return returnedData;
    });   
}