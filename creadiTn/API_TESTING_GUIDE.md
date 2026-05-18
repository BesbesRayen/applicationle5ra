# 🚀 CreadiTn API Testing Guide

## How to Test the APIs

This guide shows you exactly how to test each API endpoint with real requests.

---

## ✅ Setup: Insérer les Données de Test

### 1. Ouvrez MySQL Workbench ou `mysql` CLI:

```bash
mysql -u root -p nextjs_db < test-data.sql
```

### 2. Vérifiez que les données sont insérées:

```bash
mysql -u root -p
USE nextjs_db;
SELECT * FROM users;
```

**Résultat attendu:**
```
id | first_name | last_name | email             | kyc_status | created_at
1  | Ahmed      | Ben Ali   | ahmed@example.com | APPROVED   | 2024-03-14
2  | Fatima     | Khaled    | fatima@example...
3  | Mohamed    | Saïdi     | mohamed@example..
4  | Leila      | Amira     | leila@example.com
```

---

## 🔐 Authentification

Depuis que nous avons désactivé l'authentification, **les API sont publiques**. 
Vous devez simplement passer **`userId` en query parameter**.

---

## 📋 Collection d'Endpoints

### 1️⃣ UTILISATEURS (Users)

#### A. Récupérer le Profil Utilisateur

```bash
curl -X GET "http://localhost:8080/api/users/me?userId=1"
```

**Réponse:**
```json
{
  "id": 1,
  "firstName": "Ahmed",
  "lastName": "Ben Ali",
  "email": "ahmed@example.com",
  "phone": "+216 98 123 456",
  "kycStatus": "APPROVED",
  "createdAt": "2024-03-14T10:00:00"
}
```

#### B. Mettre à Jour le Profil

```bash
curl -X PUT "http://localhost:8080/api/users/me?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Ben Ali",
    "phone": "+216 99 888 777"
  }'
```

#### C. Récupérer un Utilisateur par ID

```bash
curl -X GET "http://localhost:8080/api/users/1"
```

---

### 2️⃣ AUTHENTIFICATION (Auth)

#### A. S'Enregistrer

```bash
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sophia",
    "lastName": "Martin",
    "email": "sophia@example.com",
    "password": "secure123",
    "phone": "+216 92 345 678"
  }'
```

**Réponse:**
```json
{
  "userId": 5,
  "email": "sophia@example.com",
  "message": "Registered successfully"
}
```

#### B. Se Connecter

```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "password123"
  }'
```

**Réponse:**
```json
{
  "userId": 1,
  "email": "ahmed@example.com",
  "message": "Login successful"
}
```

---

### 3️⃣ DOCUMENTS KYC

#### A. Soumettre les Documents KYC

```bash
curl -X POST "http://localhost:8080/api/kyc/upload?userId=4" \
  -H "Content-Type: application/json" \
  -d '{
    "cinFrontUrl": "https://example.com/leila-cin-front.jpg",
    "cinBackUrl": "https://example.com/leila-cin-back.jpg",
    "selfieUrl": "https://example.com/leila-selfie.jpg"
  }'
```

**Réponse:**
```json
{
  "id": 5,
  "userId": 4,
  "cinFrontUrl": "https://example.com/leila-cin-front.jpg",
  "cinBackUrl": "https://example.com/leila-cin-back.jpg",
  "selfieUrl": "https://example.com/leila-selfie.jpg",
  "status": "PENDING",
  "createdAt": "2024-03-14T11:00:00"
}
```

#### B. Voir le Statut KYC

```bash
curl -X GET "http://localhost:8080/api/kyc/status?userId=1"
```

**Réponse:**
```json
{
  "id": 1,
  "userId": 1,
  "status": "APPROVED",
  "cinFrontUrl": "https://example.com/user1-cin-front.jpg",
  "cinBackUrl": "https://example.com/user1-cin-back.jpg",
  "selfieUrl": "https://example.com/user1-selfie.jpg",
  "createdAt": "2024-03-14T09:00:00"
}
```

---

### 4️⃣ SCORE DE CRÉDIT (Credit Score)

#### A. Calculer le Score de Crédit

```bash
curl -X POST "http://localhost:8080/api/score/calculate?userId=4" \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 1800.00,
    "employmentType": "Self-employed",
    "yearsOfExperience": 3,
    "monthlyExpenses": 700.00
  }'
```

**Calculation:**
```
Score = (1800 * 0.3) + (3 * 10) - (700 * 0.2)
Score = 540 + 30 - 140 = 430
Max Credit = 430 * 2.5 = 1075 DT
```

**Réponse:**
```json
{
  "id": 4,
  "userId": 4,
  "salary": 1800.00,
  "employmentType": "Self-employed",
  "yearsOfExperience": 3,
  "monthlyExpenses": 700.00,
  "score": 430,
  "maxCreditAmount": 1075.00,
  "createdAt": "2024-03-14T12:00:00"
}
```

#### B. Récupérer le Dernier Score

```bash
curl -X GET "http://localhost:8080/api/score/latest?userId=1"
```

