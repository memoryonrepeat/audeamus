// JavaScript Document
$("#mainArea").bind("touchmove",  function(e){
    e.preventDefault();
});

var MAX_ZOOM_LEVEL = 300;
var OVERVIEW_LEVEL = 70;
var OVERVIEW_RATIO = OVERVIEW_LEVEL/100;
var USER_INFO = "user_info";
var LOG_OUT_LINK = "http://imbn.whatsword.com/index.php/auth/logout";
var SUBMIT_REMIND_LINK = "http://imbn.whatsword.com/index.php/auth/remind";
var PREFER_USER_LINK = "http://imbn.whatsword.com/index.php/auth/updatePrefer";
var current_ratio_ = -1;
var map_event_overview_ = null;
var map_event_list_ = null;
var user_location_div_ = "";
var snapper_ = null; // for snapper
var selectedCat_ = 0;
var eventCondObj_ = new Object();
var isOnline_ = navigator.onLine;
var user_info_ = null;
var currentEventDetailsId_ = null;

/** Duy - Used for printing date time **/
var dayInWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getFormattedTimePeriodStr(rawStrFrom, rawStrTo)
{
	var fromObj = new Date(getStandardDateStr(rawStrFrom));
	var toObj = new Date(getStandardDateStr(rawStrTo));

	var retStr = "";
	if(areSameDay(fromObj, toObj))
	{
		retStr += "<em>Time: </em>" + getFormattedDate(fromObj);
		var fromTimeStr = getFormattedTime(fromObj);
		var toTimeStr = getFormattedTime(toObj);
		if(toTimeStr !== "" && fromTimeStr === "")
			fromTimeStr = "0:00";
		if(fromTimeStr !== "")
			retStr += ", " + fromTimeStr + " to " + toTimeStr;
	}
	else
	{
		retStr += "<em>From: </em>" + getFormattedDate(fromObj);
		var fromTimeStr = getFormattedTime(fromObj);
		if(fromTimeStr !== "")
			retStr += ", " + fromTimeStr;
		retStr += "</br>";
		var toTimeStr = getFormattedTime(toObj);
		retStr += "<em>To: </em>" + getFormattedDate(toObj);
		if(toTimeStr !== "")
			retStr += ", " + toTimeStr;
	}

	return retStr;
}

function getFormattedRepeatedInfo(repeatedInfoStr)
{
}

function getFormattedDate(dateTimeObj)
{
	var retStr = dayInWeek[dateTimeObj.getDay()] + ", ";
	retStr += dateTimeObj.getDate() + "/" + (dateTimeObj.getMonth() + 1) + "/" + dateTimeObj.getFullYear();
	return retStr;
}

function getFormattedTime(dateTimeObj)
{
	var retStr = "";
	var hour = dateTimeObj.getHours();
	var minute = dateTimeObj.getMinutes();
	if(hour != 0 || minute != 0)
	{
		var hourStr = hour.toString();
		var minuteStr = minute.toString();
		if(minute < 10)
			minuteStr = "0" + minuteStr;
		retStr += hourStr + ":" + minuteStr;		
	}

	return retStr
}

function areSameDay(dOne, dTwo)
{
	return dOne.getDate() == dTwo.getDate() && dOne.getMonth() == dTwo.getMonth() && dOne.getFullYear() == dTwo.getFullYear();
}

