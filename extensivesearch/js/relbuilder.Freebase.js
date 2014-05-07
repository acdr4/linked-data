function Freebase_Suggest(query, searchObj, response) {
    var returnedData = {};
    returnedData.results = {};
    var params = "url=" + searchObj.url + "/search?key=" + searchObj.apikey + "%26query=" + query;
	//freebase won't accept any queries with spaces
	params = params.replace(" ", ",");	
    $.get("proxy.php?" + params, function(data) {
        returnedData.results.bindings = [];
        var i = 0;
        data.contents.result.forEach(function(item){
            returnedData.results.bindings[i] = {};
            returnedData.results.bindings[i].label = {}
            returnedData.results.bindings[i].label.value = item.name;
            if(typeof(item.notable) != "undefined") {
                returnedData.results.bindings[i].type = {};
                returnedData.results.bindings[i++].type.value = item.notable.name;
            }
        });
		var dataset = "Freebase";
        displaySuggest(returnedData, response, dataset);
        return returnedData;
    });
}

function Freebase_Select(query, searchObj) {
    var returnedData = {};
    returnedData.results = {};
    var params = "url=" + searchObj.url + "/search?key=" + searchObj.apikey + "%26query=" + query;
	//freebase won't accept any queries with spaces
	params = params.replace(" ", ",");
    $.get("proxy.php?" + params, function(data) {
        returnedData.results.bindings = [];
        var i = 0;
        data.contents.result.forEach(function(item){
            returnedData.results.bindings[i] = {};
            returnedData.results.bindings[i].objectTitle = {}
            returnedData.results.bindings[i].objectTitle.value = item.name;
            if(typeof(item.notable) != "undefined") {
                returnedData.results.bindings[i].objectType = {};
                returnedData.results.bindings[i].objectType.value = item.notable.name;
            }
            returnedData.results.bindings[i].link = {}
            returnedData.results.bindings[i].link.value = "http://www.freebase.com/" + item.id;			
            i++;            
            /*returnedData.results.bindings[i].objectType = {}
            returnedData.results.bindings[i].objectType.value = item.type;            
            returnedData.results.bindings[i].thumbUrl = {};
            returnedData.results.bindings[i++].thumbUrl.value = item.edmPreview;*/
        });
		var dataset = "Freebase";
        displayResults(returnedData, dataset);
        return returnedData;
    });   
}