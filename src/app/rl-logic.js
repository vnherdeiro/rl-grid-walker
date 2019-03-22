/******************************
 * State, actions, transitions
 ******************************/
 class State {
   constructor(name, id) {
     this.name = name;
     this.id = id;
   }
 }

 class Action {
   constructor(name, id) {
     this.name = name;
     this.id = id;
   }
 }

 class Transition {
   constructor(fromState, action, toState, reward = 0) {
     this.action = action;
     this.fromState = fromState;
     this.toState = toState;
     this.reward = reward;
   }
 }

/******************************
 * State Machine
 ******************************/
 class StateMachine {
   constructor(states, actions) {
     this.states = states || [];
     this.actions = actions || [];
     this.transitions = {};
     this.goalState = 0;
   }

   addTransition(fromState, toState, action, reward) {
     let transitionsForState = this.transitions[fromState] || {};
     transitionsForState[this.actions[action].name] = new Transition(this.states[fromState], this.actions[action], this.states[toState], reward || 0);
     this.transitions[fromState] = transitionsForState;
   }

   takeStep(state, action) {  
    // Can this state take this action?
    const transition = this.transitions[state][action];
    if (transition) {
      //console.log(`${transition.fromState.name} ${action} ${transition.toState.name}`);
      state = transition.toState.id;
    } else {
      console.log(`${this.states[state].name} ${action}🚫`);
    }
    return state;
  }
  
  takeRandomStep(state) {
    // Pick a random action from the available ones
    const availableTransitions = this.transitions[state];
    const availableActions = Object.keys(availableTransitions)
    const action = availableActions[this.pickRandomNumber(availableActions.length)];
    return this.takeStep(state, action);
  }
  
  pickRandomNumber(num) {
    return Math.floor(Math.random() * num);
  }
  
  pickRandomState() {
    return this.pickRandomNumber(this.states.length);
  }
}


// This is a particular kind of state machine, which is 
// a grid that lets you move in all directions.
export class Gridworld extends StateMachine {
  constructor(size, mines_coordinates, treats_coordinates) {
    super();
    this.mines_coordinates = mines_coordinates.map( x => x[0]*size + x[1]);
    this.treats_coordinates = treats_coordinates.map( x => x[0]*size + x[1]);
    this.reset();
    this.init(size);
  }
  
  reset() {
    this.currentState = 0;
    this.goalState = this.treats_coordinates;
    this.mineState = this.mines_coordinates;
    this.score = 0;
    this.totalSteps = 1;
    this._running = false;
    this.policy = null;
  }
  
  start(slow = false) {
    this._running = true;
    this._run(slow);
  }
  
  stop() {
    this._running = false;
    clearTimeout(this._timer);
  }
  
  _run(slow = false) {
    this.totalSteps++;
    this.doStep();
    if (this._running) {
      this._timer = setTimeout(() => this._run(slow), slow ? 150 : 0);
    }
  }
  
  doStep() {
    // If we've learned a policy, use that, otherwise
    // just take a random step
    if (this.policy) {
      const bestAction = this.policy[this.currentState];
      const actionName = this.actions[bestAction].name;
      this.currentState = this.takeStep(this.currentState, actionName);
    } else {
      this.currentState = this.takeRandomStep(this.currentState);
    }

    if (this.goalState.includes(this.currentState)) {
      this.score++;
      // Start in a random state to make it interesting.
      this.currentState = this.pickRandomState();
    }
    if (this.mineState.includes(this.currentState)) {
      this.score--;
      // Start in a random state to make it interesting.
      this.currentState = this.pickRandomState();
    }

    // document.dispatchEvent(new CustomEvent('did-step'));
  }
  
  init(size) {
    this.actions = [new Action('⬆️', 0), new Action('⬇️', 1), new Action('⬅️', 2), new Action('➡️', 3)];
    
    // States
    for (let i = 0; i < size * size; i++) {
      this.states.push(new State(`s${i}`, i));
    }
    
    for (let i = 0; i < this.states.length; i++) {
      for (let j = 0; j < this.states.length; j++) {
        // const reward = (j === this.goalState) ? 1 : 0;
        let reward = 0;
        if ( this.goalState.includes(j)){
          reward = +1;
        }
        if ( this.mineState.includes(j)){
          reward = -1;
        }

        // i ⬆️ j (and it doesn't go in the negatives)
        if (i - j === size) {
          this.addTransition(i, j, 0, reward);
        }
        // i ⬇️ j 
        if (j - i === size) {
          this.addTransition(i, j, 1, reward);
        }
        // i ⬅️ j (and it doesn't wrap on the previous row)
        if (i - j === 1 && (j % size !== size - 1)) {
          this.addTransition(i, j, 2, reward);
        }
        // i ➡️ j (and it doesn't wrap on the next row)
        if (j - i === 1 && (j % size !== 0)) {
          this.addTransition(i, j, 3, reward);
        }
      }
    }
  }
}


