# CreadiTn Backend - Guide d'Apprentissage Complet

## 📚 Bienvenue au Système CreadiTn!

CreadiTn est une plateforme **Buy Now, Pay Later (BNPL)** qui permet aux utilisateurs d'acheter maintenant et de payer plus tard en installments.

---

## 🏗️ Architecture du Système

### Flux Principal

```
1. UTILISATEUR S'ENREGISTRE
   ↓
2. SOUMETS DOCUMENTS KYC (ID, Selfie)
   ↓
3. KYC APPROUVÉ
   ↓
4. SCORE DE CRÉDIT CALCULÉ
   ↓
5. DEMANDE DE CRÉDIT
   ↓
6. CRÉDIT APPROUVÉ → VERSEMENTS CRÉÉS
   ↓
7. EFFECTUE LES PAIEMENTS
   ↓
8. NOTIFICATIONS À CHAQUE ÉTAPE
```

---

## 👥 Comment Ça Marche

### 1️⃣ INSCRIPTION UTILISATEUR

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Ben Ali",
    "email": "ahmed@example.com",
    "password": "password123",
    "phone": "+216 98 123 456"
  }'
```

**Réponse:**
```json
{
  "userId": 1,
  "email": "ahmed@example.com",
  "message": "Registered successfully"
}
```

**Base de Données - Table `users`:**
```
id | firstName | lastName  | email             | password    | phone          | kycStatus     | createdAt
1  | Ahmed     | Ben Ali   | ahmed@example.com | password123 | +216 98 123456 | NOT_SUBMITTED | 2024-03-14
```

---

### 2️⃣ SOUMETTRE DOCUMENTS KYC

Avant de demander un crédit, l'utilisateur doit **prouver son identité** en soumettant:
- ✅ Photo de la carte d'identité (avant)
- ✅ Photo de la carte d'identité (arrière)
- ✅ Selfie

**Endpoint:** `POST /api/kyc/upload?userId=1`

```bash
curl -X POST "http://localhost:8080/api/kyc/upload?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "cinFrontUrl": "https://example.com/cin-front.jpg",
    "cinBackUrl": "https://example.com/cin-back.jpg",
    "selfieUrl": "https://example.com/selfie.jpg"
  }'
```

**Base de Données - Table `kyc_documents`:**
```
id | user_id | cinFrontUrl                    | cinBackUrl                     | selfieUrl                   | status  | createdAt
1  | 1       | https://example.com/cin-front  | https://example.com/cin-back   | https://example.com/selfie  | PENDING | 2024-03-14
```

**Workflow KYC:**
```
PENDING (en attente d'approbation) 
   ↓ (L'administrateur examine les documents)
APPROVED (approuvé) ou REJECTED (rejeté)
```

---

### 3️⃣ CALCULER LE SCORE DE CRÉDIT

Une fois le KYC approuvé, on **calcule le score de crédit** basé sur:
- 💰 Salaire mensuel
- 💼 Type d'emploi
- 📊 Années d'expérience
- 📉 Dépenses mensuelles

**Endpoint:** `POST /api/score/calculate?userId=1`

```bash
curl -X POST "http://localhost:8080/api/score/calculate?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 1500.00,
    "employmentType": "Full-time",
    "yearsOfExperience": 5,
    "monthlyExpenses": 600.00
  }'
```

**Formule du Score (Exemple):**
```
Score = (Salaire * 0.3) + (Années_Exp * 10) - (Dépenses * 0.2)
Score = (1500 * 0.3) + (5 * 10) - (600 * 0.2)
Score = 450 + 50 - 120 = 380

Montant Crédit Max = Score * 2.5 = 950 DT
```

**Base de Données - Table `credit_scores`:**
```
id | user_id | salary | employmentType | yearsOfExperience | monthlyExpenses | score | maxCreditAmount | createdAt
1  | 1       | 1500   | Full-time      | 5                 | 600             | 380   | 950.00          | 2024-03-14
```

---

### 4️⃣ DEMANDER UN CRÉDIT

L'utilisateur peut maintenant **demander un crédit** jusqu'à son montant limité.

**Endpoint:** `POST /api/credits/request?userId=1`

```bash
curl -X POST "http://localhost:8080/api/credits/request?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 500.00,
    "downPayment": 100.00,
    "numberOfInstallments": 4,
    "merchantId": null
  }'
```

**Calcul du crédit:**
```
totalAmount = 500 DT
downPayment = 100 DT (payé immédiatement)
Montant Restant = 500 - 100 = 400 DT
Nombre de Versements = 4
Montant par Versement = 400 / 4 = 100 DT
```

**Base de Données - Table `credit_requests`:**
```
id | user_id | merchant_id | totalAmount | downPayment | numberOfInstallments | monthlyAmount | status  | createdAt
1  | 1       | NULL        | 500.00      | 100.00      | 4                    | 100.00        | APPROVED| 2024-03-14
```

Status: `PENDING` → Approuvé → `APPROVED`

---

### 5️⃣ VERSEMENTS CRÉÉS AUTOMATIQUEMENT

Lorsque la demande de crédit est **approuvée**, le système **crée automatiquement 4 versements**:

**Base de Données - Table `installments`:**
```
id | credit_request_id | dueDate    | amount | status    | paidDate | penalty
1  | 1                 | 2024-04-14 | 100    | PENDING   | NULL     | 0
2  | 1                 | 2024-05-14 | 100    | PENDING   | NULL     | 0
3  | 1                 | 2024-06-14 | 100    | PENDING   | NULL     | 0
4  | 1                 | 2024-07-14 | 100    | PENDING   | NULL     | 0
```

---

### 6️⃣ EFFECTUER UN PAIEMENT

L'utilisateur paie ses versements à chaque mois.

**Endpoint:** `POST /api/payments?userId=1`

```bash
curl -X POST "http://localhost:8080/api/payments?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "installmentId": 1,
    "amount": 100.00,
    "paymentMethod": "card"
  }'
