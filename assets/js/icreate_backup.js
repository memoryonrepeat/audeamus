/***********************
 * Constant
 ***********************/
var START_DATE_STR = "START_DATE";
var END_DATE_STR = "END_DATE";
var OFFSET_REGULAR = 10000000;
var CACHE_CAPACITY = 20;
var BY_TIME = 0;
var BY_CATEGORY = 1;
var ALL_CATEGORY = 0;
var REGULAR_WEEK_DURATION = 3;

var LOCAL_EVT_DETAIL_ID_LIST = "LOCAL_EVENT_DETAIL_ID_LIST";
var EXPIRE_STR = "EXPIRE";
var DETAIL_STR = "DETAIL";
var FULL_EVT_LIST = "FULL_EVT_LIST";

var LOAD_ALL_EVENT_URL = "http://im2013.nuditu.com/index.php/icreate/all_event";
var GET_EVT_DETAIL_URL = "http://im2013.nuditu.com/index.php/icreate/event_detail";

var mapDayToId = new Object();
mapDayToId['sun'] = 0;
mapDayToId['mon'] = 1;
mapDayToId['tue'] = 2;
mapDayToId['wed'] = 3;
mapDayToId['thu'] = 4;
mapDayToId['fri'] = 5;
mapDayToId['sat'] = 6;

var normalEventList = new Array();
var regularEventList = new Array();

// Event detail cache
var eventDetailCache = null;
var timezoneOffsetStr = getTimezoneOffsetStr();

function myFunction()
{
	/*alert(mapDayToId['mon']);
	
	var array = new Array();
	array[START_DATE_STR] = new Date();
	array[END_DATE_STR] = new Date();

	array[START_DATE_STR].setMonth(11);
	var startEndDate = getStartAndEndDate(array);

	alert(startEndDate[0].toString());
	alert(startEndDate[1].toString());

	loadEventList(5);
	getEventDetail(3); */
	var cache = new Cache(3);
	data = cache.getItem(2);
	console.log("data with key 2 = " + data);
	cache.insert(1, 2);
	cache.insert(2, 3);
	var data = cache.getItem(2);
	console.log("data with key 2 = " + data);
	cache.insert(3, 2);
	data = cache.getItem(3);
	console.log("data with key 3 = " + data);
	cache.insert(4, 5);
	data = cache.getItem(1);
	console.log("data with key 1 = " + data);
	data = cache.getItem(2);
	console.log("data with key 2 = " + data);
	data = cache.getItem(4);
	console.log("data with key 4 = " + data);
	cache.insert(5, 5);
	data = cache.getItem(3);
	console.log("data with key 3 = " + data);

	getEventDetail(1, function(obj) { console.log(obj); } );
}

function loadEventList(param, initEvn)
{
	var urlStr = LOAD_ALL_EVENT_URL;

	// Consider offline option here
	if(!isOnline_)
	{
		var fullEventList = new Array();
 
		if(typeof(Storage) !== "undefined")
		{
			var jsonStr = localStorage[FULL_EVT_LIST];
			if(jsonStr !== undefined)
				fullEventList = JSON.parse(jsonStr);
			preprocessEventList(fullEventList);
			initEvn();
		}
		return;
	}

	// If online, get the full event list by AJAX
	if(typeof(param) !== "undefined")
	{
		urlStr += "/" + param;
		console.log(urlStr);			
	}

	$.ajax({
		async: true,
		url: urlStr,
		dataType: 'jsonp',
		success: function(result)
			 {
				console.log(result);

				// Save the list into local storage here
				if(typeof(Storage) !== "undefined")
				{
					localStorage[FULL_EVT_LIST] = JSON.stringify(result);
				}

				preprocessEventList(result);
				initEvn();
			}
	});	
}

function getEventDetail(evtId, callBack)
{
	if(typeof(evtId) === 'undefined')
	{
		callBacK(null);
		return;
	}

	if(eventDetailCache === null)
		eventDetailCache = new Cache(CACHE_CAPACITY);

	var detail = eventDetailCache.getItem(evtId);

	if(detail !== null)
	{
		callBack(detail);
		return;
	}

	// If event detail is not in the cache, get it from the server (if online)
	// or from local storage (if offline)

	if(!isOnline_)
	{
		// Offline: get from local storage
		if(typeof(Storage) === "undefined")
		{
			callBack(null);
			return;
		}

		var detailKey = evtId + DETAIL_STR;
		var detailStr = localStorage[detailKey];
		if(detailStr !== undefined)
		{
			detail = JSON.parse(detailStr);
			detail.event_id = parseInt(detail.event_id);
			eventDetailCache.insert(detail.event_id, detail);
			callBack(detail);
		}
		else
			callBack(null);
		return;
	}

	// Online + Not in cache. Must get detail from the server
	var urlStr = GET_EVT_DETAIL_URL + "/" + evtId;
	$.ajax({
		url: urlStr,
		dataType: 'jsonp',
		success: function(detailObj) {
			// Guarding (corner cases)
			if(detailObj[0] === undefined)
			{
				callBack(null);
				return;
			}
			detailObj[0].event_id = parseInt(detailObj[0].event_id);

			// Update in the cache
			eventDetailCache.insert(detailObj[0].event_id, detailObj[0]);
			callBack(detailObj[0]);

			// Update in local storage
			updateDetailInLocalStorage(detailObj[0]);
		}
	});
}

