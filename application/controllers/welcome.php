<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Welcome extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		// Your own constructor code
		$this->load->library('session');			
		$this->load->helper('url');
	}
	
	public function index()
	{
		$this->load->view('index');
	}
	
	/*
	public function sendEmail() 
	{
		$this->load->library('email');	// THANH, put in constructor
		$this->email->set_newline("\r\n");
		$this->email->from('reminder@im.whatsword.com', 'eCompass');
		$this->email->to("nhudinhtuan@gmail.com"); 	// THANH, change it			
		$this->email->subject('Remind event XYZ'); // THANH, change it
		$this->email->message('Helo');		// THANH, change it
		$this->email->send();		
		
		echo $this->email->print_debugger(); // THANH, just for debugging, please remove it when it's ok	
	}*/
}

/* End of file welcome.php */
/* Location: ./application/controllers/welcome.php */