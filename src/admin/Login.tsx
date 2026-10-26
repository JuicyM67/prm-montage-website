import { useEffect, useState, type FormEvent } from 'react';
import { authClient } from './auth-client';
import { hideSplash } from './splash';

export default function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  // Redan inloggad → direkt in.
  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.user) window.location.replace('/admin');
      else hideSplash();
    }).catch(() => hideSplash());
    if (new URLSearchParams(window.location.search).get('error')) {
      setState('error');
      setError('Länken är ogiltig eller har gått ut. Begär en ny nedan.');
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    const { error: err } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: '/admin',
      errorCallbackURL: '/admin/login?error=1',
    });
    if (err) {
      setState('error');
      setError('Något gick fel. Försök igen om en stund.');
      return;
    }
    // Samma svar oavsett om adressen finns — vi avslöjar inte vilka som har konto.
    setState('sent');
  };

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <img src="/assets/img/logo/logo-color.webp" alt="PRM Montage" height={40} />
        {state === 'sent' ? (
          <>
            <h1 className="adm-h1">Kolla din e-post</h1>
            <p className="adm-sub">
              Finns <strong>{email}</strong> i systemet har vi skickat en inloggningslänk. Den gäller i 15 minuter.
            </p>
            <button type="button" className="adm-btn secondary" onClick={() => setState('idle')}>Använd en annan adress</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 className="adm-h1">Logga in</h1>
            <p className="adm-sub">Vi mejlar en inloggningslänk — inget lösenord behövs. Åtkomst sker via inbjudan.</p>
            {error && <div className="adm-alert error" role="alert">{error}</div>}
            <div className="adm-field">
              <label htmlFor="email">E-postadress</label>
              <input id="email" className="adm-input" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="adm-btn" disabled={state === 'sending'}>
              {state === 'sending' ? 'Skickar…' : 'Skicka inloggningslänk'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
