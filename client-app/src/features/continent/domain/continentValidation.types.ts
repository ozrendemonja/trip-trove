export interface ContinentFields {
    readonly continentName: string;
}

export interface ValidationResponse {
    readonly isValid: boolean;
    readonly errorMessage?: string;
}