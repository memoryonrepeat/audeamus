<?
function fb_object($link_back)
{
	$facebook = new Facebook(array(
		'appId'  => '524121370968786',
		'secret' => '72b32443694c7a009b34f1b1a6d38e35',
	));
		
	$uid = $facebook->getUser();
		
	// login or logout url will be needed depending on current user state.		
	if(!$uid)
	{
		return $facebook->getLoginUrl(array('scope' => 'email', 'redirect_uri' => $link_back));	
	}
		
	return $facebook;				
}
?>