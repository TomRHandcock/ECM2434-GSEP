import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Question} from '../../gamemaster/gamemaster-main.component';
import {FormControl, FormGroup} from '@angular/forms';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFireDatabase} from '@angular/fire/database';

/**
 * A component to ask the user a short quiz for the given location.
 * Requires that teamId and questions be set.
 */
@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit {

  /**
   * The player's team ID.
   */
  @Input() teamId: string;

  /**
   * A list of questions to ask the player in order.
   */
  @Input() questions: Question[];

  /**
   * The current question number.
   */
  questionNumber = 0;
  /**
   * Multiple choice answers to the question.
   */
  answers: string[];
  /**
   * The answer which is correct.
   */
  correctAnswerId = 0;
  /**
   * Whether or not to display the correct answer.
   */
  showCorrectAnswer = false;
  /**
   * Form for the player to answer the question.
   */
  answerForm = new FormGroup({
    answer: new FormControl()
  });
  /**
   * Whether or not the next question button should be enabled.
   */
  nextQuestionEnabled = false;
  /**
   * This quiz's current score
   */
  score = 0;
  /**
   * The total score for this quiz.
   */
  @Output() finalScore = new EventEmitter<number>();

  constructor(private afAuth: AngularFireAuth, private db: AngularFireDatabase) {
  }

  /**
   * Get the current question from the list of questions and the question number.
   */
  get currentQuestion(): Question {
    return this.questions[this.questionNumber];
  }

  ngOnInit() {
    this.nextQuestion();
  }

  /**
   * Goes to the next question
   * @author AlexWesterman
   *
   * Minor revision: (Re)-enabling the answer upon a new question being displayed
   * @author TomRHandcock
   * @version 2
   *
   * Refactor in to QuizComponent
   * @author galexite
   * @version 3
   */
  nextQuestion() {
    this.nextQuestionEnabled = false;

    // Don't show the correct answer for the next question until the player has answered!
    this.showCorrectAnswer = false;

    // Test before we increment to avoid errors in console
    if (this.questionNumber + 1 >= this.questions.length) {
      this.finishQuiz();
      return;
    }

    this.questionNumber++;

    const newAnswers = this.currentQuestion.answer;

    this.answers = [
      newAnswers.correct,
      newAnswers.incorrect0,
      newAnswers.incorrect1,
      newAnswers.incorrect2
    ];

    // Shuffle the answer's position
    // A basic function that will sort (not the fairest but easily good enough for four elements)
    this.answers.sort(() => Math.random() - 0.5);

    // Identify which answer in the sorted list is the correct one.
    this.correctAnswerId = this.answers.findIndex(value => value === newAnswers.correct);

    // (Re)-enable the form answers
    this.answerForm.controls.answer.reset();
    this.answerForm.controls.answer.enable();
  }

  /**
   * This method is called when the current round of quiz questions has been finished,
   * the player's team is then found and the score for that team is updated.
   * @author AlexWesterman
   * @author TomRHandcock
   *
   * Refactored in to QuizComponent
   * @author galexite
   * @version 2
   */
  finishQuiz() {
    // TODO: show the player with their score for that round

    let teamCurrentScore;
    // Find out the teams current score
    this.db.database.ref('/team/' + this.teamId + '/score').once('value').then(data => {
      teamCurrentScore = data.toJSON();
      // Add the score obtained from this round to the score in the database
      this.db.database.ref('/team/' + this.teamId + '/score').set(teamCurrentScore + this.score).then(() => {
        // Database updated -> Send the player on back home
        this.finalScore.emit(this.score);
      });
    });
  }

  /**
   * This method check the player answer and disables the form to prevent changing the answer
   * @author TomRHandcock
   *
   * Refactored in to QuizComponent
   * @author
   * @version 2
   */
  verifyAnswer() {
    // First we disable the form for more inputs
    this.answerForm.controls.answer.disable();
    // Set up variables for the player/correct answer
    const playerAnswer = this.answerForm.value.answer;
    // Show the correct answer.
    this.showCorrectAnswer = true;

    if (playerAnswer === this.correctAnswerId) {
      this.score += 50;
    }

    // Enable next questions button
    this.nextQuestionEnabled = true;
  }

}
