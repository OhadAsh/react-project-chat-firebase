import './App.css';
import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

type ChatMessageType = {
  id: string;
  text: string;
  uid: string;
  photoURL?: string;
};

interface ChatMessageProps {
  message: ChatMessageType;
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>💬</h1>
        <SignOut />
      </header>
      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div className="sign-in-container">
      <button className="google-sign-in" onClick={signInWithGoogle}>
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google Logo"
        />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
}

function SignOut() {
  return (
    auth.currentUser && <button onClick={() => auth.signOut()}>Sign Out</button>
  );
}

function ChatRoom() {
  const lastMessage = React.useRef<HTMLDivElement>(null);
  const messagesRef = collection(firestore, 'messages');
  const messagesQuery = query(messagesRef, orderBy('createdAt'), limit(25));
  const [messages] = useCollectionData(messagesQuery);
  const [formValue, setFormValue] = useState('');
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const { uid, photoURL } = currentUser;
    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });
    setFormValue('');
  };

  React.useEffect(() => {
    lastMessage.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  return (
    <>
      <main>
        {messages &&
          (messages as ChatMessageType[]).map(chatMsg => (
            <ChatMessage key={chatMsg.id} message={chatMsg} />
          ))}
        <div ref={lastMessage}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={e => setFormValue(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

function ChatMessage(props: ChatMessageProps) {
  const { text, uid, photoURL } = props.message;
  const currentUser = auth.currentUser;
  const messageClass =
    currentUser && uid === currentUser.uid ? 'sent' : 'received';
  return (
    <div className={`message ${messageClass}`}>
      <img
        src={
          photoURL ||
          'https://raw.githubusercontent.com/OhadAsh/react-project-chat-firebase/main/react-chat/public/default-user-icon.png'
        }
        alt="avatar"
        style={{ width: 40, height: 40, borderRadius: '50%' }}
      />
      <p>{text}</p>
    </div>
  );
}

export default App;
