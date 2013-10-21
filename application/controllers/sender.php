<?php
//To use Sent.ly to send out SMS, you must:
//1. Signup at - http://sent.ly
//2. Download and install the Sent.ly application from the Play Store on your Android phone
//   the URL is: https://play.google.com/store/apps/details?id=io.modem&hl=en
//3. Sign in on the Sent.ly client on your phone.
//Once you have completed the 3 steps, you can change this page to include
//the Sent.ly email and password in the appropriate variables.
//
//This page should be copied to your server and called like:
//http://yourserver.com/sender.php?message=Your+url+encoded+message&to=%2byourfullnumberwithcountrycode
//Example: To send an SMS to a singapore number 83887908, call this page like:
//http://yourserver.com/sender.php?message=Hi+Varun&to=%2b6583887908 

		//Put your email in the variable below
		$email = 'tienthanh8490@gmail.com';
		//Put your password in the variable below
		$password = 'tienthinh';
		 
		//Read the message from the request
		$message = "messagesent";
		//Read the destination number from the request
		$destination = "%2b6582369884";
 
//You could put the following function in a seperate php file and include it
//that was you could call it from any other php page
function sendSentlySms($email, $password, $message, $destination) { 
	$url = 	'https://sent.ly/command/sendsms?username=';
	$url .= urlencode($email);
	$url .= '&password=';
	$url .= urlencode($password);
	$url .= '&text=';
	$url .= urlencode($message);
	$url .= '&to=';
	$url .= urlencode($destination);
 
	$response = '';
 
	try
	{
		$response = file_get_contents($url);
	}
	catch(Exception $e)
	{
		//We return -1 if an exception occurred
		return array (-1, 0);
	}
 
	//We expect response as either:
	//Id:23232323 OR
	//Error:3
	$pieces = explode(':', $response);
 
	$numparts = count($pieces);
 
	//If response doesn't have two parts then something is wrong
	if($numparts != 2) {
		return array (-1, 0); //unexpected response!
	}
 
	//If it's an error response the first element of returned array has the error code
	//Id is 0 as message was not sent
	if(strcmp($pieces[0], 'Error') == 0)
		return array(intval($pieces[1]), 0);
 
	//Otherwise the first element is 0 as error code is 0
	//second element has the id of the message
	if(strcmp($pieces[0],'Id')==0)
		return array(0, intval($pieces[1]));
 
	return array (-1, 0); //unexpected response!
}
 
list ($error, $id) = sendSentlySms($email, $password, $message, $destination);
 
echo 'Error:' . $error;
echo '<br/>';
echo 'Id:' . $id;
?>