**Réponse:**
```json
{
  "id": 1,
  "userId": 1,
  "score": 380,
  "maxCreditAmount": 950.00,
  "salary": 1500.00,
  "employmentType": "Full-time Engineer",
  "yearsOfExperience": 5,
  "monthlyExpenses": 600.00
}
```

---

### 5️⃣ DEMANDES DE CRÉDIT (Credit Requests)

#### A. Simuler un Crédit (Sans soumettre)

```bash
curl -X POST "http://localhost:8080/api/credits/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 1000.00,
    "downPayment": 200.00,
    "numberOfInstallments": 5
  }'
```

**Réponse (Simulation):**
```json
{
  "totalAmount": 1000.00,
  "downPayment": 200.00,
  "remainingAmount": 800.00,
  "numberOfInstallments": 5,
  "monthlyAmount": 160.00
}
```

#### B. Demander un Crédit (Soumettre Officiellement)

```bash
curl -X POST "http://localhost:8080/api/credits/request?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 1000.00,
    "downPayment": 200.00,
    "numberOfInstallments": 5,
    "merchantId": 1
  }'
```

**Réponse:**
```json
{
  "id": 5,
  "userId": 1,
  "merchantId": 1,
  "totalAmount": 1000.00,
  "downPayment": 200.00,
  "numberOfInstallments": 5,
  "monthlyAmount": 160.00,
  "status": "APPROVED",
  "createdAt": "2024-03-14T13:00:00"
}
```

#### C. Voir Mes Demandes de Crédit

```bash
curl -X GET "http://localhost:8080/api/credits/my-requests?userId=1"
```

**Réponse:**
```json
[
  {
    "id": 1,
    "totalAmount": 800.00,
    "monthlyAmount": 150.00,
    "status": "APPROVED",
    "createdAt": "2024-03-14T09:00:00"
  },
  {
    "id": 4,
    "totalAmount": 400.00,
    "monthlyAmount": 116.67,
    "status": "APPROVED",
    "createdAt": "2024-03-14T10:00:00"
  }
]
```

#### D. Voir une Demande de Crédit Spécifique

```bash
curl -X GET "http://localhost:8080/api/credits/1"
```

---

### 6️⃣ VERSEMENTS (Installments)

#### A. Voir Mes Versements

```bash
curl -X GET "http://localhost:8080/api/credits/my-installments?userId=1"
```

**Réponse:**
```json
[
  {
    "id": 1,
    "creditRequestId": 1,
    "dueDate": "2024-04-13",
    "amount": 150.00,
    "status": "PAID",
    "paidDate": "2024-03-14T09:30:00",
    "penalty": 0.00
  },
  {
    "id": 2,
    "creditRequestId": 1,
    "dueDate": "2024-05-13",
    "amount": 150.00,
    "status": "PAID",
    "paidDate": "2024-03-19T10:15:00",
    "penalty": 5.00
  },
  {
    "id": 3,
    "creditRequestId": 1,
    "dueDate": "2024-06-13",
    "amount": 150.00,
    "status": "PENDING",
    "paidDate": null,
    "penalty": 0.00
  }
]
```

#### B. Voir Mes Versements en Attente

```bash
curl -X GET "http://localhost:8080/api/credits/my-installments/pending?userId=1"
```

**Réponse:**
```json
[
  {
    "id": 3,
    "dueDate": "2024-06-13",
    "amount": 150.00,
    "status": "PENDING"
  },
  {
    "id": 4,
    "dueDate": "2024-07-13",
    "amount": 150.00,
    "status": "PENDING"
  }
]
```

#### C. Voir les Versements d'une Demande

```bash
curl -X GET "http://localhost:8080/api/credits/1/installments"
```

---

### 7️⃣ PAIEMENTS (Payments)

#### A. Effectuer un Paiement

```bash
curl -X POST "http://localhost:8080/api/payments?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "installmentId": 3,
    "amount": 150.00,
    "paymentMethod": "card"
  }'
```

**Réponse:**
```json
{
  "id": 10,
  "userId": 1,
  "installmentId": 3,
  "amount": 150.00,
  "transactionReference": "TXN_20240314_010",
  "paymentMethod": "card",
  "paidAt": "2024-03-14T14:30:00"
}
```

#### B. Voir Mes Paiements

```bash
curl -X GET "http://localhost:8080/api/payments/my-payments?userId=1"
```

**Réponse:**
```json
[
  {
    "id": 1,
    "amount": 150.00,
    "transactionReference": "TXN_20240301_001",
    "paymentMethod": "card",
    "paidAt": "2024-03-14T09:00:00"
  },
  {
    "id": 2,
    "amount": 155.00,
    "transactionReference": "TXN_20240315_002",
    "paymentMethod": "bank_transfer",
    "paidAt": "2024-03-19T10:00:00"
  }
]
```

#### C. Chercher un Paiement par Référence

```bash
curl -X GET "http://localhost:8080/api/payments/reference/TXN_20240301_001"
```

---

### 8️⃣ NOTIFICATIONS