function updateDetailInLocalStorage(detailObj)
{
	if(typeof(Storage) === "undefined")
		// Local storage is not available
		return;

	var eventId = detailObj.event_id;

	var expireDate = new Date();
	if(detailObj.repeated_info === null || detailObj.repeated_info === "")
	{
		// Event type: normal event. This info will be expired once the event ends
		expireDate = new Date(getStandardDateStr(detailObj.end_dt));
	}
	else
	{
		// Event type: regular event. This info will be expired 3 weeks from now
		expireDate.setDate(expireDate.getDate() + REGULAR_WEEK_DURATION * 7);
	}

	// Update the list of locally-stored event id
	var storeIdList = localStorage[LOCAL_EVT_DETAIL_ID_LIST];
	if(storeIdList === undefined)
		storeIdList = "";
	if(storeIdList !== "")
		storeIdList += ",";
	storeIdList += eventId.toString();
	localStorage[LOCAL_EVT_DETAIL_ID_LIST] = storeIdList;

	// Store the detail and expiration information
	localStorage[eventId.toString() + EXPIRE_STR] = expireDate.getTime();
	localStorage[eventId.toString() + DETAIL_STR] = JSON.stringify(detailObj);		
}

function preprocessEventList(eventFullList)
{
	// Reset the two event lists
	normalEventList = new Array();
	regularEventList = new Array();

	for(var ind = 0; ind < eventFullList.length; ind++)
	{
		// Convert string to integer
		eventFullList[ind].event_id = parseInt(eventFullList[ind].event_id);
		eventFullList[ind].organizer_id = parseInt(eventFullList[ind].organizer_id);
		eventFullList[ind].category_id = parseInt(eventFullList[ind].category_id);
		eventFullList[ind].map_id = parseInt(eventFullList[ind].map_id);
		
		if(eventFullList[ind].repeated_info === "" || eventFullList[ind].repeated_info === null)
		{
			// This is a normal event
			console.log(getStandardDateStr(eventFullList[ind].start_dt));
			eventFullList[ind].startDateObj = new Date(getStandardDateStr(eventFullList[ind].start_dt));
			eventFullList[ind].endDateObj = new Date(getStandardDateStr(eventFullList[ind].end_dt));
			normalEventList.push(eventFullList[ind]);
		}
		else
		{
			// This is a regular event
			eventFullList[ind].regularInfoObj = parseRepeatedInfo(eventFullList[ind].repeated_info);
			regularEventList.push(eventFullList[ind]);
		}
	}
}

/*
 * Assumption: the input is a string of the format "yyyy-mm-dd<space>hh:mm:ss"
 */
function getStandardDateStr(dbDateStr)
{
	var token = dbDateStr.split(" ");
	return token[0] + "T" + token[1] + timezoneOffsetStr;
}

function parseRepeatedInfo(repeatedStr)
{
	// Test
	//repeatedStr = "mon,2,23:59:00,2013-01-20";
	// Test
	var listSubInfo = repeatedStr.split(";");
	
	var regularInfoObj = new Array();
	for(var ind = 0; ind < listSubInfo.length; ind++)
	{
		var fieldList = listSubInfo[ind].split(",");
		
		var obj = new Object();
		obj.dayInWeek = mapDayToId[fieldList[0]];
		obj.period = parseInt(fieldList[1]);
		obj.startTimeStr = fieldList[2];
		obj.endTimeStr = fieldList[3];
		if(obj.period > 1)
		{
			obj.baseDayStr = fieldList[4];
		}

		regularInfoObj.push(obj);
	}
	console.log(regularInfoObj[0]);

	return regularInfoObj;
}

