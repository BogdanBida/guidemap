import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isFinite } from 'lodash-es';
import { PanZoomAPI, PanZoomConfig, PanZoomModel } from 'ngx-panzoom';
import { ReplaySubject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import {
  CENTERING_DURATION_S,
  PANZOOM_CONFIG,
  VIEW_BOUNDING_RECT_INDENT,
} from 'src/app/shared/constants';
import { environment } from 'src/environments/environment';
import { ICoordinates } from '../interfaces';
import { CookieStoreService } from './cookie-store.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class PanZoomService {
  constructor(private readonly _cookieStoreService: CookieStoreService) {}

  public panZoomAPI: PanZoomAPI;

  public panzoomConfig: PanZoomConfig;

  public readonly model$ = new ReplaySubject<PanZoomModel>(1);

  public readonly api$ = new ReplaySubject<PanZoomAPI>(1);

  public zoomLevel$ = this.model$.pipe(
    filter((model) => isFinite(model.zoomLevel)),
    map((model) => Number(model.zoomLevel.toFixed(2)))
  );

  public isNaturalScale$ = this.zoomLevel$.pipe(
    map((value) => value === PANZOOM_CONFIG.neutralZoomLevel)
  );

  public isMaxZoom$ = this.isNaturalScale$;

  public isMinZoom$ = this.zoomLevel$.pipe(map((value) => value === 0));

  public init(): PanZoomConfig {
    const storedPanzoomConfigs = this._cookieStoreService.getPanZoomConfigs();

    this.panzoomConfig = new PanZoomConfig(
      Object.assign({}, PANZOOM_CONFIG, storedPanzoomConfigs)
    );

    const api$ = this.panzoomConfig.api;

    this.panzoomConfig.modelChanged
      .pipe(untilDestroyed(this))
      .subscribe(this._onModelChanges.bind(this));

    api$.pipe(untilDestroyed(this)).subscribe((api: PanZoomAPI) => {
      this.api$.next(api);
    });

    return this.panzoomConfig;
  }

  public centerTo(
    point: ICoordinates,
    duration: number = CENTERING_DURATION_S
  ): void {
    this._takeApi((api) => {
      api.panToPoint(point, duration);
    });
  }

  public resetView(): void {
    const centerPoint = {
      x: environment.map.mapWidth / 2,
      y: environment.map.mapHeight / 2,
    };

    this.centerTo(centerPoint, CENTERING_DURATION_S / 2);
  }

  public fitViewToBounds(dot1: ICoordinates, dot2: ICoordinates): void {
    const width = Math.abs(dot1.x - dot2.x);
    const height = Math.abs(dot1.y - dot2.y);

    this._takeApi((api) => {
      api.zoomToFit(
        {
          x: Math.min(dot1.x, dot2.x) - VIEW_BOUNDING_RECT_INDENT,
          y: Math.min(dot1.y, dot2.y) - VIEW_BOUNDING_RECT_INDENT,
          width: width + VIEW_BOUNDING_RECT_INDENT * 2,
          height: height + VIEW_BOUNDING_RECT_INDENT * 2,
        },
        CENTERING_DURATION_S
      );
    });
  }

  public zoomIn(): void {
    this._takeApi((api) => {
      api.zoomIn();
    });
  }

  public zoomOut(): void {
    this._takeApi((api) => {
      api.zoomOut();
    });
  }

  private _takeApi(callback: (api: PanZoomAPI) => void): void {
    this.api$.pipe(take(1)).subscribe(callback);
  }

  private _onModelChanges(model: PanZoomModel): void {
    this.model$.next(model);
    this._cookieStoreService.savePanPosition(model.pan);
    this._cookieStoreService.saveZoomLevel(model.zoomLevel);
  }
}
