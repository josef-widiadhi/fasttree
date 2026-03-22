# 🌳 FamilyTree

A beautiful, interactive family tree application with mindmap-style visualization, multi-user tree linking, and VCF import/export.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🗺️ **Mindmap Canvas** | Drag-and-drop interactive graph powered by React Flow |
| 👤 **Person Cards** | Name, nickname, gender, birthday, phone, address, email + unlimited custom fields |
| 🔗 **Tree Linking** | Invite family members by email; linked trees overlay on the same canvas |
| 📬 **Invitations** | Send/receive/accept/decline; shareable invite links |
| 👁️ **Visibility Control** | Mark each person as Private or Shared (visible to linked families) |
| 📥 **Import VCF** | Import contacts from Apple Contacts, Google Contacts, or any .vcf file |
| 📤 **Export VCF** | Export your whole tree as a .vcf contact book |
| 🔐 **Auth** | JWT-based login/register |
| 🐳 **Docker** | One-command startup with docker-compose |

---

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) + Docker Compose

### 1. Clone / extract the project
```bash
cd familytree
```

### 2. Configure environment (optional)
```bash
cp .env .env.local
# Edit .env to change passwords / secret key for production
```

### 3. Start everything
```bash
docker-compose up --build
```

### 4. Open the app
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## 🏗️ Architecture

```
familytree/
├── docker-compose.yml
├── .env
├── backend/                  # FastAPI (Python 3.12)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py           # App entry, CORS, lifespan
│       ├── core/
│       │   ├── config.py     # Settings from env
│       │   ├── database.py   # Async SQLAlchemy + PostgreSQL
│       │   └── security.py   # JWT, password hashing
│       ├── models/           # SQLAlchemy ORM models
│       │   ├── user.py
│       │   ├── person.py     # Person, Relation, TreeLink
│       │   └── invitation.py
│       ├── schemas/          # Pydantic request/response schemas
│       ├── services/         # Business logic
│       │   ├── user_service.py
│       │   ├── person_service.py   # VCF parse/export
│       │   └── invitation_service.py
│       └── api/              # FastAPI routers
│           ├── auth.py
│           ├── persons.py
│           └── invitations.py
└── frontend/                 # React 18 + Vite
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.jsx
        ├── utils/api.js      # Axios with auth interceptors
        ├── stores/           # Zustand state
        │   ├── authStore.js
        │   └── treeStore.js
        ├── components/
        │   ├── Layout.jsx        # Sidebar navigation
        │   ├── PersonNode.jsx    # React Flow custom node
        │   ├── PersonPanel.jsx   # Side panel: add/edit person
        │   ├── RelationModal.jsx # Link two people
        │   └── TreeToolbar.jsx   # Top toolbar buttons
        └── pages/
            ├── TreePage.jsx      # Main canvas (React Flow)
            ├── InvitePage.jsx    # Invitation management
            ├── AcceptInvitePage.jsx
            ├── LoginPage.jsx
            └── RegisterPage.jsx
```

---

## 🔑 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `familytree` | Database user |
| `POSTGRES_PASSWORD` | `familytree_secret` | Database password |
| `POSTGRES_DB` | `familytree` | Database name |
| `SECRET_KEY` | `super-secret-...` | JWT signing key — **change in production!** |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `VITE_API_URL` | `http://localhost:8000` | API base URL for frontend |

---

## 📡 API Overview

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, get JWT |
| `GET` | `/api/auth/me` | Current user info |

### Persons & Tree
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/persons/tree` | Get full tree (persons + relations) |
| `POST` | `/api/persons/` | Add a person |
| `PUT` | `/api/persons/{id}` | Update a person |
| `DELETE` | `/api/persons/{id}` | Delete a person |
| `POST` | `/api/persons/relations` | Add a relation |
| `DELETE` | `/api/persons/relations/{id}` | Remove a relation |
| `POST` | `/api/persons/positions` | Save node positions |
| `POST` | `/api/persons/import/vcf` | Import VCF file |
| `GET` | `/api/persons/export/vcf` | Export VCF file |

### Invitations
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/invitations/` | Send invitation |
| `GET` | `/api/invitations/sent` | List sent |
| `GET` | `/api/invitations/received` | List received |
| `GET` | `/api/invitations/token/{token}` | Get by token (public) |
| `POST` | `/api/invitations/accept` | Accept invitation |
| `POST` | `/api/invitations/decline/{token}` | Decline invitation |
| `GET` | `/api/invitations/linked-trees` | List linked families |
| `DELETE` | `/api/invitations/links/{id}` | Revoke link |

---

## 🗂️ VCF Import Guide

FamilyTree supports standard vCard 3.0/4.0 files.

**Google Contacts:** Contacts → Export → vCard format  
**Apple Contacts:** File → Export → Export vCard  
**Any .vcf file:** Drag into the import dialog

Fields automatically mapped: Full Name, Nickname, Birthday, Phone, Email, Address, Gender, Notes.

---

## 🌿 How Tree Linking Works

1. **Send** — Go to Invitations → Enter your relative's email → Send
2. **Share link** — Copy the invite link from "Sent" tab and share it directly
3. **Accept** — Recipient clicks the link and accepts (creates a TreeLink)
4. **Visibility** — Mark your persons as "Shared" so linked families can see them
5. **Revoke** — Remove a link at any time from the "Linked" tab

---

## 🛠️ Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL in .env to your local PostgreSQL
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## 🔒 Production Checklist

- [ ] Change `SECRET_KEY` to a random 64-char string
- [ ] Change `POSTGRES_PASSWORD` 
- [ ] Set `FRONTEND_URL` to your real domain
- [ ] Set `VITE_API_URL` to your real API URL
- [ ] Add HTTPS (nginx reverse proxy or load balancer)
- [ ] Set `ENVIRONMENT=production`
