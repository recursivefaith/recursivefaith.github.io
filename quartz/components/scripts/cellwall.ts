import { Graphics, Point } from "pixi.js"
import { polygonHull } from "d3-polygon"
import type { NodeData } from "./types"

const PADDING = 35 // The distance of the wall from the outer nodes.

export function drawCellWall(
  cellWallGfx: Graphics,
  nodes: NodeData[],
  width: number,
  height: number,
  color: string,
) {
  // 1. Filter out nodes that don't have a position yet.
  const points: [number, number][] = nodes
    .filter((node) => typeof node.x === "number" && typeof node.y === "number")
    .map((node) => [node.x! + width / 2, node.y! + height / 2])

  // A hull can't be computed for fewer than 3 points.
  if (points.length < 3) {
    cellWallGfx.clear()
    return
  }

  // 2. Calculate the convex hull from the node positions.
  const hull = polygonHull(points)
  if (!hull) {
    cellWallGfx.clear()
    return
  }
  
  // 3. Calculate the centroid to create an outward offset for padding.
  const centroid: [number, number] = [0, 0]
  for (const point of hull) {
    centroid[0] += point[0]
    centroid[1] += point[1]
  }
  centroid[0] /= hull.length
  centroid[1] /= hull.length

  const paddedHullPoints = hull.map((point) => {
    const vectorX = point[0] - centroid[0]
    const vectorY = point[1] - centroid[1]
    const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
    
    if (magnitude === 0) {
      return new Point(point[0], point[1]);
    }
    
    const newX = point[0] + (vectorX / magnitude) * PADDING
    const newY = point[1] + (vectorY / magnitude) * PADDING
    
    return new Point(newX, newY)
  })

  // 4. ✨ CORRECTED FOR V8: Build the shape first, then style it.
  cellWallGfx.clear()
  cellWallGfx
    .poly(paddedHullPoints) // 1. Define the shape using the correct v8 'poly' method.
    .fill({ color, alpha: 0.08 }) // 2. Apply the fill.
    .stroke({ width: 1.5, color, alpha: 0.3 }) // 3. Apply the stroke.
}
