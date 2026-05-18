# 🏗️ CreadiTn Architecture Visuelle

## Diagramme Complet du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                      CREADITN PLATFORM                          │
│                   (Buy Now, Pay Later)                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  APPLICATION WEB │
│  (Frontend)      │
└────────┬─────────┘
         │ HTTP Requests
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT BACKEND                           │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   CONTROLLERS                             │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐   │  │
│  │  │ AuthCtrl    │ │ UserCtrl     │ │ CreditCtrl       │...  │
│  │  │ /auth/*     │ │ /users/*     │ │ /credits/*       │   │  │
│  │  └──────┬──────┘ └──────┬───────┘ └────────┬─────────┘   │  │
│  │         │               │                   │             │  │
│  │  ┌──────▼──────────────▼───────────────────▼──────────┐   │  │
│  │  │            SERVICE LAYER                          │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │   │  │
│  │  │  │AuthServ  │  │UserServ  │  │CreditService   │...  │   │  │
│  │  │  └──────┬───┘  └──────┬───┘  └────────┬───────┘   │   │  │
│  │  │         │             │               │           │   │  │
│  │  │  ┌──────▼─────────────▼───────────────▼─────────┐ │   │  │
│  │  │  │          REPOSITORY LAYER                    │ │   │  │
│  │  │  │  ┌────────┐  ┌─────────┐  ┌──────────────┐  │ │   │  │
│  │  │  │  │UserRepo│  │CreditReq│  │PaymentRepo   │... │   │  │
│  │  │  │  └────────┘  │Repo     │  └──────────────┘  │ │   │  │
│  │  │  └──────┬────────┼──────────────┬──────────────┘ │   │  │
│  │  └─────────┼────────┼──────────────┼────────────────┘   │  │
│  └────────────┼────────┼──────────────┼───────────────────┘  │
│               │        │              │                       │
└───────────────┼────────┼──────────────┼───────────────────────┘
                │        │              │
                ▼        └──────┬───────┘
                        JPA/Hibernate
                                │
                ┌───────────────▼───────────────┐
                │    MySQL DATABASE             │
                │                               │
                │  ┌──────────────────────────┐ │
                │  │ USERS TABLE              │ │
                │  │ id, email, password...   │ │
                │  └──────────────┬───────────┘ │
                │                 │ Foreign Key │
                │  ┌──────────────▼──────────┐  │
                │  │ CREDIT_REQUESTS TABLE    │  │
                │  │ id, user_id, total...    │  │
                │  └──────────────┬───────────┘  │
                │                 │ FK            │
                │  ┌──────────────▼──────────┐   │
                │  │ INSTALLMENTS TABLE       │   │
                │  │ id, credit_req_id,amt... │   │
                │  └──────────────┬──────────┘   │
                │                 │ FK           │
                │  ┌──────────────▼──────────┐   │
                │  │ PAYMENTS TABLE           │   │
                │  │ id, installment_id, amt │   │
                │  └──────────────────────────┘   │
                │                                  │
                │  + KYC_DOCUMENTS TABLE           │
                │  + CREDIT_SCORES TABLE           │
                │  + NOTIFICATIONS TABLE           │
                │  + MERCHANTS TABLE               │
                │                                  │
                └──────────────────────────────────┘
```

---

## 📊 Flux de Données Complet

### 1️⃣ UTILISATEUR NOUVEAU

```
                ÉTAPE 1: ENREGISTREMENT
                      │
    curl -X POST /api/auth/register
    └─ firstName, lastName, email, password
        │
        ▼
    ┌────────────────────────────┐
    │ INSERT INTO users           │
    │ VALUES (1, Ahmed, ...)      │
    │ kycStatus = NOT_SUBMITTED   │
    └────────────────────────────┘
        │
        ▼
    Response: { userId: 1, email: ... }
```

### 2️⃣ KYC DOCUMENTS

```
                ÉTAPE 2: KYC DOCUMENTS
                      │
    curl -X POST /api/kyc/upload?userId=1
    └─ cinFrontUrl, cinBackUrl, selfieUrl
        │
        ▼
    ┌────────────────────────────────┐
    │ INSERT INTO kyc_documents      │
    │ user_id=1, status=PENDING      │
    └────────────────────────────────┘
        │
        ▼
    Admin approuve dans le système
        │
        ▼
    ┌────────────────────────────────┐
    │ UPDATE kyc_documents           │
    │ SET status = 'APPROVED'        │
    │                                │
    │ UPDATE users                   │
    │ SET kycStatus = 'APPROVED'     │
    └────────────────────────────────┘
        │
        ▼
    Notification envoyée à l'utilisateur
    "Vos documents KYC sont approuvés!"
```

### 3️⃣ SCORE DE CRÉDIT

```
                ÉTAPE 3: SCORE DE CRÉDIT
                      │
    curl -X POST /api/score/calculate?userId=1
    └─ salary, employmentType, yearsOfExp, monthlyExpenses
        │
        ▼
    Service calcule:
    Score = (salary*0.3) + (yearsExp*10) - (expenses*0.2)
    maxCredit = score * 2.5
        │
        ▼
    ┌────────────────────────────────┐
    │ INSERT INTO credit_scores      │
    │ user_id=1, score=380, maxAmt=950│
    └────────────────────────────────┘
```

### 4️⃣ DEMANDE DE CRÉDIT

```
                ÉTAPE 4: DEMANDE DE CRÉDIT
                      │
    curl -X POST /api/credits/request?userId=1
    ├─ totalAmount: 800 DT
    ├─ downPayment: 200 DT
    ├─ numberOfInstallments: 4
    └─ merchantId: 1 (optional)
        │
        ▼
    Validations:
    ✓ KYC Status = APPROVED?
    ✓ (totalAmount - downPayment) ≤ maxCreditAmount?
        │
        ▼
    ┌────────────────────────────────────────┐
    │ INSERT INTO credit_requests            │
    │ user_id=1, total=800, downpay=200,    │
    │ numInstallments=4, status=APPROVED    │
    │                                        │
    │ monthlyAmount = (800-200)/4 = 150 DT  │
    └────────────────────────────────────────┘
        │
        ▼
    Crédit APPROUVÉ automatiquement
        │
        ▼
    ┌──────────────────────────────────────┐
    │ Créer automatiquement 4 versements    │
    │                                       │
    │ INSERT INTO installments (4 fois):   │
    │ installment 1: due 30 days, amt 150  │
    │ installment 2: due 60 days, amt 150  │
    │ installment 3: due 90 days, amt 150  │
    │ installment 4: due 120 days, amt 150 │
    │ status = PENDING                     │
    └──────────────────────────────────────┘
        │
        ▼
    Notification: "Crédit Approuvé!"
```

### 5️⃣ PAIEMENT

```
                ÉTAPE 5: PAIEMENT
                      │
    curl -X POST /api/payments?userId=1
    ├─ installmentId: 1
    ├─ amount: 150 DT
    └─ paymentMethod: "card"
        │
        ▼
    ┌────────────────────────────────┐
    │ INSERT INTO payments           │
    │ user_id=1, installment_id=1   │
    │ amount=150, transactionRef=... │
    │ paidAt = NOW()                │
    └────────────────────────────────┘
        │
        ▼
    ┌────────────────────────────────┐
    │ UPDATE installments            │
    │ SET status='PAID'              │
    │     paidDate = NOW()           │
    │ WHERE id=1                     │
    └────────────────────────────────┘
        │
        ▼
    Notification: "Paiement Reçu ✓"
```

### 6️⃣ PAIEMENT TARDIF (OPTIONAL)

```
    Si paiement après dueDate:
        │
        ▼
    Calculer la pénalité:
    penalty = montantVersement * 0.05  (5%)
    Exemple: 150 * 0.05 = 7.50 DT
        │
        ▼
    ┌────────────────────────────────┐
    │ UPDATE installments            │
    │ SET penalty = 7.50             │
    │ WHERE id=2                     │
    │                                │
    │ UPDATE payments                │
    │ SET amount = 157.50 (150 + 7.5)│
    └────────────────────────────────┘
        │
        ▼
    Notification: "Pénalité appliquée: 7.50 DT"
```

---

## 🎯 État des Entités à Chaque Étape

### État UTILISATEUR

```
STEP 1 (Registration)
├─ kycStatus: NOT_SUBMITTED

STEP 2 (KYC Submitted)
├─ kycStatus: PENDING

STEP 3 (KYC Approved)
├─ kycStatus: APPROVED
```

### État DEMANDE DE CRÉDIT

```
STEP 4 (Request Submitted)
├─ status: PENDING → Auto-approved → APPROVED

STEP 5+ (After Approval)
├─ status: APPROVED (immutable)
```

### États VERSEMENT

```
At Creation (STEP 4)
├─ status: PENDING
├─ amount: 150.00
├─ dueDate: 2024-04-14

When Payment Received (STEP 5)
├─ status: PAID
├─ paidDate: 2024-03-14
├─ penalty: 0

If Payment Late
├─ status: PAID
├─ paidDate: 2024-04-20 (late)
├─ penalty: 7.50

If Payment Never Made
├─ status: OVERDUE
├─ paidDate: NULL
├─ penalty: accumulated
```

---

## 📈 Exemple Complet: Ahmed (User ID=1)

### Timeline

```
2024-03-10 | Ahmed s'enregistre
│          User created with kycStatus=NOT_SUBMITTED
│
2024-03-11 | Ahmed soumet ses documents KYC
│          kyc_documents created with status=PENDING
│
2024-03-12 | Admin approuve le KYC
│          kyc_documents.status = APPROVED
│          users.kycStatus = APPROVED
│          → Notification: "KYC Approuvé"
│
2024-03-13 | Ahmed calcule son score de crédit
│          credit_scores created
│          score = 380, maxCredit = 950 DT
│
2024-03-14 | Ahmed demande un crédit de 800 DT
│          credit_requests created with status=APPROVED
│          → 4 installments created automatically
│          → Notification: "Crédit Approuvé"
│
2024-03-14 | Ahmed paie le 1er versement (150 DT)
│          payments created
│          installments[0].status = PAID
│          → Notification: "Paiement Reçu"
│
2024-03-15 | Ahmed paie le 2e versement (155 DT = 150 + 5 pénalité)
│          payments created with penalty
│          installments[1].status = PAID
│          → Notification: "Paiement Reçu"
│
2024-03-16 | Ahmed a 2 versements en attente
│          installments[2].status = PENDING
│          installments[3].status = PENDING

DATABASE STATE:

users:
│ id │ email           │ kyc_status │
├────┼─────────────────┼────────────┤
│ 1  │ ahmed@exa...    │ APPROVED   │

kyc_documents:
│ id │ user_id │ status   │
├────┼─────────┼──────────┤
│ 1  │ 1       │ APPROVED │

credit_scores:
│ id │ user_id │ score │ max_credit │
├────┼─────────┼───────┼────────────┤
│ 1  │ 1       │ 380   │ 950.00     │

credit_requests:
│ id │ user_id │ total │ down │ installments │ status   │
├────┼─────────┼───────┼──────┼──────────────┼──────────┤
│ 1  │ 1       │ 800   │ 200  │ 4            │ APPROVED │

installments:
│ id │ credit_id │ due_date   │ amount │ status  │ penalty │
├────┼───────────┼────────────┼────────┼─────────┼─────────┤
│ 1  │ 1         │ 2024-04-14 │ 150    │ PAID    │ 0.00    │
│ 2  │ 1         │ 2024-05-14 │ 150    │ PAID    │ 5.00    │
│ 3  │ 1         │ 2024-06-14 │ 150    │ PENDING │ 0.00    │
│ 4  │ 1         │ 2024-07-14 │ 150    │ PENDING │ 0.00    │

payments:
│ id │ user_id │ instalment_id │ amount │ date       │
├────┼─────────┼───────────────┼────────┼────────────┤
│ 1  │ 1       │ 1             │ 150    │ 2024-03-14 │
│ 2  │ 1       │ 2             │ 155    │ 2024-03-15 │

notifications:
│ id │ user_id │ type             │ read  │
├────┼─────────┼──────────────────┼───────┤
│ 1  │ 1       │ KYC_VALIDATED    │ false │
│ 2  │ 1       │ CREDIT_APPROVED  │ false │
│ 3  │ 1       │ PAYMENT_CONFIRMED│ true  │
│ 4  │ 1       │ PAYMENT_CONFIRMED│ false │
```

---

## 🔄 Diagramme de Transition des États

### Utilisateur KYC Status

```
    ┌─────────────────┐
    │ NOT_SUBMITTED   │ (Initial)
    └────────┬────────┘
             │ (Submit KYC Documents)
             ▼
    ┌─────────────────┐
    │ PENDING         │ (Waiting for Admin)
    └────────┬────────┘
             │
          ┌──┴──┐
          │     │
    (Approved)  (Rejected)
          │     │
          ▼     ▼
    ┌──────────┐  ┌──────────┐
    │ APPROVED │  │ REJECTED │
    └──────────┘  └──────────┘
          │           │
          └─── Can Request Credit
    (Once APPROVED only)
```

### Demande de Crédit Status

```
    ┌─────────────────┐
    │ PENDING         │ (Initial - Very briefly)
    └────────┬────────┘
             │ (Auto-approved if validation passes)
             ▼
    ┌─────────────────┐
    │ APPROVED        │ ◄──── Installments Created
    └─────────────────┘
    
    (Alternative if validation fails)
    └───► REJECTED
```

### Versement Status

```
    ┌─────────────────┐
    │ PENDING         │ (Initial)
    └────────┬────────┘
             │
          ┌──┴──┐
          │     │
    (Payment Received)  (Due Date Passed)
          │              │
          ▼              ▼
    ┌──────────┐    ┌──────────┐
    │ PAID     │    │ OVERDUE  │
    └──────────┘    └──────────┘
             ▲       │
             │       │ (Payment Received Later)
             └───────┘
             (Update to PAID + Penalty)
```

---

## 🌐 Comment Tout S'Interconnecte

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMERCE ÉLECTRONIQUE                    │
│                                                             │
│  Customer: "Je veux acheter ce laptop!"                    │
│               │                                             │
│               ▼                                             │
│  ┌────────────────────────────────────┐                    │
│  │ SELECT * FROM users WHERE id=1     │                    │
│  │                                    │                    │
│  │ SELECT * FROM kyc_documents WHERE  │                    │
│  │ user_id=1 AND status='APPROVED'   │                    │
│  │                                    │                    │
│  │ SELECT * FROM credit_scores WHERE  │                    │
│  │ user_id=1 (Get max credit available)                   │
│  │                                    │                    │
│  │ INSERT INTO credit_requests        │                    │
│  │ (Create entry for this purchase)   │                    │
│  │                                    │                    │
│  │ INSERT INTO installments (4 times) │                    │
│  │ (Each month's payment)             │                    │
│  └────────────────────────────────────┘                    │
│               │                                             │
│               ▼                                             │
│  "You can pay 800 DT now!"                                │
│  "4 monthly payments of 150 DT"                           │
│  "Total Interest: 0 DT"                                    │
│               │                                             │
│               ▼                                             │
│  Customer approves → Credit approved instantly            │
│               │                                             │
│               ▼                                             │
│  Emails/SMS notifications sent                            │
│  "Your credit has been approved!"                         │
│               │                                             │
│               ▼                                             │
│  Payment reminders on each due date                       │
│               │                                             │
│               ▼                                             │
│  Customer pays installments                               │
│               │                                             │
│               ▼                                             │
│  Credit lifecycle complete!                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Prochaines Étapes d'Apprentissage

1. ✅ **Comprendre l'architecture** (vous êtes ici!)
2. ⬜ **Insérer les données de test** (`test-data.sql`)
3. ⬜ **Tester chaque API endpoint** (API_TESTING_GUIDE.md)
4. ⬜ **Modifier le code** pour ajouter de nouvelles fonctionnalités
5. ⬜ **Déployer en production**

