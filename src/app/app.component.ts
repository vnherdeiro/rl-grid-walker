import { Component } from '@angular/core';
import { Gridworld, QLearner} from './rl-logic.js';
import { MatSnackBar } from '@angular/material';
import { BehaviorSubject, Observable, interval, combineLatest} from 'rxjs';
import { map, pairwise, filter, tap, mapTo } from 'rxjs/operators';
import * as _ from 'lodash';

var randRange = (min, max) => Math.floor(Math.random() * (max-min) + min)
// generates 2d array filled with zeroes
var zeros = (w, h, v = 0) => Array.from(new Array(h), _ => Array(w).fill(v));

const max_size = 50;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'rl-grid-walker';
  Qarray:number[][] = undefined;
  size:number = 25; //9;
  nmines:number = 150;//0;
  ntreats:number = 11;//1;
  mines_coordinates = [];
  treats_coordinates = [];
  learningRate = 0.04;
  epsilon = 0.2;
  gamma = 0.8;
  learner;
  policy;
  trainingState = new BehaviorSubject<Number>(0);
  trainButtonMsg:Observable<string>;
  policy_update_sub;
  endOfTrainingObs;
  displayQ = true;

  constructor(private snackBar: MatSnackBar){
    this.trainButtonMsg = this.trainingState.asObservable().pipe( map( x => {
      if (x === 0){
        return 'Train';
      }
      if (x === 1){
        return 'Stopping...';
      }
      return 'Stop';
    })
    );
    // console.log('setting them up ');
    this.endOfTrainingObs = this.trainingState.pipe( pairwise(), filter( values => values[0] !== 0 && values[1] === 0));
    //update policy vis when training is finished
    this.endOfTrainingObs.subscribe( x => this.updatePolicy());
  }

  printInBar(message:string, duration:number=1000){
    this.snackBar.open( message, '', {duration: duration});
  }

  initializeWorld(){
    this.size = Math.min( max_size, this.size);
    let size = this.size;
    this.Qarray = zeros(this.size, this.size);
  }

  generateWorld(){
    this.policy = undefined;
    //if training, stop training
    this.initializeWorld();
    this.initializeMineAndTreat();
    let world = new Gridworld( this.size, this.mines_coordinates, this.treats_coordinates);
    this.learner = new QLearner(world, this.learningRate, this.epsilon, this.gamma);
  }

  changeLearningParams(){
    if (this.learner){
      this.learner.alpha = this.learningRate;    // step size (how much progress we're actually making)
      this.learner.epsilon = this.epsilon;  // probabily of taking a random action instead of the optimal one
      this.learner.gamma = this.gamma;    // discount rate. it trades off the importance of sooner vs later rewards.
    }
  }

  initializeMineAndTreat(){
    // generate random position for the mine and the treat
    let size = this.size;

    // forcing sanity of the number of mines + treats
    this.ntreats = Math.min( this.ntreats, size*size);
    this.nmines = Math.min( this.nmines, size*size - this.ntreats);

    // generating the mines and treats
    this.mines_coordinates = [];
    this.treats_coordinates = [];
    for( let i = 0; i < this.nmines; i++){
      let new_coordinate = [randRange(0, size), randRange(0, size)];
      while (this.mines_coordinates.some( x => _.isEqual(x, new_coordinate))){
        new_coordinate = [randRange(0, size), randRange(0, size)];
      }
      this.mines_coordinates.push( new_coordinate);
    }
    for( let i = 0; i < this.ntreats; i++){
      let new_coordinate = [randRange(0, size), randRange(0, size)];
      while (this.mines_coordinates.some( x =>  _.isEqual(x, new_coordinate)) || this.treats_coordinates.some( x =>  _.isEqual(x, new_coordinate))){
        new_coordinate = [randRange(0, size), randRange(0, size)];
      }
      this.treats_coordinates.push( new_coordinate);
    }
  }


  updatePolicy(){
    if( this.learner){
      this.updateQarray();
      let policy = this.learner.policy();
      let translated_policy = zeros(this.size, this.size);
      for( let key in Object.keys(policy)){
        let row = Math.floor( +key/this.size);
        let col = +key %this.size;
        // translated_policy[row] = translated_policy[row] || [];
        translated_policy[col][row] = +policy[key];
      }
      this.policy = translated_policy;
    }
    else{
      this.printInBar('Generate grid first', 500);
    }
  }


  updateQarray(){
    // if( this.learner){
      for( let key in Object.keys(this.learner.Q)){
        let row = Math.floor( +key/this.size);
        let col = +key %this.size;
        this.Qarray[col][row] = +Math.max( ...(Object.values( this.learner.Q[key]) as number[]));
      }
      // }
    }

    trainMode(){
      if ( this.trainingState.getValue() === 0){
        this.policy_update_sub = interval(1500).subscribe( x => this.updatePolicy());
        this.learner.trainStart(10000, this.trainingState);
      }
      else{
        this.trainingState.next(1);
        this.policy_update_sub.unsubscribe();
        this.learner.trainStop();
      }
    }

  }