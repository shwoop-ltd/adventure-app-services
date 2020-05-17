import Persistence from '../../../persistence';
import controller, { ApiResponse, ApiRequest } from '../../../controller';

interface Body {
  question: string;
  answer: string;
}

export async function finish_survey(event: ApiRequest, model: Persistence): Promise<ApiResponse> {
  if (!event.path || !event.path.user_id) {
    return { code: 400, body: 'Missing path parameters.' };
  }

  if (!event.body) {
    return { code: 400, body: 'Body not present' };
  }

  const { user_id } = event.path;

  if (!event.authorizer || user_id !== event.authorizer.claims.sub) {
    await model.telemetry.create('unusual-access', user_id);
    return { code: 401, body: 'Cannot access this user' };
  }

  await model.telemetry.create('finish-survey', user_id);

  const body = JSON.parse(event.body) as Body;

  // Does this user exist?
  const user = await model.user.get(user_id);
  if (!user) return { code: 401, body: 'User does not exist.' };

  const answered_questions = user.surveys.map(({ question }) => question);
  if (answered_questions.includes(body.question))
    return { code: 409, body: 'Question already completed or no question found.' };

  // TODO: Cache request?
  const surveys = await model.surveys.get();
  if (!surveys) {
    return { code: 502, body: 'Could not find survey' };
  }

  const answered_survey = surveys.surveys.find(({ question }) => question === body.question);
  if (!answered_survey) {
    return { code: 404, body: 'Survey does not exist' };
  }

  if (!answered_survey.answers.includes(body.answer)) {
    return { code: 400, body: 'Answer must be from one of the given options in the survey' };
  }

  user.surveys.push({ question: body.question, answer: body.answer });

  // TODO: Determine a prize to give to the user

  // Return the fraction of a prize they now have
  const { surveys_to_prize } = surveys.prize_given;
  const surveys_completed = user.surveys.length % surveys.prize_given.surveys_to_prize;
  if (surveys_completed === 0) {
    const prize = await model.prize.create(
      user.id,
      surveys.prize_given.prize,
      'survey',
      undefined,
      answered_survey.location
    );
    user.prizes.push(prize.id);

    // Update user info with the previously inserted survey
    await model.user.put(user);
    // Return the prize
    return { code: 201, body: prize };
  } else {
    const prize = {
      partial_prize: surveys.prize_given.prize,
      fraction_complete: (surveys_to_prize - surveys_completed) / surveys_to_prize,
    };

    await model.user.put(user);
    return { code: 200, body: prize };
  }
}

export const handler = controller(finish_survey);
