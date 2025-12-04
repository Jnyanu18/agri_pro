
'use server';

import {
    createUserWithEmailAndPassword,
    getAuth,
    type AuthError,
} from 'firebase/auth';
import { initializeFirebase } from '..';
import { z } from 'zod';

const SignUpCredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export type SignUpCredentials = z.infer<typeof SignUpCredentialsSchema>;

export async function signUpWithEmailAndPassword(credentials: SignUpCredentials) {
    try {
        // Correctly initialize Firebase and get the Auth instance for a server-side context
        const { auth } = initializeFirebase();
        
        // Use the auth instance to create a new user
        const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
        
        return { success: true, userId: userCredential.user.uid };

    } catch (e) {
        const error = e as AuthError;
        let errorMessage = 'An unknown error occurred during registration.';
        
        // This specific error code is expected when the email is already in use.
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use. Please try logging in instead.';
        } else {
            // For debugging other potential auth errors in the future
            console.error('Firebase Auth Error:', error.code, error.message);
        }
        
        return { success: false, error: errorMessage };
    }
}
