jQuery(document).ready(function ($)
{

//<?php
	$application = JFactory::getApplication("site");
	$menu = $application->getMenu();
	$menuitems_filter_type = $this->Params->get('menuitems_filter_type', 0);  // Can be "IN", "NOT IN" or "0"
	$selected_ids = $this->Params->get("menuitems_filter_items", array());
	$all_items = $menu->getItems("component", "com_oziogallery3");

	$all_ids = array();
	foreach($all_items as $item )
	{
		if ($menuitems_filter_type == 'IN')
		{
			if (in_array($item->id,$selected_ids)){$all_ids[] = $item->id;}
		}
		else if ($menuitems_filter_type == 'NOT IN')
		{
			if (!in_array($item->id,$selected_ids)){$all_ids[] = $item->id;}
		}
		else
		{
			$all_ids[] = $item->id;
		}		
	}
	$ids=$all_ids;
	$g_parameters=array();
	
	foreach($ids as &$i)
	{
		$item = $menu->getItem($i);
		// Skip album list menu items
		if (strpos($item->link, "&view=00fuerte") === false) continue;

		$g_parameters[]=array('params'=>$item->params->toArray(),'link'=>$item->link,'id'=>$item->id,'title'=>$item->title);
	}
	echo "\n".'var g_parameters='.json_encode($g_parameters).';';
	echo "\n".'var g_map_width='.json_encode($this->Params->get("map_width", "100").$this->Params->get("map_width_unit", "%")).';';
	echo "\n".'var g_map_height='.json_encode($this->Params->get("map_height", "400").'px').';';
// ?>
	
	jQuery("#container").append('<div id="oziomap-container"><div><div id="oziomap"></div><div></div>');
	jQuery("#oziomap-container").append('<div class="progress progress-striped"><div id="remainingphotos" class="bar" style="width: 0;"></div></div>');

	//jQuery("#oziomap-container").css('width',g_map_width);
	//jQuery("#oziomap-container").css('height',g_map_height);
	jQuery("#oziomap").css('width',g_map_width);
	jQuery("#oziomap").css('height',g_map_height);
	
	function addAlbumMarker(albumid){
		g_parameters[albumid].checked=true;
		var checkbox=$('<input type="checkbox" class="checkbox" checked="checked"/>');
		checkbox.change(function() {
			g_parameters[albumid].checked=$(this).is(":checked");
        	for (var i=0;i<googlemarkers.length;i++){
        		if (googlemarkers[i].oziodata.albumid==albumid){
        			googlemarkers[i].setVisible(g_parameters[albumid].checked);
<?php 				if ($this->Params->get("cluster", "1")) { ?>
						if ($(this).is(":checked")){
							markerCluster.addMarker(googlemarkers[i]);
						}else{
							markerCluster.removeMarker(googlemarkers[i]);
						}
<?php 				} ?>
        		}
        	}
		});
		var div=$('<span class="oziomap-checkcontainer"></span>');
		var title=$('<span></span>').text(g_parameters[albumid].title);
		div.append(checkbox);
		div.append(title);
		jQuery("#container").append(div);
		
	}
 	var googlemarkers=[];
 	var photos_per_album=1000;
 	var remainingphotos=0;
 	var max_remainingphotos=1;
 	var strings = {
 			picasaUrl:"http://picasaweb.google.com/data/feed/api/user/"
 		}; 	
	var markerCluster;
	var oms;
	var googlemap;
	var bounds;
	var autocenter=true;
	var infowindow;

	function linkify(inputText) {
	    var replacedText, replacePattern1, replacePattern2, replacePattern3;

	    //URLs starting with http://, https://, or ftp://
	    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

	    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

	    //Change email addresses to mailto:: links.
	    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
	    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

	    return replacedText;
	}
	
	function initialize() {

<?php if ($center = $this->Params->get("center", NULL)) {
	$coordinates = explode(",", $center);
	// Google map js needs them as two separate values (See constructor: google.maps.LatLng(lat, lon))
	$center = new stdClass();
	$center->latitude = floatval($coordinates[0]);
	$center->longitude = floatval($coordinates[1]);
 ?>
 autocenter=false;
 	var center = new google.maps.LatLng(<?php echo $center->latitude; ?>, <?php echo $center->longitude; ?>);
<?php } else { ?>
 autocenter=true;
 var center = new google.maps.LatLng(48,-8);
<?php } ?>
		bounds = new google.maps.LatLngBounds();
	

        googlemap = new google.maps.Map(document.getElementById('oziomap'), {
          zoom: <?php echo $this->Params->get("zoom", 0); ?>,
          center: center,
          mapTypeId: google.maps.MapTypeId.<?php echo $this->Params->get("map_type", "ROADMAP"); ?>,
		  scrollwheel: false
        });
		// InfoWindow creation
		infowindow = new google.maps.InfoWindow({maxWidth: <?php echo $this->Params->get("infowindow_width", "200"); ?>});

<?php if ($this->Params->get("cluster", "1")) { ?>
        markerCluster = new MarkerClusterer(googlemap,[],{maxZoom: 15});
<?php } ?>
		oms = new OverlappingMarkerSpiderfier(googlemap);
		oms.addListener('<?php echo $this->Params->get("infowindow_event", "click"); ?>', function(marker, event) {
<?php 		if ($this->Params->get("markers_action","infowindow") == "infowindow") { ?>
			// InfoWindow handling event
			var html=$('<div></div>');
			
<?php
		if ($this->Params->get('show_title', 0))
		{
			if ($this->Params->get('link_titles', 0))
			{
?>				
				var html_h3=$('<h3></h3>');
				var html_a=$('<a></a>').text(marker.oziodata.title);
				html_a.attr('target',<?php echo json_encode($this->Params->get("link_target", "_self")); ?>);
				html_a.attr('href', marker.oziodata.link);
				html_h3.append(html_a);
				html.append(html_h3);
<?php			
			}else{
?>
				var html_h3=$('<h3></h3>').text(marker.oziodata.title);
				html.append(html_h3);
<?php			
			}
		}
		if ($this->Params->get('show_image', 0))
		{
?>
			var html_img=$('<img  class="thumb_img">').attr('src',marker.oziodata.thumb);
			html.append(html_img);
<?php			
		}
		if ($this->Params->get('show_created', 0))
		{
?>
			var html_date=$('<div class="published_date"></div>').text(marker.oziodata.published);
			html.append(html_date);
<?php			
		}
		if ($this->Params->get('show_intro', 0))
		{
			echo 'var intro_max_size='.json_encode($this->Params->get('introtext_size', 0)).';';
?>				
			if (intro_max_size>0 && marker.oziodata.summary.length>intro_max_size){
				marker.oziodata.summary=marker.oziodata.summary.substr(0,intro_max_size)+'...';
			}
			var html_summary=$('<div class="summary"></div>').html(linkify(marker.oziodata.summary));
			html.append(html_summary);
<?php			
		}
		if($this->Params->get('showDirectionsMarker', 0))
		{
?>			
			var html_direction=$('<div  class="directions"></div>');
			var html_direction_a=$('<a target="_blank"></a>').text(<?php echo json_encode(JText::_('COM_OZIOGALLERY3_MAP_GET_DIRECTIONS'));?>);
			html_direction_a.attr('href','http://maps.google.com/maps?saddr=&daddr='+marker.oziodata.lat+','+marker.oziodata.long);
			html_direction.append(html_direction_a);
			html.append(html_direction);
<?php			
		}
?>				
			infowindow.setContent(html.html());
			infowindow.open(googlemap, marker);
<?php 		} else { ?>
			// Redirect handling event
			location.href = marker.oziodata.link;
<?php 		} ?>
		});

		for (var i=0;i<g_parameters.length;i++){
			g_parameters[i].views=0;
			g_parameters[i].checked=true;
			load_album_data(i,1);
		}
      }
      google.maps.event.addDomListener(window, 'load', initialize);	
	
	function load_album_data(i,start_index){
		var obj={'album_index':i};
		remainingphotos+=photos_per_album;
		update_remainingphotos();
		
		GetAlbumData({
				//mode: 'album_data',
				username: g_parameters[i]['params']['userid'],
				album:  (g_parameters[i]['params']['albumvisibility'] == "public" ? g_parameters[i]['params']['gallery_id'] : g_parameters[i]['params']['limitedalbum']),
				authKey: g_parameters[i]['params']['limitedpassword'],
				StartIndex: start_index,
				beforeSend: OnBeforeSend,
				success: OnLoadSuccess,
				error: OnLoadError, /* "error" is deprecated in jQuery 1.8, superseded by "fail" */
				complete: OnLoadComplete,
	
				// Tell the library to ignore parameters through GET ?par=...
				useQueryParameters: false,
				keyword:'',
				thumbSize:72,
				thumbCrop:false,
				photoSize:"auto",
				
				
				context:obj
			});
		
	}
	
	function update_remainingphotos(){
		if (remainingphotos>max_remainingphotos){
			max_remainingphotos=remainingphotos;
		}
		var perc=100-100*remainingphotos/max_remainingphotos;
		$('#remainingphotos').css('width',perc.toFixed(2)+"%");
	}
	

	
	function checkPhotoSize(photoSize)
	{
		var $allowedSizes = [94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600];
		if (photoSize === "auto")
		{
			var $windowHeight = $(window).height();
			var $windowWidth = $(window).width();
			var $minSize = ($windowHeight > $windowWidth) ? $windowWidth : $windowHeight;
			for (var i = 1; i < $allowedSizes.length; i++)
			{
				if ($minSize < $allowedSizes[i])
				{
					return $allowedSizes[i - 1];
				}
			}
		}
		else
		{
			return photoSize;
		}
	}


	function GetAlbumData(settings)
	{
		// Aggiunto supporto per album id numerico
		// Pur essendo le foto dai posts un album in formato alfanumerico, va trattato come numerico (|posts)
		var numeric = settings.album.match(/^[0-9]{19}|posts$/);
		var album_type;
		if (numeric) album_type = 'albumid';
		else album_type = 'album';

		var url = strings.picasaUrl + settings.username + ((settings.album !== "") ? '/' + album_type + '/' + settings.album : "") +
			'?imgmax=d' +
			// '&kind=photo' + // https://developers.google.com/picasa-web/docs/2.0/reference#Kind
			'&alt=json' + // https://developers.google.com/picasa-web/faq_gdata#alternate_data_formats
			((settings.authKey !== "") ? "&authkey=Gv1sRg" + settings.authKey : "") +
			((settings.keyword !== "") ? "&tag=" + settings.keyword : "") +
			'&thumbsize=' + settings.thumbSize + ((settings.thumbCrop) ? "c" : "u") + "," + checkPhotoSize(settings.photoSize) +
			((settings.hasOwnProperty('StartIndex')) ? "&start-index=" + settings.StartIndex : "") +
			((settings.hasOwnProperty('MaxResults')) ? "&max-results=" + settings.MaxResults : "");


		// http://api.jquery.com/jQuery.ajax/
		$.ajax({
			'url':url,
			'dataType': 'json', // Esplicita il tipo perche' il riconoscimento automatico non funziona con Firefox
			'beforeSend':settings.beforeSend,
			'success':settings.success,
			'error':settings.error,
			'complete':settings.complete,
			'context':settings.context
		});
	}
	
	
	function OnBeforeSend(jqXHR, settings)
	{
		document.body.style.cursor = "wait";
	}
	function OnLoadViewsAndCommentsComplete(jqXHR, textStatus)
	{
		remainingphotos-=1;
		update_remainingphotos();
	}
	
	
	function OnLoadViewsAndCommentsSuccess(result, textStatus, jqXHR)
	{	
		if (typeof result.entry !== "undefined" && typeof result.entry.gphoto$viewCount !== "undefined" && typeof result.entry.gphoto$viewCount.$t !== "undefined"){
			//$('#photo_info_box .pi-views').text(result.entry.gphoto$viewCount.$t);
			//ho le viste in result.entry.gphoto$viewCount.$t
			//alert(JSON.stringify(result.entry));
			g_parameters[this.album_index].views+=parseInt(result.entry.gphoto$viewCount.$t);
			//alert(this.album_index);
			//alert(this.photo_index);
			
			var seed = result.entry.content.src.substring(0, result.entry.content.src.lastIndexOf("/"))+ "/";
			//seed = seed.substring(0, seed.lastIndexOf("/")) + "/";

			/*
			photos.push();			
			*/
			
		}
		
		
		if (typeof result.entry !== "undefined" && typeof result.entry.georss$where !== "undefined" && typeof result.entry.georss$where.gml$Point !== "undefined" &&
			typeof result.entry.georss$where.gml$Point.gml$pos !== "undefined" && typeof result.entry.georss$where.gml$Point.gml$pos.$t !== "undefined"){

			var latlong=result.entry.georss$where.gml$Point.gml$pos.$t.split(" ");
			  var latLng = new google.maps.LatLng(latlong[0],
				  latlong[1]);
				  
			var oziodata={
				'albumid':this.album_index,
				'views':parseInt(result.entry.gphoto$viewCount.$t),
				'summary':result.entry.summary.$t,
				'title':result.entry.title.$t,
				'link':g_parameters[this.album_index].link+'&Itemid='+g_parameters[this.album_index].id+'#'+(this.photo_index+1),
				'thumb':seed+'h100/',
				'published':result.entry.published.$t,
				'album_title':g_parameters[this.album_index].title,
				'lat':latlong[0],
				'long':latlong[1],
				'album_link':g_parameters[this.album_index].link+'&Itemid='+g_parameters[this.album_index].id//+'&tmpl=component'
				
			};
			// Marker creation
			var marker = new google.maps.Marker(
			{
				map: googlemap,
				position: latLng,
				title: result.entry.title.$t,
				oziodata: oziodata
			});

			if (autocenter){
				bounds.extend(latLng);
				googlemap.fitBounds(bounds);
			}
			
<?php if ($this->Params->get("cluster", "1")) { ?>
			if (g_parameters[this.album_index].checked){
				markerCluster.addMarker(marker);
			}
<?php } ?>
			oms.addMarker(marker);
			marker.setVisible(g_parameters[this.album_index].checked);
			googlemarkers.push(marker);
			
		}
		
		
	}
	function OnLoadViewsAndCommentsError(jqXHR, textStatus, error)
	{	
		console.log( jqXHR.message, textStatus, error);
	}

	function OnLoadSuccess(result, textStatus, jqXHR)
	{
		if (result.feed.openSearch$startIndex.$t+result.feed.openSearch$itemsPerPage.$t>=result.feed.openSearch$totalResults.$t){
			addAlbumMarker(this.album_index);
		}else{
			//altra chiamata per il rimanente
			load_album_data(this.album_index,result.feed.openSearch$startIndex.$t+result.feed.openSearch$itemsPerPage.$t);
		}
		
		
		remainingphotos+=result.feed.entry.length;
		update_remainingphotos();
		for (var i = 0; i < result.feed.entry.length; ++i)
		{
			if (typeof result.feed.entry[i].link !== "undefined"){
				for (var j=0;j<result.feed.entry[i].link.length;j++){
					if (result.feed.entry[i].link[j].rel=='self' && result.feed.entry[i].link[j].type=='application/atom+xml'){
						var obj={
								'album_index':this.album_index,
								'photo_index':i
						};
						$.ajax({
							'url':result.feed.entry[i].link[j].href,
							'dataType': 'json',
							'success': OnLoadViewsAndCommentsSuccess,
							'error': OnLoadViewsAndCommentsError,
							'context':obj,
							'complete':OnLoadViewsAndCommentsComplete
						});
						
						break;
					}
				}
			}
		}
		
		
		
	}

	function OnLoadError(jqXHR, textStatus, error)
	{
		console.log( jqXHR.message, textStatus, error);
	}

	function OnLoadComplete(jqXHR, textStatus)
	{
		document.body.style.cursor = "default";
		remainingphotos-=photos_per_album;
		update_remainingphotos();
		
	}

});