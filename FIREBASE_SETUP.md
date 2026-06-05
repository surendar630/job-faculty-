# Firebase and Google Authentication Setup Guide

## Overview
This application uses Firebase and Google OAuth2 for authentication. Both methods are already integrated into the server.

## Prerequisites

1. **Firebase Project**: job-faculty
   - Project ID: job-faculty
   - Authentication Domain: job-faculty.firebaseapp.com
   - Storage Bucket: job-faculty.firebasestorage.app

2. **Google Cloud Project**
   - Client ID: 62016617558
   - API Key: AIzaSyB_PLqF1qcEEhnrYaUA1k5Tsi61MW0xZS8

## Installation

### 1. Install Dependencies
```bash
npm install firebase
npm install -g firebase-tools
```

### 2. Setup Environment Variables

Create a `.env` file in the root directory with:
```
GOOGLE_CLIENT_ID=62016617558
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
JWT_SECRET=your-jwt-secret-key
OPENAI_API_KEY=your-openai-api-key
PORT=3000
NODE_ENV=development
```

### 3. Firebase Configuration

The Firebase config is already set up in `public/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB_PLqF1qcEEhnrYaUA1k5Tsi61MW0xZS8",
  authDomain: "job-faculty.firebaseapp.com",
  projectId: "job-faculty",
  storageBucket: "job-faculty.firebasestorage.app",
  messagingSenderId: "62016617558",
  appId: "1:62016617558:web:014890807abc948a928ff7",
  measurementId: "G-EM3X896YYN"
};
```

## Authentication Flow

### Option 1: OAuth2 Flow (Traditional)

1. User clicks "Sign in with Google" button
2. User is redirected to `/auth/google`
3. Google OAuth2 consent screen appears
4. User authorizes the application
5. Redirected to `/auth/google/callback` with authorization code
6. Server exchanges code for access token
7. Server retrieves user info from Google
8. User is created/updated in database
9. JWT token is issued and stored in cookie
10. User is redirected to dashboard

### Option 2: Firebase Authentication

1. User clicks "Sign in with Google (Firebase)" button
2. Firebase SDK opens Google sign-in popup
3. User authenticates with Google
4. Firebase returns ID token
5. Frontend sends ID token to `/auth/google-firebase` endpoint
6. Server verifies the token with Google
7. User is created/updated in database
8. JWT token is issued and stored in cookie
9. User is redirected to dashboard

## Enable Google Authentication in Firebase Console

### Step 1: Go to Firebase Console
1. Navigate to https://console.firebase.google.com/
2. Select your "job-faculty" project

### Step 2: Enable Google Sign-In
1. Go to **Authentication** → **Sign-in method**
2. Click on **Google**
3. Enable Google
4. Add your authorized domains:
   - localhost:3000
   - your-render-domain.onrender.com
5. Click **Save**

### Step 3: Configure OAuth Consent Screen
1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen:
   - App name: job-faculty
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
5. Add authorized redirect URIs:
   - http://localhost:3000/auth/google/callback
   - https://your-render-domain.onrender.com/auth/google/callback

### Step 4: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Create OAuth 2.0 Web Application credentials
3. Set Authorized JavaScript origins and redirect URIs
4. Copy Client ID and Client Secret
5. Update your `.env` file with these credentials

## Database Schema

The application automatically creates user accounts on first Google sign-in. Users table includes:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  profile_pic TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Google OAuth
- **GET** `/auth/google` - Initiates OAuth2 flow
- **GET** `/auth/google/callback` - OAuth2 callback handler

### Firebase Authentication
- **POST** `/auth/google-firebase` - Firebase token verification and user creation

### Standard Authentication
- **GET** `/login` - Login page
- **POST** `/login` - Login form submission
- **GET** `/hr-login` - HR login page
- **POST** `/hr-login` - HR login form submission

## Usage in Frontend

### HTML Button Implementation

```html
<!-- Google Sign-In Button -->
<div id="g_id_onload"
     data-client_id="62016617558"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>

<!-- Script -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Using Firebase SDK

```html
<script type="module">
  import { auth, googleProvider } from './firebase-config.js';
  import { signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send token to backend
      const response = await fetch('/auth/google-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idToken })
      });
      
      if (response.ok) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  }
</script>
```

## Deployment to Render

### 1. Set Environment Variables in Render Dashboard
- Go to your Render service
- Click on "Environment"
- Add all variables from your `.env` file:
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - GOOGLE_REDIRECT_URI (update with Render domain)
  - JWT_SECRET
  - etc.

### 2. Update Redirect URI for Production
In your Render Dashboard environment variables, update:
```
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/google/callback
```

### 3. Firebase Console Configuration
In Firebase Console:
1. Add your Render domain to authorized domains
2. Add Render redirect URI to OAuth credentials

### 4. Deploy
```bash
git add .
git commit -m "Add Firebase and Google authentication setup"
git push origin main
```

Render will automatically redeploy when you push changes.

## Troubleshooting

### "Token audience mismatch"
- Verify GOOGLE_CLIENT_ID in `.env` matches Firebase console
- Clear browser cache and cookies
- Re-authenticate

### "Invalid redirect URI"
- Ensure GOOGLE_REDIRECT_URI in `.env` matches OAuth consent screen
- For local development: http://localhost:3000/auth/google/callback
- For production: https://your-domain.onrender.com/auth/google/callback

### User not being created
- Check database file permissions
- Verify users table exists in database
- Check server logs for database errors

### Firebase SDK not loading
- Ensure `firebase-config.js` is in public folder
- Check browser console for CORS errors
- Verify Firebase project credentials are correct

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong JWT_SECRET** - At least 32 characters
3. **Rotate credentials regularly** - Update Google OAuth credentials every 90 days
4. **Use HTTPS in production** - Don't use HTTP redirect URIs
5. **Validate tokens server-side** - Always verify tokens with Google's servers
6. **Store sensitive data securely** - Use environment variables, not hardcoded values
7. **Update OAuth consent screen regularly** - Add accurate privacy policy and terms

## Next Steps

1. Update GOOGLE_CLIENT_SECRET with actual value from Google Cloud Console
2. Generate a strong JWT_SECRET
3. Test locally with `npm start`
4. Deploy to Render
5. Monitor server logs for authentication errors

For more information, see:
- Firebase Documentation: https://firebase.google.com/docs/auth
- Google OAuth2 Documentation: https://developers.google.com/identity/protocols/oauth2
- Render Deployment: https://render.com/docs