/** Map Location **/
function getCoordById(locId)
{
	var locObj = mapIdToLocObj[locId];
	if(locObj === 'undefined')
		return null;

	var coordObj = new Object();
	coordObj.x = locObj.x_coord;
	coordObj.y = locObj.y_coord;
	
	return coordObj;
}
function groupMapLoc(locIdArr)
{
	locIdArr.sort(function(idOne, idTwo) {
		var parentIdOne = mapIdToLocObj[idOne].parent_map_id;
		var parentIdTwo = mapIdToLocObj[idTwo].parent_map_id;
		return parentIdOne - parentIdTwo;
	});

	var groupLocArr = new Array();
	for(var ind = 0; ind < locIdArr.length;)
	{
		var curId = locIdArr[ind];
		var parentId = mapIdToLocObj[curId].parent_map_id;

		var groupObj = new Object();
		groupObj.x = mapIdToLocObj[parentId].x_coord;
		groupObj.y = mapIdToLocObj[parentId].y_coord;
		groupObj.map_id = parentId;

		// Count the number of consecutive locations having the same parent_id
		var nextInd = ind + 1;
		var count = 1;
		while(nextInd < locIdArr.length && 
		      mapIdToLocObj[locIdArr[nextInd]].parent_map_id === parentId)
		{
			count++;
			nextInd++;
		}

		groupObj.count = count;
		groupLocArr.push(groupObj);

		ind = nextInd;
	}

	return groupLocArr;
}


function mapFocus(posx, posy) {
	$('#nusmap').smoothZoom('focusTo',{
		x: posx,
		y: posy,
		zoom: current_ratio_*100,
		speed: 10
	});
}

function genEventListDiv(map_evn) {
	var mapPos = getCoordById(map_evn.map_id);
	var htmlstr = "<div id=\""+map_evn.event_id+"\" class=\"item mark\" data-position=\""+mapPos.x+","+mapPos.y+"\" data-show-at-zoom="+OVERVIEW_LEVEL+"\>";
	console.log("map_evn event_id = " + map_evn.event_id);
	if (map_evn.event_id.length == 1) {
		htmlstr	+= "<div><div class=\"text\" style=\"width:100px\"  onClick=\"loadEventDetails(["+map_evn.event_id+"])\"><strong>"+map_evn.name+"</strong></div>";
	} else {
		var strParam = "[";
		for(var i in map_evn.name) {
			strParam += "'"+ map_evn.name[i] +"',";
		}
		strParam += "'']";
		htmlstr	+= "<div><div class=\"text\"  onClick=\"loadEventDetails(["+map_evn.event_id+"], "+strParam+")\">"+map_evn.event_id.length+"</div>";
	}
	htmlstr	+= "<img src='images/pin.png'  alt=\"Event\"/></div>";
	htmlstr	+= "</div>";
	return htmlstr;
}
function genEventOverviewDiv(map_evo) {
	var htmlstr = "<div id=\"evo_"+map_evo.map_id+"\" class=\"item mark\" data-position=\""+map_evo.x+","+map_evo.y+"\" data-show-at-zoom=0   >";
	var circle_img = "";
	if(map_evo.count > 5) {
		circle_img = "5LCircle2.png";
	} else if (map_evo.count > 3) {
		circle_img = "5LCircle3.png";
	} else {
		circle_img = "5LCircle4.png";
	}
	htmlstr	+= "<div style='position: relative;top: -35px;'><img src='images/"+circle_img+"' width=\"60px\" height=\"60px\" alt=\"Event\"/><div class=\"counttext\"><b>"+map_evo.count+"</b></div></div>";
	htmlstr	+= "</div>";
	return htmlstr;
}
function showMapOverview() {
	console.log("show overview");
	$("#zoom_container .landmarks").html("");
	is_user_location_showed = false;
	var htmlstr = "";
	for(var i in map_event_overview_)
		htmlstr += genEventOverviewDiv(map_event_overview_[i]);
	htmlstr += user_location_div_;
	$("#zoom_container .landmarks").html(htmlstr);
	$('#nusmap').smoothZoom('refreshAllLandmarks');
}

function showMapList() {
	console.log("showMapList");
	$("#zoom_container .landmarks").html("");
	is_user_location_showed = false;
	var htmlstr = "";
	for(var i in map_event_list_)
		htmlstr += genEventListDiv(map_event_list_[i]);
	htmlstr += user_location_div_;
	$("#zoom_container .landmarks").html(htmlstr);
	$('#nusmap').smoothZoom('refreshAllLandmarks');
}

