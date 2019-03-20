import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DrawBoxComponent } from './graphics/draw-box/draw-box.component';

import { FormsModule } from '@angular/forms';
import { MatButtonModule,
        } from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    DrawBoxComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatButtonModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
