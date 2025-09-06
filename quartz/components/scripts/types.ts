import { SimulationNodeDatum } from "d3"
import { SimpleSlug } from "../../util/path"

// Move the NodeData type definition here and export it.
export type NodeData = {
  id: SimpleSlug
  text: string
  tags: string[]
} & SimulationNodeDatum