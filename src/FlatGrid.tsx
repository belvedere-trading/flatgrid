import * as React from 'react';
import ReactResizeDetector from 'react-resize-detector';

import './FlatGrid.css';
import {
    FlatGridDataItem,
    FlatGridAxis,
    FlatGridAxisType,
    ScrollData
} from './FlatGridData';
import FlatGridCells from './FlatGridCells';
import FlatGridHelper from './FlatGridHelper';

interface IProps {
    axes: Array<FlatGridAxis>;
    data: Array<FlatGridDataItem>;
    columnWidth: number;
    rowHeight: number;
    gridCornerComponent?: any;
    defaultValueComponent?: any;
    useWindowing?: boolean;
    fillInEmptyCells?: boolean;
}

interface IState {
    filteredData: Array<FlatGridDataItem>;
    xAxes: number;
    yAxes: number;
    yAxisLeft: number;
}

export default class FlatGrid extends React.Component<IProps, IState> {

    private flatGridContainerRef: any;

    constructor(props: IProps) {
        super(props);
        this.state = {
            filteredData: [],
            xAxes: 1,
            yAxes: 2,
            yAxisLeft: 0
        };
    }

    public componentDidMount() {
        this.updateFilteredData();
    }

    public componentDidUpdate(prevProps: IProps) {
        if (
            (prevProps.data != this.props.data)
            || (prevProps.axes != this.props.axes)
            || (prevProps.useWindowing != this.props.useWindowing)
        ) {
            this.updateFilteredData();
        }
    }

    public getScrollData(): ScrollData {
        return {
            clientHeight: this.flatGridContainerRef.clientHeight,
            clientWidth: this.flatGridContainerRef.clientWidth,
            scrollLeft: this.flatGridContainerRef.scrollLeft,
            scrollTop: this.flatGridContainerRef.scrollTop,
        };
    }

    public getNextIndexItemCount(thisAxis: FlatGridAxis, allAxes: Array<FlatGridAxis>) {
        let nextAxis = allAxes.find(
            axis => axis.axis == thisAxis.axis && axis.axisIndex == thisAxis.axisIndex + 1
        );
        if (!nextAxis) {
            return 1;
        }
        return Object.keys(nextAxis.values).length;
    }

    // TODO: Unit test this
    // TODO: separate the logic for getting row/column number from the styling aspect of this?
    public getLabelStyle(
        thisAxisValueIndex: number,
        offset = 0,
        thisAxis: FlatGridAxis,
        allAxes: Array<FlatGridAxis>
    ) {
        // TODO: Is there a type for react style?
        let theStyle: any = {};

        let xIndexCount = allAxes.filter(axis => axis.axis == FlatGridAxisType.X).length;

        let nextItemIndexItemCount = this.getNextIndexItemCount(thisAxis, allAxes);

        if (thisAxis.axis == FlatGridAxisType.X) {
            // the column is the number of y axes, push it over 1 column for each y axis label
            theStyle = {
                ...theStyle,
                gridColumn: `span ${nextItemIndexItemCount}`,
                gridRow: thisAxis.axisIndex + 1
            };
        }

        if (thisAxis.axis == FlatGridAxisType.Y) {
            let gridRowStart = xIndexCount + nextItemIndexItemCount * thisAxisValueIndex + offset;
            theStyle = {
                ...theStyle,
                gridColumn: `${thisAxis.axisIndex + 1}`,
                // row = number of x axes + 1
                gridRow: `${gridRowStart} / span ${nextItemIndexItemCount}`
            };
        }

        return theStyle;
    }

    public getAxisLabels(
        axis: FlatGridAxis,
        allAxes: Array<FlatGridAxis>,
        offset = 0,
        parentAxes: Array<string> = []
    ) {

        let labels = [];

        Object.keys(axis.values)
            .sort((axisA: string, axisB: string) => {
                return axis.values[axisA].index - axis.values[axisB].index;
            })
            .forEach((axisValueKey, axisValueIndex) => {
                let value = axis.values[axisValueKey];

                labels.push(
                    <div
                        key={`${axis.axis}-${axis.axisIndex}-${axisValueIndex}-${offset}-${axisValueKey}`}
                        style={this.getLabelStyle(axisValueIndex, offset, axis, this.props.axes)}
                        className={
                            axis.axis == FlatGridAxisType.X
                                ? 'flatgrid-x-label'
                                : 'flatgrid-y-label'
                        }
                        data-grid-header-axis={`${axis.axis}-${axisValueIndex}`}
                    >
                        {value.component ? (
                            <value.component value={value} axis={axis} parentAxes={parentAxes} />
                        ) : (
                            <div>{axisValueKey}</div>
                        )}
                    </div>
                );
                // if there are axes greater than this, then call this function on each of them here
                // find the next higher axis and get it here
                const nextAxis = allAxes.find(thisAxis => {
                    return thisAxis.axis == axis.axis && thisAxis.axisIndex == axis.axisIndex + 1;
                });

                if (nextAxis) {
                    const offsetIndex = axisValueIndex * Object.keys(nextAxis.values).length;
                    let thisParentAxes = [...parentAxes, axisValueKey];
                    const nextLabels = this.getAxisLabels(
                        nextAxis,
                        allAxes,
                        offsetIndex,
                        thisParentAxes
                    );
                    labels = labels.concat(nextLabels);
                }
            }, this);

        return labels;
    }

