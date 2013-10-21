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
var GENERAL_USER = 0;
var REGULAR_WEEK_DURATION = 3;
var BOOKMARK_WEEK_DURATION = 4;

var LOCAL_EVT_DETAIL_ID_LIST = "LOCAL_EVENT_DETAIL_ID_LIST";
var BOOKMARK_DETAIL_ID_LIST = "BOOKMARK_DETAIL_ID_LIST";
var LOCAL_USER_ID_LIST = "LOCAL_USER_ID_LIST";
var EXPIRE_STR = "EXPIRE";
var DETAIL_STR = "DETAIL";
var BOOKMARK_STR = "BOOKMARK";
var FULL_EVT_LIST = "FULL_EVT_LIST";

var LOAD_ALL_EVENT_URL = "http://im2013.nuditu.com/index.php/icreate/all_event";
var GET_EVT_DETAIL_URL = "http://im2013.nuditu.com/index.php/icreate/event_detail";
var SYNC_BOOKMARK_URL = "http://im2013.nuditu.com/index.php/icreate/sync_bookmark";

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

// For local bookmarking
var mapIdToBookmarkStatus = new Object();

// For indexing event
var mapIdToIndex = new Object();

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
			buildMapIdToEvtInd();
			initEvn();
		}
		return;
	}

	// If online, get the full event list by AJAX
	if(typeof(param) !== "undefined")
	{
		urlStr += "/" + param;		
	}

	$.ajax({
		async: true,
		url: urlStr,
		dataType: 'jsonp',
		success: function(result)
			 {
				// Save the list into local storage here
				if(typeof(Storage) !== "undefined")
				{
					localStorage[FULL_EVT_LIST] = JSON.stringify(result);
				}

				preprocessEventList(result);
				buildMapIdToEvtInd();
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
		detail.bookmark = isBookmarked(detail.event_id);
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
			detail.bookmark = isBookmarked(detail.event_id);
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
			detailObj[0].bookmark = isBookmarked(detailObj[0].event_id);
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
		if(eventFullList[ind].tags === null)
			eventFullList[ind].tags = new Array();
		else
		{
			eventFullList[ind].tags = eventFullList[ind].tags.toLowerCase().split(/[^0-9a-z]+/gi);
		}

		if(eventFullList[ind].repeated_info === "" || eventFullList[ind].repeated_info === null)
		{
			// This is a normal event
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

	return regularInfoObj;
}

function getEvtIndListByTime(orgIndArr, dateArr)
{
	var startEndDate = getStartAndEndDate(dateArr);
	var startDate = startEndDate[0];
	var endDate = startEndDate[1];
	
	var newIndArr = new Array();
	// Get normal events 
	for(var k = 0; k < orgIndArr.length; k++)
	{
		var ind = orgIndArr[k];
		if(ind >= OFFSET_REGULAR)
			continue;

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

		var evtObj = regularEventList[ind];
		var curDate = new Date(startDate.toString());
		var isFirstDate = true;

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

	var regularInfo = regularEvt.regularInfoObj;
	
	for(var ind = 0; ind < regularInfo.length; ind++)
	{
		if(dayInWeek == regularInfo[ind].dayInWeek)
		{
			var curStartTime = new Date("2013-01-01");
			curStartTime.setHours(curDate.getHours(), curDate.getMinutes(), curDate.getSeconds());

			var infoEndTime = new Date("2013-01-01" + "T" + regularInfo[ind].endTimeStr + timezoneOffsetStr);

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

function searchByKeywords(keywordStr)
{
	var listWords = keywordStr.toLowerCase().split(/[^0-9a-z]+/gi);

	var wordSet = new Object();
	for(var k = 0; k < listWords.length; k++)
	{
		if(listWords[k].length > 0)
		{
			wordSet[listWords[k]] = true;
		}	
	}
	
	var indArr = new Array();
	for(var k = 0; k < 2; k++)
	{
		var arrPtr = normalEventList;
		if(k != 0)
			arrPtr = regularEventList;

		for(var i = 0; i < arrPtr.length; i++)
		{
			var eventObj = arrPtr[i];
			var rank = countWordInSet(wordSet, eventObj.tags);
			if(rank > 0)
			{
				var indObj = new Object();
				indObj.id = eventObj.event_id;
				if(k != 0)
					indObj.id += OFFSET_REGULAR;
				indObj.rank = rank;
				indArr.push(indObj);
			}	
		}
	}

	indArr.sort(function (objA, objB) {
			return objA.rank - objB.rank;
		    });
	indArr.reverse();
	
	var retEvtArr = new Array();
	for(var k = 0; k < indArr.length; k++)
	{
		var ind = mapIdToIndex[indArr[k].id];
		if(ind === undefined)
			continue;

		var evtObj = null;
		if(ind >= OFFSET_REGULAR)
			evtObj = regularEventList[ind - OFFSET_REGULAR];
		else
			evtObj = normalEventList[ind];

		retObj = new Object();
		retObj.event_id = evtObj.event_id;
		retObj.event_name = evtObj.event_name;
		retObj.short_name = evtObj.short_name;
		retEvtArr.push(retObj);
	}

	return retEvtArr;
}

/* Count the number of words in wordList that appears in wordSet */
function countWordInSet(wordSet, wordList)
{
	var count = 0;
	for(var k = 0; k < wordList.length; k++)
		if(wordSet[wordList[k]] !== undefined)
			count++;
	return count;
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
		var nameArr = new Array();

		idArr.push(eventList[ind].event_id);
		nameArr.push(eventList[ind].event_name);

		// Find all consecutive events that have the same map_id
		var nextInd = ind + 1;
		while(nextInd < eventList.length &&
		      eventList[nextInd].map_id === eventList[ind].map_id)
		{
			idArr.push(eventList[nextInd].event_id);
			nameArr.push(eventList[nextInd].event_name);
			nextInd++;
		}

		groupObj = new Object();
		groupObj.event_id = idArr;
		groupObj.name = "";
		groupObj.map_id = eventList[ind].map_id;
		if(idArr.length == 1) {
			groupObj.name = eventList[ind].short_name;
			if(groupObj.name === "" || groupObj.name === null)
				groupObj.name = eventList[ind].event_name;
		}
		else
			groupObj.name = nameArr;

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
				indArr = getEvtIndListByTime(indArr, param);
				break;
			case BY_CATEGORY:
				indArr = getEvtIndListByCategory(indArr, param);
				break;
		}
	}

	return groupEventByMapId(indArr);
}

function cleanUpExpiredStorage()
{
	cleanUpLocalEventDetail();

	// Clean up outdated / expired bookmark
	cleanUpExpiredBookmark();
}

function cleanUpLocalEventDetail()
{
	if(typeof(Storage) === "undefined")
		return;

	var localIdStr = localStorage[LOCAL_EVT_DETAIL_ID_LIST];
	if(localIdStr === undefined || localIdStr === "")
		return;

	var idList = localIdStr.split(",");
	for(var ind = 0; ind < idList.length; ind++)
		idList[ind] = parseInt(idList[ind]);

	var newIdList = new Array();
	var nowTime = new Date().getTime();

	var usedIdSet = new Object();

	for(var ind = 0; ind < idList.length; ind++)
	{
		var evtId = idList[ind];
		if(usedIdSet[evtId] !== undefined)
			continue;
		usedIdSet[evtId] = true;

		var expireKey = evtId.toString() + EXPIRE_STR;

		var expireTime = localStorage[expireKey];
		if(expireTime === undefined)
			continue;

		expireTime = parseInt(expireTime);
		if(expireTime < nowTime)
		{
			// Remove the detail of this event
			var detailKey = evtId.toString() + DETAIL_STR;
			localStorage.removeItem(detailKey);
			var expireKey = evtId.toString() + EXPIRE_STR;
			localStorage.removeItem(expireKey);
		}
		else
		{
			newIdList.push(evtId);
		}
	}

	localStorage[LOCAL_EVT_DETAIL_ID_LIST] = newIdList.toString();
}

function cleanUpExpiredBookmark()
{
	if(typeof(Storage) === "undefined")
		return;
	var userIdStr = localStorage[LOCAL_USER_ID_LIST];
	if(userIdStr === undefined)
		userIdStr = "";
	var userIdArr = new Array();
	if(userIdStr !== "")
		userIdArr = userIdStr.split(",");
	userIdArr.push(GENERAL_USER);

	for(var ind = 0; ind < userIdArr.length; ind++)
		cleanUpUserExpiredBookmark(userIdArr[ind]);	
}

function cleanUpUserExpiredBookmark(userId)
{
	if(typeof(Storage) === "undefined")
		return;

	var bookmarkIdStr = localStorage[userId + "_" + BOOKMARK_DETAIL_ID_LIST];
	if(bookmarkIdStr === undefined || bookmarkIdStr === "")
	{
		localStorage[userId + "_" + BOOKMARK_DETAIL_ID_LIST] = "";
		return;
	}

	var idList = bookmarkIdStr.split(",");

	var newIdList = new Array();
	// Initialize this global variable
	mapIdToBookmarkStatus = new Object();

	var nowTime = new Date().getTime();
	for(var ind = 0; ind < idList.length; ind++)
	{
		var id = idList[ind];
		if(mapIdToBookmarkStatus[id] !== undefined)
			continue;

		bookmarkObj = JSON.parse(localStorage[userId + "_" + id + BOOKMARK_STR]);

		if(nowTime > bookmarkObj.expired)
		{
			// Delete this entry
			localStorage.removeItem([userId + "_" + id + BOOKMARK_STR]);
		}
		else
		{
			newIdList.push(id);
			mapIdToBookmarkStatus[id] = bookmarkObj.flag;
		}
	}

	localStorage[BOOKMARK_DETAIL_ID_LIST] = newIdList.toString(); 	
}

function registerLocalUser(userId)
{
	if(typeof(Storage) === "undefined")
		return;
	if(parseInt(userId) === GENERAL_USER)
		return;

	var localUIdStr = localStorage[LOCAL_USER_ID_LIST];
	if(localUIdStr === undefined)
		localUIdStr = "";

	var userIdList = new Array();
	if(localUIdStr !== "")
		userIdList = localUIdStr.split(",");
	for(var ind = 0; ind < userIdList.length; ind++)
		userIdList[ind] = parseInt(userIdList[ind]);
	userId = parseInt(userId);
	if(userIdList.indexOf(userId) < 0)
	{
		if(localUIdStr === "")
			localUIdStr += ",";
		localUIdStr += userId.toString();
		localStorage[LOCAL_USER_ID_LIST] = localUIdStr;
	}
}

function updateUserForBookmarkData()
{
	// The curent user is still GENERAL_USER.
	// No need to update
	if(user_info_ === null)
		return;
	if(typeof(Storage) === "undefined")
		return;

	var userId = user_info_.user_id;
	var generalBookmarkStr = localStorage[GENERAL_USER.toString() + "_" + BOOKMARK_DETAIL_ID_LIST];
	var generalBookmarkArr = new Array();
	if(generalBookmarkStr !== undefined && generalBookmarkStr !== "")
		generalBookmarkArr = generalBookmarkStr.split(",");

	var userBookmarkStr = localStorage[userId.toString() + "_" + BOOKMARK_DETAIL_ID_LIST];
	if(userBookmarkStr === undefined)
		userBookmarkStr = "";

	for(var k = 0; k < generalBookmarkArr.length; k++)
	{
		var evtId = generalBookmarkArr[k];
		var generalBookmarkKey = GENERAL_USER.toString() + "_" + evtId + BOOKMARK_STR;
		var bookmarkDataStr = localStorage[generalBookmarkKey];

		localStorage.removeItem(generalBookmarkKey);

		localStorage[userId.toString() + "_" + evtId + BOOKMARK_STR] = bookmarkDataStr;
		if(userBookmarkStr !== "")
			userBookmarkStr += ",";
		userBookmarkStr += evtId;
	}

	localStorage[GENERAL_USER.toString() + "_" + BOOKMARK_DETAIL_ID_LIST] = "";
	localStorage[userId.toString() + "_" + BOOKMARK_DETAIL_ID_LIST] = userBookmarkStr;	 
}

function isBookmarked(evtId)
{
	bookmarkStatus = mapIdToBookmarkStatus[evtId];
	if(bookmarkStatus === undefined)
		return false;
	return bookmarkStatus;
}

function doBookmark(evtId)
{
	performBookmark(evtId, true);	
}

function undoBookmark(evtId)
{
	performBookmark(evtId, false);
}

function performBookmark(evtId, bookmarkStatus)
{
	var userId = GENERAL_USER;
	if(user_info_ !== null)
		userId = user_info_.user_id;

	var detailObj = new Object();
	getEventDetail(evtId, function(detail) { detailObj = detail; } );
	
	var bookmarkObj = null;
	
	if(typeof(Storage) !== "undefined")
	{
		var bookmarkKey = userId + "_" + evtId.toString() + BOOKMARK_STR;
		var bookmarkObjStr = localStorage[bookmarkKey];
		if(bookmarkObjStr !== undefined)
			bookmarkObj = JSON.parse(bookmarkObjStr);
	}

	if(bookmarkObj === null)
	{
		bookmarkObj = new Object();
		bookmarkObj.flag = !bookmarkStatus;
		bookmarkObj.event_id = parseInt(evtId);
	}

	if(bookmarkObj.flag === bookmarkStatus)
	{
		// The bookmark state of this event is unchanged. Do nothing
		return;
	}

	bookmarkObj.flag = bookmarkStatus;
	mapIdToBookmarkStatus[evtId] = bookmarkStatus;

	var expireDate = new Date();
	if(isRegularEvent(detailObj))
	{
		if(bookmarkStatus === true)
		{
			expireDate.setDate(expireDate.getDate() + BOOKMARK_WEEK_DURATION * 7);
		}
		else
		{
			expireDate.setDate(expireDate.getDate() + REGULAR_WEEK_DURATION * 7);
		}
	}
	else
	{
		// Normal event
		expireDate = new Date(getStandardDateStr(detailObj.end_dt));
		if(bookmarkStatus === true)
		{
			// If bookmarked, this event detail last BOOKMARK_WEEK_DURATION weeks
			// more from its end date
			expireDate.setDate(expireDate.getDate() + BOOKMARK_WEEK_DURATION * 7);	
		}
	}
	bookmarkObj.expired = expireDate.getTime();

	var timeStamp = new Date().getTime();
	bookmarkObj.timehappen = timeStamp;

	var jsonBookmarkStr = JSON.stringify(bookmarkObj);
	// Update in local storage
	if(typeof(Storage) !== "undefined")
	{
		localStorage[userId + "_" + evtId.toString() + BOOKMARK_STR] = jsonBookmarkStr;
		// Update expire date for this event detail as well
		var localExpire = localStorage[evtId.toString() + EXPIRE_STR];
		if(localExpire === undefined || expireDate.getTime() > parseInt(localExpire));
			localStorage[evtId.toString() + EXPIRE_STR] = expireDate.getTime();
		// Update the bookmark event id list
		idListStr = localStorage[userId + "_" + BOOKMARK_DETAIL_ID_LIST];
		if(idListStr === undefined)
			idListStr = "";
		if(idListStr !== "")
			idListStr += ",";
		idListStr += evtId;
		localStorage[userId + "_" + BOOKMARK_DETAIL_ID_LIST] = idListStr;		
	}
	
	// Under development: async = false for the moment
	// Ajax if the user log in
	if(user_info_ !== null)
	{
		syncBookmark(false, bookmarkObj);
	}
}

function isRegularEvent(evtObj)
{
	if(evtObj.repeated_info === null || evtObj.repeated_info === "")
		return false;
	return true;
}

function syncBookmark(fullSyncFlag, bookmarkDataObj)
{
	if(user_info_ === null)
		return;

	var userId = user_info_.user_id;
	var bookmarkDataArr = new Array();

	if(typeof(bookmarkDataObj) !== "undefined")
	{
		bookmarkDataArr.push(bookmarkDataObj);
	}
	else
	{
		// Post all local stored bookmark data
		if(typeof(Storage) === "undefined")
		{
			var allIdStr = localStorage[userId + "_" + BOOKMARK_DETAIL_ID_LIST];
			var idArr = new Array();
			if(allIdStr !== undefined && allIdStr !== "")
				idArr = allIdStr.split(",");

			for(var k = 0; k < idArr.length; k++)
			{
				var id = idArr[k];
				jsonStr = localStorage[userId + "_" + id + BOOKMARK_STR];
				bookmarkDataArr.push(JSON.parse(jsonStr));
			}
		}		
	}

	var uploadData = JSON.stringify(bookmarkDataArr);

	// Post to the server
	var uploadObj = new Object();
	uploadObj.user_id = userId;
	uploadObj.bookmarkData = uploadData;
	if(fullSyncFlag)
		uploadObj.fullSync = "true";
	else
		uploadObj.fullSync = "false";
 
	$.ajax({
		type: "POST",
		data: uploadObj,
		url: SYNC_BOOKMARK_URL,
		success: function(serverDataStr) {
				if(!fullSyncFlag) {
					return;
				}
				
				serverData = JSON.parse(serverDataStr);
				updateServerBookmarkData(serverData, userId);
			 }
	}); 		
}

function updateServerBookmarkData(serverData, userId)
{
	mapIdToBookmarkStatus = new Object();

	for(var ind = 0; ind < serverData.length; ind++)
	{
		var obj = serverData[ind];
		mapIdToBookmarkStatus[obj.event_id] = true;
	}

	// Insert details in the cache
	for(var ind = 0; ind < serverData.length; ind++)
	{
		var serverObj = serverData[ind];
		if(eventDetailCache === null)
			eventDetailCache = new Cache(CACHE_CAPACITY);
		eventDetailCache.insert(parseInt(serverObj.event_id), serverObj.detailObj);
	}

	// Update in local storage
	if(typeof(Storage) === 'undefined')
		return;

	// Remove old data	
	var idListStr = localStorage[userId + "_" + BOOKMARK_DETAIL_ID_LIST];
	if(idListStr !== undefined && idListStr !== "")
	{
		var idList = idListStr.split(",");
		for(var ind = 0; ind < idList.length; ind++)
		{
			var id = idList[ind];
			localStorage.removeItem(userId + "_" + id + BOOKMARK_STR);
		}		
	}

	var bookmarkIdStr = "";
	for(var ind = 0; ind < serverData.length; ind++)
	{
		var serverObj = serverData[ind];
		var bookmarkObj = new Object();
		bookmarkObj.flag = true;
		bookmarkObj.event_id = serverObj.event_id;
		bookmarkObj.timehappen = serverObj.timehappen;
		bookmarkObj.expired = serverObj.expired;

		localStorage[userId + "_" + bookmarkObj.event_id + BOOKMARK_STR] = JSON.stringify(bookmarkObj);
		localStorage[bookmarkObj.event_id + DETAIL_STR] = JSON.stringify(serverObj.detailObj);
		var localExpire = localStorage[bookmarkObj.event_id + EXPIRE_STR];
		if(localExpire === undefined || parseInt(localExpire) < parseInt(serverObj.expired))
		{
			localStorage[bookmarkObj.event_id + EXPIRE_STR] = serverObj.expired;
		}

		if(bookmarkIdStr !== "")
			bookmarkIdStr += ",";
		bookmarkIdStr += bookmarkObj.event_id;
	}

	localStorage[userId + "_" + BOOKMARK_DETAIL_ID_LIST] = bookmarkIdStr;
}

function buildMapIdToEvtInd()
{
	mapIdToIndex = new Object();

	for(var ind = 0; ind < normalEventList.length; ind++)
	{
		var evtObj = normalEventList[ind];
		mapIdToIndex[evtObj.event_id] = ind;
	}

	for(var ind = 0; ind < regularEventList.length; ind++)
	{
		var evtObj = regularEventList[ind];
		mapIdToIndex[evtObj.event_id] = ind + OFFSET_REGULAR;
	}
}

function getBookmarkedEvents(callback)
{
	var bookmarkEvtArr = new Array();
	var countNumRet = 0;
	
	for(var evtId in mapIdToBookmarkStatus)
		if(mapIdToBookmarkStatus[evtId])
			countNumRet++;

	if(countNumRet == 0)
	{
		callback(bookmarkEvtArr);
		return;
	}

	for(var evtId in mapIdToBookmarkStatus)
	{
		if(mapIdToBookmarkStatus[evtId])
		{
			getEventDetail(parseInt(evtId), function(detaiObj) { 
				var retObj = new Object();
				retObj.event_id = detaiObj.event_id;
				retObj.event_name = detaiObj.event_name;
				retObj.short_name = detaiObj.short_name;
				bookmarkEvtArr.push(retObj);
	
				if(bookmarkEvtArr.length == countNumRet)
					// Get all the bookmarked detail
					callback(bookmarkEvtArr);
			});
		}
	}
}
