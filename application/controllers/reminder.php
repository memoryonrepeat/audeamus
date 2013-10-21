<?php
/*
	user_id: int (note: email and sms can be null)
	event_id: int (to get event time, type = datetime --> paste by my own)
	remind_before : int
	type : varchar

	Get system datetime, rmb to set timezone to singapore, put in constructor	

	https://sent.ly/command/sendsms?username=tienthanh8490@gmail.com&password=icreate&to=%2b6582369884&text=Sent.ly+is+wicked+cool.
*/
class Reminder extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		//$this->load->model('icreate_model');
		$this->load->database();
		$this->load->library('email');	
		$this->load->helper('url');
		date_default_timezone_set("Asia/Singapore");
	}	

	public function index(){
		redirect(site_url("reminder/sendsms"));		
	}	
	
	public function sendsms() { 				

		//Put your email in the variable below
		$email = 'tienthanh8490@gmail.com';
		//Put your password in the variable below
		$password = 'icreate';

		$message = array("First message","Second message");
		$destination = array("+6582369884","+6582369884");		

		$receiver = "tienthanh8490@gmail.com";
		$event_name = "iCreate demo";
		
		$event_time = array("2013-07-05 02:24:00","2013-07-05 02:23:00");
		
		$today = getdate();
		$current_year = intval($today["year"]);
		$current_month = intval($today["mon"]);
		$current_day = intval($today["mday"]);
		$current_hour = intval($today["hours"]);
		$current_min = intval($today["minutes"]);
		$max_day_of_month = date('t');
		
		
		echo "Current: ".$current_year."|".$current_month."|".$current_day."|".$current_hour."|".$current_min."\n";

		//Send message 5 minutes beforehand
		
		for ($i=0; $i<2; $i++){
			
			$event_year[$i]=intval(substr($event_time[$i],0,4));
			$event_month[$i]=intval(substr($event_time[$i],5,2));
			$event_day[$i]=intval(substr($event_time[$i],8,2));
			$event_hour[$i]=intval(substr($event_time[$i],11,2));
			$event_min[$i]=intval(substr($event_time[$i],14,2));

			echo "Event: ".$event_year[$i].";".$event_month[$i].";".$event_day[$i].";".$event_hour[$i].";".$event_min[$i]."\n";
			
			$same_hour = FALSE;
			$transition = FALSE;
			if (($event_hour[$i]-$current_hour==1 || $current_hour-$event_hour[$i]==23) && $current_min-$event_min[$i]>=60-$send_before) $transition = TRUE;			

			if ($event_hour[$i]==$current_hour && $event_min[$i]-$current_min<=$send_before && $event_min[$i]>=$current_min){
				echo "same hour\n";
				$same_hour = TRUE;
			}
				
			$start_sending = FALSE;
			$send_before = 5; //Send messages 5 mins before event starts									

			if ($event_day[$i]==1 && $event_month[$i]==1 && $current_day==31 && $current_month==12 && $event_hour[$i]==0 &&
				$current_hour==23 && $current_min-$event_min[$i]>=60-$send_before) $start_sending=TRUE;
			
			if ($event_year[$i]==$current_year){				
				if ($event_month[$i]-$current_month==1){					
					if ($current_day==$max_day_of_month && $event_day[$i]==1 && $transition) {					
						$start_sending = TRUE;		
					}
				}
				else if ($event_month[$i]==$current_month){					
					if (($event_day[$i]-$current_day==1 && $transition) || ($event_day[$i]==$current_day && ($transition||$same_hour)))	$start_sending=TRUE;					
				}
			}

			//$start_sending=TRUE;

			if ($start_sending) {

				echo "true";

				
				$this->email->set_newline("\r\n");
				$this->email->from('reminder@im.whatsword.com', 'eCompass');
				$this->email->to($receiver); 	// Replace receiver by the email address of the user			
				$this->email->subject("Event reminder from eCompass"); 
				$this->email->message("Hello, please reminded that your event \"".$event_name."\" will be happening in 30 minutes.");	//Replace event_name by the real name of the event
				$this->email->send();		
				
				//echo $this->email->print_debugger(); // THANH, just for debugging, please remove it when it's ok				
				

				$url = 	'https://sent.ly/command/sendsms?username=';
				$url .= urlencode($email);
				$url .= '&password=';
				$url .= urlencode($password);
				$url .= '&text=';
				$url .= urlencode($message[$i]);
				$url .= '&to=';
				$url .= urlencode($destination[$i]);
			 	
			 	
				$response = '';

				$error=0;
				$id=0;
			 
				try
				{
					$response = file_get_contents($url);
				}
				catch(Exception $e)
				{
					//We return -1 if an exception occurred
					//return array (-1, 0);
					$error=-1;
				}
			 
				//We expect response as either:
				//Id:23232323 OR
				//Error:3
				$pieces = explode(':', $response);
			 
				$numparts = count($pieces);
			 
				//If response doesn't have two parts then something is wrong
				if($numparts != 2) {
					//return array (-1, 0); //unexpected response!
					$error=-3;
				}
			 
				//If it's an error response the first element of returned array has the error code
				//Id is 0 as message was not sent
				else if(strcmp($pieces[0], 'Error') == 0)
					$error=intval($pieces[1]);
			 
				//Otherwise the first element is 0 as error code is 0
				//second element has the id of the message
				else if(strcmp($pieces[0],'Id')==0)
					$id=intval($pieces[1]);
			 
				//return array (-1, 0); //unexpected response!
				else $error=-2;
				echo 'Error:' . $error;
				echo '<br/>';
				echo 'Id:' . $id;				
			}				

		}
			
	}

}
?>