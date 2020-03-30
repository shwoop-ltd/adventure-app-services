import Model from './model';
import { Location } from './types';

export interface SurveyCollection {
  id: 'surveys';
  surveys: {
    question: string;
    answers: string[];
    location: Location;
  }[];
  prize_given: {
    prize: string;
    surveys_to_prize: number;
  };
}

export class SurveyModel extends Model {
  public get = () => this.driver.get_item<SurveyCollection>('surveys');
}
