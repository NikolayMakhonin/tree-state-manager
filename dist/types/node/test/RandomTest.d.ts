import { ThenableOrIteratorOrValue } from '../../common/async/async';
import { TSearchBestError } from '../../common/test/RandomTest';
export declare function searchBestErrorBuilderNode<TMetrics>({ reportFilePath, onFound, consoleOnlyBestErrors, }: {
    reportFilePath: string;
    onFound?: (reportMin: string) => ThenableOrIteratorOrValue<any>;
    consoleOnlyBestErrors?: boolean;
}): TSearchBestError<TMetrics>;
