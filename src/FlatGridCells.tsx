import * as React from 'react';
import { FlatGridDataItem, FlatGridAxis, FlatGridAxisType } from './FlatGridData';
import FlatGridHelper from './FlatGridHelper';

interface IProps {
    axes: Array<FlatGridAxis>;
    data: Array<FlatGridDataItem>;
    defaultValueComponent: any;
    columnWidth: number;
    fillInEmptyCells: boolean;
}

interface IState {
}

export default class FlatGridCells extends React.Component<IProps, IState> {

    public shouldComponentUpdate(nextProps: IProps): boolean {
        return (nextProps.data != this.props.data)
            || (nextProps.axes != this.props.axes)
            || (nextProps.columnWidth != this.props.columnWidth);
    }

    public isCellStriped(indexSet: Array<string>, axes: Array<FlatGridAxis>): boolean {
        let stripeMe = false;
        axes.forEach( thisAxis => {
            if (thisAxis.isStriped) {
                let indexValue = indexSet[thisAxis.dataIndex];
                if (thisAxis.values[indexValue]) {
                    stripeMe = !!(thisAxis.values[indexValue].index % 2 == 0);
                }
            }
        });
        return stripeMe;
    }

    public getCellValues() {

        const axes: Array<FlatGridAxis> = this.props.axes;
        const data: Array<FlatGridDataItem> = this.props.data;

        if (!data) {
            return <div>nodata</div>;
        }

        const xAxes = axes.filter((axis) => (axis.axis == FlatGridAxisType.X));
        const yAxes = axes.filter((axis) => (axis.axis == FlatGridAxisType.Y));

        return data.map(dataItem => {

            let stripeMeX = this.isCellStriped(dataItem.indexes, xAxes);
            let stripeMeY = this.isCellStriped(dataItem.indexes, yAxes);

            return <div
                key={dataItem.indexes.join(',')}
                style={FlatGridHelper.getRowStyle(dataItem.indexes, xAxes, yAxes)}
                className={`flatgrid-cell flex ${(stripeMeX) ? 'stripe-x' : ''} ${(stripeMeY) ? 'stripe-y' : ''}`}
                data-indexes={dataItem.indexes.join('~')}
                data-grid-cell-x={FlatGridHelper.getStartPosition(xAxes, 1, dataItem.indexes)}
                data-grid-cell-y={FlatGridHelper.getStartPosition(yAxes, 1, dataItem.indexes)}
            >
                {
                    // TODO: how do we pass props dynamically instead of just using 'value'
                    (dataItem.component)
                        ? <dataItem.component value={dataItem.value} />
                        : (this.props.defaultValueComponent)
                            ? <this.props.defaultValueComponent value={dataItem.value} />
                            : <div className='flex-grow'>
                                {dataItem.value ? dataItem.value.toString() : null}
                            </div>
                }
            </div>;
        });

    }

    public render() {
        return (
            <div
                className='flatgrid flatgrid-container'
                style={{
                    gridTemplateColumns: `repeat(${FlatGridHelper.getColumnCount(this.props.data, this.props.axes)}, ${this.props.columnWidth}px)`,
                    gridTemplateRows: `repeat(${FlatGridHelper.getRowCount(this.props.data, this.props.axes)}, minmax(21px, 1fr))`,
                }}
            >
                {this.getCellValues()}
            </div>
        );
    }

}
