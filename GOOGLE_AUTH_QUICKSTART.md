# Google Authentication Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install firebase dotenv firebase-tools
```

### Step 2: Update `.env` File
Edit `.env` in the root directory with your Firebase credentials:
```
GOOGLE_CLIENT_ID=62016617558
GOOGLE_CLIENT_SECRET=your-actual-secret-from-google-console
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
JWT_SECRET=your-super-secret-key-here
```

### Step 3: Get Your Google Secrets
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Download your OAuth 2.0 credentials (JSON file)
5. Copy `client_secret` from the JSON file
6. Update GOOGLE_CLIENT_SECRET in `.env`

### Step 4: Run Locally
```bash
npm start
```

Visit `http://localhost:3000` and click "Sign in with Google" button

---

## 📱 Adding Google Sign-In Button to Your Pages

### Option 1: Google Sign-In Button (HTML)
Add this to your login/register pages (e.g., `views/login.ejs`):

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
<div id="g_id_onload"
     data-client_id="62016617558"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>

<script>
  window.onload = function () {
    google.accounts.id.initialize({
      client_id: '62016617558'
    });
  };

  function handleCredentialResponse(response) {
    // The response token is sent to backend for verification
    fetch('/auth/google-firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential })
    }).then(res => {
      if (res.ok) window.location.href = '/dashboard';
    });
  }
</script>
```

### Option 2: Custom Button with Redirect
```html
<a href="/auth/google" class="btn btn-primary">
  <i class="fab fa-google"></i> Sign in with Google
</a>
```

---

## 🌐 Deployment to Render

### Step 1: Add Environment Variables to Render
1. Go to your Render Dashboard
2. Click on your service
3. Go to **Environment**
4. Add these variables:
   - `GOOGLE_CLIENT_ID` = 62016617558
   - `GOOGLE_CLIENT_SECRET` = (from Google Console)
   - `GOOGLE_REDIRECT_URI` = https://your-app.onrender.com/auth/google/callback
   - `JWT_SECRET` = (generate a strong random string)

### Step 2: Update Google Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **OAuth consent screen**
3. Add authorized redirect URIs:
   ```
   https://your-app.onrender.com/auth/google/callback
   ```

### Step 3: Deploy
```bash
git add .
git commit -m "Add Firebase and Google authentication"
git push origin main
```

---

## 🔒 Security Checklist

- [ ] Add `.env` to `.gitignore` (already done)
- [ ] Use strong `JWT_SECRET` (at least 32 characters)
- [ ] Update Google credentials regularly
- [ ] Use HTTPS in production
- [ ] Don't commit sensitive data to git
- [ ] Rotate credentials every 90 days
- [ ] Monitor authentication logs

---

## 🐛 Troubleshooting

### "Sign in with Google" button not showing
- Check browser console for errors
- Ensure `GOOGLE_CLIENT_ID` is correct
- Clear browser cache

### "Invalid redirect URI"
- Verify `GOOGLE_REDIRECT_URI` in `.env` matches Google Console
- For local: `http://localhost:3000/auth/google/callback`
- For production: `https://your-domain.onrender.com/auth/google/callback`

### User not being created after sign-in
- Check `database.db` file exists
- Verify users table was created
- Check server logs for errors

### Token verification failed
- Ensure `GOOGLE_CLIENT_ID` matches in Firebase and .env
- Check token hasn't expired
- Verify token issuer is correct

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Start OAuth2 flow |
| GET | `/auth/google/callback` | OAuth2 callback handler |
| POST | `/auth/google-firebase` | Firebase token verification |

---

## 📖 Full Documentation

For complete setup details, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## 🆘 Need Help?

- Firebase Docs: https://firebase.google.com/docs/auth
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Render Docs: https://render.com/docs
