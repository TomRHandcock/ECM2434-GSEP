import * as shortid from 'shortid';

export abstract class Table {
  static tableName: string;
}

export class User {
  ID: string;

  constructor(id: string) {
    this.ID = id;
  }
}

export class Game extends Table {
  static tableName = 'games';

  id = '';
  gameMaster: { [uid: string]: string } = {};
  location: Location[] = [];
  players: string[] = [];
  team: Team[] = [];

  constructor(id: string, gameMasterUid: string) {
    super();

    this.id = id;
    this.gameMaster[gameMasterUid] = gameMasterUid;

    const team = new Team('Gamemaster team');
    team.addPlayer(gameMasterUid);

    this.team = [team];
  }
}

export class Location extends Table {
  static tableName = 'location';

  latitude = 0.0;
  longitude = 0.0;
  name = '';
  questions: Question[] = [];
  description = '';
  hint = '';
}

export class Question extends Table {
  static tableName = 'location';

  question = '';
  answer = {
    correct: '',
    incorrect0: '',
    incorrect1: '',
    incorrect2: ''
  };
}

export class Team extends Table {
  static tableName = 'team';

  id = '';
  currentTarget = '';
  hintsUsed = 0;
  name = '';
  locationsCompleted = 0;
  nextTarget = 0;
  score = 0;
  players: string[] = [];

  constructor(name?: string) {
    super();
    this.id = shortid.generate();
    this.name = name || this.id;
  }

  addPlayer(uid: string): void {
    this.players.push(uid);
  }
}

export class Lost extends Table {
  static tableName = 'lost';

  id: number;
  lat: number;
  lon: number;
}
