# Bitespeed Identity Reconciliation Service

A backend service built for Bitespeed that identifies and links customer contacts across multiple purchases. When a customer uses different email addresses or phone numbers, this service recognizes them as the same person and consolidates their contact information.

## Live API Endpoint

POST https://bite-speed-xvnq.onrender.com/identify

> Note: First request may take 30-50 seconds as the free tier server spins up after inactivity.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js v4
- **Database:** PostgreSQL
- **ORM:** Prisma v5
- **Hosting:** Render.com



## Project Structure

```
src/
├── app.ts                        # Express app setup and server start
├── routes/
│   └── identify.ts               # Route definitions
├── controllers/
│   └── identifyController.ts     # Request validation and response handling
├── services/
│   └── identifyService.ts        # Core reconciliation logic
└── db/
    └── client.ts                 # Prisma database connection
```


## How It Works

Every incoming request goes through this logic:

1. Search for existing contacts matching the email OR phone number
2. If nothing found → create a new primary contact
3. If match found with new information → create a secondary contact linked to the primary
4. If two separate primary contacts are found → merge them (older one stays primary)
5. If exact same request comes again → return existing data, no duplicate created

## Run Locally

**Prerequisites:** Node.js v18+, PostgreSQL

```bash
# Clone the repo
git clone https://github.com/Yatharth224/Bite-Speed
cd Bite-Speed

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your DATABASE_URL in .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Server will start at `http://localhost:3000`

## API Reference

### POST /identify

Identifies a customer and returns their consolidated contact information.

**Request Body:**
```json
{
  "email": "example@gmail.com",
  "phoneNumber": "9876543210"
}
```

- At least one of `email` or `phoneNumber` is required
- `phoneNumber` must be a valid 10 digit Indian mobile number (starts with 6, 7, 8 or 9)
- `email` must be a valid email format

**Success Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@gmail.com", "secondary@gmail.com"],
    "phoneNumbers": ["9876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Error Response (400):**
```json
{
  "error": "At least one of email or phoneNumber is required"
}
```

---

## Test Cases

### Test 1 - New Customer

Brand new email and phone, no existing contact in database.

**Request:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "9876543210"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["9876543210"],
    "secondaryContactIds": []
  }
}
```

---

### Test 2 - Same Phone, New Email → Secondary Created

Same phone number comes in with a different email. System links them.

**Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "9876543210"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["9876543210"],
    "secondaryContactIds": [2]
  }
}
```

---

### Test 3 - Same Request Again → No Duplicate

Sending the exact same request twice should not create a new contact.

**Request:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "9876543210"
}
```

**Response:** Same as Test 2 — no new contact created.

---

### Test 4 - Two Separate Primaries Get Merged

First create two separate primary contacts, then send a request that links them.

**Create second primary:**
```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "8765432109"
}
```

**Now link them:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "8765432109"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu", "george@hillvalley.edu"],
    "phoneNumbers": ["9876543210", "8765432109"],
    "secondaryContactIds": [2, 3]
  }
}
```

Older contact (id 1) stays primary. Newer contact (id 3) gets demoted to secondary.

---

### Test 5 - Validation: Invalid Phone

**Request:**
```json
{
  "email": "test@gmail.com",
  "phoneNumber": "123"
}
```

**Response (400):**
```json
{
  "error": "Please provide a valid 10 digit Indian mobile number"
}
```

---

### Test 6 - Validation: Invalid Email

**Request:**
```json
{
  "email": "notanemail",
  "phoneNumber": "9876543210"
}
```

**Response (400):**
```json
{
  "error": "Please provide a valid email address"
}
```

---

### Test 7 - Validation: Nothing Provided

**Request:**
```json
{}
```

**Response (400):**
```json
{
  "error": "At least one of email or phoneNumber is required"
}
```

---

## Health Check


GET https://bite-speed-xvnq.onrender.com/health