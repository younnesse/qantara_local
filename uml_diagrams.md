# Qantara Architecture & UML Diagrams

This document contains the core UML diagrams mapping the design, database relationships, and key verification workflows of the Qantara platform.

---

## 1. Use Case Diagram

The use case diagram illustrates the actors (Provider, Client, Admin, and external APIs) and their interactions with the system boundary.

```mermaid
flowchart LR
    %% Actors on the Left
    subgraph LeftActors [" "]
        style LeftActors fill:none,stroke:none
        Provider["👤 Service Provider"]
        Client["👤 Client"]
    end

    %% Actors on the Right
    subgraph RightActors [" "]
        style RightActors fill:none,stroke:none
        Admin["👮 Admin"]
        DiditAPI["☁️ Didit IDV API"]
        FastAPIServer["🐍 FastAPI Server<br>(LayoutLMv3 & Pyzbar)"]
    end

    %% System Boundary
    subgraph SystemBoundary ["System Boundary: Qantara Platform"]
        UC_Reg(["Register / Login"])
        UC_Profile(["Manage Profile & Services"])
        UC_Identity(["Verify Identity (Didit IDV)"])
        UC_Professional(["Verify Professional Credentials"])
        UC_Search(["Search & Browse Providers"])
        UC_Call(["Get Phone Number & Call Provider"])
        UC_Review(["Leave Reviews"])
        UC_Manage(["Moderate Providers & System"])
        UC_Telegram(["Send Admin Telegram Alerts"])
    end

    %% Connections (Left Actors)
    Provider --- UC_Reg
    Provider --- UC_Profile
    Provider --- UC_Identity
    Provider --- UC_Professional

    Client --- UC_Reg
    Client --- UC_Search
    Client --- UC_Call
    Client --- UC_Review

    %% Connections (Right Actors)
    UC_Manage --- Admin
    UC_Telegram --- Admin

    %% External System Connections
    UC_Identity <--> DiditAPI
    UC_Professional <--> FastAPIServer

    %% Use Case Relationships
    UC_Identity -.->|"<<include>>"| UC_Reg
    UC_Professional -.->|"<<include>>"| UC_Reg
```

---

## 2. Class Diagram (Database Schema)

This class diagram represents the Prisma schema models, fields, types, and database relationships (SQLite/PostgreSQL).

```mermaid
classDiagram
    class Client {
        +String id
        +String email
        +String name
        +String password
        +String phoneNumber
        +Boolean emailVerified
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime deletedAt
        +Boolean isBanned
        +Review[] reviews
    }

    class Provider {
        +String id
        +String email
        +String name
        +String password
        +String phoneNumber
        +Boolean emailVerified
        +String certificateStatus
        +String identityStatus
        +String certificateMessage
        +String certificateIdHash
        +String extractedFullName
        +String extractedDate
        +String idCardImage
        +String selfieImage
        +String certificateImage
        +String certificateId
        +String yotiName // verifiedName
        +DateTime verificationSubmittedAt
        +Boolean aiFaceMatch
        +Boolean aiNameMatch
        +String aiAnalysisMessage
        +String professionalCategoryId
        +String regulatoryBodyId
        +String licenseNumber
        +String licenseDocumentUrl
        +DateTime licenseVerifiedAt
        +String licenseStatus
        +String tradeId
        +String cnamCardNumber
        +String cnamCardDocumentUrl
        +DateTime cnamCardVerifiedAt
        +String cnamCardStatus
        +String autoEntrepreneurActivityId
        +String anaeCardNumber
        +String anaeCardDocumentUrl
        +DateTime anaeCardVerifiedAt
        +String anaeCardStatus
        +Service[] services
    }

    class Service {
        +String id
        +String name
        +String description
        +Float price
        +Int duration
        +String category
        +Float rating
        +Int reviewCount
        +String providerId
        +Provider provider
        +Review[] reviews
    }

    class Review {
        +String id
        +Int rating
        +String comment
        +DateTime createdAt
        +String clientId
        +Client client
        +String serviceId
        +Service service
    }

    class ProfessionalCategory {
        +String id
        +String name
        +String nameFr
        +String nameEn
        +String nameAr
        +RegulatoryBody[] regulatoryBodies
        +Trade[] trades
        +AutoEntrepreneurActivity[] autoEntrepreneurActivities
        +Provider[] providers
    }

    class RegulatoryBody {
        +String id
        +String code
        +String name
        +String categoryId
        +ProfessionalCategory category
        +Provider[] providers
    }

    class Trade {
        +String id
        +String name
        +String categoryId
        +ProfessionalCategory category
        +Provider[] providers
    }

    class AutoEntrepreneurActivity {
        +String id
        +String name
        +String categoryId
        +ProfessionalCategory category
        +Provider[] providers
    }

    %% Relations
    Client "1" --> "0..*" Review : writes
    Service "1" --> "0..*" Review : receives
    Provider "1" --> "0..*" Service : offers
    Provider "1" --> "0..1" ProfessionalCategory : belongs to
    Provider "1" --> "0..1" RegulatoryBody : belongs to
    Provider "1" --> "0..1" Trade : belongs to
    Provider "1" --> "0..1" AutoEntrepreneurActivity : belongs to
    ProfessionalCategory "1" --> "0..*" RegulatoryBody : defines
    ProfessionalCategory "1" --> "0..*" Trade : defines
    ProfessionalCategory "1" --> "0..*" AutoEntrepreneurActivity : defines
```