```

**Base de Données - Table `payments`:**
```
id | user_id | installment_id | amount | transactionReference | paymentMethod | paidAt
1  | 1       | 1              | 100    | TXN_2024_03_14_001  | card          | 2024-03-14
```

**Le versement devient:**
```
Versement 1: PENDING → PAID
```

---

### 7️⃣ NOTIFICATIONS

À chaque étape importante, on envoie une **notification** à l'utilisateur:

**Base de Données - Table `notifications`:**
```
id | user_id | title              | message                              | type             | read | createdAt
1  | 1       | KYC Validé         | Vos documents sont approuvés         | KYC_VALIDATED    | 0    | 2024-03-14
2  | 1       | Crédit Approuvé    | Votre crédit de 500 DT est approuvé  | CREDIT_APPROVED  | 0    | 2024-03-14
3  | 1       | Paiement Reçu      | Versement 1 reçu avec succès        | PAYMENT_CONFIRMED| 0    | 2024-03-14
```

**Endpoint pour voir les notifications:**
```bash
curl -X GET "http://localhost:8080/api/notifications?userId=1"
```

---

## 🏪 MARCHANDS (Merchants)

Les utilisateurs peuvent faire du crédit **chez des marchands spécifiques**.

**Exemple:**
- Ahmed achète un laptop chez "TechStore" pour 700 DT
- Il paie 200 DT immédiatement
- Il paie 100 DT par mois pendant 5 mois

**Base de Données - Table `merchants`:**
```
id | name      | category    | address    | phone        | email          | active | createdAt
1  | TechStore | Electronics | Tunis, TN | +216 71 123  | tech@store.tn | 1      | 2024-03-14
```

**Demande de crédit avec marchand:**
```bash
curl -X POST "http://localhost:8080/api/credits/request?userId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 700.00,
    "downPayment": 200.00,
    "numberOfInstallments": 5,
    "merchantId": 1
  }'
```

---

## 📊 Visualisation Complète

### Flow d'une Transaction Complète

```
┌─────────────────────────────────────┐
│ 1. Nouvel Utilisateur               │
│    Ahmed Ben Ali                    │
│    ahmed@example.com                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. Soumet KYC Documents             │
│    ID Card (Front + Back)           │
│    Selfie                           │
│    Status: PENDING                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. Admin Approuve KYC               │
│    Status: APPROVED                 │
│    Notification: KYC_VALIDATED      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. Système Calcule Score de Crédit  │
│    Salaire: 1500 DT                 │
│    Score: 380                       │
│    Max Crédit: 950 DT               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 5. Utilisateur Demande Crédit       │
│    Montant: 500 DT                  │
│    Versements: 4                    │
│    Status: PENDING                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 6. Système Approuve la Demande      │
│    Status: APPROVED                 │
│    Crée 4 versements de 100 DT      │
│    Notification: CREDIT_APPROVED    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 7. Utilisateur Paie Versements      │
│    Versement 1: 100 DT ✅           │
│    Versement 2: 100 DT ✅           │
│    Versement 3: 100 DT ✅           │
│    Versement 4: 100 DT ✅           │
│    Notification: PAYMENT_CONFIRMED  │
└─────────────────────────────────────┘
```

---

## 🔗 Relations Entre Tables

```
UTILISATEURS (users)
    │
    ├─→ DOCUMENTS KYC (kyc_documents)
    │       └─ Prouver l'identité
    │
    ├─→ SCORES DE CRÉDIT (credit_scores)
    │       └─ Déterminer la limite de crédit
    │
    ├─→ DEMANDES DE CRÉDIT (credit_requests)
    │       │
    │       ├─→ VERSEMENTS (installments)
    │       │   └─→ PAIEMENTS (payments)
    │       │
    │       └─→ MARCHANDS (merchants)
    │
    └─→ NOTIFICATIONS (notifications)
```

---

## 💾 Résumé des Opérations de Base de Données

| Opération | Table | Description |
|-----------|-------|-------------|
| Créer utilisateur | users | `INSERT INTO users ...` |
| Soumettre KYC | kyc_documents | `INSERT INTO kyc_documents ...` |
| Calculer score | credit_scores | `INSERT INTO credit_scores ...` |
| Demander crédit | credit_requests | `INSERT INTO credit_requests ...` |
| Créer versements | installments | `INSERT INTO installments (auto x4)` |
| Enregistrer paiement | payments | `INSERT INTO payments ...` |
| Updater versement | installments | `UPDATE installments SET status=PAID` |
| Envoyer notification | notifications | `INSERT INTO notifications ...` |

---

## 🎯 Quiz d'Apprentissage

**Q1: Quel est le premier document qu'un utilisateur doit soumettre?**
A. Attestation de salaire  
B. **Documents KYC (ID + Selfie)** ✅  
C. Contrat de travail  

**Q2: Comment est calculé le montant maximum de crédit?**
A. Fixe à 500 DT pour tous  
B. **Score * 2.5** ✅  
C. Salaire annuel / 12  

**Q3: Combien de versements sont créés pour un crédit?**
A. Automatiquement selon `numberOfInstallments` ✅  
B. Toujours 4  
C. Décidé par l'admin  

---

## 📝 Prochaines Étapes

1. **✅ Comprendre** les entités et leurs relations
2. **✅ Apprendre** le flux de travail complet
3. **⬜ Tester** avec des données réelles (voir fichier SQL suivant)
4. **⬜ Pratiquer** les API avec Postman/Curl
5. **⬜ Modifier** le code pour ajouter de nouvelles fonctionnalités
