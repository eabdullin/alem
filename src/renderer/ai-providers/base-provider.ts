import type { LanguageModel, ToolSet } from "ai";
import { getGeneralToolSet } from "@/tools/registry";
import type {
  AiProvider,
  ModelCostInfo,
  ModelUsageInfo,
  ProviderInfo,
  ProviderModelInfo,
  ProviderOptions,
  ResolvedModelConfig,
  ToolConfig,
} from "./types";

export abstract class BaseProvider {
  readonly resolvedModel: ResolvedModelConfig;

  protected constructor(
    readonly id: AiProvider,
    protected readonly apiKey: string,
    readonly selectedModelId: string,
    readonly providerInfo: ProviderInfo,
    protected readonly toolConfig?: ToolConfig,
  ) {
    this.resolvedModel = this.resolveModelConfig(selectedModelId);
  }

  get name(): string {
    return this.providerInfo.name;
  }

  get logoPath(): string {
    return this.providerInfo.logoPath;
  }

  get models(): ProviderModelInfo[] {
    return this.providerInfo.models;
  }

  get tools(): ToolSet {
    return {
      ...this.getGeneralTools(),
      ...this.getProviderSpecificTools(),
    };
  }

  get options(): ProviderOptions | undefined {
    return this.createProviderOptions(this.resolvedModel);
  }

  get usageInfo(): ModelUsageInfo {
    return this.getModelUsageInfo(this.selectedModelId);
  }

  chatModel(model: string = this.selectedModelId): LanguageModel {
    const resolved = this.resolveModelConfig(model);
    return this.createLanguageModel(resolved.modelId);
  }

  isReasoningModel(model: string = this.selectedModelId): boolean {
    return this.resolveModelConfig(model).isReasoning;
  }

  getMaxTokens(model: string = this.selectedModelId): number {
    const resolved = this.resolveModelConfig(model);
    return this.getMaxTokensForResolvedModel(resolved);
  }

  getModelUsageInfo(model: string = this.selectedModelId): ModelUsageInfo {
    const resolved = this.resolveModelConfig(model);
    return {
      maxTokens: this.getMaxTokensForResolvedModel(resolved),
      cost: this.getModelCostInfo(resolved),
    };
  }

  getApiKeyErrorMessage(): string {
    return `${this.name} API key is not configured.`;
  }

  isApiKeyValid(apiKey: string = this.apiKey): boolean {
    return this.validateApiKeyFormat(apiKey);
  }

  protected getGeneralTools(): ToolSet {
    return getGeneralToolSet(this.toolConfig);
  }

  protected getProviderSpecificTools(): ToolSet {
    return {} as ToolSet;
  }

  protected resolveRuntimeModelId(selectedModelId: string): string {
    return selectedModelId;
  }

  protected isReasoningSelection(_selectedModelId: string): boolean {
    return false;
  }

  protected createProviderOptions(
    _resolvedModel: ResolvedModelConfig,
  ): ProviderOptions | undefined {
    return undefined;
  }

  protected getModelCostInfo(_resolvedModel: ResolvedModelConfig): ModelCostInfo {
    return {
      note: "See provider pricing page for current token costs.",
    };
  }

  protected getMaxTokensForResolvedModel(_resolvedModel: ResolvedModelConfig): number {
    return 200000;
  }

  protected validateApiKeyFormat(apiKey: string): boolean {
    return apiKey.trim().length > 0;
  }

  private resolveModelConfig(selectedModelId: string): ResolvedModelConfig {
    const modelInfo = this.providerInfo.models.find((model) => model.id === selectedModelId);
    if (!modelInfo) {
      throw new Error(`Model ${selectedModelId} not found for provider ${this.id}`);
    }

    return {
      providerId: this.id,
      providerInfo: this.providerInfo,
      modelInfo,
      selectedModelId: modelInfo.id,
      modelId: this.resolveRuntimeModelId(modelInfo.id),
      isReasoning: this.isReasoningSelection(modelInfo.id),
    };
  }

  protected abstract createLanguageModel(modelId: string): LanguageModel;
}
