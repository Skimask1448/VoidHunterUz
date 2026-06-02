/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy } from '../types';

export class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Enemy[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map<string, Enemy[]>();
  }

  public clear() {
    this.grid.clear();
  }

  private _key(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  public insert(obj: Enemy) {
    const k = this._key(obj.x, obj.y);
    if (!this.grid.has(k)) {
      this.grid.set(k, []);
    }
    this.grid.get(k)!.push(obj);
  }

  public query(x: number, y: number, radius: number): Enemy[] {
    const results: Enemy[] = [];
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const k = `${cx},${cy}`;
        const cell = this.grid.get(k);
        if (cell) {
          results.push(...cell);
        }
      }
    }
    return results;
  }
}
