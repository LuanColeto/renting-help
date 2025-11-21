import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDakcmPeDILvV03GywP4eBJzsfrCreq2PY",
  authDomain: "renting-help.firebaseapp.com",
  projectId: "renting-help",
  storageBucket: "renting-help.firebasestorage.app",
  messagingSenderId: "884406517172",
  appId: "1:884406517172:web:4274ecc09927f813b506e1",
  measurementId: "G-8GRZHB8C6Y"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
