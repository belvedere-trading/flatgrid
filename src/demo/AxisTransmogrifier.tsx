import * as React from 'react';
import { DragDropContext, DropTarget, DragSource } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import { FlatGridAxis, FlatGridAxisType } from '../FlatGridData';


interface IProps {
    axes: Array<FlatGridAxis>;
    onAxesChanged: Function;
}

interface IState {
}

@DragDropContext(HTML5Backend)
export default class AxisTransmogrifier extends React.Component<IProps, IState> {

    public getAxis(axisDirection: FlatGridAxisType, axisIndex: number) {
        return this.props.axes.find((axis: any) => {
            return (axis.axis == axisDirection) && (axis.axisIndex == axisIndex);
        });
    }

    public getAxisSockets(axis: FlatGridAxisType, classNames: string) {
        let axisShapeObj = new AxisShape();

        this.props.axes.forEach(thisAxis => axisShapeObj[thisAxis.axis].push(thisAxis));

        if (axisShapeObj[axis].length == 2) {
            return (
                <div className={classNames}>
                    <AxisSocket
                        allAxes={this.props.axes}
                        axis={this.getAxis(axis, 0)}
                        axisDirection={axis}
                        axisIndex={0}
                        onAxesChanged={this.props.onAxesChanged}
                    />
                    <AxisSocket
                        allAxes={this.props.axes}
                        axis={this.getAxis(axis, 1)}
                        axisDirection={axis}
                        axisIndex={1}
                        onAxesChanged={this.props.onAxesChanged}
                    />
                </div>
            );
        } else {
            return (
                <div className={classNames}>
                    <AxisSocket
                        allAxes={this.props.axes}
                        axis={this.getAxis(axis, 1)}
                        axisDirection={axis}
                        axisIndex={1}
                        onAxesChanged={this.props.onAxesChanged}
                    />
                    <AxisSocket
                        allAxes={this.props.axes}
                        axis={this.getAxis(axis, 0)}
                        axisDirection={axis}
                        axisIndex={0}
                        onAxesChanged={this.props.onAxesChanged}
                    />
                </div>
            );
        }
    }

    public render() {
        return (
            <div className='flex flex-row bg-gray-lighter m-r-sm m-b-sm p-xs p-3'>

                <div
                    style={{ height: '225px' }}
                    className='flex flex-row'
                >
                    {this.getAxisSockets(FlatGridAxisType.Y, 'flex flex-row')}
                </div>

                <div className='flex flex-column flex-grow'>
                    {this.getAxisSockets(FlatGridAxisType.X, 'flex flex-column')}

                    <div className='flex flex-grow flex-justify-center bg-white shadow-light'>
                        <div className='flex flex-column flex-justify-center eyebrow info'>
                            Data
                        </div>
                    </div>
                </div>

            </div>
        );
    }

}

const AxisPlugSource = {
    beginDrag(props) {
        return {
            axis: props.axis
        };
    }
};

@DragSource('AXISPLUG', AxisPlugSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType()
}))
class AxisPlug extends React.Component<{ axis: any, connectDragSource?: Function }, {}> {
    public render() {
        return this.props.connectDragSource(
            <div
                style={{ cursor: 'move' }}
            >
                <span className='glyphicon glyphicon-move p-r-xs' style={{cursor: 'move'}} />{this.props.axis.name}
            </div>
        );
    }
}




