import { InteractiveItem } from "./InteractiveItem"

type Plot = {
	plotting: boolean
	updateShape: ()=> void
	plot: ()=> void
}
export class PlotInterface extends InteractiveItem {
	static currentPlot: Plot
}