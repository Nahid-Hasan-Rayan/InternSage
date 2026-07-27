export declare enum ClientApplicationStatus {
    UNDER_REVIEW = "UNDER_REVIEW",
    INTERVIEW = "INTERVIEW",
    OFFER = "OFFER",
    REJECTED = "REJECTED",
    WITHDRAWN = "WITHDRAWN"
}
export declare class UpdateApplicationStatusDto {
    status: ClientApplicationStatus;
}
