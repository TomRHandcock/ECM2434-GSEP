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
  team: Team[];

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

  latitude: number;
  longitude: number;
  name: string;
  questions: Question[];
  description: string;
  hint: string;
}

export class Question extends Table {
  static tableName = 'location';

  question = '';
  answer: { [ans: string]: any } = {};
}

export class Team extends Table {
  static tableName = 'team';

  id = 0;
  currentTarget = '';
  hintsUsed = 0;
  name = '';
  locationsCompleted = 0;
  nextTarget = 0;
  score = 0;
  players: string[] = [];

  constructor(name?: string) {
    super();
    this.name = name || shortid.generate();
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