function updateZoom(zoomData) {
	var ratio = zoomData.ratio; 
	if (current_ratio_ == -1) {
		current_ratio_ = ratio;
		return;
	}
	if (ratio > OVERVIEW_RATIO && current_ratio_ <= OVERVIEW_RATIO) { // need to change
		showMapList();
	} else if (ratio <= OVERVIEW_RATIO && current_ratio_ > OVERVIEW_RATIO) {
		showMapOverview();
	}
	current_ratio_ = ratio;
}
function updateMap() {
	
	var num_event = 0;
	var map_ids = new Array();
	for(var ind = 0; ind < map_event_list_.length; ind++) {
		num_event += map_event_list_[ind].event_id.length;
		for (var count = 0; count < map_event_list_[ind].event_id.length; count++)
			map_ids.push(map_event_list_[ind].map_id);
	}
	
	// show count
	$("#envCountLabel").html(num_event + " events on map");
	
	map_event_overview_ = groupMapLoc(map_ids);
	if (current_ratio_ > OVERVIEW_RATIO) {
		showMapList();
	} else {
		showMapOverview();
	}
}

function initUserInfo() {
	var hash_value = window.location.hash;
	if (hash_value != "") {
		hash_value = hash_value.replace('#', '');
		hash_value = decodeURIComponent(hash_value);
		user_info_ = JSON.parse(hash_value);
		localStorage[USER_INFO] = hash_value;
	} else {
		hash_value = localStorage[USER_INFO];
	}
	
	if (hash_value !== undefined && hash_value != "") {
		user_info_ = JSON.parse(hash_value);
		$("#welcome_us_info").html(user_info_.name);
		$("#lmSynLogged").show();
		$("#reminderEmail").val(user_info_.email);
		$("#remiderPhone").val(user_info_.phone);	
		$("#userPreferTag").val(user_info_.prefer);	
	} else {
		$("#lmSynNotLogged").show();
	}
	
	if (user_info_ != null) {
		registerLocalUser(user_info_.user_id);
		updateUserForBookmarkData();
		syncBookmark(true);
	}
}


function logout() {
	localStorage[USER_INFO] = "";
	location.href = LOG_OUT_LINK;
}

function changeCategory(newCat) {
	$(".dropdown-content").css({'opacity': 0, 'visibility': 'hidden'});
	if (selectedCat_ != newCat) {
		if (newCat == 0) 
			$("#catTitle").html("All Categories");
		else
			$("#catTitle").html(mapIdToCategory[newCat].category_name);
		selectedCat_ = newCat;
		eventCondObj_[BY_CATEGORY] = [selectedCat_];
		map_event_list_ = searchEvent(eventCondObj_);
		updateMap();
	}
}

function openCatDropDown() {
	var dropdowncont = $(".dropdown-content");
	if (dropdowncont.css('opacity') == 1) {
		$(".dropdown-content").css({'opacity': 0, 'visibility': 'hidden'});
	} else {
		$(".dropdown-content").css({'opacity': 1, 'visibility': 'visible'});
	}
}



