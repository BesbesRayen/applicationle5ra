-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 07 mai 2026 à 18:25
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `creaditn`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `message` varchar(2500) NOT NULL,
  `order_id` bigint(20) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `title` varchar(180) NOT NULL,
  `transaction_id` varchar(70) DEFAULT NULL,
  `type` enum('INVOICE_GENERATED','NEW_CREDIT_PURCHASE') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `created_at`, `message`, `order_id`, `is_read`, `title`, `transaction_id`, `type`, `updated_at`) VALUES
(1, '2026-05-05 11:44:04.000000', 'Client rayen Besbes purchased Zara Oversized Blazer on credit. Transaction: ORD-875424DE-A, installments: 3.', 1, b'0', 'New credit purchase', 'ORD-875424DE-A', 'NEW_CREDIT_PURCHASE', '2026-05-05 11:44:04.000000'),
(2, '2026-05-05 11:44:04.000000', 'Invoice FAC-20260505-A1BB5B generated for transaction ORD-875424DE-A', 1, b'0', 'Invoice generated', 'ORD-875424DE-A', 'INVOICE_GENERATED', '2026-05-05 11:44:04.000000'),
(3, '2026-05-05 11:45:40.000000', 'Client rayen Besbes purchased Bershka Cargo Pants on credit. Transaction: ORD-C58AD6D4-7, installments: 3.', 2, b'0', 'New credit purchase', 'ORD-C58AD6D4-7', 'NEW_CREDIT_PURCHASE', '2026-05-05 11:45:40.000000'),
(4, '2026-05-05 11:45:40.000000', 'Invoice FAC-20260505-F2BE22 generated for transaction ORD-C58AD6D4-7', 2, b'0', 'Invoice generated', 'ORD-C58AD6D4-7', 'INVOICE_GENERATED', '2026-05-05 11:45:40.000000'),
(5, '2026-05-05 14:05:07.000000', 'Client raslen Besbes purchased Decathlon Running Shoes on credit. Transaction: ORD-3FDEB307-3, installments: 6.', 3, b'0', 'New credit purchase', 'ORD-3FDEB307-3', 'NEW_CREDIT_PURCHASE', '2026-05-05 14:05:07.000000'),
(6, '2026-05-05 14:05:07.000000', 'Invoice FAC-20260505-979EE6 generated for transaction ORD-3FDEB307-3', 3, b'0', 'Invoice generated', 'ORD-3FDEB307-3', 'INVOICE_GENERATED', '2026-05-05 14:05:07.000000'),
(7, '2026-05-07 11:42:58.000000', 'Client rayen Besbes purchased Zara Structured Trousers on credit. Transaction: ORD-172DA6C0-5, installments: 6.', 4, b'1', 'New credit purchase', 'ORD-172DA6C0-5', 'NEW_CREDIT_PURCHASE', '2026-05-07 11:43:08.000000'),
(8, '2026-05-07 11:42:58.000000', 'Invoice FAC-20260507-B5B17F generated for transaction ORD-172DA6C0-5', 4, b'0', 'Invoice generated', 'ORD-172DA6C0-5', 'INVOICE_GENERATED', '2026-05-07 11:42:58.000000'),
(9, '2026-05-07 11:47:07.000000', 'Client rayen Besbes purchased last on credit. Transaction: ORD-6AC895AB-C, installments: 3.', 5, b'0', 'New credit purchase', 'ORD-6AC895AB-C', 'NEW_CREDIT_PURCHASE', '2026-05-07 11:47:07.000000'),
(10, '2026-05-07 11:47:07.000000', 'Invoice FAC-20260507-0E3F4F generated for transaction ORD-6AC895AB-C', 5, b'0', 'Invoice generated', 'ORD-6AC895AB-C', 'INVOICE_GENERATED', '2026-05-07 11:47:07.000000'),
(11, '2026-05-07 13:43:24.000000', 'Client nasrou Nasrou purchased H&M Cotton Shirt on credit. Transaction: ORD-9FAE0466-5, installments: 6.', 6, b'0', 'New credit purchase', 'ORD-9FAE0466-5', 'NEW_CREDIT_PURCHASE', '2026-05-07 13:43:24.000000'),
(12, '2026-05-07 13:43:24.000000', 'Invoice FAC-20260507-728B15 generated for transaction ORD-9FAE0466-5', 6, b'0', 'Invoice generated', 'ORD-9FAE0466-5', 'INVOICE_GENERATED', '2026-05-07 13:43:24.000000');

-- --------------------------------------------------------

--
-- Structure de la table `articles`
--

