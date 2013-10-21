<?php
class Icreate_model extends CI_Model {
	private $eventQueryTemplate =  "SELECT ev.event_id, ev.organizer_id, ev.category_id, ev.map_id, ev.short_name, ev.event_name, ev.start_dt, ev.end_dt, ev.repeated_info, ev.registration_start_dt, ev.registration_end_dt, ev.tags, cat.category_name FROM event AS ev LEFT JOIN category AS cat ON ev.category_id = cat.category_id";

	private $eventDetailQueryTemplate = "SELECT ev.*, cat.*, org.* FROM event AS ev LEFT JOIN category AS cat ON ev.category_id = cat.category_id LEFT JOIN organizer AS org ON ev.organizer_id = org.organizer_id";

	public function __construct()
	{
		$this->load->database();
	}

	// Create database (used once)
	public function createDatabaseIcreate()
	{
		$this->load->dbforge();

		if($this->dbforge->create_database('IcreateEvent'))
		{
			echo 'Database created!';
		}
		else
		{
			echo 'Error creating database';
			return;
		}

		// Create CATEGORY table
		$this->dbforge->create_table('CATEGORY', TRUE);
	}

	public function getCategory()
	{
		$sqlString = "SELECT * FROM category;";

		$query = $this->db->query($sqlString);

		return $query->result();
	}

	public function getAllEvents($monthFromNow)
	{
		$strModify = '+' . $monthFromNow . ' month';
		$endDate = new DateTime();
		$endDate->modify($strModify);
		$startDate = new DateTime();

		$sqlString = $this->eventQueryTemplate;
		$sqlString = $sqlString . " WHERE (ev.end_dt <= '" .
			$endDate->format('Y-m-d') . "' AND ev.end_dt >= '" . 
		        $startDate->format('Y-m-d') . "') OR ev.repeated_info != '' ";

		$query = $this->db->query($sqlString);
		return $query->result();
	}

	public function getEventDetail($eventIdArr)
	{
		if(count($eventIdArr) == 0)
			return;
		$sqlString = $this->eventDetailQueryTemplate;
		$sqlString = $sqlString . " WHERE ev.event_id IN (";

		$isFirst = true;
		foreach ($eventIdArr as $id)
		{
			if($isFirst == true)
				$isFirst = false;
			else
				$sqlString = $sqlString . ",";
			$sqlString = $sqlString . $id;
		}
		$sqlString = $sqlString . ");";

		$query = $this->db->query($sqlString);
		return $query->result();
	}

	public function getMapLocation()
	{
		$sqlString = "SELECT * FROM map_location;";
		$query = $this->db->query($sqlString);
		return $query->result();
	}

	public function getEventCategory()
	{
		$sqlString = "SELECT * FROM category;";
		$query = $this->db->query($sqlString);
		return $query->result();
	}

	public function getBookmarkData($userId)
	{
		$sqlString = "SELECT * FROM bookmark WHERE userid = " . $userId . ";";
		$query = $this->db->query($sqlString);
		return $query->result();
	}

	public function updateBookmarkData($userId, $bookmarkDataArr)
	{
		if(count($bookmarkDataArr) == 0)
			return;

		$sqlString = "INSERT INTO bookmark VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE flag = ?, timehappen = ?, expired = ? ;";
		
		foreach($bookmarkDataArr as $data)
		{
			$this->db->query($sqlString, array($userId, $data->event_id, $data->flag, $data->timehappen, $data->expired, $data->flag, $data->timehappen, $data->expired));
		}
	}

	public function deleteBookmarkData($userId, $deleteEvtArr)
	{
		if(count($deleteEvtArr) == 0)
			return;

		$sqlString = "DELETE FROM bookmark WHERE (userid, event_id) IN ( ";
		$isFirst = true;
		
		foreach($deleteEvtArr as $deleteId)
		{
			if($isFirst)
				$isFirst = false;
			else
				$sqlString .= ", ";
			$sqlString .= "(" . $userId . ", " . $deleteId . ")";
		}
		$sqlString .= " ); ";

		$this->db->query($sqlString);
	}
}
