export abstract class Table {
  static tableName: string;
}

export class User {
  ID: string;

  constructor(id: string) {
    this.ID = id;
  }
}

export class Location extends Table {
  static tableName = 'location';

  latitude: number;
  longitude: number;
  name: string;
  qrCode: string;
  questions: Question[];
  description: string;
  hint: string;
}

export class Question extends Table {
  static tableName = 'location';

  question: string;
  answer: { [ans: string]: any };
}

export class Team extends Table {
  static tableName = 'team';

  ID: number;
  name: string;
  score: number;
  players: User[];
}

export class Lost extends Table {
  static tableName = 'lost';

  ID: number;
  lat: number;
  lon: number;
}