function showLeftMenu(type) {
	snapper_.open('left');
	var lm = $("#leftMenuMainArea");
	lm.children("#lmCurrentLocation").hide();
	lm.children("#lmSyn").hide();	
	lm.children("#lmBookMark").hide();
	lm.children("#lmEventDetails").hide();
	lm.children("#lmBugReport").hide();
	lm.children("#lmSearch").hide();
	switch(type) {
		case 1:    lm.children("#lmCurrentLocation").show(); 
				lm.children("#leftMenuHeader").html("Find your position on map.");
				break;
		case 2:    lm.children("#lmSyn").show();
				lm.children("#leftMenuHeader").html("Sync data to cloud and use everywhere.");
				break;
		case 3:    lm.children("#lmBookMark").show();
				lm.children("#leftMenuHeader").html("Your Bookmarks");
				break;
		case 4:    lm.children("#lmEventDetails").show();
				lm.children("#lmEventDetailsContent").html("Loading...");
				lm.children("#leftMenuHeader").html("Event details");
				break;
		case 5:
				lm.children("#lmBugReport").show();
				lm.children("#leftMenuHeader").html("Welcome to Audeamus");
				break;
		case 6:
				lm.children("#lmSearch").show();
				lm.children("#leftMenuHeader").html("Search Result");
				break;
	}
}
function loadCurrentLocation() {
	
	showLeftMenu(1);
	var lmclstatus =  $("#lmclstatus");
	lmclstatus.html("");
	function displayPosition(position) {
		mapPos = convertLanLongToMapPos(position.coords.latitude, position.coords.longitude);
		var htmlstr = "<div id='map_user_location' class=\"item mark\" data-position=\""+mapPos.x+","+mapPos.y+"\" data-show-at-zoom=0>";
		htmlstr	+= "<img src='images/mark.png' width=\"40px\" alt=\"User Location\"/>";
		htmlstr	+= "</div>";
		
		if (user_location_div_ != "") {
			$('#nusmap').smoothZoom('removeLandmark', ["map_user_location"]);	
		}
		$("#zoom_container .landmarks").append(htmlstr);
		$('#nusmap').smoothZoom('addLandmark', [htmlstr]);
		user_location_div_ = htmlstr;
		mapFocus(mapPos.x, mapPos.y);
	}
	
	function displayError(error) {
		  var errors = { 
		    1: 'Permission denied',
		    2: 'Position unavailable',
		    3: 'Request timeout'
		  };
		  lmclstatus.html("Unable to find you on the map " + errors[error.code]);
	}
	
	if (navigator.geolocation) {
	 	var timeoutVal = 10 * 1000 * 1000;
		navigator.geolocation.getCurrentPosition(
			displayPosition, 
			displayError,
			{ enableHighAccuracy: true, timeout: timeoutVal, maximumAge: 0 }
		);
	} else {
		lmclstatus("Geolocation is not supported by this browser");
	}
}

function openSynTab() {
	showLeftMenu(2);
}

function openBugReport() {
	showLeftMenu(5);
}

function openBookMarkList() {
	showLeftMenu(3);

	/* Duy */
	getBookmarkedEvents(function(allBookmarkList) {
				var str = "";
				for (var i in allBookmarkList) {
				str += '<li class="leftm_li"><div class="left_div_child" onClick=loadEventDetails(['+allBookmarkList[i].event_id+'])>'+allBookmarkList[i].event_name+'</div></li>';
				}
				$("#bookmarkul").html(str);		
	});
/*	var str = "";
	var allBookmarkList = getBookmarkedEvents();
	for (var i in allBookmarkList) {
		str += '<li class="leftm_li"><div class="left_div_child" onClick=loadEventDetails(['+allBookmarkList[i].event_id+'])>'+allBookmarkList[i].event_name+'</div></li>';
	}
	$("#bookmarkul").html(str); */
}

function searchResult() {
	var keyword = $("#searchField").val();
	if (keyword == "") {
		alert("Please enter the tags");
		return;
	}
	showLeftMenu(6);
	var str = '<ul class="left_ul">';
	var allEvents = searchByKeywords(keyword);
	var count = 0;
	for (var i in allEvents) {
		count++;
		str += '<li class="leftm_li"><div class="left_div_child" onClick=loadEventDetails(['+allEvents[i].event_id+'])>'+allEvents[i].event_name+'</div></li>';
	}
	str += '</ul>';
	if (count == 0)
		str = "<p>no result</p>";
	$("#lmSearch").html(str);
}

function openRemiderDialog(my_button) {
	if (!isOnline_) {
		alert("You need to be online to use this function.");
		return;
	}
	$("#reminderSubmitButton").attr('event_id', my_button.attr('event_id'));
	$("#reminder-form").dialog({height: 360, width: 450, modal: true});
}