    public getAllAxisLabels(axisType: FlatGridAxisType, axes: Array<FlatGridAxis>, data: Array<FlatGridDataItem>) {
        if (!data || axes.length == 0) {
            return <div />;
        }

        // get the 0 axis
        const outerAxis = axes.find(thisAxis => {
            return thisAxis.axis == axisType && thisAxis.axisIndex == 0;
        });

        if (outerAxis) {
            return this.getAxisLabels(outerAxis, axes);
        } else {
            throw new Error(`Missing ${axisType} axis with axisIndex 0`);
        }
    }

    public getYAxisCount(): number {
        return this.props.axes.filter(axis => axis.axis == FlatGridAxisType.Y).length;
    }

    public getXAxisCount(): number {
        return this.props.axes.filter(axis => axis.axis == FlatGridAxisType.X).length;
    }

    public getColumnPercent(): string {
        const columnCount = FlatGridHelper.getColumnCount(this.props.data, this.props.axes);
        const columnDecimal = columnCount / (columnCount + this.getYAxisCount());
        return `${columnDecimal * 100}%`;
    }

    public updateFilteredData = () => {

        // Add empty cells to data
        let filteredData = (this.props.fillInEmptyCells)
                ? this.props.data.concat(
                    FlatGridHelper.getEmptyDataItems(this.props.axes, this.props.data)
                )
                : this.props.data.slice();

        if (this.props.useWindowing) {
            filteredData = FlatGridHelper.getWindowFilteredData(
                filteredData,
                this.props.axes,
                this.getScrollData(),
                this.props.rowHeight,
                this.props.columnWidth
            );
        }

        this.setState({filteredData});
    }


    public onScroll = () => {
        if ( this.props.useWindowing) {
            this.updateFilteredData();
        }
    }

    public onResize = () => {
        if ( this.props.useWindowing) {
            this.updateFilteredData();
        }
    }

    public render() {
        if (!this.props.data) {
            return null;
        }

        return (
            <div
                className='flatgrid flex flex-column width-full height-full'
                style={{ overflow: 'scroll' }}
                onScroll={this.onScroll}
                ref={ element => this.flatGridContainerRef = element }
            >
                <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />

                {/* Grid Y-axis/column header row */}
                <div
                    className='flatgrid flatgrid-container'
                    style={{
                        gridTemplateColumns: `repeat(${this.getYAxisCount()}, ${
                            this.props.columnWidth
                        }px) ${this.getColumnPercent()}`,
                        minWidth: 'max-content',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2
                    }}
                >
                    {/* Grid Corner */}
                    <div
                        className='bg-gray-light id-grid-corner'
                        style={{
                            gridColumnStart: 1,
                            gridColumnEnd: this.getYAxisCount() + 1,
                            left: 0,
                            position: 'sticky',
                            zIndex: 2
                        }}
                    >
                        {this.props.gridCornerComponent && (
                            <this.props.gridCornerComponent {...this.props} />
                        )}
                    </div>

                    {/* X-axis/Column Labels */}
                    <div
                        className='flatgrid flatgrid-header-container bg-gray-light'
                        style={{
                            gridTemplateColumns: `repeat(${FlatGridHelper.getColumnCount(
                                this.props.data,
                                this.props.axes
                            )}, ${this.props.columnWidth}px)`
                        }}
                    >
                        {this.getAllAxisLabels(FlatGridAxisType.X, this.props.axes, this.props.data)}
                    </div>
                </div>

                {/* Lower container, Y-axis headers and data grid */}
                <div style={{ minWidth: 'max-content' }}>
                    <div
                        className='flatgrid flatgrid-header-container'
                        style={{gridTemplateColumns: `${this.getYAxisCount() * this.props.columnWidth}px auto`}}
                    >
                        {/* Y-axis/Row Headers container */}
                        <div
                            className='flatgrid flatgrid-container flatgrid-header-axis-y bg-gray-light'
                            style={{
                                zIndex: 1,
                                position: 'sticky',
                                left: 0
                            }}
                        >
                            {this.getAllAxisLabels(FlatGridAxisType.Y, this.props.axes, this.props.data)}
                        </div>

                        <div>
                            <FlatGridCells
                                axes={this.props.axes}
                                data={this.state.filteredData}
                                defaultValueComponent={this.props.defaultValueComponent}
                                columnWidth={this.props.columnWidth}
                                fillInEmptyCells={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
