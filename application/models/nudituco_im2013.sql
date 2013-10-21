-- phpMyAdmin SQL Dump
-- version 3.4.11.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jul 08, 2013 at 09:04 AM
-- Server version: 5.5.32
-- PHP Version: 5.2.17

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `nudituco_im2013`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookmark`
--

DROP TABLE IF EXISTS `bookmark`;
CREATE TABLE IF NOT EXISTS `bookmark` (
  `userid` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `flag` varchar(1) NOT NULL,
  `timehappen` bigint(20) NOT NULL,
  `expired` bigint(20) NOT NULL,
  PRIMARY KEY (`userid`,`event_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `bookmark`
--

INSERT INTO `bookmark` (`userid`, `event_id`, `flag`, `timehappen`, `expired`) VALUES
(5, 3, '1', 1372824349669, 1375851600000),
(5, 2, '0', 1372824568119, 1374638968119),
(5, 4, '1', 1372824558393, 1375243758392),
(1, 3, '1', 1373036948226, 1375804800000),
(1, 4, '1', 1373036881977, 1375456081977);

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
CREATE TABLE IF NOT EXISTS `category` (
  `category_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`category_id`, `category_name`) VALUES
(1, 'Social Events'),
(2, 'Experiment'),
(3, 'Conferences & Seminars'),
(4, 'Fair & Exhibitions'),
(5, 'Arts & Entertainment'),
(6, 'Lectures & Workshops'),
(7, 'Health & Wellness');

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

DROP TABLE IF EXISTS `event`;
CREATE TABLE IF NOT EXISTS `event` (
  `event_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `organizer_id` int(10) unsigned NOT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `map_id` int(10) unsigned NOT NULL,
  `short_name` varchar(100) NOT NULL DEFAULT '',
  `event_name` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `location` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `start_dt` datetime DEFAULT NULL,
  `end_dt` datetime DEFAULT NULL,
  `participation_fee` float DEFAULT NULL,
  `renumeration` float DEFAULT NULL,
  `repeated_info` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `elegibility` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `registration_start_dt` datetime DEFAULT NULL,
  `registration_end_dt` datetime DEFAULT NULL,
  `speaker_name` varchar(220) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `speaker_profile` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `description` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `info_url` varchar(200) NOT NULL DEFAULT '',
  `tags` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  PRIMARY KEY (`event_id`),
  KEY `organizer_id` (`organizer_id`),
  KEY `category_id` (`category_id`),
  KEY `map_id` (`map_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `event`
--

INSERT INTO `event` (`event_id`, `organizer_id`, `category_id`, `map_id`, `short_name`, `event_name`, `location`, `start_dt`, `end_dt`, `participation_fee`, `renumeration`, `repeated_info`, `elegibility`, `registration_start_dt`, `registration_end_dt`, `speaker_name`, `speaker_profile`, `description`, `info_url`, `tags`) VALUES
(1, 1, 1, 2, 'Managing Interpersonal Communication', 'Managing Interpersonal Communication', 'COM1', '2013-06-28 10:33:19', '2013-06-28 18:41:35', 100, 100, NULL, 'Testing', '2013-06-26 11:14:00', '2013-06-27 12:24:29', 'Professor Test', 'Test Professor', 'Learning Objectives (key skill-set covered by workshops)<br>\r\n\r\nListening: decode non-verbal message & identify group functions\r\nSpeaking: interaction (1) to improve content learning<br>\r\n\r\nSynopsis <br>\r\n\r\n2013 Oracy Suite focuses on interaction as a primary means of learning via collaboration. Through meaningful interactions, students will learn to decode and respond to content with higher efficiency and a greater sense of immediacy. Build on their experience of giving formal and informal presentations, the five workshops will engage participants in interactive situations such as case studies, panel discussions, and peer instruction for more formal, structured, yet flexible ways to communicate.', '', 'hello,world,testing'),
(2, 1, 1, 1, '', 'Rise of the Guardians', 'dasda', '2013-07-01 00:00:00', '2013-07-10 00:00:00', NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, 'Rise of the Guardians is an epic adventure that tells the story of a group of heroes - each with extraordinary abilities. When an evil spirit known as Pitch lays down the Gauntlet to take over the world, the immortal Guardians must join forces for the first time to protect the hopes, beliefs and imagination of children all over the world.', '', NULL),
(3, 1, 1, 3, 'Chinas Tibetan Problem', ' Chinas Tibetan Problem with South Asia', NULL, '2013-07-01 00:00:00', '2013-07-10 00:00:00', NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, 'Speaker: Dr Chung Chien-peng (Visiting Senior Research Fellow, East Asian Institute, NUS; Associate Professor, Department of Political Science, Lingnan University, Hong Kong)<br>\r\n\r\nAbstract: The 2008 riots in Tibetan-populated areas of China and the subsequent incidents of self-immolation have spotlighted the discontent of Tibetans, response of Chinese security forces, and shortcomings in China''s policies toward its ethnic minorities. These acts of defiance have received expressions of sympathy from Tibetan refugees in India and other parts of South Asia. China''s policy toward Tibet and Tibetans is influenced by firstly the activities, statements and politics of Tibetan émigré spiritual leaders such as the Dalai Lama and the Karmapa and organizations like the Tibetan Government-in-Exile and Tibetan Youth Congress in India; secondly, the actions taken by the governments of India, Bhutan and Nepal in assisting and monitoring their resident Tibetan communities vis-à-vis their relations with Beijing; and thirdly, the financial support from US government and non-governmental organizations for maintaining Tibetan settlements in South Asia. China''s interactions with South Asian countries over their Tibetan refugees would be analyzed in this seminar.\r\n', '', NULL),
(4, 1, 1, 4, '', 'regOne', NULL, '2013-07-01 00:00:00', '2013-07-03 00:00:00', NULL, NULL, 'mon,1,09:30:00,11:30:00', NULL, NULL, NULL, 'Professor Lau Siu-kai (Emeritus Professor of Sociology, The Chinese University of Hong Kong; Former Head, Central Policy Unit, Hong Kong Special Administrative Region Government)', NULL, 'A significant political change in Hong Kong since the handover is the transformation of Hong Kong''s middle-class from a social group characterized by self-confidence and complacency into a group stricken by anxiety and discontent. Hong Kong''s political confusion and difficulty of governance have a lot to do with this development. This change is related to changes in Hong Kong''s society, economy and politics in the last several decades. The changes in the political mentality and behavior of the middle class have brought about middle-class radicalism, "poisoned" Hong Kong''s political atmosphere, deepened the conflict between the government and the people, as well as aggravated social and political friction. Nevertheless, as the middle class still has vested interests in the existing institutional arrangements, it has no intention of launching a "war" against other social classes or to drastically change the status quo. Consequently, middle-class instability is not likely to result in political turmoil in post-handover Hong Kong.', '', NULL),
(5, 1, 1, 5, '', 'regTwo', NULL, '2013-07-01 00:00:00', '2013-07-10 00:00:00', NULL, NULL, 'wed,2,16:45:00,19:30:00,2013-06-12', NULL, NULL, NULL, '', NULL, 'Now in its seventh edition, the Annual Risk Management Conference organized by the Risk Management Institute (RMI) at the National University of Singapore (NUS) has grown into the region''s foremost annual forum of decision makers and senior risk professionals in the financial services industry. The theme of this year''s conference is "Risk Management in the New Normal." As banking regulators and supervisory authorities discuss and implement policies in reaction to the financial crisis, the financial industry in general and financial risk management in specific must adjust their modes of operation. With increased capital requirements along with an effectively zero interest rate environment, financial institutions are challenged to operate in a more restricted business environment. \r\n<br>\r\nThese issues will be at the forefront during the conference, with panel discussions around regulatory issues, investment and risk management in emerging markets, and other pressing issues faced by the financial industry. As it has been since 2009, the conference is organized in collaboration with the International Association of Credit Portfolio Managers (IACPM). Their sessions include the first look at their Benchmarking Results of the 2013 IACPM and McKinsey & Company Survey on Credit and Portfolio Risk Management.', '', NULL),
(7, 1, 2, 7, 'regThree', 'regThree', 'PGP', '2013-06-26 00:00:00', '2013-07-18 00:00:00', NULL, NULL, 'thu,2,16:45:00,19:30:00,2013-06-13;tue,1,08:45:00,10:30:00', NULL, NULL, NULL, NULL, NULL, 'The Main Objective of this CPR + AED Familiarization Programme is to proliferate and familiarize NUS community (both staff and students) with the knowledge and skills in CPR & AED so as to enable them to act in an emergency situation to save lives', '', NULL),
(8, 1, 1, 3, 'Testing 345', 'Testing 345', NULL, '2013-07-01 00:00:00', '2013-07-10 00:00:00', NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, 'Speaker: Testing here 345\r\n\r\nAbstract: The 2008 riots in Tibetan-populated areas of China and the subsequent incidents of self-immolation have spotlighted the discontent of Tibetans, response of Chinese security forces, and shortcomings in China''s policies toward its ethnic minorities. These acts of defiance have received expressions of sympathy from Tibetan refugees in India and other parts of South Asia. China''s policy toward Tibet and Tibetans is influenced by firstly the activities, statements and politics of Tibetan émigré spiritual leaders such as the Dalai Lama and the Karmapa and organizations like the Tibetan Government-in-Exile and Tibetan Youth Congress in India; secondly, the actions taken by the governments of India, Bhutan and Nepal in assisting and monitoring their resident Tibetan communities vis-à-vis their relations with Beijing; and thirdly, the financial support from US government and non-governmental organizations for maintaining Tibetan settlements in South Asia. China''s interactions with South Asian countries over their Tibetan refugees would be analyzed in this seminar.\r\n', '', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `map_location`
--

DROP TABLE IF EXISTS `map_location`;
CREATE TABLE IF NOT EXISTS `map_location` (
  `map_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `map_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT '',
  `x_coord` int(11) NOT NULL,
  `y_coord` int(11) NOT NULL,
  `parent_map_id` int(11) DEFAULT '0',
  PRIMARY KEY (`map_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `map_location`
--

INSERT INTO `map_location` (`map_id`, `map_name`, `x_coord`, `y_coord`, `parent_map_id`) VALUES
(1, 'S5', 2330, 2520, 0),
(2, 'S6', 2440, 2570, 0),
(3, 'S1', 1950, 2570, 5),
(4, 'S2', 2000, 2620, 5),
(5, 'FoS', 1900, 2600, 0),
(6, 'NUS Main Building', 2900, 2380, 0),
(7, 'PGP', 2900, 3300, 0);

-- --------------------------------------------------------

--
-- Table structure for table `oauth`
--

DROP TABLE IF EXISTS `oauth`;
CREATE TABLE IF NOT EXISTS `oauth` (
  `user_id` int(11) NOT NULL,
  `host` varchar(10) NOT NULL,
  `host_id` varchar(150) NOT NULL,
  PRIMARY KEY (`host`,`host_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `oauth`
--

INSERT INTO `oauth` (`user_id`, `host`, `host_id`) VALUES
(1, 'gmail', 'nhudinhtuan@gmail.com'),
(2, 'yahoo', 'nhudinhtuan1990@yahoo.com'),
(3, 'fb', '1401143295'),
(4, 'fb', '1450872666'),
(5, 'gmail', 'truongduy134@gmail.com'),
(6, 'fb', '1783995089');

-- --------------------------------------------------------

--
-- Table structure for table `organizer`
--

DROP TABLE IF EXISTS `organizer`;
CREATE TABLE IF NOT EXISTS `organizer` (
  `organizer_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `organizer_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `contact` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  PRIMARY KEY (`organizer_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `organizer`
--

INSERT INTO `organizer` (`organizer_id`, `organizer_name`, `contact`) VALUES
(1, 'Org1', 'example');

-- --------------------------------------------------------

--
-- Table structure for table `reminder`
--

DROP TABLE IF EXISTS `reminder`;
CREATE TABLE IF NOT EXISTS `reminder` (
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `remind_before` int(11) NOT NULL,
  `type` varchar(1) NOT NULL,
  PRIMARY KEY (`user_id`,`event_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET latin1 NOT NULL,
  `phone` varchar(30) CHARACTER SET latin1 NOT NULL,
  `prefer` text COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=7 ;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `phone`, `prefer`) VALUES
(1, 'nhudinhtuan@gmail.com', 'nhudinhtuan@gmail.com', '', ''),
(2, 'Tuan Nhu Dinh', 'nhudinhtuan1990@yahoo.com', '', ''),
(3, 'Tuan Dinh Nhu', 'nhudinhtuan@gmail.com', '', ''),
(4, 'Trung Hieu Nguyen', 'trunghieu.ngn@gmail.com', '', ''),
(5, 'truongduy134@gmail.com', 'truongduy134@gmail.com', '', ''),
(6, 'NguyenTruong Duy', 'truongduy134@yahoo.com', '', '');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
