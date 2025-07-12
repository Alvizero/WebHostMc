CREATE DATABASE IF NOT EXISTS `webhostmc` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `webhostmc`;

CREATE TABLE IF NOT EXISTS `durate_noleggio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `mesi` int(11) NOT NULL,
  `prezzo_sconto` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `server` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `proprietario_email` varchar(255) NOT NULL,
  `data_acquisto` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_scadenza` timestamp NULL DEFAULT NULL,
  `n_rinnovi` int(11) DEFAULT 0,
  `stato` enum('disponibile','scaduto','sospeso') DEFAULT 'disponibile',
  `pterodactyl_id` varchar(255) DEFAULT NULL,
  `identifier` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_server_proprietario` (`proprietario_email`),
  KEY `idx_server_stato` (`stato`),
  KEY `idx_server_scadenza` (`data_scadenza`),
  CONSTRAINT `server_ibfk_2` FOREIGN KEY (`proprietario_email`) REFERENCES `utenti` (`email`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `tipi_server` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `cpu_cores` int(11) NOT NULL,
  `ram_gb` int(11) NOT NULL,
  `storage_gb` int(11) NOT NULL,
  `prezzo_mensile` decimal(10,2) NOT NULL,
  `popular` tinyint(1) NOT NULL DEFAULT 0,
  `icon` varchar(50) NOT NULL DEFAULT 'server',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `utenti` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `cognome` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `ruolo` enum('admin','user') DEFAULT 'user',
  `data_registrazione` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `versioni_server` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `ultima_versione` tinyint(1) DEFAULT 0,
  `popolare` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `versioni_server_egg` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `descrizione` varchar(255) NOT NULL,
  `icona` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;