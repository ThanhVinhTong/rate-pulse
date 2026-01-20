# API Test Commands (Windows CMD)

## Setup Environment Variables

First, set your token and base URL:

```cmd
set API_BASE_URL=http://localhost:8080
set TOKEN=v2.local.Lt92YCyIyP-NmP04IO9XJnBtErztTLBYVpKj_hlX98tuPvJwqF-WKSAE7HSMhCuhna400EL6TmLBluMqjMFxL6ZSHhfDJ1LDb2MPpU2yvvqJtgn8WVMk2ZDYC-LrvA0mQHdSKbPDwS3-ZVEgaLtoGnntpr-c5H5LmAFhWG2wwEBZ_gucCSchJ1PC17VGo0Weumi8HhmQFeHO4FtbOPF0vuCj6OwBxZpNFiW-PYpMOY3VvUa5w4p8XyInjGGHMARwCp04f5Dminqe7jLxnIxIXgkIJK2XdXJ3PKhg_lIKxSWk.bnVsbA
```

---

## User Authentication

### Create User
```cmd
curl -X POST %API_BASE_URL%/users -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\",\"user_type\":\"free\",\"email_verified\":false,\"time_zone\":\"UTC\",\"language_preference\":\"en\",\"country_of_residence\":\"Vietnam\",\"country_of_birth\":\"Vietnam\",\"is_active\":true}"
```

### Create Admin User
```cmd
curl -X POST %API_BASE_URL%/users -H "Content-Type: application/json" -d "{\"username\":\"adminuser\",\"email\":\"admin@example.com\",\"password\":\"admin123\",\"user_type\":\"admin\",\"email_verified\":true,\"time_zone\":\"UTC\",\"language_preference\":\"en\",\"is_active\":true}"
```

### Login User
```cmd
curl -X POST %API_BASE_URL%/users/login -H "Content-Type: application/json" -d "{\"username\":\"adminuser\",\"password\":\"admin123\"}"
```

### Get User by ID
```cmd
curl -X GET %API_BASE_URL%/users/1 -H "Authorization: Bearer %TOKEN%"
```

### List Users (Paginated)
```cmd
curl -X GET "%API_BASE_URL%/users?page_id=1&page_size=5" -H "Authorization: Bearer %TOKEN%"
```

### Health Check
```cmd
curl -X GET %API_BASE_URL%/health
```

---

## Currency APIs (Setup Test Data)

### Create USD Currency
```cmd
curl -X POST %API_BASE_URL%/currencies -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_code\":\"USD\",\"currency_name\":\"US Dollar\",\"currency_symbol\":\"$\"}"
```

### Create VND Currency
```cmd
curl -X POST %API_BASE_URL%/currencies -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_code\":\"VND\",\"currency_name\":\"Vietnamese Dong\",\"currency_symbol\":\"₫\"}"
```

### Create EUR Currency
```cmd
curl -X POST %API_BASE_URL%/currencies -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_code\":\"EUR\",\"currency_name\":\"Euro\",\"currency_symbol\":\"€\"}"
```

### Create GBP Currency
```cmd
curl -X POST %API_BASE_URL%/currencies -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_code\":\"GBP\",\"currency_name\":\"British Pound\",\"currency_symbol\":\"£\"}"
```

### Create JPY Currency
```cmd
curl -X POST %API_BASE_URL%/currencies -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_code\":\"JPY\",\"currency_name\":\"Japanese Yen\",\"currency_symbol\":\"¥\"}"
```

### Create AUD Currency
```cmd
curl -X POST %API_BASE_URL%/currencies -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_code\":\"AUD\",\"currency_name\":\"Australian Dollar\",\"currency_symbol\":\"A$\"}"
```

### Create CNY Currency
```cmd
curl -X POST %API_BASE_URL%/currencies -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_code\":\"CNY\",\"currency_name\":\"Chinese Yuan\",\"currency_symbol\":\"¥\"}"
```

### Get Currency by ID
```cmd
curl -X GET %API_BASE_URL%/currencies/1 -H "Authorization: Bearer %TOKEN%"
```

### List All Currencies (Paginated)
```cmd
curl -X GET "%API_BASE_URL%/currencies?page_id=1&page_size=10" -H "Authorization: Bearer %TOKEN%"
```

---

## Rate Source APIs (Setup Test Data)

### Create Rate Source - Vietcombank
```cmd
curl -X POST %API_BASE_URL%/rate-sources -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"source_name\":\"Vietcombank\",\"source_link\":\"https://vietcombank.com.vn\",\"source_country\":\"Vietnam\",\"source_status\":\"active\"}"
```

