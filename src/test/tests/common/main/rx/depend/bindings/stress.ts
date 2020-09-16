/* tslint:disable:no-identical-functions no-shadowed-variable */
import {AsyncValueOf} from '../../../../../../../main/common/async/async'
import {webrainOptions} from '../../../../../../../main/common/helpers/webrainOptions'
import {Random} from '../../../../../../../main/common/random/Random'
import {describe, it, xdescribe, xit} from '../../../../../../../main/common/test/Mocha'
import {
	iterationBuilder,
	iteratorBuilder,
	RandomTest, randomTestBuilder,
	searchBestErrorBuilder,
} from '../../../../../../../main/common/test/randomTest'

declare const beforeEach: any

describe('common > main > rx > depend > bindings > stress', function() {
	this.timeout(24 * 60 * 60 * 1000)

	beforeEach(function() {
		webrainOptions.callState.garbageCollect.disabled = false
		webrainOptions.callState.garbageCollect.bulkSize = 100
		webrainOptions.callState.garbageCollect.interval = 1000
		webrainOptions.callState.garbageCollect.minLifeTime = 500
	})

	function createMetrics() {
		return {
			count: 0,
		}
	}
	type IMetrics = AsyncValueOf<ReturnType<typeof createMetrics>>

	function optionsPatternBuilder(metrics: IMetrics, metricsMin: IMetrics) {
		return {
			metrics,
			metricsMin,
		}
	}
	type IOptionsPattern = AsyncValueOf<ReturnType<typeof optionsPatternBuilder>>

	function optionsGenerator(rnd: Random, {
		metrics,
		metricsMin,
	}: IOptionsPattern) {
		return {
			metrics,
			metricsMin,
		}
	}
	type IOptions = AsyncValueOf<ReturnType<typeof optionsGenerator>>

	function compareMetrics(metrics: IMetrics, metricsMin: IMetrics) {
		if (metrics.count !== metricsMin.count) {
			return metrics.count < metricsMin.count
		}
		return true
	}

	function createState(rnd: Random, options: IOptions) {
		return {
			options,
		}
	}
	type IState = AsyncValueOf<ReturnType<typeof createState>>

	function action(rnd: Random, state: IState) {
		// TODO
	}

	// region randomTest

	const randomTest = randomTestBuilder(
		createMetrics,
		optionsPatternBuilder,
		optionsGenerator,
		{
			compareMetrics,
			consoleThrowPredicate() {
				return this === 'error' || this === 'warn'
			},
			// searchBestError: searchBestErrorBuilderNode({
			// 	reportFilePath: './tmp/test-cases/depend/bindings/base.txt',
			// 	consoleOnlyBestErrors: true,
			// }),
			searchBestError: searchBestErrorBuilder({
				consoleOnlyBestErrors: true,
			}),
			testIterator: iteratorBuilder(
				createState,
				{
					stopPredicate(iterationNumber, timeStart, state) {
						return iterationNumber >= 100
					},
					iteration: iterationBuilder({
						action: {
							weight: 1,
							func: action,
						},
					}),
				},
			),
		},
	)

	// endregion

	it('base', async function() {
		await randomTest({
			stopPredicate: (iterationNumber, timeElapsed) => {
				return iterationNumber >= 50
			},
			customSeed: null,
			metricsMin: null,
			searchBestError: true,
		})
	})
})