function getEvtIndListByTime(orgIndArr, dateArr)
{
	var startEndDate = getStartAndEndDate(dateArr);
	var startDate = startEndDate[0];
	var endDate = startEndDate[1];

	/*console.log("startDate = ");
	console.log(startDate);
	console.log("endDate = ");
	console.log(endDate); */
	
	var newIndArr = new Array();
	// Get normal events 
	for(var k = 0; k < orgIndArr.length; k++)
	{
		var ind = orgIndArr[k];
		if(ind >= OFFSET_REGULAR)
			continue;

		/* console.log("startDateObj = ");
		console.log(normalEventList[ind].startDateObj);
		console.log("endDateObj = ");
		console.log(normalEventList[ind].endDateObj); */
		if(areOverlapping(normalEventList[ind].startDateObj, normalEventList[ind].endDateObj,
		   startDate, endDate))
		{
			newIndArr.push(ind);
		}
	}

	// Get regular events
	for(var k = 0; k < orgIndArr.length; k++)
	{
		var ind = orgIndArr[k];
		if(ind < OFFSET_REGULAR)
			continue;
		ind -= OFFSET_REGULAR;

		//console.log("ind regular = " + ind);
		var evtObj = regularEventList[ind];
		//console.log("Event name = " + regularEventList[ind].event_name);
		var curDate = new Date(startDate.toString());
		//console.log(curDate);
		var isFirstDate = true;

		//var countDay = 0;

		while(curDate <= endDate)
		{
			if(doesRegularEvtHappen(evtObj, curDate))
			{
				newIndArr.push(ind + OFFSET_REGULAR);
				break;
			}

			curDate.setDate(curDate.getDate() + 1);
			if(isFirstDate)
			{
				// Except for the first day, subsequent day will start at 00:00:00
				curDate.setHours(0, 0, 0);
				isFirstDate = false;
			}

			/*countDay++;

			if(countDay > 7)
				// Has consider all possible day in a week
				break; */				
		}
	}
	
	return newIndArr;	 		
}

function areOverlapping(startInterval1, endInterval1, startInterval2, endInterval2)
{
	if(startInterval1 >= endInterval2 || startInterval2 >= endInterval1)
		return false;
	return true;
}

function doesRegularEvtHappen(regularEvt, curDate)
{
	var dayInWeek = curDate.getDay();
	/*console.log("curDate = ");
	console.log(curDate);
	console.log("dayInWeek = ");
	console.log(dayInWeek);*/
	var regularInfo = regularEvt.regularInfoObj;
	
	for(var ind = 0; ind < regularInfo.length; ind++)
	{
		if(dayInWeek == regularInfo[ind].dayInWeek)
		{
			var curStartTime = new Date("2013-01-01");
			curStartTime.setHours(curDate.getHours(), curDate.getMinutes(), curDate.getSeconds());

			var infoEndTime = new Date("2013-01-01" + "T" + regularInfo[ind].endTimeStr + timezoneOffsetStr);

			console.log("curStartTime = ");
			console.log(curStartTime);
			console.log("infoEndTime = ");
			console.log(infoEndTime);

			if(curStartTime >= infoEndTime)
				// The event has already ended
				continue;

			if(regularInfo[ind].period == 1)
				return true;

			// If period > 2, check the period as well
			var infoDate = new Date(regularInfo[ind].baseDayStr);
			infoDate.setHours(0, 0, 0);
			var curDay = new Date(curDate.toString());
			curDay.setHours(0, 0, 0);
			// Get the week difference between the two dates
			var timeDiff = Math.abs(curDay.getTime() - infoDate.getTime());
			var weekDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));
			// If weekDiff is a multiple of period, then the regular event happens
			if(weekDiff % regularInfo[ind].period == 0)
				return true;
		}	
	}

	return false;
}

function getTimezoneOffsetStr()
{
	var today = new Date();
	var timeOffset = today.getTimezoneOffset();

	var sign = "+";
	if(timeOffset > 0)
		sign = "-";

	if(timeOffset < 0)
		timeOffset = -timeOffset;

	var hourStr = Math.floor(timeOffset / 60);
	hourStr = hourStr.toString();
	if(hourStr.length < 2)
		hourStr = "0" + hourStr;
	
	var minuteStr = timeOffset % 60;
	minuteStr = minuteStr.toString();
	if(minuteStr.length < 2)
		minuteStr = "0" + minuteStr;

	var result = sign + hourStr + ":" + minuteStr;

	return result;
}

