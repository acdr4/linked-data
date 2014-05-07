function Europeana_Suggest(query, url, response) {
    var results = {};
    $.get("proxy.php", function(data) {
        results.items = [];
        var i = 0;
        data.contents.items.forEach(function(item){
            results.items[i] = {};
            results.items[i].label = item.term;
            results.items[i++].type = item.field;
        });
        displaySuggest(results, response);
        return results;
    });
}