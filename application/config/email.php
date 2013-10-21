<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

$config['protocol'] = 'smtp'; 
$config['smtp_host'] = 'mail.whatsword.com';
$config['smtp_port'] = 26;
$config['smtp_user'] = 'reminder@im.whatsword.com';
$config['smtp_pass'] = 'tuan1990';
$config['mailtype'] = "html";
$config['charset'] = 'utf-8';
$config['wordwrap'] = TRUE;
$config['bcc_batch_mode'] = TRUE;
$config['bcc_batch_size'] = 1000;

?>