---

## 3. Sequence Diagrams

### A. Identity Verification Flow (Didit Integration with In-Review Grace Period)

This sequence maps the flow from the moment the provider triggers the Didit verification to when the background lazy check auto-completes verification.

```mermaid
sequenceDiagram
    autonumber
    actor Provider as 👤 Provider
    participant FE as 📱 Next.js Frontend
    participant BE as 🖥️ Next.js Backend
    participant Didit as ☁️ Didit IDV Server
    participant DB as 💾 Database (Prisma)

    %% Session Creation
    Provider->>FE: Click "Verify Identity"
    FE->>BE: POST /api/provider/didit/create-session
    BE->>Didit: POST /v3/session/ (Workflow ID)
    Didit-->>BE: 201 Created (session_id, url)
    BE-->>FE: 200 OK (sessionId, sessionUrl)
    FE->>FE: Mount Didit iframe using sessionUrl

    %% Provider interaction
    Provider->>FE: Upload ID & Take Selfie in Iframe
    FE->>Didit: Submits media files
    Didit->>Didit: Processing (transitions to "In Review")

    %% Submission
    Provider->>FE: Click "Complete Verification"
    FE->>BE: POST /api/provider/verify-identity (diditSessionId)
    BE->>Didit: GET /v3/session/{id}/decision/
    Didit-->>BE: 200 OK (status: "In Review")
    
    note over BE: Grace period kicks in: backend does not fail
    BE->>DB: Update Provider (identityStatus="PENDING", yotiName=diditSessionId)
    BE-->>FE: 200 OK (success=true, identityStatus="PENDING")
    FE->>FE: Render disabled "Verification in Review..." button

    %% Background Lazy Poll
    note over Provider, FE: Sometime later: Provider refreshes page
    Provider->>FE: Visits Profile Page
    FE->>BE: GET /api/providers/{providerId}
    
    note over BE: Backend detects identityStatus="PENDING" & yotiName contains Session ID
    BE->>Didit: GET /v3/session/{sessionId}/decision/
    Didit-->>BE: 200 OK (status: "Approved", first_name, last_name, front_image, portrait_image)
    
    BE->>Didit: Download front_image & portrait_image files
    Didit-->>BE: Returns binary files
    BE->>BE: Write files to public/uploads/
    BE->>DB: Update Provider (identityStatus="APPROVED", yotiName="First Last", idCardImage, selfieImage)
    BE-->>FE: 200 OK (provider record updated)
    FE->>FE: Render green "Verified" Badge
```

---

### B. Professional Agreement / Card Verification Flow (FastAPI + LayoutLMv3 / Pyzbar)

This sequence maps how professional credentials are AI-verified (using local model or QR code decoding) and cross-matched against the Didit-verified name.

```mermaid
sequenceDiagram
    autonumber
    actor Provider as 👤 Provider
    participant FE as 📱 Next.js Frontend
    participant BE as 🖥️ Next.js Backend
    participant PyServer as 🐍 Python FastAPI Server (Port 8000)
    participant Model as 🤖 LayoutLMv3 Model (Regulated)
    participant Pyzbar as 🔍 pyzbar QR Decoder (Artisan/Auto-Ent)
    participant ModelDB as 💾 Agreements DB (certificates.db)
    participant AppDB as 💾 App Database (Prisma)

    Provider->>FE: Upload Professional Card / Agreement
    FE->>BE: POST /api/provider/verify-professional (image file)
    
    alt Category is Artisan or Auto-Entrepreneur (QR Path)
        BE->>PyServer: POST /verify-card-qr (form-data image)
        PyServer->>PyServer: cv2 image processing (Grayscale + Gaussian Blur + Adaptive Threshold)
        PyServer->>Pyzbar: Locate and decode QR code
        Pyzbar-->>PyServer: Returns decoded text (Name/ID)
        PyServer->>PyServer: Parse and clean name & ID
        PyServer-->>BE: 200 OK (status: success, extracted_data)
    else Category is Regulated Profession (LayoutLMv3 Path)
        BE->>PyServer: POST /verify-certificate (form-data image)
        PyServer->>PyServer: cv2 BGR2RGB image processing
        PyServer->>Model: Run token classification
        Model-->>PyServer: Returns tokens (FULL_NAME, ID, DATE)
        PyServer->>PyServer: Clean extracted text
        PyServer->>ModelDB: Query valid_certificates table (name & id)
        ModelDB-->>PyServer: Returns validation status (True/False)
        PyServer-->>BE: 200 OK (status: success, extracted_data, is_valid)
    end
    
    %% Cross-Matching
    note over BE: Compare extracted name with Didit-verified name (yotiName)
    BE->>BE: Check word inclusion between extracted name & yotiName (Min 2 matches)
    
    alt Name matches and verification is successful
        BE->>AppDB: Update Provider (licenseStatus/cnamCardStatus/anaeCardStatus="VERIFIED", certificateStatus="PENDING")
        BE-->>FE: 200 OK (success: true, message: "Credentials submitted and matched")
        FE->>FE: Display success status & PENDING final review message
    else Name mismatch or verification fails
        BE->>AppDB: Update Provider (licenseStatus/cnamCardStatus/anaeCardStatus="REJECTED")
        BE-->>FE: 200 OK (success: true, names_match: false, message: "Name mismatch")
        FE->>FE: Display rejection feedback
    end
```
