import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Circle, Use } from '@svgdotjs/svg.js';
import { GuideMapFeaturePointCategory, MapStairsFloorSwitcher } from '../enums';
import { GuideMapRoomProperties } from '../models';
import { MapPointUtils } from '../utils';
import { FloorService } from './floor.service';
import { MapPathService } from './map-path.service';
import { MapService } from './map.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MapDotService {
  constructor(
    private readonly _mapPathService: MapPathService,
    private readonly _mapService: MapService,
    private readonly _floorService: FloorService
  ) {}

  public userDot: Circle;

  public endpointDot: Circle;

  public stairsFloorSwitcher: Use;

  public init(): void {
    this._subscribeOnPathCoordinatesChanges();
  }

  public drawPoint(
    dot: Circle,
    location: GuideMapRoomProperties,
    isEndpoint = true
  ): Circle {
    const pointColor = MapPointUtils.getPointColor(
      location?.category,
      isEndpoint
    );

    if (dot) {
      dot.remove();
    }

    if (this._mapService.svgInstance && location) {
      const radius = 25;
      const maxRadius = 500;
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const maxRadiusHalf = maxRadius / 2;
      const dotSizeMaxAnimationRadius = 20;
      const dotSize = radius + dotSizeMaxAnimationRadius;
      const { x, y } = location;

      dot = this._mapService.svgInstance
        .circle(maxRadius)
        .attr({ fill: pointColor, opacity: 0 })
        .move(x - maxRadiusHalf, y - maxRadiusHalf);

      dot
        .animate({ duration: 2500 })
        .size(radius, radius)
        .attr({ fill: pointColor, opacity: 0.75 });

      dot.animate({ ease: '<' });

      dot
        .animate({ duration: 1000, ease: '<>' })
        .loop(Infinity, true)
        .size(dotSize, dotSize)
        .attr({ opacity: 0.4 });
    }

    return dot;
  }

  private _subscribeOnPathCoordinatesChanges(): void {
    this._mapPathService.pathCoordinatesChanges$
      .pipe(untilDestroyed(this))
      .subscribe(([userLocation, endPoint]) => {
        this.endpointDot = this.drawPoint(this.endpointDot, endPoint);
        this.userDot = this.drawPoint(this.userDot, userLocation, false);
        this._drawFloorSwitcher([userLocation, endPoint]);
      });
  }

  private _drawFloorSwitcher(points: GuideMapRoomProperties[]): void {
    const stairsPointIndex = points.findIndex(
      (point) => point?.category === GuideMapFeaturePointCategory.Stairs
    );

    this.stairsFloorSwitcher?.remove();

    const isShowDownArrow = stairsPointIndex === 0;
    const isShowArrowUp = stairsPointIndex > -1;

    if (isShowDownArrow) {
      this.stairsFloorSwitcher = this._drawArrow(
        points[stairsPointIndex],
        MapStairsFloorSwitcher.ArrowDown
      );

      return;
    }

    if (isShowArrowUp) {
      this.stairsFloorSwitcher = this._drawArrow(
        points[stairsPointIndex],
        MapStairsFloorSwitcher.ArrowUp
      );
    }
  }

  private _drawArrow(
    stairsPoint: GuideMapRoomProperties,
    arrowDirection: MapStairsFloorSwitcher
  ): Use {
    const xOffset = 25;
    const yOffset = 80;
    const arrowsOverStairsPointCoordinates = {
      x: stairsPoint.x - xOffset,
      y: stairsPoint.y - yOffset,
    };
    const arrowsSize = 50;
    const arrowsStyles = `
      filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.5))
              drop-shadow(1px 3px 2px rgba(0, 0, 0, 0.4))
              drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
      pointer-events: all;
      cursor: pointer;
    `;

    return this._mapService.svgInstance
      .use(arrowDirection, 'assets/icons/sprite.svg')
      .attr('style', arrowsStyles)
      .size(arrowsSize, arrowsSize)
      .id(arrowDirection)
      .move(
        arrowsOverStairsPointCoordinates.x,
        arrowsOverStairsPointCoordinates.y
      )
      .click(() => this._onFloorSwitcherClick(arrowDirection));
  }

  private _onFloorSwitcherClick(arrowDirection: MapStairsFloorSwitcher): void {
    if (arrowDirection === MapStairsFloorSwitcher.ArrowUp) {
      const finalEndpoint = this._mapPathService.finalEndpoint$.getValue();

      this._floorService.floor = finalEndpoint.floor;
    } else {
      const startPoint = this._mapPathService.startPoint$.getValue();

      this._floorService.floor = startPoint.floor;
    }
  }
}