#### A. Voir Mes Notifications

```bash
curl -X GET "http://localhost:8080/api/notifications?userId=1"
```

**Réponse:**
```json
[
  {
    "id": 1,
    "title": "Documents KYC Approuvés",
    "message": "Vos documents KYC ont été vérifiés et approuvés.",
    "type": "KYC_VALIDATED",
    "read": false,
    "createdAt": "2024-03-12T10:00:00"
  },
  {
    "id": 2,
    "title": "Crédit Approuvé",
    "message": "Votre demande de crédit de 800 DT a été approuvée!",
    "type": "CREDIT_APPROVED",
    "read": false,
    "createdAt": "2024-03-13T11:00:00"
  }
]
```

#### B. Voir Notifications Non-Lues

```bash
curl -X GET "http://localhost:8080/api/notifications/unread?userId=1"
```

#### C. Compter les Notifications Non-Lues

```bash
curl -X GET "http://localhost:8080/api/notifications/unread-count?userId=1"
```

**Réponse:**
```json
3
```

#### D. Marquer une Notification comme Lue

```bash
curl -X PUT "http://localhost:8080/api/notifications/1/read"
```

---

### 9️⃣ MARCHANDS (Merchants)

#### A. Voir Tous les Marchands

```bash
curl -X GET "http://localhost:8080/api/merchants"
```

**Réponse:**
```json
[
  {
    "id": 1,
    "name": "TechStore",
    "category": "Electronics",
    "address": "Tunis, Bardo",
    "phone": "+216 71 123 456",
    "email": "tech@store.tn",
    "active": true
  },
  {
    "id": 2,
    "name": "FashionBoutique",
    "category": "Fashion",
    "address": "Sousse, Centre Ville",
    "phone": "+216 73 234 567",
    "email": "fashion@boutique.tn",
    "active": true
  }
]
```

#### B. Voir un Marchand Spécifique

```bash
curl -X GET "http://localhost:8080/api/merchants/1"
```

#### C. Filtrer par Catégorie

```bash
curl -X GET "http://localhost:8080/api/merchants?category=Electronics"
```

---

## 🧪 Cas d'Usage Pratiques

### Cas 1: Un Nouvel Utilisateur Demande un Crédit

```bash
# 1. S'enregistrer
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ali", "lastName":"Hassan", "email":"ali@example.com", "password":"123456"}' 

# Récupérez l'ID (ex: userId=6)

# 2. Soumettre KYC
curl -X POST "http://localhost:8080/api/kyc/upload?userId=6" \
  -H "Content-Type: application/json" \
  -d '{"cinFrontUrl":"...", "cinBackUrl":"...", "selfieUrl":"..."}'

# 3. Calculer le Score (après approbation KYC par admin)
curl -X POST "http://localhost:8080/api/score/calculate?userId=6" \
  -H "Content-Type: application/json" \
  -d '{"salary":2000, "employmentType":"Manager", "yearsOfExperience":4, "monthlyExpenses":500}'

# 4. Demander un Crédit
curl -X POST "http://localhost:8080/api/credits/request?userId=6" \
  -H "Content-Type: application/json" \
  -d '{"totalAmount":500, "downPayment":100, "numberOfInstallments":4, "merchantId":1}'

# 5. Voir les Versements Créés
curl -X GET "http://localhost:8080/api/credits/my-installments?userId=6"

# 6. Payer le 1er Versement
curl -X POST "http://localhost:8080/api/payments?userId=6" \
  -H "Content-Type: application/json" \
  -d '{"installmentId":FIRST_ID, "amount":100, "paymentMethod":"card"}'
```

---

## 📊 Requêtes SQL de Vérification

Après chaque action, vérifiez dans la BD:

```sql
-- Voir l'utilisateur
SELECT * FROM users WHERE email = 'ahmed@example.com';

-- Voir ses versements
SELECT i.*, cr.user_id FROM installments i 
JOIN credit_requests cr ON i.credit_request_id = cr.id 
WHERE cr.user_id = 1;

-- Voir ses paiements
SELECT * FROM payments WHERE user_id = 1;

-- Voir ses notifications
SELECT * FROM notifications WHERE user_id = 1 ORDER BY created_at DESC;
```

---

## 🎯 Exercices Pratiques

1. **Créez un nouvel utilisateur** et suivez tout le flux jusqu'à accepter un crédit
2. **Effectuez 3 paiements** et voyez comment les statuts changent
3. **Simulez un paiement tardif** et observez les pénalités
4. **Testez un crédit sans marchand** (merchantId = null)
5. **Explorez les notifications** et marquez-les comme lues

---

## 🔍 Débogage

Si une API échoue, vérifiez:

1. **Code HTTP:**
   - 200: Succès
   - 400: Données invalides
   - 404: Ressource non trouvée
   - 500: Erreur serveur

2. **Logs du serveur:** Cherchez les erreurs dans la console Spring Boot

3. **Base de données:** Vérifiez que les données existent avec SQL

4. **Format JSON:** Assurez-vous que le JSON est valide