function getStartAndEndDate(dateArr)
{
	var startDate = new Date();
	var endDate = new Date();

	var today = new Date();

	if(dateArr[START_DATE_STR] !== undefined)
	{
		startDate = dateArr[START_DATE_STR];
		
		if(!(startDate.getDate() == today.getDate() && 
                     startDate.getMonth() == today.getMonth() &&
		     startDate.getFullYear() == today.getFullYear()))
		{
			startDate.setHours(0, 0, 0);
		}
	}


	console.log(dateArr[END_DATE_STR] );
	if(dateArr[END_DATE_STR] !== undefined)
	{
		endDate = dateArr[END_DATE_STR];
		endDate.setHours(23, 59, 59);
	}

	var startEndDate = new Array();
	startEndDate[0] = startDate;
	startEndDate[1] = endDate;

	return startEndDate;		
}

function getEvtIndListByCategory(orgIndArr, catIdList) {
	var newIndArr = new Array();

	console.log("getEvtIndListByCategory with catIdList = ");
	console.log(catIdList);

	// check if there is an entry indicating to take all categories
	for(var i = 0; i < catIdList.length; i++)
		if(catIdList[i] == ALL_CATEGORY)
		{
			return orgIndArr;
		}

	for(var i = 0; i < orgIndArr.length; i++)
	{
		var ind = orgIndArr[i];
		var evtObj;
		if(ind >= OFFSET_REGULAR)
			evtObj = regularEventList[ind - OFFSET_REGULAR];
		else
			evtObj = normalEventList[ind];

		if(catIdList.indexOf(evtObj.category_id) >= 0)
			newIndArr.push(ind);
	}

	return newIndArr;	
}

function groupEventByMapId(indArr)
{
	var eventList = new Array();
	for(var i = 0; i < indArr.length; i++)
	{
		var id = indArr[i];
		if(id >= OFFSET_REGULAR)
		{
			eventList.push(regularEventList[id - OFFSET_REGULAR]);
		}
		else
		{
			eventList.push(normalEventList[id]);
		}
			
	}
	
	// Sort by map_id
	eventList.sort(function (evtA, evtB) { 
				return evtA.map_id - evtB.map_id;
		       });

	var eventGroupList = new Array();
	for(var ind = 0; ind < eventList.length; )
	{
		var idArr = new Array();
		idArr.push(eventList[ind].event_id);

		// Find all consecutive events that have the same map_id
		var nextInd = ind + 1;
		while(nextInd < eventList.length &&
		      eventList[nextInd].map_id === eventList[ind].map_id)
		{
			idArr.push(eventList[nextInd].event_id);
			nextInd++;
		}

		groupObj = new Object();
		groupObj.event_id = idArr;
		groupObj.name = "";
		groupObj.map_id = eventList[ind].map_id;
		if(idArr.length == 1) {
			groupObj.name = eventList[ind].event_name;
			console.log("assign name to event" + eventList[ind].event_name);
		}

		eventGroupList.push(groupObj);

		ind = nextInd; 		
	}
	
	return eventGroupList;	 
}

function searchEvent(criteriaObj)
{
	var indArr = new Array();
	for(var ind = 0; ind < normalEventList.length; ind++)
		indArr.push(ind);
	for(var ind = 0; ind < regularEventList.length; ind++)
		indArr.push(ind + OFFSET_REGULAR);

	for(var type in criteriaObj)
	{
		if(indArr.length == 0)
			// No search result
			break;

		var param = criteriaObj[type];

		var cmdType = parseInt(type);
		switch(cmdType)
		{
			case BY_TIME:
				console.log("Hello Time");
				indArr = getEvtIndListByTime(indArr, param);
				break;
			case BY_CATEGORY:
				console.log("Hello Category");
				indArr = getEvtIndListByCategory(indArr, param);
				break;
		}
	}

	return groupEventByMapId(indArr);
}

function cleanUpLocalEventDetail()
{
	if(typeof(Storage) === "undefined")
		return;

	var localIdStr = localStorage[LOCAL_EVT_DETAIL_ID_LIST];
	if(localIdStr === undefined)
		return;

	var idList = localIdStr.split(",");
	for(var ind = 0; ind < idList.length; ind++)
		idList[ind] = parseInt(idList[ind]);

	var newIdList = new Array();
	var now = new Date();

	for(var ind = 0; ind < idList.length; ind++)
	{
		var evtId = idList[ind];
		var expireKey = evtId.toString() + EXPIRE_STR;

		var time = localStorage[expireKey];
		if(time === undefined)
			continue;

		var expireDate = new Date(time);

		if(expireDate <= now)
		{
			// Remove the detail of this event
			var detailKey = evtId.toString() + DETAIL_STR;
			localStorage[detailKey].removeItem(detailKey);
			localStorage[expireDate].removeItem(detailKey);
		}
		else
		{
			newIdList.push(evtId);
		}
	}

	localStorage[LOCAL_EVT_DETAIL_ID_LIST] = newIdList.toString();
}
