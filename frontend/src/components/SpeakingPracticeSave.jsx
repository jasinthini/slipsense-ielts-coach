import { useRef, useState } from 'react';
import { savePracticeAttempt } from '../services/practiceHistory';

export default function SpeakingPracticeSave({ title, seconds }) {
  const [status, setStatus] = useState('idle');
  const savingRef = useRef(false);

  async function handleSave() {
    if (savingRef.current || status === 'saved') return;

    savingRef.current = true;
    setStatus('saving');

    try {
      await savePracticeAttempt({
        skill: 'speaking',
        title,
        elapsed_seconds: Math.max(0, Math.floor(seconds || 0)),
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      savingRef.current = false;
    }
  }

  const buttonLabel = {
    idle: 'Save practice',
    saving: 'Saving…',
    saved: 'Practice saved',
    error: 'Retry save',
  }[status];

  return (
    <div>
      <button
        type="button"
        onClick={handleSave}
        disabled={status === 'saving' || status === 'saved'}
      >
        {buttonLabel}
      </button>

      <p role="status">
        {status === 'saved' && 'Saved to practice history.'}
        {status === 'error' && 'Could not save this practice. Please try again.'}
      </p>
    </div>
  );
}