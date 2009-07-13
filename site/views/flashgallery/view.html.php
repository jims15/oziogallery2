<?php
defined( '_JEXEC' ) or die( 'Restricted access' );
jimport( 'joomla.application.component.view');

class OzioGalleryViewFlashGallery extends JView
{
	function display( $tpl = null )
	{
	
		global $mainframe;
		$document 	= & JFactory::getDocument();
		$menus		= & JSite::getMenu();
		$menu		= $menus->getActive();

		$params = $mainframe->getParams('com_oziogallery2');
		
		$larghezza 			= $params->def('width', 640);
		$altezza 			= $params->def('height', 480);
		$titlegall 			= (int) $params->def('titlegall', 1);
		$flickr 			= (int) $params->def('flickr', 0);
		$user_id 			= $params->def('user_id', 0);
		$folder				= $params->def('folder');
		$modifiche 			= (int) $params->def('modifiche', 0);
		$debug 				= (int) $params->def('debug');			
		
		
		switch ($params->get( 'rotatoralign' ))
		{
			case '0': $float		= 'left'; 		break;
			case '1': $float		= 'right';		break;
			case '2': $float		= 'inherit';	break;			
			default:  $float		= 'inherit'; 	break;				
		}
		
		switch ($params->get( 'table' ))
		{
			case '0': $table		= 'left'; 		break;
			case '1': $table		= 'right';		break;
			case '2': $table		= 'center';		break;			
			default:  $table		= 'center'; 	break;				
		}		

		switch ($params->get( 'xmlcolor' ))
		{
			case '0': $xmlcolor		= 'default.xml'; 				break;
			case '1': $xmlcolor		= 'blue.xml';					break;
			case '2': $xmlcolor		= 'black.xml'; 					break;
			case '3': $xmlcolor		= 'defaultnotitle.xml'; 		break;			
			default:  $xmlcolor		= 'default.xml'; 		break;				
		}
		
		$document->addScript(JURI::root(true).'/components/com_oziogallery2/assets/js/15/swfobject.js');
		$document->addCustomTag('
		<style type="text/css">
			.oziofloat {
				width: '.$larghezza.';
				height: '.$altezza.';
				margin: 0px auto;
				float:  '.$float.';
				}
			.oziotime {
                font-size: 0.8em;
				color:#ccc;	
				}				
		</style>
		');		

		if (is_object( $menu )) {
			$menu_params = new JParameter( $menu->params );		
			
			if (!$menu_params->get( 'page_title')) {
				$params->set('page_title',	$menu->name);
			}
			
		} else {
			$params->set('page_title',	JText::_('Ozio'));
		}

		$document->setTitle($params->get('page_title'));
		$document->setMetadata( 'keywords' , $params->get('page_title') );

		if ($mainframe->getCfg('MetaTitle') == '1') {
				$mainframe->addMetaTag('title', $params->get('page_title'));
		}


		
 if( $flickr == 0 ) :

		jimport('joomla.filesystem.file'); 
		// creazione file xml al volo	
    	$VAMBpathAssoluto = JPATH_SITE;
		$VAMBpathAssoluto = str_replace("\\", "/" , $VAMBpathAssoluto);	

		$path  = $VAMBpathAssoluto .'/'. $folder . '/';
		$dir_images = rtrim(JURI::root() . $folder . '/') ;
		$dir_files = rtrim(JURI::root() . 'images/oziogallery2') . '/';

		$xmltitle = $menu->name;
		$xmltitle = str_replace( ' ', '', $xmltitle );
		$regex = array('#(\.){2,}#', '#[^A-Za-z0-9\.\_\- ]#', '#^\.#');
		$xmltitle = preg_replace($regex, '', $xmltitle);

		
		$xmlnamesuff = $params->def('xmlnamesuff');
		$xmlnamesuff = str_replace( ' ', '', $xmlnamesuff );
		$regex = array('#(\.){2,}#', '#[^A-Za-z0-9\.\_\- ]#', '#^\.#');
		$xmlnamesuff = preg_replace($regex, '', $xmlnamesuff);		
		
		if ($xmlnamesuff != null) :
			$xmlname = $xmltitle . '_'. $xmlnamesuff;
		else:
			$xmlname = $xmltitle;
		endif;
		// nome del file creato
		$filename 	= JPATH_SITE.'/components/com_oziogallery2/skin/flashgallery/xml/flashgallery_'. $xmlname .'.xml';
        $foldername = $path;		
		$this->assignRef('nomexml' , 				$xmlname);

		if (JFolder::exists( $path ))
		{
		
		if ( @filemtime($foldername) >= @filemtime($filename) ) 
		{	
	
		$thumb_sufix = ".th.";
	
		$files = array();
		if ($hd = opendir($path)) {
			while (false !== ($file = readdir($hd))) { 
				if($file != '.' && $file != '..') {
					if (strpos($file, $thumb_sufix) === false) {
						if(is_file($path . $file) && preg_match('/\.(jpg|png|gif)$/i',$file)) {
							$files[] = array(filemtime($path.$file), $file);
					}
				}
			}
		}
			closedir($hd);
	}
		
		
		if(count($files)) {
			arsort($files);
			$filehandle = fopen($filename, 'w');

			$string = '<pics>'."\n";

			$n = count($files);
			for ($i=0; $i<$n; $i++)
			{
				$row 	 = &$files[$i];
				$title = preg_replace('/\.(jpg|png|gif)$/i','',$row[1]);
		if ( $titlegall == 1 ) : 				
						$string .= '<pic src="' . $dir_images . $row[1] . '" title="'. $title . '">';
						$string .= "</pic>\n";
			else:
						$string .= '<pic src="' . $dir_images . $row[1] . '" title="">';
						$string .= "</pic>\n";			
            endif;			
						
			}	
			$string .= '</pics>'."\n";
			fwrite($filehandle, $string);
			fclose($filehandle);
			}			
	
	}	

		}	
		else//Folder  non esiste
		{
			$message = '<p><b><span style="color:#009933">Attenzione:<br />
			Il percorso alla cartella immagini indicato nei parametri</span><br /> ' . $folder 
						   .' <br /><span style="color:#009933">non e\' corretto. </span>
						   <span style="color:#009933">Controlla se hai creato la cartella, se la cartella esiste controlla, ed eventualmente modifica, il percorso nei parametri.</span>
						   </b></p>';
			$error[] = 0;
				 
		echo $message;	
			
		}

		 
				$tempo = '<div>';
				$tempo .= '<span class="oziotime">';	
			$foldername 	= $foldername;				
			if (JFolder::exists($foldername)) {
			    $tempo .= JText::_('Ultima modifica cartella'). ": " . date("d m Y H:i:s.", filemtime($foldername));
				$tempo .= '</span>';				
			}
			$tempo .= ' | ';
			
			$filename 	= $filename;
			if (JFile::exists($filename)) {
			    $tempo .= '<span class="oziotime">';
			    $tempo .= JText::_('Ultima modifica file') . ": " . date("d m Y H:i:s.", filemtime($filename));
				$tempo .= '</span>';
				$tempo .= '</div>';				
			}		 
endif;		

        // Debug per test interno
		$oziodebug 	= '<h2>DEBUG OZIO - FOR HELP</h2>';
if( $flickr == 1 ) :			
		$oziodebug .= '<pre>'.JText::_('PARAMETRO').'  Flickr :   ' .JText::_('ATTIVO').'</pre>';
		$oziodebug .= '<pre>'.JText::_('PARAMETRO').'  User_id :   ' .$user_id .'</pre>';
else:
		$oziodebug .= '<pre>'.JText::_('PARAMETRO').'  XML :   ' .JText::_('ATTIVO') .'</pre>';
endif;
		
		$oziodebug .= '<pre>'.JText::_('PARAMETRO').'  titlegall :   ' .$titlegall  .'</pre>';
		$oziodebug .= '<pre>'.JText::_('PARAMETRO').'  xmlcolor :     '.$xmlcolor  .'</pre>';
		$oziodebug .= '<pre>'.JText::_('PARAMETRO').'  larghezza :     '.$larghezza  .'</pre>';
		$oziodebug .= '<pre>'.JText::_('PARAMETRO').'  altezza :     '.$altezza  .'</pre>';
if( $flickr == 0 ) :		
		if (is_writable(JPATH_SITE.DS . $folder)):
			$oziodebug .= '<pre>'.JText::_('CARTELLA'). '  ' . $folder . ' :     '. JText::_( 'Writable' )  .'</pre>';
        else:
			$oziodebug .= '<pre>'.JText::_('CARTELLA'). '  ' . $folder . ' :     '.  JText::_( 'Unwritable' )  .'</pre>';			
		endif;			
		if (is_writable(JPATH_SITE.DS.'components'.DS.'com_oziogallery2'.DS.'skin'.DS.'flashgallery'.DS.'xml')):
			$oziodebug .= '<pre>'.JText::_('CARTELLA'). '  components/com_oziogallery2/skin/flashgallery/xml :     '. JText::_( 'Writable' )  .'</pre>';
        else:
			$oziodebug .= '<pre>'.JText::_('CARTELLA'). '  components/com_oziogallery2/skin/flashgallery/xml :     '.  JText::_( 'Unwritable' )  .'</pre>';			
		endif;
endif;		
		//fine debug



		$this->assignRef('params' , 				$params);
		$this->assignRef('altezza' , 				$altezza);
		$this->assignRef('larghezza' , 				$larghezza);
		$this->assignRef('xmlcolor' , 				$xmlcolor);
		$this->assignRef('titlegall' , 				$titlegall);		
		$this->assignRef('flickr' , 				$flickr);
		$this->assignRef('user_id' , 				$user_id);
		$this->assignRef('table' , 					$table);
		$this->assignRef('filename' , 				$filename);
		$this->assignRef('foldername' , 			$foldername);	
		$this->assignRef('tempo' , 					$tempo);
		$this->assignRef('modifiche' , 				$modifiche);
		$this->assignRef('debug' , 					$debug);
		$this->assignRef('oziodebug' , 				$oziodebug);		
		
		parent::display($tpl);
	}
}
?>