import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CanvaComponent } from './canva/canva.component';
import { FloorSwitcherComponent } from './floor-switcher/floor-switcher.component';
import { GotoButtonComponent } from './goto-button/goto-button.component';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';
import { MapRoutingModule } from './map-routing.module';
import { MapComponent } from './map.component';
import { SearchComponent } from './search/search.component';
import { SwitchesDialogComponent } from './switches/switches-dialog/switches-dialog.component';
import { SwitchesComponent } from './switches/switches.component';
import { WhereaboutsComponent } from './whereabouts/whereabouts.component';

@NgModule({
  imports: [
    CommonModule,
    MapRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ZXingScannerModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  declarations: [
    MapComponent,
    SearchComponent,
    SwitchesComponent,
    CanvaComponent,
    FloorSwitcherComponent,
    GotoButtonComponent,
    WhereaboutsComponent,
    SwitchesDialogComponent,
    InfoDialogComponent,
  ],
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { floatLabel: 'always' } }]
})
export class MapModule { }
