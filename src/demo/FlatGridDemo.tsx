import * as React from 'react';

import AxisTransmogrifier from './AxisTransmogrifier';
import {
    FlatGridAxis,
    FlatGridAxisType,
    FlatGridDataItem,
    FlatGridAxisHeaderItem,
    FlatGridAxisHeaderItemsByKey
} from '../FlatGridData';
import FlatGrid from '../FlatGrid';
import { expirationList, strikeList } from '../_test_/mockData';

interface IProps {
}

interface IState {
    axes: Array<FlatGridAxis>;
    data: Array<FlatGridDataItem>;
}


export class FlatGridDemo extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            axes: [],
            data: []
        };
    }

    public componentDidMount() {
        this.setState({
            axes: this.getFlatGridAxes(expirationList, strikeList),
            data: this.getFlatGridData(expirationList, strikeList)
        });
    }

    public getFlatGridAxes(expirationList: Array<string>, strikeList: Array<number>): Array<FlatGridAxis> {
        let putCallHeaderItems: FlatGridAxisHeaderItemsByKey<any> = {};
        let expirationHeaderItems: FlatGridAxisHeaderItemsByKey<any> = {};
        let strikeHeaderItems: FlatGridAxisHeaderItemsByKey<any> = {};

        putCallHeaderItems['call'] = new FlatGridAxisHeaderItem<any>(0, 'call', 'call', 'call', null);
        putCallHeaderItems['put'] = new FlatGridAxisHeaderItem<any>(1, 'put', 'put', 'put', null);

        expirationList.forEach( (expirationKey, index) => {
            expirationHeaderItems[expirationKey] = new FlatGridAxisHeaderItem(index, expirationKey, expirationKey, expirationKey, null);
        });

        strikeList.forEach( (strike, index) => {
            strikeHeaderItems[strike.toString()] = new FlatGridAxisHeaderItem(index, strike.toString(), strike.toString(), strike.toString(), null);
        });

        const flatGridAxes: Array<FlatGridAxis> = [
            new FlatGridAxis<any>(FlatGridAxisType.Y, 1, 0, 'Puts/Calls', putCallHeaderItems, false),
            new FlatGridAxis<any>(FlatGridAxisType.X, 0, 1, 'Expirations', expirationHeaderItems, false),
            new FlatGridAxis<any>(FlatGridAxisType.Y, 0, 2, 'Strikes', strikeHeaderItems, false),
        ];

        return flatGridAxes;
    }

    public getFlatGridData(expirationList: Array<string>, strikeList: Array<number>): Array<FlatGridDataItem> {

        const flatGridData: Array<FlatGridDataItem> = [];

        // Generate random numbers for each call/put + expiration + strike
        ['call', 'put'].forEach( option => {
            expirationList.forEach(expirationKey => {
                strikeList.forEach(strike => {
                    const value = (Math.random() * 25).toFixed(2);
                    flatGridData.push(
                        new FlatGridDataItem(
                            [option, expirationKey, strike.toString()],
                            value,
                            null // Use this to set a custom component for viewing the value
                        )
                    );
                });
            });
        });

        return flatGridData;

    }

    public onAxesChanged = (axes: Array<FlatGridAxis>) => {
        this.setState({
            axes,
            data: [...this.state.data]
        });
    }

    public render() {
        return (
            <div>
                <h1>FlatGrid</h1>
                <div style={{display: 'flex', padding: '20px'}}>
                    <div style={{ display: 'inline-block', width: '250px'}} >
                        <AxisTransmogrifier
                            axes={this.state.axes}
                            onAxesChanged={this.onAxesChanged}
                        />
                    </div>
                    <div style={{ display: 'inline-block', width: '850px', height: '600px' }} >
                        <FlatGrid
                            axes={this.state.axes}
                            data={this.state.data}
                            columnWidth={100}
                            rowHeight={24}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

