$(document).ready(function(){
	
	var marketId = []; //returned from the API
	var allLatlng = []; //returned from the API
	var allMarkers = []; //returned from the API
	var marketName = []; //returned from the API
	var infowindow = null;
	var pos;
	var userCords;
	var tempMarkerHolder = [];	
	
	//Start geolocation
		
		if (navigator.geolocation) {    
		
			function error(err) {
				console.warn('ERROR(' + err.code + '): ' + err.message);
			}
			
			function success(pos){
				userCords = pos.coords;
				
				//return userCords;
			}
		
			// Get the user's current position
			navigator.geolocation.getCurrentPosition(success, error);
		} else {
			alert('Geolocation is not supported in your browser');
		}
		
		//End Geo location
		
		//map options
		//initial map settings
		var mapOptions = {
			zoom: 5,
			center: new google.maps.LatLng(37.09024, -100.712891),
			panControl: true,
			panControlOptions: {
				position: google.maps.ControlPosition.BOTTOM_LEFT
			},
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.RIGHT_CENTER
			},
			scaleControl: true

		};
		
		//Adding infowindow option
		infowindow = new google.maps.InfoWindow({
			content: "holding..."
		});
	
		//Fire up Google maps and place inside the map-canvas div
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		
		//grab form data
    $('#chooseZip').submit(function() { // bind function to submit event of form
		
		//define and set variables
		var userZip = $("#textZip").val();
		
		// add validation later???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
		var accessURL;
		
		if(userZip){
			accessURL = "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + userZip;
		} else {
			accessURL = "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + userCords.latitude + "&lng=" + userCords.longitude;
		}
			
			//Use the zip code and return all market ids in area.
			$.ajax({
				type: "GET",
				contentType: "application/json; charset=utf-8",
				url: accessURL,
				dataType: 'jsonp',
				success: function (data) {

					 $.each(data.results, function (i, val) {
						//Loop through each returned item and push onto marketId 
						marketId.push(val.id);
						//Loop through each returned item and push marketname onto var marketName
						marketName.push(val.marketname);
					 });
					
					var counter = 0;
					//Now, use the id to get detailed info
					$.each(marketId, function (k, v){
						$.ajax({
							type: "GET",
							contentType: "application/json; charset=utf-8",
							// submit a get request to the restful service mktDetail.
							url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + v,
							dataType: 'jsonp',
							success: function (data) {

							for (var key in data) {

								var results = data[key];

								//The API returns a link to Google maps containing lat and long. This pulls it apart.
								var googleLink = results['GoogleLink'];
								var latLong = decodeURIComponent(googleLink.substring(googleLink.indexOf("=")+1, googleLink.lastIndexOf("(")));
								
								var split = latLong.split(',');
								
								//covert values to floats, to play nice with .LatLng() below.
								var latitude = parseFloat(split[0]);
								var longitude = parseFloat(split[1]);
								
								//set the markers.	  
								myLatlng = new google.maps.LatLng(latitude,longitude);
						  
								allMarkers = new google.maps.Marker({
									position: myLatlng,
									//reders the features on map
									map: map,
									//title of the market on mouseover
									title: marketName[counter],
									//style of the infobox on click
									html: 
											'<div class="markerPop">' +
											'<h1>' + marketName[counter].substring(4) + '</h1>' + //substring removes distance from title
											'<h3>' + results['Address'] + '</h3>' +
											'<p>' + results['Products'].split(';') + '</p>' +
											'<p>' + results['Schedule'] + '</p>' +
											'</div>'
								});

								//put all lat long coordinates in array
								allLatlng.push(myLatlng);
								
								//Put the marketrs in an array
								tempMarkerHolder.push(allMarkers);
								
								counter++;
							};
								
								google.maps.event.addListener(allMarkers, 'click', function () {
									infowindow.setContent(this.html);
									infowindow.open(map, this);
								});

								//  Make an array of the LatLng's of the markers you want to show
								//  Create a new viewpoint bound
								var bounds = new google.maps.LatLngBounds ();
								//  Go through each...
								for (var i = 0, LtLgLen = allLatlng.length; i < LtLgLen; i++) {
								  //  And increase the bounds to take this point
								  bounds.extend (allLatlng[i]);
								}
								//  Fit these bounds to the map
								map.fitBounds (bounds);
																		
							}
						});
					}); //end .each
				}
			});

        return false; // important: prevent the form from submitting
    });
});