function remindme(my_button) {
	$("#reminder-form").dialog( "close" );
	var email  = $("#reminderEmail").val();
	var phone = $("#remiderPhone").val();
	
	user_info_.email = email;
	user_info_.phone = phone;
	// save user_info
	localStorage[USER_INFO] = JSON.stringify(user_info_);
	
	var uploadObj = new Object();
	uploadObj.user_id = user_info_.user_id;
	uploadObj.email = email;
	uploadObj.phone = phone;
	uploadObj.event_id = my_button.attr('event_id');
	uploadObj.before = $("#remindBeforeHour").val();
	$.ajax({
		type: "POST",
		data: uploadObj,
		url: SUBMIT_REMIND_LINK,
		success: function(serverDataStr) {
			
		}
	}); 
}

function updatePrefer() {
	if (!isOnline_) {
		alert("You need to be online to use this function.");
		return;
	}
	
	var prefer =  $("#userPreferTag").val();
	user_info_.prefer = prefer;
	// save user_info
	localStorage[USER_INFO] = JSON.stringify(user_info_);
	
	var uploadObj = new Object();
	uploadObj.user_id = user_info_.user_id;
	uploadObj.prefer = prefer;
	$.ajax({
		type: "POST",
		data: uploadObj,
		url: PREFER_USER_LINK,
		success: function(serverDataStr) {
			alert("the data is updated");
		}
	}); 	
	
}

function loadEventDetails(event_ids, event_names) {
	//mapFocus(posx, posy);
	
	showLeftMenu(4);
	var lmEventDetailsContent = $("#lmEventDetailsContent");
	lmEventDetailsContent.html("Loading ...");
	if (event_ids.length == 1) {
		getEventDetail(event_ids[0], function(data) {
			if (data === null) {
				alert("Unable to load event details");
			} else {
				/* Name */
				var str_html = "<p><strong>"+data.event_name+"</strong><br>";
				/* Location */
				str_html += "<em>Location: </em>" + data.location + "</br>";
				/* Start time and end time */
				if(data.repeated_info === null || data.repeated_info === "")
				{
					// Normal events
					str_html += getFormattedTimePeriodStr(data.start_dt, data.end_dt) + "</br>";
				}
				else
				{
					// Regular events
				}

				if(data.speaker_name !== null)
					str_html += "<em>Speakers: </em>"+data.speaker_name+"</br>";

				/* Print detail */
				str_html += "</br>" + data.description;
				str_html += "</br></p>";
				var eventBookmarkButton = $("#bookmarkEventButton");
				if (data.bookmark) {
					eventBookmarkButton.attr('event_id', -1*data.event_id);
					eventBookmarkButton.html("Unbookmark");
				} else {
					eventBookmarkButton.attr('event_id', data.event_id);
					eventBookmarkButton.html("Bookmark");
				}
				$("#reminderButton").attr('event_id', data.event_id);
				lmEventDetailsContent.html(str_html);
				lmEventDetailsContent.css("margin", "10px");
				$("#lmEventDetailsButton").show();
				
				$("#event_social_share a").attr('event_id', data.event_id);
			}
		});
	} else {
		$("#lmEventDetailsButton").hide();
		var str_html = '<ul class="left_ul">';
		for (var i in event_ids) {
			str_html += '<li class="leftm_li"><div class="left_div_child" onClick=loadEventDetails(['+event_ids[i]+'])>'+event_names[i]+'</div></li>';
		}
		str_html += '</ul>';
		lmEventDetailsContent.css("margin", "0px");
		lmEventDetailsContent.html(str_html);
	}	
}

function bookmark(my) {
	var event_id = my.attr('event_id');
	my.attr('event_id', -1*event_id);
	if (event_id < 0) {
		undoBookmark(-1*event_id);
		my.html("Bookmark");
	} else {
		doBookmark(event_id);
		my.html("Unbookmark");
	}
}

