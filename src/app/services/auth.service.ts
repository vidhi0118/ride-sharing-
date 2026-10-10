import { Injectable } from '@angular/core';
import { auth, db } from '../firebase/firebase.config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'passenger' | 'driver' | 'admin';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ===============================
  // 🔹 CURRENT USER
  // ===============================
  getCurrentUser(): Promise<User | null> {
    return new Promise(resolve => {
      onAuthStateChanged(auth, user => resolve(user));
    });
  }

  // ===============================
  // 🔹 ROLE FETCH
  // ===============================
  async getUserRole(uid: string): Promise<UserRole> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.data()?.['role'] as UserRole;
  }

  // ===============================
  // 🔐 LOGIN (USED AFTER OTP VERIFIED)
  // ===============================
  login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // ===============================
  // 🔐 SEND OTP (EMAIL VERIFICATION)
  // ===============================
  async sendOtp(email: string, password: string) {
    // Step 1: Sign in user temporarily
    const cred = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Step 2: Send OTP (email verification link)
    if (!cred.user.emailVerified) {
      await sendEmailVerification(cred.user);
    }

    return cred;
  }

  // ===============================
  // ✅ CHECK OTP VERIFIED
  // ===============================
  async isOtpVerified(): Promise<boolean> {
    if (!auth.currentUser) return false;

    // Reload user to get latest verification state
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  }

  // ===============================
  // 📝 REGISTER (OPTIONAL: SEND OTP AFTER REGISTER)
  // ===============================
  async register(
    name: string,
    email: string,
    password: string,
    phone: string,
    role: 'passenger' | 'driver',
    aadhaarVerified: boolean
  ) {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 🔐 Send OTP after registration
    await sendEmailVerification(userCred.user);

    await setDoc(doc(db, 'users', userCred.user.uid), {
      name,
      email,
      phone,
      role,
      aadhaarVerified,
      createdAt: new Date()
    });

    return userCred;
  }

  // ===============================
  // 🚪 LOGOUT
  // ===============================
  logout() {
    return signOut(auth);
  }
}
