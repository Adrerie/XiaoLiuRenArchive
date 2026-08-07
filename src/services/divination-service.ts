import type {
  CalculationInput,
  CalculationResult,
  CalendarResult,
  CastingSummary,
  DivinationRequest,
  DivinationResult,
  EthicsResult,
  InterpretationResult,
  Provenance,
  ResultInput,
} from "../shared";

export interface CalendarResolution {
  readonly input: ResultInput;
  readonly casting: CastingSummary;
  readonly calendar: CalendarResult | null;
  readonly calculationInput: CalculationInput;
}

export interface CalendarPort {
  resolve(request: DivinationRequest): Promise<CalendarResolution>;
}

export interface CalculationPort {
  calculate(input: CalculationInput): CalculationResult;
}

export interface InterpretationPort {
  interpret(input: {
    readonly request: DivinationRequest;
    readonly resolvedInput: ResultInput;
    readonly calendar: CalendarResult | null;
    readonly calculation: CalculationResult;
  }): Promise<InterpretationResult>;
}

export interface EthicsPort {
  evaluate(input: {
    readonly request: DivinationRequest;
    readonly resolvedInput: ResultInput;
    readonly calculation: CalculationResult;
    readonly interpretation: InterpretationResult;
  }): Promise<EthicsResult>;
}

export interface ProvenancePort {
  create(input: {
    readonly request: DivinationRequest;
    readonly resolvedInput: ResultInput;
    readonly calculation: CalculationResult;
    readonly interpretation: InterpretationResult;
    readonly ethics: EthicsResult;
  }): Provenance;
}

export interface DivinationPresentation {
  readonly interpretation: InterpretationResult;
  readonly ethics: EthicsResult;
}

export interface PresentationPort {
  present(input: {
    readonly request: DivinationRequest;
    readonly resolvedInput: ResultInput;
    readonly calendar: CalendarResult | null;
    readonly calculation: CalculationResult;
    readonly interpretation: InterpretationResult;
    readonly ethics: EthicsResult;
  }): DivinationPresentation;
}

export interface DivinationDependencies {
  readonly calendar: CalendarPort;
  readonly calculation: CalculationPort;
  readonly interpretation: InterpretationPort;
  readonly ethics: EthicsPort;
  readonly provenance: ProvenancePort;
  readonly presentation?: PresentationPort;
}

export interface DivinationService {
  runDivination(request: DivinationRequest): Promise<DivinationResult>;
}

export function createDivinationService(
  dependencies: DivinationDependencies,
): DivinationService {
  return {
    async runDivination(request): Promise<DivinationResult> {
      const resolved = await dependencies.calendar.resolve(request);
      const calculation = dependencies.calculation.calculate(resolved.calculationInput);
      const interpretation = await dependencies.interpretation.interpret({
        request,
        resolvedInput: resolved.input,
        calendar: resolved.calendar,
        calculation,
      });
      const ethics = await dependencies.ethics.evaluate({
        request,
        resolvedInput: resolved.input,
        calculation,
        interpretation,
      });
      const presented = dependencies.presentation?.present({
        request,
        resolvedInput: resolved.input,
        calendar: resolved.calendar,
        calculation,
        interpretation,
        ethics,
      }) ?? { interpretation, ethics };

      return {
        resultVersion: "1.3.0",
        createdAt: null,
        casting: resolved.casting,
        input: resolved.input,
        calendar: resolved.calendar,
        calculation,
        interpretation: presented.interpretation,
        ethics: presented.ethics,
        provenance: dependencies.provenance.create({
          request,
          resolvedInput: resolved.input,
          calculation,
          interpretation: presented.interpretation,
          ethics: presented.ethics,
        }),
      };
    },
  };
}

export async function runDivination(
  request: DivinationRequest,
  dependencies: DivinationDependencies,
): Promise<DivinationResult> {
  return createDivinationService(dependencies).runDivination(request);
}
