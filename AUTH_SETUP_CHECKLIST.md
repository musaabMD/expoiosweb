# Authentication Setup Checklist

This document tracks the authentication provider setup for TestPrep app using Convex Auth.

## Current Status

- [x] Convex Auth installed and configured
- [x] Anonymous authentication (development/guest mode)
- [ ] Google OAuth
- [ ] Apple Sign In
- [ ] Email OTP (via Resend)

---

## 1. Google OAuth Setup

### Prerequisites
- Google Cloud Platform account
- Access to Google Cloud Console

### Steps

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable OAuth APIs**
   - Navigate to APIs & Services > Library
   - Enable "Google+ API" or "Google Identity Services"

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:8081` (development)
     - `https://your-app-domain.com` (production)
   - Add authorized redirect URIs:
     - `https://frugal-reindeer-352.convex.site/api/auth/callback/google` (dev)
     - `https://elegant-kookabura-424.convex.site/api/auth/callback/google` (prod)

4. **Set Environment Variables in Convex**
   ```bash
   npx convex env set AUTH_GOOGLE_ID "your-client-id.apps.googleusercontent.com"
   npx convex env set AUTH_GOOGLE_SECRET "your-client-secret"
   ```

5. **Update auth.ts** to include Google provider (code ready, just uncomment)

---

## 2. Apple Sign In Setup

### Prerequisites
- Apple Developer Program membership ($99/year)
- Access to Apple Developer Portal

### Steps

1. **Register App ID**
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Certificates, Identifiers & Profiles > Identifiers
   - Create new App ID with "Sign in with Apple" capability

2. **Create Service ID**
   - Identifiers > Service IDs
   - Create new Service ID
   - Configure Sign in with Apple:
     - Domain: `frugal-reindeer-352.convex.site` (dev) or your prod domain
     - Return URL: `https://frugal-reindeer-352.convex.site/api/auth/callback/apple`

3. **Create Private Key**
   - Keys > Create new key
   - Enable "Sign in with Apple"
   - Download the `.p8` file (save securely!)

4. **Generate Client Secret**
   - Apple uses JWT for client secrets
   - Use the private key to generate a JWT token
   - Tools like [this generator](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens) can help

5. **Set Environment Variables in Convex**
   ```bash
   npx convex env set AUTH_APPLE_ID "your-service-id"
   npx convex env set AUTH_APPLE_SECRET "your-generated-jwt-secret"
   ```

6. **Update auth.ts** to include Apple provider (code ready, just uncomment)

---

## 3. Email OTP Setup (Resend)

### Prerequisites
- Resend account (free tier available)
- Domain for sending emails (optional but recommended)

### Steps

1. **Create Resend Account**
   - Go to [Resend](https://resend.com/)
   - Sign up for free account

2. **Get API Key**
   - Dashboard > API Keys
   - Create new API key
   - Copy the key (shown only once!)

3. **Verify Domain (Recommended)**
   - Domains > Add Domain
   - Add DNS records to your domain
   - Wait for verification

4. **Set Environment Variables in Convex**
   ```bash
   npx convex env set AUTH_RESEND_KEY "re_xxxxxxxxx"
   npx convex env set AUTH_EMAIL_FROM "TestPrep <noreply@yourdomain.com>"
   ```

5. **Update auth.ts** to include Email OTP provider (code ready in backup)

---

## Implementation Notes

### Current auth.ts Configuration

The current setup uses Anonymous auth for development:

```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Anonymous],
});
```

### Full Configuration (after providers are set up)

```typescript
import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import Apple from "@auth/core/providers/apple";
import { Email } from "@convex-dev/auth/providers/Email";

const ResendOTPEmail = Email({
  id: "resend-otp",
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.AUTH_RESEND_KEY;
    const fromEmail = process.env.AUTH_EMAIL_FROM;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "Your TestPrep verification code",
        html: `<p>Your code is: <strong>${token}</strong></p>`,
      }),
    });
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
    ResendOTPEmail,
  ],
});
```

---

## Environment Variables Summary

| Variable | Provider | Example Value |
|----------|----------|---------------|
| `AUTH_GOOGLE_ID` | Google OAuth | `123456789.apps.googleusercontent.com` |
| `AUTH_GOOGLE_SECRET` | Google OAuth | `GOCSPX-xxxxx` |
| `AUTH_APPLE_ID` | Apple Sign In | `com.yourapp.signin` |
| `AUTH_APPLE_SECRET` | Apple Sign In | `eyJhbGciOiJFUzI1NiIsInR5...` |
| `AUTH_RESEND_KEY` | Email OTP | `re_123456789` |
| `AUTH_EMAIL_FROM` | Email OTP | `TestPrep <noreply@testprep.com>` |

---

## Testing

After setting up each provider:

1. Run `npx convex dev` to deploy changes
2. Test sign-in flow in the app
3. Check Convex dashboard for auth logs
4. Verify user records are created in the database

---

## Troubleshooting

### Google OAuth Issues
- Check redirect URIs match exactly
- Ensure OAuth consent screen is configured
- Check if app is in testing mode (limited users)

### Apple Sign In Issues
- Verify Service ID domain configuration
- Check private key hasn't expired
- Ensure return URL matches exactly

### Email OTP Issues
- Verify Resend API key is valid
- Check domain is verified in Resend
- Look at Resend dashboard for delivery logs

---

## Resources

- [Convex Auth Documentation](https://docs.convex.dev/auth)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Resend Documentation](https://resend.com/docs)
