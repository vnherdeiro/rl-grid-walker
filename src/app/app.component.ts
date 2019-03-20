import { Component } from '@angular/core';
import { Gridworld, QLearner} from './rl-logic.js';

var randRange = (min, max) => Math.floor(Math.random() * (max-min) + min)
// generates 2d array filled with zeroes
let zeros = (w, h, v = 0) => Array.from(new Array(h), _ => Array(w).fill(v));


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'rl-grid-walker';
  array: number[][];
  size:number = 9;
  nmines:number = 1;
  ntreats:number = 1;
  // mine_x:number;
  // mine_y:number;
  // treat_x:number;
  // treat_y:number;
  mines_coordinates = [];
  treats_coordinates = [];
  learningRate = 0.01;
  epsilon = 0.2;
  gamma=0.8;
  learner;
  mode:string;
  policy;

  constructor(){

    // console.log( this.array);
    // let size = 9;
    // this.size = size;
    // this.initializeWorld( size);
    // this.initializeMineAndTreat( size);
    // let world = new Gridworld( size, [this.mine_x, this.mine_y], [this.treat_x, this.treat_y]);
    // this.learner = new QLearner(world);
    // learner.train();
    // console.log( 'has trained', learner.policy());
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
    // let [mine_x, mine_y] = [randRange(0, size), randRange(0, size)];
    // let [treat_x, treat_y] = [mine_x, mine_y];
    // while (treat_x === mine_x && treat_y === mine_y){
    //   treat_x = randRange(0, size);
    //   treat_y = randRange(0, size);
    // }
    // this.mine_x = mine_x;
    // this.mine_y = mine_y;
    // this.treat_x = treat_x;
    // this.treat_y = treat_y;

    // generating the mines and treats
    this.mines_coordinates = [];
    this.treats_coordinates = [];
    for( let i = 0; i < this.nmines; i++){
      let new_coordinate = [randRange(0, size), randRange(0, size)];
      while (this.mines_coordinates.includes( new_coordinate)){
        new_coordinate = [randRange(0, size), randRange(0, size)];
      }
      this.mines_coordinates.push( new_coordinate);
    }
    for( let i = 0; i < this.ntreats; i++){
      let new_coordinate = [randRange(0, size), randRange(0, size)];
      while (this.mines_coordinates.includes( new_coordinate) || this.treats_coordinates.includes( new_coordinate)){
        new_coordinate = [randRange(0, size), randRange(0, size)];
      }
      this.treats_coordinates.push( new_coordinate);
    }
  }


  updatePolicy(){
  	// this.mode = this.mode === 'test' ? '' : 'test';
    // drawing policy
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

  trainMode(){
    // this.mode = this.mode === 'train' ? '' : 'train';
    this.learner.train();
    setTimeout( () => {this.updatePolicy();}, 1000);
    // console.log('done training')
  }
}
