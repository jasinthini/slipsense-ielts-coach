import api from './api';

export async function savePracticeAttempt(attempt) {
  const { data } = await api.post('/practice-history/attempts', attempt);
  return data;
}

export async function getPracticeAttempts(skill, offset = 0, limit = 20) {
  const { data } = await api.get('/practice-history/attempts', {
    params: { skill, offset, limit },
  });
  return data;
}