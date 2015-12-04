-- phpMyAdmin SQL Dump
-- version 4.1.12
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Dec 04, 2015 at 02:17 AM
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
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `name` varchar(100) NOT NULL,
  `lastname` int(100) NOT NULL,
  `gender` char(1) NOT NULL,
  `dob` date NOT NULL,
  `email` varchar(50) NOT NULL,
  `occupation` varchar(50) NOT NULL,
  `profile_pic` varchar(100) NOT NULL,
  `password_hash` varchar(256) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`name`, `lastname`, `gender`, `dob`, `email`, `occupation`, `profile_pic`, `password_hash`) VALUES
('Donovan', 0, 'f', '2015-12-09', 'menydo@yahoo.com', 'Velit odit voluptatem itaque minima', 'none', '$2a$10$L2rzGn5DkZIPoP/Mx4bOyOTDoLfj6tIuNpyokOY6RScnLtp.F.daO');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
