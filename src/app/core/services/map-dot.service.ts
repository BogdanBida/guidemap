import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Circle, Use } from '@svgdotjs/svg.js';
import { withLatestFrom } from 'rxjs/operators';
import { MapStairsFloorSwitcher } from '../enums';
import { GuideMapFeature, GuideMapRoomProperties } from '../models';
import { MapDotUtils, MapPointUtils } from '../utils';
import { FloorService } from './floor.service';
import { MapPathService } from './map-path.service';
import { MapService } from './map.service';

// TODO: for now we stairsFloorSwitcher only once on UI, we need to create new instance when will it need
// When new floors and other buildings will be add
// Also we need to update _onFloorSwitcherClick, when path will be build on middle floors

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
    this._subscribeOnStartPointChanges();
    this._subscribeOnFinalEndpointPointChanges();
  }

  private _subscribeOnStartPointChanges(): void {
    this._mapPathService.startPointFloorChanges$
      .pipe(
        withLatestFrom(
          this._mapPathService.calculatedPositiveStartPoint$,
          this._floorService.floor$,
          this._mapPathService.fullPathProperties$
        ),
        untilDestroyed(this)
      )
      .subscribe(
        ([, calculatedPositiveStartPoint, floor, fullPathProperties]) => {
          if (calculatedPositiveStartPoint.floor !== floor) {
            this.userDot?.remove();
            this.stairsFloorSwitcher?.remove();
          } else {
            this._drawStartPointDot(
              calculatedPositiveStartPoint,
              fullPathProperties
            );
          }
        }
      );
  }

  private _subscribeOnFinalEndpointPointChanges(): void {
    this._mapPathService.endPointFloorChanges$
      .pipe(
        withLatestFrom(
          this._mapPathService.calculatedPositiveEndPoint$,
          this._floorService.floor$,
          this._mapPathService.fullPathProperties$
        ),
        untilDestroyed(this)
      )
      .subscribe(
        ([, calculatedPositiveEndPoint, floor, fullPathProperties]) => {
          if (calculatedPositiveEndPoint.floor !== floor) {
            this.endpointDot?.remove();
            this.stairsFloorSwitcher?.remove();
          } else {
            this._drawEndPointDot(
              calculatedPositiveEndPoint,
              fullPathProperties
            );
          }
        }
      );
  }

  private _drawStartPointDot(
    startPoint: GuideMapRoomProperties,
    fullPathProperties: GuideMapFeature[]
  ): void {
    this.userDot = this._drawPoint(this.userDot, startPoint, false);
    this._drawFloorSwitcher(
      startPoint,
      this._mapPathService.currentUserEndpoint$.getValue(),
      fullPathProperties
    );
  }

  private _drawEndPointDot(
    endPoint: GuideMapRoomProperties,
    fullPathProperties: GuideMapFeature[]
  ): void {
    this.endpointDot = this._drawPoint(this.endpointDot, endPoint);
    this._drawFloorSwitcher(
      this._mapPathService.currentUserLocationPoint$.getValue(),
      endPoint,
      fullPathProperties
    );
  }

  private _drawPoint(
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
      const radius = 30;
      const maxRadius = 300;
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
        .animate({ duration: 1250 })
        .size(radius, radius)
        .attr({ fill: pointColor, opacity: 0.75 });

      dot.animate({ ease: '<' });

      dot
        .animate({ duration: 800, ease: '<>' })
        .loop(Infinity, true)
        .size(dotSize, dotSize)
        .attr({ opacity: 0.4 });
    }

    return dot;
  }

  private _drawFloorSwitcher(
    userLocation: GuideMapRoomProperties,
    endPoint: GuideMapRoomProperties,
    fullPathProperties: GuideMapFeature[]
  ): void {
    const currentFloor = this._floorService.floor;
    const isUserOnStairs = MapDotUtils.checkIsStairs(userLocation?.category);
    const isEndpointOnStairs = MapDotUtils.checkIsStairs(endPoint?.category);

    this.stairsFloorSwitcher?.remove();

    if (isUserOnStairs) {
      const arrowDirection = MapDotUtils.getPrevStairsArrowDirection(
        fullPathProperties,
        userLocation.id,
        currentFloor
      );

      this.stairsFloorSwitcher = this._drawArrow(userLocation, arrowDirection);

      return;
    }

    if (isEndpointOnStairs) {
      const arrowDirection = MapDotUtils.getNextStairsArrowDirection(
        fullPathProperties,
        endPoint.id,
        currentFloor
      );

      this.stairsFloorSwitcher = this._drawArrow(endPoint, arrowDirection);
    }
  }

  private _drawArrow(
    stairsPoint: GuideMapRoomProperties,
    arrowDirection: MapStairsFloorSwitcher
  ): Use {
    const arrowsSize = 92;
    const xOffset = arrowsSize / 2;
    const yOffset = 90;
    const arrowsOverStairsPointCoordinates = {
      x: stairsPoint.x - xOffset,
      y: stairsPoint.y - yOffset,
    };
    const arrowsStyles = `
      filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.5))
              drop-shadow(1px 3px 2px rgba(0, 0, 0, 0.4))
              drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
      pointer-events: all;
      cursor: pointer;
    `;

    const arrow = this._mapService.svgInstance
      .use(arrowDirection, 'assets/icons/sprite.svg')
      .attr('style', arrowsStyles)
      .size(arrowsSize, arrowsSize)
      .id(arrowDirection)
      .move(
        arrowsOverStairsPointCoordinates.x,
        arrowsOverStairsPointCoordinates.y
      )
      .click(() => this._onFloorSwitcherClick(arrowDirection));

    arrow
      .animate({ duration: 1000, ease: '<>' })
      .loop(Infinity, true)
      .move(
        arrowsOverStairsPointCoordinates.x,
        arrowsOverStairsPointCoordinates.y - 10
      );

    return arrow;
  }

  private _onFloorSwitcherClick(arrowDirection: MapStairsFloorSwitcher): void {
    const finalEndpoint = this._mapPathService.finalEndpoint$.getValue();
    const startPoint = this._mapPathService.startPoint$.getValue();
    const minFloor = Math.min(startPoint.floor, finalEndpoint.floor);
    const maxFloor = Math.max(startPoint.floor, finalEndpoint.floor);

    if (arrowDirection === MapStairsFloorSwitcher.ArrowUp) {
      this._floorService.floor = maxFloor;
    }

    if (arrowDirection === MapStairsFloorSwitcher.ArrowDown) {
      this._floorService.floor = minFloor;
    }
  }
}
