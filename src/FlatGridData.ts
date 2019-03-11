export class FlatGridDataItem<T = any> {

    public indexes: Array<any>;
    public value: T;
    // TODO: Can we use React.Component as a type?
    public component: any;

    constructor(indexes: Array<any>, value: T, component: any) {
        this.indexes = indexes;
        this.value = value;
        this.component = component;
    }
}

export class FlatGridAxisHeaderItem<T = any> {

    public index: number;
    public key: string;
    public label: string;
    public value: T;
    public component: any;

    constructor(index: number, key: string, label: string, value: T, component: any) {
        this.index = index;
        this.key = key;
        this.label = label;
        this.value = value;
        this.component = component;
    }
}

export type FlatGridAxisHeaderItemsByKey<T = any> = {[key: string]: FlatGridAxisHeaderItem<T>};

// Axes/dimensions of the grid
export class FlatGridAxis<T = any> {

    // "x" or "y" - detrimine if this axis display along the x axis (columns) or y axis (rows)
    public axis: string;

    // the index of the axis labels (x0, x1, y0, y1, etc...)
    public axisIndex: number;

    // the index of the n-dimensional array: data[0][1][2], 0=x, 1=y, 2=z
    public dataIndex: number;

    // The display name of this axis
    public name: string;

    // whatever the values are you want associated with this axis (like row/column labels, order number, etc...)
    public values: FlatGridAxisHeaderItemsByKey<T>;

    // Stripe alternate rows/columns for this axis
    public isStriped: boolean;

    constructor(
        axis: string,
        axisIndex: number,
        dataIndex: number,
        name: string,
        values: FlatGridAxisHeaderItemsByKey<T>,
        isStriped = false
    ) {
        this.axis = axis;
        this.axisIndex = axisIndex;
        this.dataIndex = dataIndex;
        this.name = name;
        this.values = values;
        this.isStriped = isStriped;
    }

}

export enum FlatGridAxisType {
    X = 'x',
    Y = 'y'
}

export class ScrollData {
    public clientHeight = 0;
    public clientWidth = 0;
    public scrollLeft = 0;
    public scrollTop = 0;
}
