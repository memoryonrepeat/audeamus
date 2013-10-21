<?php
class Auth extends CI_Controller {
	public function __construct()
	{
		parent::__construct();
		// Your own constructor code
		$this->load->library('session');			
		$this->load->helper('url');
		$this->load->database();
		$this->load->library('facebook');
		$this->load->helper('facebook');
		$this->load->library('Lightopenid');
		$this->load->helper('openid');
	}
	
	public function index() {
		echo "what are you doing here!";
	}
	
	public function login() {
		if($this->session->userdata('logged_in') == FALSE) {
			$sv = $this->uri->segment(3);
			$redirect_back_link = site_url("auth/login_redirect_back/".$sv);
			switch($sv) {
				case "fb":
					$facebook = fb_object($redirect_back_link);	
					if (!is_string($facebook)) {
						redirect($redirect_back_link);
					} else {
						redirect($facebook);
					}
					break; 
				case "gmail":
				case "yahoo":
					redirect(openid_login_link($sv, $redirect_back_link));
					break;
				default:
					redirect(site_url("auth/system_error"));
			}
		} else {
			$data = array(
				'user_id' => $this->session->userdata('user_id'),
				'name'   => $this->session->userdata('name'),
				'email'    => $this->session->userdata('email'),
				'phone'  => $this->session->userdata('phone'),
			);
			$return_str = json_encode($data);
			redirect("http://im.whatsword.com#".urlencode ($return_str));
		}
	}
	
	public function login_redirect_back() {
		$sv = $this->uri->segment(3);
		$user_openid = array("remote_source" => $sv, "remote_id" => "", "name" => "", "email" => "", "gender" => "", "fb_username" => "");
		switch($sv) {
			case "fb":
				$facebook = fb_object("");	
				if (!is_string($facebook)) {
					$user_profile = $facebook->api('/me');
					$user_openid ["remote_id"] = $user_profile["id"];
					$user_openid ["name"] = $user_profile["name"];
					$user_openid ["email"] = $user_profile["email"];
					$user_openid ["gender"] = $user_profile["gender"];
					$user_openid ["fb_username"] = $user_profile["username"];
				} else {
					redirect(site_url("auth/system_error"));
					return;
				}
				break;
			case "gmail":
			case "yahoo":
				$openid = openid_object();
				if ($openid->mode == "id_res") {
					$attributes = $openid->getAttributes();
					$user_openid ["remote_id"] = $attributes["contact/email"];
					$user_openid ["name"] = $attributes["namePerson"];
					$user_openid ["email"] = $attributes["contact/email"];
				} else {
					redirect(site_url("auth/system_error"));
					return;
				}
				break;
			default:
				redirect(site_url("auth/system_error"));
				return;
		}
		
		if ($user_openid ["name"] == NULL || $user_openid ["name"] == "")
			$user_openid ["name"] = $user_openid ["email"];
		
		//Check database whether the user exist or not
		$user_id  =  0;
		$query = $this->db->get_where('oauth', array("host" => $sv, "host_id" => $user_openid ["remote_id"]), 1);
		if ($query->num_rows() > 0) {
			$row = $query->row(0);
			$user_id = $row->user_id;
		} else {
			// check email
			$query = $this->db->get_where('user', array('email' => $email), 1);
			if($query->num_rows()>0) {
				$row = $query->row(0);
				$user_id = $row->id;
			}
			if (empty($user_id)) {
				// add this account to database
				$this->db->insert('user', array('email' => $user_openid ["email"], 'name' => $user_openid ["name"], 'phone' => '')); 
				$user_id = $this->db->insert_id();
			} 
			$this->db->insert('oauth', array('user_id' => $user_id, 'host' => $user_openid ["remote_source"], 'host_id' => $user_openid ["remote_id"]));
		}
		
		// Login successfully  
		// set session
		// redirect
		/* set session */
		$query = $this->db->get_where('user', array('id' =>$user_id), 1);
		$user_info = $query->row(0);
		$new_session = array(
			'user_id' =>$user_id,
			'name'   => $user_info->name,
			'email'    => $user_info->email,
			'phone'  => $user_info->phone,
			'prefer'   => $user_info->prefer,
		);
		$return_str = json_encode($new_session);
		$new_session['logged_in'] = TRUE;
		$this->session->set_userdata($new_session);
		redirect("http://im.whatsword.com#".urlencode ($return_str));
	}
	
	/* system error */
	public function system_error() {
		echo "There is a problem with openid";
	}
	
	public function logout() {
		$this->session->set_userdata('logged_in', FALSE);
		redirect("http://im.whatsword.com");
	}
	
	public function remind() {
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
		
		$user_id = $this->input->post("user_id");
		$email = $this->input->post("email");
		$phone = $this->input->post("phone");
		$event_id = $this->input->post("event_id");
		$before = $this->input->post("before");
		echo $user_id."<br>".$email."<br>".$phone."<br>".$event_id."<br>".$before;
	}
	
	public function updatePrefer() {
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
		
		$user_id = $this->input->post("user_id");
		$prefer = $this->input->post("prefer");
		$this->db->update('user', array('prefer' => $prefer), array('id' => $user_id));
		echo "success";
	}
}


?>