CREATE TABLE `articles` (
  `id` bigint(20) NOT NULL,
  `active` bit(1) NOT NULL,
  `boutique_name` varchar(160) NOT NULL,
  `category` varchar(100) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(2000) NOT NULL,
  `image_url` varchar(600) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `product_name` varchar(160) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `articles`
--

INSERT INTO `articles` (`id`, `active`, `boutique_name`, `category`, `created_at`, `description`, `image_url`, `price`, `product_name`, `updated_at`) VALUES
(1, b'1', 'Zara', 'PARTNER_CATALOG', '2026-05-05 11:44:04.000000', 'Mobile catalog purchase: Zara Oversized Blazer', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900', 259.00, 'Zara Oversized Blazer', '2026-05-05 11:44:04.000000'),
(2, b'1', 'Bershka', 'PARTNER_CATALOG', '2026-05-05 11:45:40.000000', 'Mobile catalog purchase: Bershka Cargo Pants', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900', 139.00, 'Bershka Cargo Pants', '2026-05-05 11:45:40.000000'),
(3, b'1', 'Decathlon', 'PARTNER_CATALOG', '2026-05-05 14:05:07.000000', 'Mobile catalog purchase: Decathlon Running Shoes', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900', 199.00, 'Decathlon Running Shoes', '2026-05-05 14:05:07.000000'),
(4, b'1', 'Zara', 'PARTNER_CATALOG', '2026-05-07 11:42:55.000000', 'Mobile catalog purchase: Zara Structured Trousers', 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=900', 169.00, 'Zara Structured Trousers', '2026-05-07 11:42:55.000000'),
(5, b'0', 'nn', 'jj', '2026-05-07 11:46:45.000000', 'expensive', '/api/files/articles/e9667da9-7f90-41e5-ae6d-0d16ce63f0a5.png', 50.00, 'last', '2026-05-07 13:42:52.000000'),
(6, b'1', 'H&M', 'PARTNER_CATALOG', '2026-05-07 13:43:22.000000', 'Mobile catalog purchase: H&M Cotton Shirt', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900', 119.00, 'H&M Cotton Shirt', '2026-05-07 13:43:22.000000'),
(7, b'1', 'zara', 'shirt', '2026-05-07 13:47:19.000000', 'bb', 'https://www.zara.com/tn/fr/veste-a-rayures-100-lin-p02775647.html?v1=526754153&v2=2546081', 40.00, 't shirt', '2026-05-07 13:47:19.000000'),
(8, b'1', 'Zara', 'b', '2026-05-07 14:32:43.000000', 'cc', '/api/files/articles/922daea2-0a74-4f29-a10c-9f0ee7f98367.jpg', 499.98, 'trikou', '2026-05-07 14:32:43.000000'),
(9, b'1', 'Zara', ',,', '2026-05-07 14:44:42.000000', 'yg', '/api/files/articles/6d27c6d3-8c40-4b9a-af1f-571357037323.jpg', 25.00, 'hh', '2026-05-07 14:44:42.000000'),
(10, b'1', 'Zara', 'n', '2026-05-07 15:24:30.000000', 'j', '/api/files/articles/11ded06e-b7c9-458d-bad8-d2526c10a6b7.jpg', 78.00, 'njjj', '2026-05-07 15:32:02.000000'),
(11, b'1', 'Zara', 'nj', '2026-05-07 15:50:16.000000', 'Veste A Rayures 100 Lin — Zara', '/api/files/articles/0a146aa9-57f5-4834-bb8b-f307cdc4a167.jpg', 25.00, 'Veste A Rayures 100 Lin', '2026-05-07 15:50:16.000000'),
(12, b'1', 'nn', 'n', '2026-05-07 16:02:12.000000', 'n', '/api/files/articles/ac502272-37f3-459b-99c6-561f93c63eb4.jpg', 4.00, 'b', '2026-05-07 16:02:12.000000');

-- --------------------------------------------------------

--
-- Structure de la table `cards`
--

CREATE TABLE `cards` (
  `id` bigint(20) NOT NULL,
  `card_number` varchar(1024) NOT NULL,
  `cardholder_name` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expiry_date` varchar(5) NOT NULL,
  `is_default` bit(1) NOT NULL,
  `last4` varchar(4) DEFAULT NULL,
  `status` enum('ACTIVE','BLOCKED') NOT NULL,
  `type` enum('MASTERCARD','VISA') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cards`
--

INSERT INTO `cards` (`id`, `card_number`, `cardholder_name`, `created_at`, `expiry_date`, `is_default`, `last4`, `status`, `type`, `updated_at`, `user_id`) VALUES
(7, 'hTf1LLzDWcuTv24beX/lwhK1sPxUczjim5xKge/D5K9oDh7N5sehD5j1NNI=', 'RAYENBESBES', '2026-05-07 11:33:19.000000', '02/26', b'1', '8151', 'ACTIVE', 'VISA', '2026-05-07 11:33:19.000000', 11),
(8, 'MyV04igB0E8k16El24c0M03dSQRC+5jCKf5yLHIGLhHoPICASR1JkdvQJAU=', 'NASROU', '2026-05-07 13:37:25.000000', '01/26', b'1', '4848', 'ACTIVE', 'VISA', '2026-05-07 13:37:25.000000', 13);

-- --------------------------------------------------------

--
-- Structure de la table `creadi_scores`
--

CREATE TABLE `creadi_scores` (
  `id` bigint(20) NOT NULL,
  `badge` varchar(255) DEFAULT NULL,
  `behavior_score` int(11) DEFAULT NULL,
  `children_score` int(11) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `kyc_score` int(11) DEFAULT NULL,
  `level` enum('EXCELLENT','GOOD','HIGH_RISK','MEDIUM') NOT NULL,
  `marital_score` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `risk` enum('CRITICAL','HIGH','LOW','MODERATE') NOT NULL,
  `salary_score` int(11) DEFAULT NULL,
  `total_score` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `creadi_scores`
--

INSERT INTO `creadi_scores` (`id`, `badge`, `behavior_score`, `children_score`, `created_at`, `kyc_score`, `level`, `marital_score`, `reason`, `risk`, `salary_score`, `total_score`, `user_id`) VALUES
(19, NULL, 100, 100, '2026-05-07 11:32:01.000000', 0, 'HIGH_RISK', 50, 'Your score is at high risk level due to clean fraud record. Consider improving: identity not yet verified, no salary information provided.', 'CRITICAL', 0, 250, 11),
(20, NULL, 100, 100, '2026-05-07 11:34:36.000000', 0, 'HIGH_RISK', 50, 'Your score is at high risk level due to clean fraud record. Consider improving: identity not yet verified, no salary information provided.', 'CRITICAL', 0, 250, 12),
(21, 'GOLD', 200, 100, '2026-05-07 11:40:07.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 950, 11),
(22, 'GOLD', 210, 100, '2026-05-07 11:42:01.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 960, 11),
(23, 'GOLD', 220, 100, '2026-05-07 11:42:03.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 970, 11),
(24, 'GOLD', 230, 100, '2026-05-07 11:42:05.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 980, 11),
(25, NULL, 100, 100, '2026-05-07 13:33:21.000000', 0, 'HIGH_RISK', 50, 'Your score is at high risk level due to clean fraud record. Consider improving: identity not yet verified, no salary information provided.', 'CRITICAL', 0, 250, 13),
(26, 'GOLD', 200, 100, '2026-05-07 13:37:57.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 950, 13),
(27, 'GOLD', 210, 100, '2026-05-07 13:39:20.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 960, 13),
(28, 'GOLD', 220, 100, '2026-05-07 13:39:22.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 970, 13),
(29, 'GOLD', 230, 100, '2026-05-07 13:39:23.000000', 300, 'EXCELLENT', 50, 'Your score is excellent due to verified identity, stable salary, clean fraud record.', 'LOW', 300, 980, 13);

-- --------------------------------------------------------

--
-- Structure de la table `credit_requests`
--

CREATE TABLE `credit_requests` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `down_payment` decimal(38,2) NOT NULL,
  `monthly_amount` decimal(38,2) NOT NULL,
  `number_of_installments` int(11) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `status` enum('APPROVED','PENDING','REJECTED') NOT NULL,
  `total_amount` decimal(38,2) NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `credit_requests`
--

INSERT INTO `credit_requests` (`id`, `created_at`, `down_payment`, `monthly_amount`, `number_of_installments`, `product_name`, `status`, `total_amount`, `user_id`) VALUES
(4, '2026-05-07 11:41:02.000000', 20.00, 26.67, 3, NULL, 'APPROVED', 100.00, 11),
(5, '2026-05-07 11:42:55.000000', 33.80, 23.21, 6, 'Zara Structured Trousers', 'APPROVED', 169.00, 11),
(6, '2026-05-07 11:47:05.000000', 2.00, 2.67, 3, 'last', 'APPROVED', 10.00, 11),
(7, '2026-05-07 13:38:46.000000', 38.00, 50.33, 3, 'Zara Quilted Jacket', 'APPROVED', 189.00, 13),
(8, '2026-05-07 13:43:22.000000', 23.80, 16.34, 6, 'H&M Cotton Shirt', 'APPROVED', 119.00, 13);

-- --------------------------------------------------------

--
-- Structure de la table `financial_profiles`
--

CREATE TABLE `financial_profiles` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `employment_status` enum('FULL_TIME','OTHER','PART_TIME','SELF_EMPLOYED','STUDENT','UNEMPLOYED') NOT NULL,
  `monthly_salary` decimal(12,2) NOT NULL,
  `risk_level` enum('CRITICAL','HIGH','LOW','MODERATE') NOT NULL,
  `salary_day` int(11) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `financial_profiles`
--

INSERT INTO `financial_profiles` (`id`, `created_at`, `employment_status`, `monthly_salary`, `risk_level`, `salary_day`, `updated_at`, `user_id`) VALUES
(5, '2026-05-07 11:33:31.000000', 'SELF_EMPLOYED', 2000.00, 'LOW', 1, '2026-05-07 11:33:31.000000', 11),
(6, '2026-05-07 13:37:38.000000', 'STUDENT', 2500.00, 'LOW', 1, '2026-05-07 13:37:38.000000', 13);

-- --------------------------------------------------------

--
-- Structure de la table `installments`
--

CREATE TABLE `installments` (
  `id` bigint(20) NOT NULL,
  `amount` decimal(38,2) NOT NULL,
  `due_date` date NOT NULL,
  `paid_date` datetime(6) DEFAULT NULL,
  `penalty` decimal(38,2) DEFAULT NULL,
  `status` enum('OVERDUE','PAID','PENDING') NOT NULL,
  `credit_request_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `installments`
--

INSERT INTO `installments` (`id`, `amount`, `due_date`, `paid_date`, `penalty`, `status`, `credit_request_id`) VALUES
(13, 26.67, '2026-06-03', '2026-05-07 11:42:01.000000', 0.00, 'PAID', 4),
(14, 26.67, '2026-07-03', '2026-05-07 11:42:03.000000', 0.00, 'PAID', 4),
(15, 26.67, '2026-08-03', '2026-05-07 11:42:05.000000', 0.00, 'PAID', 4),
(16, 23.21, '2026-06-03', NULL, 0.00, 'PENDING', 5),
(17, 23.21, '2026-07-03', NULL, 0.00, 'PENDING', 5),
(18, 23.21, '2026-08-03', NULL, 0.00, 'PENDING', 5),
(19, 23.21, '2026-09-03', NULL, 0.00, 'PENDING', 5),
(20, 23.21, '2026-10-03', NULL, 0.00, 'PENDING', 5),
(21, 23.21, '2026-11-03', NULL, 0.00, 'PENDING', 5),
(22, 2.67, '2026-06-03', NULL, 0.00, 'PENDING', 6),
(23, 2.67, '2026-07-03', NULL, 0.00, 'PENDING', 6),
(24, 2.67, '2026-08-03', NULL, 0.00, 'PENDING', 6),
(25, 50.33, '2026-06-03', '2026-05-07 13:39:20.000000', 0.00, 'PAID', 7),
(26, 50.33, '2026-07-03', '2026-05-07 13:39:22.000000', 0.00, 'PAID', 7),
(27, 50.33, '2026-08-03', '2026-05-07 13:39:23.000000', 0.00, 'PAID', 7),
(28, 16.34, '2026-06-03', NULL, 0.00, 'PENDING', 8),
(29, 16.34, '2026-07-03', NULL, 0.00, 'PENDING', 8),
(30, 16.34, '2026-08-03', NULL, 0.00, 'PENDING', 8),
(31, 16.34, '2026-09-03', NULL, 0.00, 'PENDING', 8),
(32, 16.34, '2026-10-03', NULL, 0.00, 'PENDING', 8),
(33, 16.34, '2026-11-03', NULL, 0.00, 'PENDING', 8);

-- --------------------------------------------------------

--
-- Structure de la table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint(20) NOT NULL,
  `article_name` varchar(180) NOT NULL,
  `boutique_name` varchar(180) NOT NULL,
  `client_email` varchar(180) NOT NULL,
  `client_name` varchar(180) NOT NULL,
  `client_phone` varchar(40) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `invoice_number` varchar(70) NOT NULL,
  `number_of_installments` int(11) NOT NULL,
  `payment_type` varchar(20) NOT NULL,
  `purchase_date` datetime(6) NOT NULL,
  `statement` varchar(800) NOT NULL,
  `status` enum('ISSUED') NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `transaction_id` varchar(70) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `order_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `invoices`
--

INSERT INTO `invoices` (`id`, `article_name`, `boutique_name`, `client_email`, `client_name`, `client_phone`, `created_at`, `invoice_number`, `number_of_installments`, `payment_type`, `purchase_date`, `statement`, `status`, `total_price`, `transaction_id`, `updated_at`, `order_id`, `user_id`) VALUES
(4, 'Zara Structured Trousers', 'Zara', 'besbes@gmail.com', 'rayen Besbes', '20409390', '2026-05-07 11:42:58.000000', 'FAC-20260507-B5B17F', 6, 'CREDIT', '2026-05-07 11:42:58.000000', 'The application paid the boutique; the client must reimburse the application.', 'ISSUED', 169.00, 'ORD-172DA6C0-5', '2026-05-07 11:42:58.000000', 4, 11),
(5, 'last', 'nn', 'besbes@gmail.com', 'rayen Besbes', '20409390', '2026-05-07 11:47:07.000000', 'FAC-20260507-0E3F4F', 3, 'CREDIT', '2026-05-07 11:47:07.000000', 'The application paid the boutique; the client must reimburse the application.', 'ISSUED', 10.00, 'ORD-6AC895AB-C', '2026-05-07 11:47:07.000000', 5, 11),
(6, 'H&M Cotton Shirt', 'H&M', 'nasrasamali@gmail.com', 'nasrou Nasrou', '20409390', '2026-05-07 13:43:24.000000', 'FAC-20260507-728B15', 6, 'CREDIT', '2026-05-07 13:43:24.000000', 'The application paid the boutique; the client must reimburse the application.', 'ISSUED', 119.00, 'ORD-9FAE0466-5', '2026-05-07 13:43:24.000000', 6, 13);

-- --------------------------------------------------------

--
-- Structure de la table `kyc_documents`
--

CREATE TABLE `kyc_documents` (
  `id` bigint(20) NOT NULL,
  `admin_comment` varchar(255) DEFAULT NULL,
  `cin_back_url` varchar(255) DEFAULT NULL,
  `cin_front_url` varchar(255) DEFAULT NULL,
  `cin_number` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `face_match_score` double DEFAULT NULL,
  `ocr_result` varchar(255) DEFAULT NULL,
  `selfie_url` varchar(255) DEFAULT NULL,
  `status` enum('APPROVED','NOT_SUBMITTED','PENDING','REJECTED') NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `cin_back_hash` varchar(255) DEFAULT NULL,
  `cin_front_hash` varchar(255) DEFAULT NULL,
  `cin_number_unique` varchar(255) DEFAULT NULL,
  `didit_identity_id` varchar(255) DEFAULT NULL,
  `extracted_identity_number` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `kyc_documents`
--

INSERT INTO `kyc_documents` (`id`, `admin_comment`, `cin_back_url`, `cin_front_url`, `cin_number`, `created_at`, `face_match_score`, `ocr_result`, `selfie_url`, `status`, `user_id`, `cin_back_hash`, `cin_front_hash`, `cin_number_unique`, `didit_identity_id`, `extracted_identity_number`) VALUES
(25, 'Auto-approved by Didit AI (confidence: 85%)', '/api/files/kyc/11/cin_back.jpg', '/api/files/kyc/11/cin_front.jpg', NULL, '2026-05-07 11:32:45.000000', NULL, NULL, '/api/files/kyc/11/selfie.jpg', 'APPROVED', 11, '87cbf3802f532d27eeb5cb112d17c41c7f4d686f167884600c009cfdaf35b8ae', '94bb1fd1c13536ceec1f08a941006f42116e995e2c3e13aca23951a904bd3536', NULL, NULL, NULL),
(26, 'Auto-approved by Didit AI (confidence: 85%)', '/api/files/kyc/12/cin_back.jpg', '/api/files/kyc/12/cin_front.jpg', NULL, '2026-05-07 12:53:45.000000', NULL, NULL, '/api/files/kyc/12/selfie.jpg', 'APPROVED', 12, '94bb1fd1c13536ceec1f08a941006f42116e995e2c3e13aca23951a904bd3536', '87cbf3802f532d27eeb5cb112d17c41c7f4d686f167884600c009cfdaf35b8ae', NULL, NULL, NULL),
(27, 'Auto-approved by Didit AI (confidence: 85%)', '/api/files/kyc/13/cin_back.jpg', '/api/files/kyc/13/cin_front.jpg', NULL, '2026-05-07 13:37:02.000000', NULL, NULL, '/api/files/kyc/13/selfie.jpg', 'APPROVED', 13, '70b38faedfee4feb6293d209b67269429db2deeaf150a5f6b766c37f96e96e8a', 'ab6639ef684fb901eae2c3aa9f57ea548bacff692e958be5b956606e078d7b23', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `merchants`
--

CREATE TABLE `merchants` (
  `id` bigint(20) NOT NULL,
  `active` bit(1) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','unread','read','replied') NOT NULL DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` enum('CREDIT_APPROVED','CREDIT_REJECTED','INSTALLMENT_OVERDUE','KYC_VALIDATED','PAYMENT_CONFIRMED','PAYMENT_REMINDER') NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `created_at`, `message`, `is_read`, `title`, `type`, `user_id`) VALUES
(43, '2026-05-07 11:32:46.000000', 'Your identity has been verified successfully.', b'0', 'KYC Approved', 'KYC_VALIDATED', 11),
(44, '2026-05-07 11:33:19.000000', 'Your card **** **** **** 8151 has been linked successfully.', b'0', 'Payment method added', 'PAYMENT_CONFIRMED', 11),
(45, '2026-05-07 11:33:31.000000', 'Your salary profile is now complete. You can request credit.', b'0', 'Financial profile updated', 'CREDIT_APPROVED', 11),
(46, '2026-05-07 11:41:02.000000', 'Your credit request of 100 DT has been approved.', b'0', 'Credit Approved', 'CREDIT_APPROVED', 11),
(47, '2026-05-07 11:42:01.000000', 'Payment of 26.67 DT confirmed. Ref: TXN-609E4782', b'0', 'Payment Confirmed', 'PAYMENT_CONFIRMED', 11),
(48, '2026-05-07 11:42:03.000000', 'Payment of 26.67 DT confirmed. Ref: TXN-4B86751B', b'0', 'Payment Confirmed', 'PAYMENT_CONFIRMED', 11),
(49, '2026-05-07 11:42:05.000000', 'Payment of 26.67 DT confirmed. Ref: TXN-0593E50B', b'0', 'Payment Confirmed', 'PAYMENT_CONFIRMED', 11),
(50, '2026-05-07 11:42:55.000000', 'Your credit request of 169 DT has been approved.', b'0', 'Credit Approved', 'CREDIT_APPROVED', 11),
(51, '2026-05-07 11:42:58.000000', 'Your order for Zara Structured Trousers is active on 6 installments.', b'0', 'Credit purchase confirmed', 'CREDIT_APPROVED', 11),
(52, '2026-05-07 11:47:05.000000', 'Your credit request of 10.00 DT has been approved.', b'0', 'Credit Approved', 'CREDIT_APPROVED', 11),
(53, '2026-05-07 11:47:07.000000', 'Your order for last is active on 3 installments.', b'0', 'Credit purchase confirmed', 'CREDIT_APPROVED', 11),
(54, '2026-05-07 12:53:48.000000', 'Your identity has been verified successfully.', b'0', 'KYC Approved', 'KYC_VALIDATED', 12),
(55, '2026-05-07 13:37:04.000000', 'Your identity has been verified successfully.', b'0', 'KYC Approved', 'KYC_VALIDATED', 13),
(56, '2026-05-07 13:37:25.000000', 'Your card **** **** **** 4848 has been linked successfully.', b'0', 'Payment method added', 'PAYMENT_CONFIRMED', 13),
(57, '2026-05-07 13:37:38.000000', 'Your salary profile is now complete. You can request credit.', b'0', 'Financial profile updated', 'CREDIT_APPROVED', 13),
(58, '2026-05-07 13:38:46.000000', 'Your credit request of 189 DT has been approved.', b'0', 'Credit Approved', 'CREDIT_APPROVED', 13),
(59, '2026-05-07 13:39:20.000000', 'Payment of 50.33 DT confirmed. Ref: TXN-765829C1', b'0', 'Payment Confirmed', 'PAYMENT_CONFIRMED', 13),
(60, '2026-05-07 13:39:22.000000', 'Payment of 50.33 DT confirmed. Ref: TXN-E02F2605', b'0', 'Payment Confirmed', 'PAYMENT_CONFIRMED', 13),
(61, '2026-05-07 13:39:23.000000', 'Payment of 50.33 DT confirmed. Ref: TXN-D2367BC2', b'0', 'Payment Confirmed', 'PAYMENT_CONFIRMED', 13),
(62, '2026-05-07 13:43:22.000000', 'Your credit request of 119 DT has been approved.', b'0', 'Credit Approved', 'CREDIT_APPROVED', 13),
(63, '2026-05-07 13:43:24.000000', 'Your order for H&M Cotton Shirt is active on 6 installments.', b'0', 'Credit purchase confirmed', 'CREDIT_APPROVED', 13);

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) NOT NULL,
  `amount` decimal(38,2) NOT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `transaction_reference` varchar(255) DEFAULT NULL,
  `installment_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `amount`, `paid_at`, `payment_method`, `transaction_reference`, `installment_id`, `user_id`) VALUES
(13, 26.67, '2026-05-07 11:42:01.000000', 'CARD', 'TXN-609E4782', 13, 11),
(14, 26.67, '2026-05-07 11:42:03.000000', 'CARD', 'TXN-4B86751B', 14, 11),
(15, 26.67, '2026-05-07 11:42:05.000000', 'CARD', 'TXN-0593E50B', 15, 11),
(16, 50.33, '2026-05-07 13:39:20.000000', 'CARD', 'TXN-765829C1', 25, 13),
(17, 50.33, '2026-05-07 13:39:22.000000', 'CARD', 'TXN-E02F2605', 26, 13),
(18, 50.33, '2026-05-07 13:39:23.000000', 'CARD', 'TXN-D2367BC2', 27, 13);

-- --------------------------------------------------------

--
-- Structure de la table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` bigint(20) NOT NULL,
  `article_name` varchar(160) NOT NULL,
  `boutique_name` varchar(160) NOT NULL,
  `category` varchar(100) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `down_payment` decimal(12,2) NOT NULL,
  `financed_amount` decimal(12,2) NOT NULL,
  `installment_months` int(11) DEFAULT NULL,
  `merchant_paid` bit(1) NOT NULL,
  `merchant_paid_at` datetime(6) DEFAULT NULL,
  `merchant_payout_reference` varchar(120) DEFAULT NULL,
  `monthly_amount` decimal(12,2) DEFAULT NULL,
  `payment_type` enum('CASH','CREDIT') NOT NULL,
  `status` enum('COMPLETED','CREDIT_ACTIVE','CREDIT_REJECTED') NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `transaction_id` varchar(70) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `article_id` bigint(20) NOT NULL,
  `credit_request_id` bigint(20) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `article_name`, `boutique_name`, `category`, `created_at`, `down_payment`, `financed_amount`, `installment_months`, `merchant_paid`, `merchant_paid_at`, `merchant_payout_reference`, `monthly_amount`, `payment_type`, `status`, `total_price`, `transaction_id`, `updated_at`, `article_id`, `credit_request_id`, `user_id`) VALUES
(4, 'Zara Structured Trousers', 'Zara', 'PARTNER_CATALOG', '2026-05-07 11:42:58.000000', 33.80, 135.20, 6, b'1', '2026-05-07 11:42:58.000000', 'MRCH-0FF487C9', 23.21, 'CREDIT', 'CREDIT_ACTIVE', 169.00, 'ORD-172DA6C0-5', '2026-05-07 11:42:58.000000', 4, 5, 11),
(5, 'last', 'nn', 'jj', '2026-05-07 11:47:07.000000', 2.00, 8.00, 3, b'1', '2026-05-07 11:47:07.000000', 'MRCH-92418754', 2.67, 'CREDIT', 'CREDIT_ACTIVE', 10.00, 'ORD-6AC895AB-C', '2026-05-07 11:47:07.000000', 5, 6, 11),
(6, 'H&M Cotton Shirt', 'H&M', 'PARTNER_CATALOG', '2026-05-07 13:43:24.000000', 23.80, 95.20, 6, b'1', '2026-05-07 13:43:24.000000', 'MRCH-E82EA981', 16.34, 'CREDIT', 'CREDIT_ACTIVE', 119.00, 'ORD-9FAE0466-5', '2026-05-07 13:43:24.000000', 6, 8, 13);

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `reference` varchar(60) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `transactions`
--

INSERT INTO `transactions` (`id`, `amount`, `created_at`, `description`, `reference`, `status`, `type`, `user_id`) VALUES
(9, 26.67, '2026-05-07 11:42:01.000000', 'Installment payment', 'TXN-609E4782', 'SUCCESS', 'PAYMENT', 11),
(10, 26.67, '2026-05-07 11:42:03.000000', 'Installment payment', 'TXN-4B86751B', 'SUCCESS', 'PAYMENT', 11),
(11, 26.67, '2026-05-07 11:42:05.000000', 'Installment payment', 'TXN-0593E50B', 'SUCCESS', 'PAYMENT', 11),
(12, 135.20, '2026-05-07 11:42:58.000000', 'App paid boutique for article Zara Structured Trousers; client reimburses monthly', 'ORD-172DA6C0-5', 'SUCCESS', 'CREDIT_PURCHASE', 11),
(13, 8.00, '2026-05-07 11:47:07.000000', 'App paid boutique for article last; client reimburses monthly', 'ORD-6AC895AB-C', 'SUCCESS', 'CREDIT_PURCHASE', 11),
(14, 50.33, '2026-05-07 13:39:20.000000', 'Installment payment', 'TXN-765829C1', 'SUCCESS', 'PAYMENT', 13),
(15, 50.33, '2026-05-07 13:39:22.000000', 'Installment payment', 'TXN-E02F2605', 'SUCCESS', 'PAYMENT', 13),
(16, 50.33, '2026-05-07 13:39:23.000000', 'Installment payment', 'TXN-D2367BC2', 'SUCCESS', 'PAYMENT', 13),
(17, 95.20, '2026-05-07 13:43:24.000000', 'App paid boutique for article H&M Cotton Shirt; client reimburses monthly', 'ORD-9FAE0466-5', 'SUCCESS', 'CREDIT_PURCHASE', 13);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `autopay` bit(1) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `kyc_failed_attempts` int(11) DEFAULT NULL,
  `kyc_fraud_flag` bit(1) NOT NULL,
  `kyc_provider` varchar(255) NOT NULL,
  `kyc_status` enum('APPROVED','NOT_SUBMITTED','PENDING','REJECTED') NOT NULL,
  `kyc_submitted_at` datetime(6) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `marital_status` varchar(255) DEFAULT NULL,
  `monthly_salary` double DEFAULT NULL,
  `number_of_children` int(11) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `payment_score_modifier` int(11) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `profession` varchar(255) DEFAULT NULL,
  `profile_photo_url` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `account_deleted` bit(1) NOT NULL,
  `email_verification_attempts` int(11) DEFAULT NULL,
  `email_verification_otp` varchar(255) DEFAULT NULL,
  `email_verification_otp_expiry` datetime(6) DEFAULT NULL,
  `email_verification_sent_at` datetime(6) DEFAULT NULL,
  `email_verified` bit(1) NOT NULL,
  `email_verified_at` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `address`, `autopay`, `created_at`, `email`, `first_name`, `kyc_failed_attempts`, `kyc_fraud_flag`, `kyc_provider`, `kyc_status`, `kyc_submitted_at`, `last_name`, `marital_status`, `monthly_salary`, `number_of_children`, `password_hash`, `payment_score_modifier`, `phone`, `profession`, `profile_photo_url`, `updated_at`, `account_deleted`, `email_verification_attempts`, `email_verification_otp`, `email_verification_otp_expiry`, `email_verification_sent_at`, `email_verified`, `email_verified_at`) VALUES
(9, NULL, b'0', '2026-05-05 18:47:09.000000', 'deleted_9_1778153956897@deleted.invalid', 'Deleted', 3, b'0', 'DIDIT', 'APPROVED', '2026-05-07 10:55:41.000000', 'User', NULL, NULL, 0, '$2a$10$4x058o0EYmq6RxmnNJAyl.P13PjdSzJXaJY7YIt.d1OqEbIPhELhC', 0, NULL, NULL, NULL, '2026-05-07 11:39:16.000000', b'1', NULL, NULL, NULL, NULL, b'0', NULL),
(10, NULL, b'0', '2026-05-07 11:12:40.000000', 'deleted_10_1778153961700@deleted.invalid', 'Deleted', 0, b'0', 'DIDIT', 'APPROVED', '2026-05-07 11:14:41.000000', 'User', NULL, NULL, 0, '$2a$10$KWFjUPTp0l.dG2fFPlZCYuM4jj24lcB3m0CQuyYGF3dfPaIiV6AJ2', 0, NULL, NULL, NULL, '2026-05-07 11:39:21.000000', b'1', NULL, NULL, NULL, NULL, b'0', NULL),
(11, 'Yhd', b'0', '2026-05-07 11:32:01.000000', 'besbes@gmail.com', 'rayen', 0, b'0', 'DIDIT', 'APPROVED', '2026-05-07 11:32:50.000000', 'Besbes', NULL, 2000, 0, '$2a$10$97nxhvket4eFESqeB7/tzOyTjtwqG46a7p1VK9uRszhsYyNrXJnrG', 30, '20409390', NULL, NULL, '2026-05-07 11:44:55.000000', b'0', NULL, NULL, NULL, NULL, b'0', NULL),
(12, 'Hejs', b'0', '2026-05-07 11:34:36.000000', 'raslenbesbes929@gmail.com', 'raslen', 0, b'0', 'DIDIT', 'APPROVED', '2026-05-07 12:53:50.000000', 'Hheh', NULL, NULL, 0, '$2a$10$LEJ7kc6xHU2X5T8i9VJpdeSMxf5tgxiYHYMV68TQsxK3cJmJAsB3O', 0, '55584669', NULL, '/api/files/profiles/12/62bca7b2-fce0-49fe-8e43-36d7034e4b2c.JPG', '2026-05-07 12:56:42.000000', b'0', 0, NULL, NULL, '2026-05-07 12:22:51.000000', b'1', '2026-05-07 12:23:05.000000'),
(13, 'Hhjj', b'0', '2026-05-07 13:33:21.000000', 'nasrasamali@gmail.com', 'nasrou', 0, b'0', 'DIDIT', 'APPROVED', '2026-05-07 13:37:06.000000', 'Nasrou', NULL, 2500, 0, '$2a$10$UekMMojObCSaVMFRXo25B.T6xGUMzLpqWwW0sKpy81j5e.oXfxxcG', 30, '20409390', NULL, '/api/files/profiles/13/1c34427d-3114-43b5-b69c-9b648e62d900.JPG', '2026-05-07 13:51:53.000000', b'0', 0, NULL, NULL, '2026-05-07 13:33:21.000000', b'1', '2026-05-07 13:35:03.000000');

-- --------------------------------------------------------

--
-- Structure de la table `user_wallet`
--

CREATE TABLE `user_wallet` (
  `id` bigint(20) NOT NULL,
  `balance` decimal(10,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_wallet`
--

INSERT INTO `user_wallet` (`id`, `balance`, `created_at`, `updated_at`, `user_id`) VALUES
(11, 1919.99, '2026-05-07 11:32:01.000000', '2026-05-07 11:42:05.000000', 11),
(12, 2000.00, '2026-05-07 11:34:36.000000', '2026-05-07 11:34:36.000000', 12),
(13, 1849.01, '2026-05-07 13:33:21.000000', '2026-05-07 13:39:23.000000', 13);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKcmanafgwbibfijy2o5isfk3d5` (`user_id`);

--
-- Index pour la table `creadi_scores`
--
ALTER TABLE `creadi_scores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK5ksgepgsgxt26v5vky2ie49qs` (`user_id`);

--
-- Index pour la table `credit_requests`
--
ALTER TABLE `credit_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKqqaj53cdd5yui6nr9faqxro7r` (`user_id`);

--
-- Index pour la table `financial_profiles`
--
ALTER TABLE `financial_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK4jrh39uvndm2javq34lb1jexu` (`user_id`);

--
-- Index pour la table `installments`
--
ALTER TABLE `installments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK7k1jkwkhmkrcepft7pu7cnq00` (`credit_request_id`);

--
-- Index pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKl1x55mfsay7co0r3m9ynvipd5` (`invoice_number`),
  ADD UNIQUE KEY `UKjes3ujnqxrugth3qctcmskwml` (`transaction_id`),
  ADD UNIQUE KEY `UKe718q5klx5pempy28p2nx88a6` (`order_id`),
  ADD KEY `FKbwr4d4vyqf2bkoetxtt8j9dx7` (`user_id`);

--
-- Index pour la table `kyc_documents`
--
ALTER TABLE `kyc_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_kyc_cin_number` (`cin_number_unique`),
  ADD UNIQUE KEY `uq_kyc_front_hash` (`cin_front_hash`),
  ADD UNIQUE KEY `uq_kyc_back_hash` (`cin_back_hash`),
  ADD UNIQUE KEY `uq_kyc_didit_id` (`didit_identity_id`),
  ADD KEY `FKllb8bcbbyo994afdepf7f7j63` (`user_id`);

--
-- Index pour la table `merchants`
--
ALTER TABLE `merchants`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKrwn36natqiwaseu5c3jvaun3` (`transaction_reference`),
  ADD KEY `FKp0wyj2pahks5oh3qs9qstfnsj` (`installment_id`),
  ADD KEY `FKj94hgy9v5fw1munb90tar2eje` (`user_id`);

--
-- Index pour la table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKj9nh8v228i4ruhyupy67ra6py` (`transaction_id`),
  ADD KEY `FKfvk9w884rbmso2tiv89e232tx` (`article_id`),
  ADD KEY `FK5dsyovo7wihbep1fluuar8kes` (`credit_request_id`),
  ADD KEY `FKquq1njrq27p9ye5u19f1yvnfp` (`user_id`);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKj6ef2k4uhj4iy1wl38fry8ih5` (`reference`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`);

--
-- Index pour la table `user_wallet`
--
ALTER TABLE `user_wallet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKsmlynan5580w2445atlq9aaom` (`user_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `articles`
--
ALTER TABLE `articles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `cards`
--
ALTER TABLE `cards`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `creadi_scores`
--
ALTER TABLE `creadi_scores`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT pour la table `credit_requests`
--
ALTER TABLE `credit_requests`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `financial_profiles`
--
ALTER TABLE `financial_profiles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `installments`
--
ALTER TABLE `installments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT pour la table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `kyc_documents`
--
ALTER TABLE `kyc_documents`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT pour la table `merchants`
--
ALTER TABLE `merchants`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT pour la table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `user_wallet`
--
ALTER TABLE `user_wallet`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `cards`
--
ALTER TABLE `cards`
  ADD CONSTRAINT `FKcmanafgwbibfijy2o5isfk3d5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `creadi_scores`
--
ALTER TABLE `creadi_scores`
  ADD CONSTRAINT `FK5ksgepgsgxt26v5vky2ie49qs` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `credit_requests`
--
ALTER TABLE `credit_requests`
  ADD CONSTRAINT `FKqqaj53cdd5yui6nr9faqxro7r` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `financial_profiles`
--
ALTER TABLE `financial_profiles`
  ADD CONSTRAINT `FKqt6pnf8hhik2gmxj31f4bm63v` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `installments`
--
ALTER TABLE `installments`
  ADD CONSTRAINT `FK7k1jkwkhmkrcepft7pu7cnq00` FOREIGN KEY (`credit_request_id`) REFERENCES `credit_requests` (`id`);

--
-- Contraintes pour la table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `FKa9ees8akliq77jf5h5flucyon` FOREIGN KEY (`order_id`) REFERENCES `purchase_orders` (`id`),
  ADD CONSTRAINT `FKbwr4d4vyqf2bkoetxtt8j9dx7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `kyc_documents`
--
ALTER TABLE `kyc_documents`
  ADD CONSTRAINT `FKllb8bcbbyo994afdepf7f7j63` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `FKj94hgy9v5fw1munb90tar2eje` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `FKp0wyj2pahks5oh3qs9qstfnsj` FOREIGN KEY (`installment_id`) REFERENCES `installments` (`id`);

--
-- Contraintes pour la table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `FK5dsyovo7wihbep1fluuar8kes` FOREIGN KEY (`credit_request_id`) REFERENCES `credit_requests` (`id`),
  ADD CONSTRAINT `FKfvk9w884rbmso2tiv89e232tx` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`),
  ADD CONSTRAINT `FKquq1njrq27p9ye5u19f1yvnfp` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
