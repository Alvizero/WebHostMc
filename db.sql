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
  `data_acquisto` datetime DEFAULT NULL,
  `data_scadenza` datetime DEFAULT NULL,
  `n_rinnovi` int(11) DEFAULT 0,
  `stato` enum('disponibile','scaduto','sospeso') DEFAULT 'disponibile',
  `pterodactyl_id` varchar(255) DEFAULT NULL,
  `uuidShort` varchar(255) DEFAULT NULL,
  `esecuzione` enum('online','offline') DEFAULT 'online',
  PRIMARY KEY (`id`),
  KEY `idx_server_proprietario` (`proprietario_email`),
  KEY `idx_server_stato` (`stato`),
  KEY `idx_server_scadenza` (`data_scadenza`),
  CONSTRAINT `server_ibfk_2` FOREIGN KEY (`proprietario_email`) REFERENCES `utenti` (`email`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dump dei dati della tabella webhostmc.server: ~3 rows (circa)
INSERT INTO `server` (`id`, `nome`, `tipo`, `proprietario_email`, `data_acquisto`, `data_scadenza`, `n_rinnovi`, `stato`, `pterodactyl_id`, `uuidShort`, `esecuzione`) VALUES
	(1, 'alvise servers', 'Server Base', 'alvisesacconato02@gmail.com', '2025-07-14 00:00:00', '2025-08-14 00:00:00', 0, 'disponibile', '1', NULL, 'online'),
	(2, 'test', 'Server Base', 'alvisesacconato02@gmail.com', '2025-07-14 00:00:00', '2099-12-12 00:00:00', 0, 'disponibile', '2', NULL, 'online'),
	(3, 'asas', 'Server Medio', 'alvisesacconato02@gmail.com', '2025-07-13 22:00:00', '2099-12-11 23:00:00', 0, 'disponibile', '3', '6a4ba6a7', 'online');

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
	(1, 'Alvise', 'Sacconato', 'alvise', 'alvisesacconato02@gmail.com', '$2b$10$ns8ETTnrj63XdIPhCIr61OP1jEXFexNWQD48pcgGRJpGAFsrqE2Ua', 'admin', '2025-07-10 08:47:12'),
	(2, 'Paolo', 'Sacconato', 'paolino', 'paolo@paolo.it', '$2b$10$ns8ETTnrj63XdIPhCIr61OP1jEXFexNWQD48pcgGRJpGAFsrqE2Ua', 'admin', '2025-07-10 08:47:12');

-- Dump della struttura di tabella webhostmc.versioni_server
CREATE TABLE IF NOT EXISTS `versioni_server` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `ultima_versione` tinyint(1) DEFAULT 0,
  `popolare` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dump dei dati della tabella webhostmc.versioni_server: ~0 rows (circa)

-- Dump della struttura di tabella webhostmc.versioni_server2
CREATE TABLE IF NOT EXISTS `versioni_server2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_id` int(11) NOT NULL,
  `versione` varchar(20) NOT NULL,
  `ultima_versione` tinyint(1) DEFAULT 0,
  `popolare` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `tipo_id` (`tipo_id`),
  CONSTRAINT `versioni_server2_ibfk_1` FOREIGN KEY (`tipo_id`) REFERENCES `versioni_server_egg` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dump dei dati della tabella webhostmc.versioni_server2: ~24 rows (circa)
INSERT INTO `versioni_server2` (`id`, `tipo_id`, `versione`, `ultima_versione`, `popolare`) VALUES
	(1, 1, '1.21.7', 1, 0),
	(2, 1, '1.21.6', 0, 0),
	(3, 1, '1.21.5', 0, 0),
	(4, 1, '1.21.4', 0, 1),
	(5, 2, '1.21.7', 1, 0),
	(6, 2, '1.21.6', 0, 0),
	(7, 2, '1.21.5', 0, 0),
	(8, 2, '1.21.4', 0, 0),
	(9, 3, '1.21.7', 1, 0),
	(10, 3, '1.21.6', 0, 0),
	(11, 3, '1.21.5', 0, 0),
	(12, 3, '1.21.4', 0, 0),
	(13, 4, '1.21.5', 1, 0),
	(14, 4, '1.21.4', 0, 0),
	(15, 4, '1.21.3', 0, 0),
	(16, 4, '1.21.2', 0, 0),
	(17, 5, '1.21.7', 1, 0),
	(18, 5, '1.21.6', 0, 0),
	(19, 5, '1.21.5', 0, 0),
	(20, 5, '1.21.4', 0, 0),
	(21, 6, '1.21.5', 1, 0),
	(22, 6, '1.21.4', 0, 0),
	(23, 6, '1.21.3', 0, 0),
	(24, 6, '1.21.1', 0, 0);

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
