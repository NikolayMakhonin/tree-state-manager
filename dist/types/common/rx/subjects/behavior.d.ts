import { TClass } from '../../helpers/helpers';
import { ISubscriber, IUnsubscribe } from './observable';
import { ISubject } from './subject';
export interface IBehavior<T> {
    value: T;
    unsubscribeValue: T;
    subscribe(subscriber: ISubscriber<T>, description?: any): IUnsubscribe;
    emit(value: T): this;
}
export declare function behavior<TBase>(base: TClass<TBase>): any;
export interface IBehaviorSubject<T> extends ISubject<T>, IBehavior<T> {
}
export declare const BehaviorSubject: new <T>(value?: T) => IBehaviorSubject<T>;
