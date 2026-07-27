export declare enum ClientEventType {
    PROFILE_UPDATED = "PROFILE_UPDATED",
    CV_UPDATED = "CV_UPDATED"
}
export declare class CreateEventDto {
    type: ClientEventType;
    metadata?: Record<string, unknown>;
}
