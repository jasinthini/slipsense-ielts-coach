import api from './api';

// Load published questions for the selected category.
export async function getWritingQuestions(category, offset = 0) {
  const response = await api.get('/writing/questions', {
    params: {
      category,
      offset,
      limit: 20,
    },
  });

  return response.data;
}

// Create a new draft or submit a new answer.
export async function createWritingAttempt({
  questionId,
  answer,
  elapsedSeconds,
  status = 'draft',
}) {
  const response = await api.post('/writing/attempts', {
    question_id: questionId,
    answer,
    elapsed_seconds: elapsedSeconds,
    status,
  });

  return response.data;
}

// Update an existing draft instead of creating duplicate drafts.
export async function updateWritingAttempt(
  attemptId,
  {
    questionId,
    answer,
    elapsedSeconds,
    status = 'draft',
  }
) {
  const response = await api.put(
    `/writing/attempts/${attemptId}`,
    {
      question_id: questionId,
      answer,
      elapsed_seconds: elapsedSeconds,
      status,
    }
  );

  return response.data;
}

// Load the student's saved practice history.
export async function getWritingAttempts(offset = 0) {
  const response = await api.get('/writing/attempts', {
    params: {
      offset,
      limit: 20,
    },
  });

  return response.data;
}

// Open one saved answer.
export async function getWritingAttempt(attemptId) {
  const response = await api.get(
    `/writing/attempts/${attemptId}`
  );

  return response.data;
}

// Load the original question for one saved answer.
export async function getWritingAttemptQuestion(attemptId) {
  const response = await api.get(
    `/writing/attempts/${attemptId}/question`
  );

  return response.data;
}