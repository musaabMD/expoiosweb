import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";

/**
 * Convex Auth configuration.
 *
 * Using Email OTP authentication.
 * In development mode, OTP codes are logged to the console.
 * For production, configure RESEND_API_KEY environment variable.
 */
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Email({
      id: "email",
      maxAge: 60 * 15, // 15 minutes
      generateVerificationToken: () => {
        // Generate a 6-digit numeric OTP code
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      sendVerificationRequest: async ({ identifier: email, provider, token }) => {
        // Development mode: log OTP to console
        console.log("\n==============================================");
        console.log(`📧 Email OTP for ${email}`);
        console.log(`🔑 Verification Code: ${token}`);
        console.log("==============================================\n");

        // In production, you would send an email here using Resend or another service
        // Example with Resend:
        // const { Resend } = require('resend');
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //   from: 'noreply@yourdomain.com',
        //   to: email,
        //   subject: 'Your verification code',
        //   html: `Your verification code is: ${token}`
        // });
      },
    }),
  ],
});
