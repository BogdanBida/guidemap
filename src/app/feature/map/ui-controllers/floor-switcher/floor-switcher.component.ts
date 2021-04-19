import { Component, HostListener } from '@angular/core';
import { FloorService } from '../../../../core/services';

@Component({
  selector: 'app-floor-switcher',
  templateUrl: './floor-switcher.component.html',
  styleUrls: ['./floor-switcher.component.scss']
})
export class FloorSwitcherComponent {
  @HostListener('window:keyup', ['$event'])
  private keyEvent(event: KeyboardEvent): void {
    event.key === 'ArrowUp' && this.upFloor();
    event.key === 'ArrowDown' && this.downFloor();
  }

  constructor(public floorService: FloorService) { }

  public upFloor(): void {
    this.floorService.floor++;
  }

  public downFloor(): void {
    this.floorService.floor--;
  }

}
