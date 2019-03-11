import { FlatGridDataItem, FlatGridAxis, FlatGridAxisType, ScrollData } from './FlatGridData';

// TODO: Unit test all of this
export default class FlatGridHelper {

    public static getColumnCount(data: Array<FlatGridDataItem>, axes: Array<FlatGridAxis>): number {
        return FlatGridHelper._getAxisItemCount(data, axes, FlatGridAxisType.X);
    }

    public static getRowCount(data: Array<FlatGridDataItem>, axes: Array<FlatGridAxis>): number {
        return FlatGridHelper._getAxisItemCount(data, axes, FlatGridAxisType.Y);
    }

    private static _getAxisItemCount(
        data: Array<FlatGridDataItem>,
        axes: Array<FlatGridAxis>,
        axisString
    ): number {
        if (!data) {
            return 1;
        }
        let count = 1;

        axes.forEach(axis => {
            if (axis.axis == axisString) {
                count *= Object.keys(axis.values).length;
            }
        });
        return count;
    }

    public static getRowStyle(indexValues, xAxes, yAxes) {
        let colStart = FlatGridHelper.getStartPosition(xAxes, 1, indexValues);
        let rowStart = FlatGridHelper.getStartPosition(yAxes, 1, indexValues);

        let theStyle = {
            gridRow: rowStart,
            gridColumn: colStart
        };

        return theStyle;
    }

    public static getStartPosition(axes: Array<FlatGridAxis>, startIndex: number, indexValues: Array<string>) {
        let startPosition = startIndex;

        axes.sort((axis1, axis2) => axis1.axisIndex - axis2.axisIndex).forEach(axis => {
            let indexValueForThisAxis = indexValues[axis.dataIndex];

            // This index's place in the list of indexes (1st, 2nd, 3rd...?)
            let orderNumberOfThisIndexInTheAxis =
                axis.values[indexValueForThisAxis] && axis.values[indexValueForThisAxis].index
                    ? axis.values[indexValueForThisAxis].index
                    : 0;

            let numberOfValuesInTheNextAxisUp = 0;

            if (axis.axisIndex < axes.length - 1) {
                numberOfValuesInTheNextAxisUp =
                    Object.keys(axes[axis.axisIndex + 1].values).length || 0;
                startPosition += orderNumberOfThisIndexInTheAxis * numberOfValuesInTheNextAxisUp;
            } else {
                startPosition += orderNumberOfThisIndexInTheAxis;
            }
        });
        return startPosition;
    }

    public static getYAxisCount(axes: Array<FlatGridAxis>): number {
        return axes.filter(axis => axis.axis == FlatGridAxisType.Y).length;
    }

    public static getAllPossibleIndexes(axes: Array<FlatGridAxis>): Array<Array<string>> {
        let allIndexes = [];

        axes.forEach(axis => {
            let newAllIndexes = [];

            Object.keys(axis.values).forEach(axisValue => {
                if (allIndexes.length == 0) {
                    newAllIndexes.push([axisValue]);
                } else {
                    allIndexes.forEach(allIndex => {
                        let newIndexSet = allIndex.slice();
                        newIndexSet.push(axisValue);
                        newAllIndexes.push(newIndexSet);
                    });
                }
            });

            allIndexes = newAllIndexes.slice();
        });

        return allIndexes;
    }

    public static getIndexesWithNoData(
        axes: Array<FlatGridAxis>,
        data: Array<FlatGridDataItem>
    ): Array<Array<string>> {
        const dataDictionary = {};
        data.forEach(dataItem => {
            dataDictionary[dataItem.indexes.join('~')] = true;
        });

        const emptyCells = [];
        FlatGridHelper.getAllPossibleIndexes(axes).forEach(index => {
            if (dataDictionary[index.join('~')] != true) {
                emptyCells.push(index);
            }
        });

        return emptyCells;
    }

    public static getEmptyDataItems(
        axes: Array<FlatGridAxis>,
        data: Array<FlatGridDataItem>
    ): Array<FlatGridDataItem> {

        return FlatGridHelper.getIndexesWithNoData(axes, data)
            .map( indexSet => {
                return (
                    new FlatGridDataItem(indexSet, null, null)
                );
            });
    }

    public static getWindowFilteredData(
        data: Array<FlatGridDataItem>,
        axes: Array<FlatGridAxis>,
        scrollData: ScrollData,
        rowHeight: number,
        columnWidth: number
    ) {

        // TODO: Make this an option/prop?
        // The number of extra cells that are not visible that we want to render anyway
        const WINDOWING_FRAME_CELL_BUFFER = 1;

        const topLeftCell_X = Math.floor( scrollData.scrollLeft / columnWidth );
        const topLeftCell_Y = Math.floor( scrollData.scrollTop / rowHeight );

        // TODO: to get accurate numbers based on clientWidth/Height, we need to account for the headers,
        //   but that doesn't matter for now
        const bottomRightCell_X = topLeftCell_X + (scrollData.clientWidth / columnWidth);
        const bottomRightCell_Y = topLeftCell_Y + (scrollData.clientHeight / rowHeight);

        const xAxes = axes.filter((axis) => (axis.axis == FlatGridAxisType.X));
        const yAxes = axes.filter((axis) => (axis.axis == FlatGridAxisType.Y));

        const newDataArray = data.filter( dataItem => {

            const thisCellXPosition = FlatGridHelper.getStartPosition(xAxes, 1, dataItem.indexes);

            const colVisible = (thisCellXPosition >= (topLeftCell_X - WINDOWING_FRAME_CELL_BUFFER))
                && ( thisCellXPosition <= (bottomRightCell_X + WINDOWING_FRAME_CELL_BUFFER) );

            const thisCellYPosition = FlatGridHelper.getStartPosition(yAxes, 1, dataItem.indexes);

            const rowVisible = (thisCellYPosition >= (topLeftCell_Y - WINDOWING_FRAME_CELL_BUFFER))
                && ( thisCellYPosition <= (bottomRightCell_Y + WINDOWING_FRAME_CELL_BUFFER));

            return rowVisible && colVisible;
        });

        return newDataArray;
    }
}
