var markers = [];
	var latitudes = [];
	var longitudes = [];
	var infowindow = null;
	
	function markerExists(lat, lng)
	{
		var latExists = false;
		var lngExists = false;
		if(latitudes.length == 0)
		{
			return false;
		}
		else
		{
			for(var i = 0; i < latitudes.length; i++)
			{
				if(lat == latitudes[i])
				{
					latExists = true;
				}
			}
			for(var i = 0; i < longitudes.length; i++)
			{
				if(lng == longitudes[i])
				{
					lngExists = true;
				}
			}
			
			if(latExists && lngExists)
			{
				return true;
			}
		}
		return false;
	}
	
	function initialize() 
	{
		var center = new google.maps.LatLng(46.55886,-34.453125);
        var map = new google.maps.Map(document.getElementById('map'), {
          zoom: 3,
          center: center,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });
		var imageUrl = 'http://chart.apis.google.com/chart?cht=mm&chs=24x32&' +
			'chco=FFFFFF,008CFF,000000&ext=.png';
		var markerImage = new google.maps.MarkerImage(imageUrl,
			new google.maps.Size(24, 32));
			
		var markerCluster = new MarkerClusterer(map);
        
		for (var i = 0; i < 663; i++) {
			var place = places.array[i];
							
			var myLat = place.lat;
			var myLng = place.lng;
			
			if(markerExists(myLat, myLng)){
				var randomnumber1 = Math.floor(Math.random()*101);  //generates a random number 0-100
				var randomnumber2 = Math.floor(Math.random()*101);
				var offset1 = 0.0001*randomnumber1;
				var offset2 = 0.0001*randomnumber2;
				myLat = parseFloat(myLat) + parseFloat(offset1)
				myLng = parseFloat(myLng) + parseFloat(offset2)
			}
				var contentString = 
				'<div id="bodyContent" style="max-width: 200px; overflow: hidden;">'+
				'<a href="'+place.url+'" target="_blank"><i>'+place.title+'</i></a>'+
				'</br><font>'+place.author+'</font>'+
				'</div>';

				latitudes[i] = place.lat;
				longitudes[i] = place.lng;
			
				var latLng = new google.maps.LatLng(myLat,
					myLng);
				var marker = new google.maps.Marker({
					position: latLng,
					html: contentString,
					icon: markerImage
				});
				infowindow = new google.maps.InfoWindow({
					content: contentString
				});
				google.maps.event.addListener(marker, 'click', function() {
				infowindow.setContent(this.html);
				infowindow.open(map,this);
				});
			
				markers.push(marker);
        }
        var markerCluster = new MarkerClusterer(map, markers);
    }