interface IPropsAxisSocket {
    allAxes: any;
    axis: any;
    axisDirection: string;
    axisIndex: number;
    connectDropTarget?: any;
    isOver?: boolean;
    onAxesChanged: Function;
}
const AxisSocketSource = {
    drop(props, monitor, component) {
        let droppedAxis = monitor.getItem().axis;

        let targetAxisDirection = props.axisDirection;
        let targetAxisIndex = props.axisIndex;
        let allAxes = props.allAxes;


        let dropTargetAxis = allAxes.find(axis => {
            return (
                (axis.axis == targetAxisDirection)
                && (axis.axisIndex == targetAxisIndex)
            );
        });

        // If the item is dragged and dropped on top of itself, we don't need to do anything
        if (dropTargetAxis && dropTargetAxis.dataIndex == droppedAxis.dataIndex) {
            return;
        }

        // This means the drop target is empty,
        //   which means it's the outer box and ther's another axis in the inner box
        //   so we want the dropped axes to be 0 (outer-most axis)
        //   and the current axis at index 0 to be moved to 1 (inner-most index)
        if (!dropTargetAxis) {

            // If we're dragging it out of an area that has another axis at index 1, then
            // that axis needs to move to index 0
            if (droppedAxis.axisIndex == 0) {
                let outerDragOriginAreaAxis = allAxes.find((thisAxis) => {
                    return (
                        thisAxis.axis == droppedAxis.axis
                        && thisAxis.axisIndex == 1
                    );
                });

                if (outerDragOriginAreaAxis) {
                    outerDragOriginAreaAxis.axisIndex = 0;
                }
            }

            let innerDropAxis: any = allAxes.find((thisAxis) => {
                return (
                    (thisAxis.axis == targetAxisDirection)
                    && (thisAxis.axisIndex == 0)
                );
            });

            innerDropAxis.axisIndex = 1;
            droppedAxis.axis = innerDropAxis.axis;
            droppedAxis.axisIndex = 0;

            props.onAxesChanged(allAxes);

        }
        else {
        // We've dragged it to a place occupied by another axis
        // If there are free spaces available in this axis direction (x,y)
        //   then we want to push the current occupant over and put this in it's place
        //   make the current 0 a 1 and make the dragged item the 0
        // Otherwise, we want to swap the positions of the two axes with one another
            let neighborAxisIndex = (dropTargetAxis.axisIndex == 1)
                ? 0
                : 1;

            let dropTargetAxisNeighbor = allAxes.find(thisAxis => {
                return (
                    (thisAxis.axis == targetAxisDirection)
                    && (thisAxis.axisIndex == neighborAxisIndex)
                );
            });

            // If there's a neighbor
            // then swap them
            if (dropTargetAxisNeighbor) {

                let newAxisDirectionForDroppedAxis = dropTargetAxis.axis;
                let newAxisIndexForDroppedAxis = dropTargetAxis.axisIndex;

                dropTargetAxis.axis = droppedAxis.axis;
                dropTargetAxis.axisIndex = droppedAxis.axisIndex;

                droppedAxis.axis = newAxisDirectionForDroppedAxis;
                droppedAxis.axisIndex = newAxisIndexForDroppedAxis;

            }
            // There is no neighbor, we need to move the current occupant over.
            // That means the current occupant must be at index 0. and we want to keep it there
            // and put the new item at axis 1
            else {
                let newAxisDirectionForDroppedAxis = dropTargetAxis.axis;
                let newAxisIndexForDroppedAxis = dropTargetAxis.axisIndex == 1 ? 0 : 1;

                dropTargetAxis.axisIndex = newAxisIndexForDroppedAxis == 0 ? 1 : 0;

                // If we're moving out the 0 axis and there's a 1 axis, we need to move that down to 0
                if (droppedAxis.axis != newAxisDirectionForDroppedAxis) {
                    if (droppedAxis.axisIndex == 0) {
                        let axisToMoveDown = allAxes.find(thisAxis => {
                            return (
                                (thisAxis.axis == droppedAxis.axis)
                                && (thisAxis.axisIndex == 1)
                            );
                        });
                        if (axisToMoveDown) {
                            axisToMoveDown.axisIndex--;
                        }
                    }
                }

                droppedAxis.axis = newAxisDirectionForDroppedAxis;
                droppedAxis.axisIndex = newAxisIndexForDroppedAxis;

            }

            props.onAxesChanged(allAxes);

        }
    }
};
@DropTarget(['AXISSOCKET', 'AXISPLUG'], AxisSocketSource, (connect, monitor) => ({
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDropTarget: connect.dropTarget(),
    // You can ask the monitor about the current drag state:
    isOver: monitor.isOver({ shallow: false }),
    isOverCurrent: monitor.isOver(),
    itemType: monitor.getItemType()
}))
class AxisSocket extends React.Component<IPropsAxisSocket, {}> {

    public getStyle(): any {
        let baseStyle = {
            textAlign: 'center'
        };

        let style: any = (this.props.axisDirection == FlatGridAxisType.X)
            ? {
                ...baseStyle,
                width: '100%',
                marginBottom: '7px',
                height: '24px'
            } : {
                ...baseStyle,
                marginRight: '7px',
                textOrientation: 'sideways',
                writingMode: 'vertical-lr',
                width: '24px'
            };

        if (this.props.isOver) {
            style.backgroundColor = '#f4f9fc';
        }

        return style;
    }

    public render() {
        return (this.props.connectDropTarget(
            <div
                style={this.getStyle()}
                className='bg-gray-light shadow-light p-3 font-weight-heavy'
            >
                {this.props.axis && <AxisPlug axis={this.props.axis} />}
            </div>
        ));
    }
}

class AxisShape {
    public x: Array<FlatGridAxis> = [];
    public y: Array<FlatGridAxis> = [];
}
