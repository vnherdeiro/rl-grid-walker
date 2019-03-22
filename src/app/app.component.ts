import { Component } from '@angular/core';
import { Gridworld, QLearner} from './rl-logic.js';
import {MatSnackBar} from '@angular/material';
import { BehaviorSubject} from 'rxjs';
import * as _ from 'lodash';

var randRange = (min, max) => Math.floor(Math.random() * (max-min) + min)
// generates 2d array filled with zeroes
var zeros = (w, h, v = 0) => Array.from(new Array(h), _ => Array(w).fill(v));


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'rl-grid-walker';
  array:number[][];
  size:number = 9;
  nmines:number = 1;
  ntreats:number = 1;
  mines_coordinates = [];
  treats_coordinates = [];
  learningRate = 0.01;
  epsilon = 0.2;
  gamma = 0.8;
  learner;
  policy;
  isTraining = new BehaviorSubject<boolean>(false);

  constructor(private snackBar: MatSnackBar){
  }

  printInBar(message:string, duration:number=1000){
    this.snackBar.open( message, '', {duration: duration});
  }

  initializeWorld(){
    let size = this.size;
    this.array = [];
    for( let i = 0; i < size; i++){
      let temp = [];
      for( let j = 0; j < size; j++){
        temp.push( 0);
        // temp.push( Math.random());
      }
      this.array.push( temp);
    } 
  }

  generateWorld(){
    this.policy = undefined;
    this.initializeWorld();
    this.initializeMineAndTreat();
    let world = new Gridworld( this.size, this.mines_coordinates, this.treats_coordinates);
    this.learner = new QLearner(world, this.learningRate, this.epsilon, this.gamma);
  }

  initializeMineAndTreat(){
    // generate random position for the mine and the treat
    let size = this.size;

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
  	// this.mode = this.mode === 'test' ? '' : 'test';
    // drawing policy
    if( this.learner){
      let policy = this.learner.policy();
      let translated_policy = zeros(this.size, this.size);
      for( let key in Object.keys(policy)){
        let row = Math.floor( +key/this.size);
        let col = +key %this.size;
        // translated_policy[row] = translated_policy[row] || [];
        translated_policy[row][col] = +policy[key];
      }
      // console.log( translated_policy)
      this.policy = translated_policy;
    }
    else{
      this.printInBar('Generate grid first', 500);
    }
  }

  trainMode(){
    if( this.learner){
      let training_duration = 2000;
      this.learner.trainStart(training_duration, this.isTraining);
      // setTimeout( () => {this.updatePolicy();}, 1000);
    }
    else{
      this.printInBar('Generate grid first', 500);
    }
    // console.log('done training')
  }
}