/******************************
 In Reinforcement Learning, we train agents to learn
 from a particular state what actions are the best, so 
 that overall they profit.
 
 Q-learning is an algorithm that teaches the agent a value function 
 usually written Q(s,a). This is the value of taking an action from a state. 
 For example, if you're at the edge of the cliff and you go forward you die, 
 so you should learn pretty quickly that's a very expensive action that you
 should never take.
 
 The idea is that if you take enough steps to see the whole world, 
 and you take all actions from those steps, eventually you'll learn what
 to do in every step.
 ******************************/

 export class QLearner {
   constructor(world, alpha=0.04, epsilon=0.2, gamma=0.8) {
    // Algorithm configuration. Won't lie, these numbers
    // are usually magic, and take trying out different values
    // before you settle on good ones
    this.alpha = alpha;    // step size (how much progress we're actually making)
    this.epsilon = epsilon;  // probabily of taking a random action instead of the optimal one
    this.gamma = gamma;    // discount rate. it trades off the importance of sooner vs later rewards.
    
    this.world = world;
    this.reset();
  }
  
  reset() {
    // The value function.
    this.Q = {};
    
    // Initialize Q(s, a)
    // for all states s, and possible actions from that state,
    // set everything to a random number except for the 
    // goal state. You want random numbers so that you
    // don't accidentally bias the "prior" knowledge.
    for (let s = 0; s < this.world.states.length; s++) {
      const transitions = this.world.transitions[s];
      this.Q[s] = {};
      for (let a in transitions) {
        const transition = transitions[a]
        // Goal state?
        if (this.world.goalState.includes( transition.toState.id ) || this.world.mineState.includes( transition.toState.id )) {
          this.Q[s][transition.action.id] = 0;
        } else {
          this.Q[s][transition.action.id] = Math.random();
        }
      }
    }
  }

  trainStart(duration = 3000, isTraining){
    isTraining.next(true);
    this.currentState = this.world.pickRandomState();
    this._sequence = [];
    this._running = true;
    this.timer = setTimeout( () => this.trainStep());
    setTimeout( () => {this.trainStop(); isTraining.next(false)}, duration);
    // let resolve = () => {this.trainStop();};
    // await new Promise(resolve => setTimeout(resolve, duration));
  }
  
  trainStop(){
    this._running = false;
    clearTimeout( this.timer);
    console.log('done training');
  }

  trainStep() {
    // Initialize S: Pick a random starting state.
    
     // console.log(`training ${steps} steps`);
    // Take steps until you reach the goal.
    this.currentState = this.step(this.currentState);
    // For debugs, if you want to see what's happening.
    this._sequence.push(this.currentState);
    
    if (this.world.goalState.includes(this.currentState) || this.world.mineState.includes( this.currentState)) {
      // console.log('goal reached in training, restarting', this.currentState === this.world.goalState, this.currentState === this.world.mineState);
      this.currentState = this.world.pickRandomState();
      this._sequence = [];
    }
    if( this._running){
      this.timer = setTimeout( () => this.trainStep());
    }
  }
  
  step(state) {
    // Choose the best action from this state according to the policy.
    const bestAction = this.pickEpsilonGreedyAction(this.Q[state]);

    // Take the action A, and get a reward R and the next state S'.
    const actionName = this.world.actions[bestAction].name;
    const transition = this.world.transitions[state][actionName];

    // Update the value function according to this formula:
    // Q(S, A) = Q(S, A) + α[R + γ max_a Q(S', a) − Q(S, A)]
    // This basically means that if this action is good, then the next action
    // we can take after this should put us in a better place
    // in the world than where we are right now. If it doesn't,
    // then this action isn't good.
    // That's how you get to the goal!
    const bestActionForNextState = this.pickBestAction(this.Q[transition.toState.id]);
    const bestValueOfNextAction = this.Q[transition.toState.id][bestActionForNextState]
    
    // If we pretend our policy is optimal, then we can calculate what we should
    // make if we follow this policy at the next step.
    const learntReward = transition.reward + this.gamma * bestValueOfNextAction;
    // Remember: gamma trades off the importance of sooner versus later rewards.
    // This is the difference between the value of our place in the world and now.
    
    const stepValue = this.alpha * (learntReward - this.Q[state][bestAction]) 
    this.Q[state][bestAction] += stepValue; 
    
    // Go to the next state.
    //this.alpha -= 0.001;
    return transition.toState.id;
  }
  
  // The best action from each state.
  policy() {
    let policy = {};
    for (let s in this.Q) {
      policy[s] = this.pickBestAction(this.Q[s]);
    }
    return policy;
  }
  
  // Epsilon-greedy means that most of the time we pick the 
  // best action (we are "greedy"), but with epsilon probability we pick a 
  // random action
  pickEpsilonGreedyAction(values) {
    const randomNumber = Math.random();
    if (randomNumber < this.epsilon) {
      const actions = Object.keys(values);
      return actions[Math.floor(Math.random() * (actions.length-1))];
    } else {
      return this.pickBestAction(values);
    }
  }
  
  pickBestAction(values) {
    let highestValue = -1;
    let bestAction = -1;
    for (let action in values) {
      if (values[action] > highestValue) {
        highestValue = values[action];
        bestAction = action;
      }
    }
    return bestAction;
  }
  
}

