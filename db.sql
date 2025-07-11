-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versione server:              10.4.32-MariaDB - mariadb.org binary distribution
-- S.O. server:                  Win64
-- HeidiSQL Versione:            12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dump della struttura del database webhostmc
CREATE DATABASE IF NOT EXISTS `webhostmc` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `webhostmc`;

-- Dump della struttura di tabella webhostmc.durate_noleggio
CREATE TABLE IF NOT EXISTS `durate_noleggio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `mesi` int(11) NOT NULL,
  `prezzo_sconto` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dump dei dati della tabella webhostmc.durate_noleggio: ~5 rows (circa)
INSERT INTO `durate_noleggio` (`id`, `nome`, `mesi`, `prezzo_sconto`) VALUES
	(1, '1 mese', 1, 0.00),
	(2, '2 mesi', 2, 4.00),
	(3, '3 mesi', 3, 7.00),
	(4, '6 mesi', 6, 12.00),
	(5, '12 mesi', 12, 18.00);

-- Dump della struttura di tabella webhostmc.server
CREATE TABLE IF NOT EXISTS `server` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `proprietario_email` varchar(255) NOT NULL,
  `data_acquisto` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_scadenza` timestamp NULL DEFAULT NULL,
  `n_rinnovi` int(11) DEFAULT 0,
  `stato` enum('disponibile','scaduto') DEFAULT 'disponibile',
  `pterodactyl_id` varchar(255) DEFAULT NULL,
  `identifier` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_server_proprietario` (`proprietario_email`),
  KEY `idx_server_stato` (`stato`),
  KEY `idx_server_scadenza` (`data_scadenza`),
  CONSTRAINT `server_ibfk_2` FOREIGN KEY (`proprietario_email`) REFERENCES `utenti` (`email`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dump dei dati della tabella webhostmc.server: ~2 rows (circa)
INSERT INTO `server` (`id`, `nome`, `tipo`, `proprietario_email`, `data_acquisto`, `data_scadenza`, `n_rinnovi`, `stato`, `pterodactyl_id`, `identifier`) VALUES
	(1, 'Mc\'S Server Alvise', 'Server Base', 'alvisesacconato02@gmail.com', '2025-08-11 17:07:09', '2025-07-11 17:07:10', 1, 'disponibile', '1', 'eefcd533'),
	(2, 'Prova', 'Server Medio', 'alvisesacconato02@gmail.com', '2025-07-11 20:12:28', '2026-07-11 20:12:31', 100, 'disponibile', NULL, NULL);

-- Dump della struttura di tabella webhostmc.tipi_server
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

-- Dump dei dati della tabella webhostmc.tipi_server: ~7 rows (circa)
INSERT INTO `tipi_server` (`id`, `nome`, `cpu_cores`, `ram_gb`, `storage_gb`, `prezzo_mensile`, `popular`, `icon`) VALUES
	(1, 'Server Base', 2, 4, 15, 7.20, 0, 'server'),
	(2, 'Server Medio', 4, 6, 35, 10.80, 1, 'zap'),
	(3, 'Server Pro', 4, 8, 50, 14.40, 0, 'shield'),
	(4, 'Modpack Base', 4, 12, 60, 14.40, 0, 'cpu'),
	(5, 'Modpack Medio', 4, 14, 80, 25.20, 0, 'package'),
	(6, 'Modpack Pro', 4, 16, 100, 28.80, 0, 'rocket');

-- Dump della struttura di tabella webhostmc.utenti
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

-- Dump dei dati della tabella webhostmc.utenti: ~1 rows (circa)
INSERT INTO `utenti` (`id`, `nome`, `cognome`, `username`, `email`, `password_hash`, `ruolo`, `data_registrazione`) VALUES
	(1, 'Alvise', 'Sacconato', 'alvise', 'alvisesacconato02@gmail.com', '$2b$10$ns8ETTnrj63XdIPhCIr61OP1jEXFexNWQD48pcgGRJpGAFsrqE2Ua', 'admin', '2025-07-10 08:47:12');

-- Dump della struttura di tabella webhostmc.versioni_server
CREATE TABLE IF NOT EXISTS `versioni_server` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `ultima_versione` tinyint(1) DEFAULT 0,
  `popolare` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dump dei dati della tabella webhostmc.versioni_server: ~24 rows (circa)
INSERT INTO `versioni_server` (`id`, `nome`, `tipo`, `ultima_versione`, `popolare`) VALUES
	(1, 'Vanilla 1.21.7', 'Vanilla', 1, 0),
	(2, 'Vanilla 1.21.6', 'Vanilla', 0, 0),
	(3, 'Vanilla 1.21.5', 'Vanilla', 0, 0),
	(4, 'Vanilla 1.21.4', 'Vanilla', 0, 1),
	(5, 'Forge 1.21.7', 'Forge', 1, 0),
	(6, 'Forge 1.21.6', 'Forge', 0, 0),
	(7, 'Forge 1.21.5', 'Forge', 0, 0),
	(8, 'Forge 1.21.4', 'Forge', 0, 0),
	(9, 'Fabric 1.21.7', 'Fabric', 1, 0),
	(10, 'Fabric 1.21.6', 'Fabric', 0, 0),
	(11, 'Fabric 1.21.5', 'Fabric', 0, 0),
	(12, 'Fabric 1.21.4', 'Fabric', 0, 0),
	(13, 'Spigot 1.21.5', 'Spigot', 1, 0),
	(14, 'Spigot 1.21.4', 'Spigot', 0, 0),
	(15, 'Spigot 1.21.3', 'Spigot', 0, 0),
	(16, 'Spigot 1.21.2', 'Spigot', 0, 0),
	(17, 'Paper 1.21.7', 'Paper', 1, 0),
	(18, 'Paper 1.21.6', 'Paper', 0, 0),
	(19, 'Paper 1.21.5', 'Paper', 0, 0),
	(20, 'Paper 1.21.4', 'Paper', 0, 0),
	(21, 'Bukkit 1.21.5', 'Bukkit', 1, 0),
	(22, 'Bukkit 1.21.4', 'Bukkit', 0, 0),
	(23, 'Bukkit 1.21.3', 'Bukkit', 0, 0),
	(24, 'Bukkit 1.21.1', 'Bukkit', 0, 0);

-- Dump della struttura di tabella webhostmc.versioni_server_egg
CREATE TABLE IF NOT EXISTS `versioni_server_egg` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `descrizione` varchar(255) NOT NULL,
  `icona` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dump dei dati della tabella webhostmc.versioni_server_egg: ~6 rows (circa)
INSERT INTO `versioni_server_egg` (`id`, `nome`, `descrizione`, `icona`) VALUES
	(1, 'Vanilla', 'Minecraft originale senza modifiche', '🎮'),
	(2, 'Forge', 'Supporto completo per le mod', '🔨'),
	(3, 'Fabric', 'Mod leggere e performance ottimizzate', '🧵'),
	(4, 'Spigot', 'Supporto completo per i plugins', '🌟'),
	(5, 'Paper', 'Fork di Spigot ottimizzato', '📄'),
	(6, 'Bukkit', 'Plugins classici', '🪣');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
