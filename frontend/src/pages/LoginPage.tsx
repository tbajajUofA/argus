import { ArrowRight, BookOpen, Code2, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const ERRORS: Record<string, string> = {
  unauthorized: 'Your Google account is not authorized.',
  oauth_failed: 'Google sign-in failed. Please try again.',
};

const REPO_URL = 'https://github.com/justTej100/argus';

function GoogleIcon() {
  return (
    <svg className="login-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M5.3 14.3l-.8.6-2.7 2.1C3.5 20.1 7.4 22.5 12 22.5c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-5.9-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3.2 6.1A10.4 10.4 0 0 0 1.5 12c0 2.1.6 4 1.7 5.6l3.5-2.7C6.1 13.5 5.8 12.8 5.8 12c0-.8.3-1.6.7-2.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.3 14.7 1.5 12 1.5 7.4 1.5 3.5 3.9 1.8 7.7l3.5 2.7C6.9 7.2 9.2 5.3 12 5.3z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get('error');

  return (
    <div className="login-page">
      <div className="login-noise" aria-hidden />
      <div className="login-hero">
        <div className="login-mark" aria-hidden><BookOpen size={27} /></div>
        <p className="login-kicker">A calmer way to study</p>
        <h1 className="login-brand">ARGUS</h1>
        <p className="login-lead">
          Turn dense textbooks into a living feed, focused study packs, and source-linked answers.
        </p>
        <div className="login-features" aria-label="Highlights">
          <span><Sparkles size={15} aria-hidden /> Chapter insights</span>
          <span>Source-linked</span>
          <span>Built for focus</span>
        </div>
        {error && ERRORS[error] && <p className="login-error" role="alert">{ERRORS[error]}</p>}
        <a href="/auth/google" className="btn btn-primary login-google">
          <GoogleIcon />
          <span>Continue with Google</span>
          <ArrowRight size={17} aria-hidden />
        </a>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="login-repo">
          <Code2 size={15} aria-hidden /> View source
        </a>
      </div>
    </div>
  );
}
