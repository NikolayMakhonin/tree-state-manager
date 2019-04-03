export function expandArray<T>(array: T[], output: any[] = []): any[] {
	for (const item of array) {
		if (!item) {
			continue
		}

		if (Array.isArray(item)) {
			expandArray(item, output)
		} else {
			output.push(item)
		}
	}

	return output
}

interface AnyObject { [key: string]: any }
type AnyFunction = (...args: any[]) => any

export interface IOptionsVariants {
	[key: string]: any
}

function *generateOptions<TOptions extends AnyObject>(
	base: TOptions,
	optionsVariants: IOptionsVariants,
): Iterable<TOptions> {
	let hasChilds
	for (const key in optionsVariants) {
		if (Object.prototype.hasOwnProperty.call(optionsVariants, key)) {
			for (const optionVariant of optionsVariants[key]) {
				const variant = {
					...base as any,
					[key]: optionVariant,
				}

				const newOptionsVariants = {
					...optionsVariants,
				}

				delete newOptionsVariants[key]

				hasChilds = true

				yield* generateOptions(variant, newOptionsVariants)
			}

			break
		}
	}

	if (!hasChilds) {
		yield base
	}
}

// region Test Actions

type TestAction<TAction extends AnyFunction> = TAction | TestActions<TAction>
interface TestActions<TAction extends AnyFunction> extends Array<TestAction<TAction>> { }
export interface ITestActionsWithDescription<TAction extends AnyFunction> {
	actions: TestActions<TAction>,
	description: string
}
type TestActionsWithDescription<TAction extends AnyFunction>
	= TestAction<TAction> | ITestActionsWithDescription<TAction> | TestActionsWithDescriptions<TAction>
export interface TestActionsWithDescriptions<TAction extends AnyFunction>
	extends Array<TestActionsWithDescription<TAction>> { }

// endregion

export interface ITestCase<TAction extends AnyFunction, TExpected> {
	actions: Array<TestActionsWithDescription<TAction>>
	expected: TExpected
}

export interface IOptionsVariant<TAction, TExpected> {
	action: TAction,
	description: string,
	expected: TExpected
}

export abstract class TestVariants<
	TAction extends AnyFunction,
	TExpected,
	TOptionsVariant extends AnyObject,
	TOptionsVariants extends IOptionsVariants
> {
	protected abstract baseOptionsVariants: TOptionsVariants

	protected abstract testVariant(optionsVariant: TOptionsVariant & IOptionsVariant<TAction, TExpected>)

	public test(testCases: ITestCase<TAction, TExpected> & TOptionsVariants) {
		const optionsVariants = {
			...this.baseOptionsVariants as object,
			...testCases as object,
		} as TOptionsVariants

		const expected = testCases.expected
		delete optionsVariants.expected

		const actionsWithDescriptions: Array<ITestActionsWithDescription<TAction>>
			= expandArray(optionsVariants.actions)
		delete optionsVariants.actions

		const variants = Array.from(generateOptions({} as TOptionsVariant, optionsVariants))

		for (const actionsWithDescription of actionsWithDescriptions) {
			let {actions, description} = actionsWithDescription
			if (typeof actionsWithDescription === 'function') {
				actions = [actionsWithDescription]
				description = ''
			}

			for (const action of expandArray(actions)) {
				for (const variant of variants) {
					this.testVariant({
						...variant as any,
						action,
						description,
						expected,
					})
				}
			}
		}
	}
}
