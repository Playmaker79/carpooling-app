-- phpMyAdmin SQL Dump
-- version 4.1.12
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Dec 06, 2015 at 03:40 AM
-- Server version: 5.6.16
-- PHP Version: 5.5.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `carpooling`
--

-- --------------------------------------------------------

--
-- Table structure for table `rides`
--

CREATE TABLE IF NOT EXISTS `rides` (
  `ride_id` int(11) NOT NULL AUTO_INCREMENT,
  `source` varchar(1000) NOT NULL,
  `destination` varchar(1000) NOT NULL,
  `waypoints` varchar(100) NOT NULL,
  `travel_date` date NOT NULL,
  `travel_time` date NOT NULL,
  `purpose` varchar(1000) NOT NULL,
  `return_date` date NOT NULL,
  `return_time` date NOT NULL,
  `car_name` varchar(20) NOT NULL,
  `car_photo` varchar(100) NOT NULL,
  `drinking` char(1) NOT NULL,
  `smoking` char(1) NOT NULL,
  `music` char(1) NOT NULL,
  `passenger` char(1) NOT NULL,
  `rider_id` int(100) NOT NULL,
  `rate` int(20) NOT NULL,
  `phone` int(20) NOT NULL,
  PRIMARY KEY (`ride_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
