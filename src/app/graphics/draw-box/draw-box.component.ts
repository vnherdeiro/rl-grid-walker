import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
// let require;
// const rough = require('roughjs');
import {RoughCanvas} from 'roughjs/bin/canvas';
import * as colormap from 'colormap';
import * as _ from 'lodash';


@Component({
	selector: 'app-draw-box',
	templateUrl: './draw-box.component.html',
	styleUrls: ['./draw-box.component.css']
})
export class DrawBoxComponent implements OnInit {

	@ViewChild('canvas') canvas:ElementRef;
	@Input('array') array:number[][];
	@Input('mines_coordinates') mines_coordinates:number[][];
	@Input('treats_coordinates') treats_coordinates:number[][];
	@Input('policy') policy_data:number[][];
	@Input('colormap') cm_name = 'density';
	@Input('displayQ') displayQ:boolean;
	n_rows:number;
	n_cols:number;
	canvas_width:number = 700;
	canvas_height:number = 700;
	margin:number = 10;
	n_shades = 10;
	box_width:number;
	box_height:number;
	rc;
	cm;
	symbols = ['↑','↓','←','→'];


	constructor() { }

	ngOnInit() {
		// console.log( this.canvas);

		// console.log( rough);
		this.rc = new RoughCanvas(this.canvas.nativeElement);
		// rc.rectangle(10, 10, 200, 200); // x, y, width, height
		// this.canvas_height = this.canvas.nativeElement.height;
		// this.canvas_width = this.canvas.nativeElement.width;
		this.canvas.nativeElement.height = this.canvas_height;
		this.canvas.nativeElement.width = this.canvas_width;
		// define colormap function here
		this.cm = colormap({
			colormap: this.cm_name,
			nshades: this.n_shades,
			format: 'hex',
			alpha: 1
		});
		this.cm.reverse();
		// console.log( this.cm);
	}

	ngOnChanges(){
		// clearing
		if(this.array){
		this.n_rows = this.array.length;
		this.n_cols = this.array[0].length;
		this.box_width = Math.round( (this.canvas_width - 2*this.margin)/this.n_cols);
		this.box_height = Math.round( (this.canvas_height - 2*this.margin)/this.n_rows);
	}
		let ctx = this.canvas.nativeElement.getContext("2d");
		ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
		if( this.cm){
			this.drawArray();
		}
		if ( this.policy_data){
			this.drawPolicy();
		}
	}

	drawArray(){
		//rescale array to cm
		let max = Math.max(...this.array['flat']())*(1+1e-3); //sligth offset 
		let min = 0;
		let rescaleFunction = val => this.cm[Math.floor( this.n_shades* (val - min)/(max-min))];
		let cm_array = this.array.map( row => row.map(rescaleFunction));
		// console.log( cm_array);

		for(let i in this.array){
			for(let j in this.array[i]){
				if( this.mines_coordinates.every( x => x[0] !== +i || x[1] !== +j) && this.treats_coordinates.every( x => x[0] !== +i || x[1] !== +j)){
				this.rc.rectangle( this.margin + (+i)*this.box_width, this.margin + (+j)*this.box_height, this.box_width, this.box_height,  {
					fillStyle: 'cross-hatch',
					roughness: 2.5,
					fillWeight: 1.5,
					fill: this.displayQ ? cm_array[i][j]: '#ffffff'
				});
				// this.rc.rectangle( this.margin + (+i)*this.box_width, this.margin + (+j)*this.box_height, this.box_width, this.box_height,  { fill: cm_array[i][j] });
			}
		}
		}
		// drawing the mine
		for( let mine_coordinate of this.mines_coordinates){
		this.rc.rectangle( this.margin + mine_coordinate[0]*this.box_width, this.margin + mine_coordinate[1]*this.box_height, this.box_width, this.box_height,  {
			fillStyle: 'cross-hatch',
			roughness: 2.5,
			fillWeight: 1.5,
			fill: 'black'});
	}
		// drawing the target
		for( let treat_coordinate of this.treats_coordinates){
		this.rc.rectangle( this.margin + treat_coordinate[0]*this.box_width, this.margin + treat_coordinate[1]*this.box_height, this.box_width, this.box_height,  {
			fillStyle: 'cross-hatch',
			roughness: 2.5,
			fillWeight: 1.5,
			fill: 'gold'});
	}
	}

	drawPolicy(){
		// console.log('draw policy')
		let ctx = this.canvas.nativeElement.getContext("2d");
		ctx.textAlign = "center"; 
		ctx.textBaseline = "middle"; 
		ctx.font = "23px Arial"
		ctx.fillStyle = this.displayQ ? 'darkorange' : 'black';
		for(let i in this.policy_data){
			for(let j in this.policy_data[i]){
				// this.rc.path( this.margin + (+i)*this.box_width, this.margin + (+j)*this.box_height, this.box_width, this.box_height,  {
				// 	fillStyle: 'cross-hatch',
				// 	roughness: 2.5,
				// 	fillWeight: 1.5,
				// 	fill: cm_array[i][j] });
				// if ( ([+i,+j] as number[] != this.mine_position) && ([+i,+j] as number[] != this.treat_position)){
				if ( this.mines_coordinates.every( x => x[0] !== +i || x[1] !== +j) && this.treats_coordinates.every( x => x[0] !== +i || x[1] !== +j)){
				ctx.fillText( this.symbols[this.policy_data[i][j]] ,this.margin + (+i+0.5)*this.box_width, this.margin + (+j+0.5)*this.box_height);
			// }
			}
				// this.rc.rectangle( this.margin + (+i)*this.box_width, this.margin + (+j)*this.box_height, this.box_width, this.box_height,  { fill: cm_array[i][j] });
			}
		}	
	}

}