### Create Rate Source - ACB
```cmd
curl -X POST %API_BASE_URL%/rate-sources -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"source_name\":\"ACB Bank\",\"source_link\":\"https://acb.com.vn\",\"source_country\":\"Vietnam\",\"source_status\":\"active\"}"
```

### Get Rate Source by ID
```cmd
curl -X GET %API_BASE_URL%/rate-sources/1 -H "Authorization: Bearer %TOKEN%"
```

### List All Rate Sources (Paginated)
```cmd
curl -X GET "%API_BASE_URL%/rate-sources?page_id=1&page_size=10" -H "Authorization: Bearer %TOKEN%"
```

---

## Rate Source Preference APIs

### 1. Create Rate Source Preference
```cmd
curl -X POST %API_BASE_URL%/rate-source-preferences -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"source_id\":1,\"is_primary\":true}"
```

### 2. Get Rate Source Preferences by User ID (Paginated)
```cmd
curl -X GET "%API_BASE_URL%/rate-source-preferences-userid?page_id=1&page_size=5" -H "Authorization: Bearer %TOKEN%"
```

### 3. Get Rate Source Preferences by Source ID (Paginated)
```cmd
curl -X GET "%API_BASE_URL%/rate-source-preferences-sourceid?page_id=1&page_size=5" -H "Authorization: Bearer %TOKEN%"
```

### 4. List All Rate Source Preferences (Admin Only)
```cmd
curl -X GET "%API_BASE_URL%/rate-source-preferences?page_id=1&page_size=10" -H "Authorization: Bearer %TOKEN%"
```

### 5. Update Rate Source Preference
```cmd
curl -X PUT %API_BASE_URL%/rate-source-preferences/1 -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"is_primary\":false}"
```

### 6. Delete Rate Source Preference
```cmd
curl -X DELETE %API_BASE_URL%/rate-source-preferences/1 -H "Authorization: Bearer %TOKEN%"
```

---

## Currency Preference APIs

### 1. Create Currency Preference
```cmd
curl -X POST %API_BASE_URL%/currency-preference -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_id\":1,\"is_favorite\":true,\"display_order\":1}"
```

### 2. Get Currency Preferences by User ID (Paginated)
```cmd
curl -X GET "%API_BASE_URL%/currency-preference-userid?page_id=1&page_size=5" -H "Authorization: Bearer %TOKEN%"
```

### 3. Get Currency Preferences by Currency ID (Paginated)
```cmd
curl -X GET "%API_BASE_URL%/currency-preference-currid/1?page_id=1&page_size=5" -H "Authorization: Bearer %TOKEN%"
```

### 4. List All Currency Preferences (Admin Only)
```cmd
curl -X GET "%API_BASE_URL%/currency-preferences?page_id=1&page_size=10" -H "Authorization: Bearer %TOKEN%"
```

### 5. Update Currency Preference
```cmd
curl -X PUT %API_BASE_URL%/currency-preference/1 -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_id\":1,\"is_favorite\":false,\"display_order\":2}"
```

### 6. Delete Currency Preference
```cmd
curl -X DELETE %API_BASE_URL%/currency-preference/1 -H "Authorization: Bearer %TOKEN%"
```

---

## Testing Workflow Example

### Step 1: Start your server
```cmd
go run main.go
```

### Step 2: Set environment variables
```cmd
set API_BASE_URL=http://localhost:8080
```

### Step 3: Create a user (if not exists)
```cmd
curl -X POST %API_BASE_URL%/users -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\",\"user_type\":\"free\",\"email_verified\":false,\"is_active\":true}"
```

### Step 4: Login and get token (copy the access_token from response)
```cmd
curl -X POST %API_BASE_URL%/users/login -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"password\":\"password123\"}"
```

Response will look like:
```json
{
  "access_token": "v2.local.xxxxx...",
  "user": {...}
}
```

### Step 5: Set the token
```cmd
set TOKEN=paste_your_actual_access_token_here
```

### Step 6: Test endpoints
```cmd
curl -X POST %API_BASE_URL%/currency-preference -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"currency_id\":1,\"is_favorite\":true}"
```

---

## Notes

- Replace `your_token_here` with your actual access_token from login response
- Replace `localhost:8080` with your actual server address if different
- Page IDs start from 1
- Page size is between 5 and 10
- Admin-only endpoints require `user_type: "admin"` in token
- User types: `free`, `premium`, `enterprise`, `admin`
- For IDs in URL path, replace the number (e.g., `/1`) with actual IDs
- Username must be alphanumeric (no special characters)
- Required fields for user creation: `username`, `email`, `password`, `user_type`, `is_active`
- Optional fields: `email_verified`, `time_zone`, `language_preference`, `country_of_residence`, `country_of_birth`