function share_action(my_but) {
	var type = my_but.attr("type");
	var event_id = my_but.attr("event_id");
	
	getEventDetail(event_id, function(data) {
		var sharedUrl = data.info_url;
		var title = data.event_name;
		if (sharedUrl == "" || typeof sharedUrl == "undefined") {
			sharedUrl = "http://im.whatsword.com";
		}
		if (type== "email") {
			window.open("mailto:name@domain.com?body="+title+"%0AMore info at: "+escape(sharedUrl));
		} else if (type == "fb") {
			window.open("http://www.facebook.com/sharer.php?t="+title+"&u="+escape(sharedUrl));
		} else if (type == "twitter") {
			window.open("http://twitter.com/share?text="+title+"&url="+escape(sharedUrl));
		} else if (type =="google") {
			window.open("https://plusone.google.com/_/+1/confirm?hl=en&url="+escape(sharedUrl)+"&title="+title);
		}
	});
}

/***** JQSlider ****/
function dateDiffInDays(a, b) {
	// Discard the time and time-zone information.
	var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
	return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

jQuery(function($){
	// clean up old data
	if (isOnline_) {
		cleanUpExpiredStorage();
	}
	
	//
	$('#event_social_share').PieMenu({
		'starting_angel':18,
		'angel_difference' : 72,
		'radius':100 ,
	});
	
	// init snapper
	snapper_ = new Snap({
		element: document.getElementById('mainArea'),
		dragger: document.getElementById('do-drag'),
		disable: 'right',
		maxPosition: 400,
	});
	
	// init date range
	//var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
	var max_date = new Date();
	max_date.setDate(max_date.getDate() + 30);
	var default_max_date = new Date();
	default_max_date.setDate(default_max_date.getDate() + 10);
	$("#dateSelector").dateRangeSlider({
		bounds: {min: new Date(), max: max_date},
		defaultValues: {min: new Date(), max: default_max_date},
		arrows:false,
		scales: [{
			first: function(value){ return value; },
			end: function(value) {return value; },
			next: function(value){
				var next = new Date(value);
				return new Date(next.setDate(value.getDate() + 2));
			},
			label: function(value){
				return dateDiffInDays(new Date(), value);
			},
			format: function(tickContainer, tickStart, tickEnd){
				tickContainer.addClass("myCustomClass");
			}
		}]
	});
	$("#dateSelector").bind("valuesChanged", function(e, data) {
		var range = new Object();
		range[START_DATE_STR] = data.values.min;
		range[END_DATE_STR] =  data.values.max;
		eventCondObj_[BY_TIME] = range;
		map_event_list_ = searchEvent(eventCondObj_);
		updateMap(); 
	});

	
	// init map component
	$('#nusmap').smoothZoom({
		width: 1000,
		height: 550,
		button_SIZE: 22,
		button_ALIGN: "top right",
		zoom_OUT_TO_FIT: "NO", 
		button_AUTO_HIDE: "YES", 
		button_AUTO_HIDE_DELAY: 2,
		container: 'zoom_container',
		
		//Additional settings			            
		pan_LIMIT_BOUNDARY: "YES", //Whether the image can be dragged fully inside the boundary or not                           
		zoom_MAX: MAX_ZOOM_LEVEL, //Max zoom level
		border_TRANSPARENCY: 0, //Transparency of border         
		on_ZOOM_PAN_UPDATE: updateZoom, //Update events while zooming
		
		/******************************************
		Enable Responsive settings below if needed.
		Max width and height values are optional.
		******************************************/
		responsive: false,
		responsive_maintain_ratio: true,
		max_WIDTH: '',
		max_HEIGHT: ''
	});
	
	// load categories
	for (var catId in mapIdToCategory) {
		$("#catDropDownList").append('<li><a href="javascript:changeCategory('+catId+')">'+mapIdToCategory[catId].category_name+'</a></li>');
	}
	
	// init user info
	initUserInfo();
	
	
	// load event list
	loadEventList(1, function () {
		// init eventCond
		var range = new Object();
		range[START_DATE_STR] =  new Date();
		range[END_DATE_STR] =  default_max_date;
		eventCondObj_[BY_TIME] = range;
		eventCondObj_[BY_CATEGORY] = [selectedCat_];
		map_event_list_ = searchEvent(eventCondObj_);
		updateMap();
	});
});
