<?php
class Icreate extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		$this->load->model('icreate_model');
		$this->load->helper('url');
	}

	public function index()
	{
		echo "hello world";
	}

	public function category()
	{
		$queryResult = $this->icreate_model->getCategory();

		echo json_encode($queryResult);
	}

	public function all_event($monthFromNow = 3)
	{
		$queryResult = $this->icreate_model->getAllEvents($monthFromNow);
		echo  $_GET['callback']."(".json_encode($queryResult).")";
	}

	public function event_detail($idArrStr)
	{
		$idArr = explode(",", $idArrStr);
		//print($idArr);
		$queryResult = $this->icreate_model->getEventDetail($idArr);
		
		echo  $_GET['callback']."(".json_encode($queryResult).")";
	}

	public function static_resource()
	{
		header("Content-Type: text/javascript");

		// Get map location
		$dbLocationResult = $this->icreate_model->getMapLocation();

		foreach($dbLocationResult as $loc)
		{
			$loc->map_id = intval($loc->map_id);
			$loc->parent_map_id = intval($loc->parent_map_id);
			if($loc->parent_map_id == 0)
				$loc->parent_map_id = $loc->map_id;
			$loc->x_coord = intval($loc->x_coord);
			$loc->y_coord = intval($loc->y_coord);
		}

		$mapIdToLocObj = array();
		foreach($dbLocationResult as $loc)
		{
			$mapIdToLocObj[$loc->map_id] = $loc;
		}

		$strContent = json_encode($mapIdToLocObj);
		
		echo "mapIdToLocObj = " . $strContent . ";";

		// Get event category
		$dbEvtCategory = $this->icreate_model->getEventCategory();
		$mapIdToName = array();
		foreach($dbEvtCategory as $cat)
		{
			$cat->category_id = intval($cat->category_id);
			$mapIdToName[$cat->category_id] = $cat;
		}
		$strContent = json_encode($mapIdToName);
		
		echo "mapIdToCategory = " . $strContent . ";";
	}

	public function sync_bookmark()
	{
		$allowedClientList = array("http://im.whatsword.com", "http://imbn.whatsword.com");
		$defaultOrigin = "http://imbn.whatsword.com";

		$origin = $_SERVER['HTTP_ORIGIN'];
		$retOrigin = $defaultOrigin;
		$match = false;
		foreach($allowedClientList as $str)
		{
			if($str == $origin)
			{
				$retOrigin = $origin;
				$match = true;
				break;
			}
		}

		header("Access-Control-Allow-Origin: " . $retOrigin);
		if(!$match)
		{
			echo '';
			return;
		}

		$userId = $_POST['user_id'];
		$userId = intval($userId);

		$bookmarkDataStr = $_POST['bookmarkData'];
		$bookmarkObjArr = json_decode($bookmarkDataStr);

		// If fullSync = false, we just need to overwrite the data in the database by data sent from the client.
		if($_POST['fullSync'] === "false")
		{
			$this->icreate_model->updateBookmarkData($userId, $bookmarkObjArr);
			echo 'Update successfully';
			return;
		}

		// If fullSync = true, we merge the data in the database and data from the client.
		// Send the list of bookmarked events to the client as well 
		$queryResult = $this->icreate_model->getBookmarkData($userId);
		$mapEvtIdToData = array();
		$nowTime = time() * 1000;
		$deleteEvtArr = array();
		foreach($queryResult as $record)
		{
			// Assumption there are no two records with the same event id and user id
			$newRecord = (object) array();
			$newRecord->event_id = intval($record->event_id);
			$newRecord->flag = $record->flag;
			$newRecord->timehappen = intval($record->timehappen);
			$newRecord->expired = intval($record->expired);
			if($newRecord->expired > nowTime)
				$mapEvtIdToData[$newRecord->event_id] = $newRecord;
			else
				array_push($deleteArr, $newRecord->event_id);
		}

		// Delete expired data
		$this->icreate_model->deleteBookmarkData($userId, $deleteEvtArr);

		// Merge the two bookmark data lists
		foreach($bookmarkObjArr as $clientRecord)
		{
			$clientRecord->event_id = intval($clientRecord->event_id);
			$flagChar = '0';
			if($clientRecord->flag)
				$flagChar = '1';
			$clientRecord->flag = $flagChar;

			$dbRecord = $mapEvtIdToData[$clientRecord->event_id];
			if(!isset($dbRecord) || $clientRecord->timehappen > $dbRecord->timehappen)
			{
				$mapEvtIdToData[$clientRecord->event_id] = $clientRecord;
			}
		}

		// Update the record in the table
		$updateData = array();
		foreach($mapEvtIdToData as $key => $data)
		{
			array_push($updateData, $data);
		}
		$this->icreate_model->updateBookmarkData($userId, $updateData);

		// Get event details of those bookmarked events
		$detailEvtIdArr = array();
		foreach($mapEvtIdToData as $key => $data)
		{
			if($data->flag == "1")
				array_push($detailEvtIdArr, intval($key));
		}

		$detailQuery = $this->icreate_model->getEventDetail($detailEvtIdArr);
		$clientResult = array();
		foreach($detailQuery as $detailObj)
		{
			$eventId = intval($detailObj->event_id);
			$retObj = $mapEvtIdToData[$eventId];
			if($retObj->flag == "1")
				$retObj->flag = true;
			else
				$retObj->flag = false;
			$retObj->detailObj = $detailObj;
			array_push($clientResult, $retObj);
		} 
		
		echo json_encode($clientResult);
	} 
}
