/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Sync visit data
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postV1Sync(
        requestBody: {
            id: string;
            time: string;
            lat: number;
            lon: number;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/sync',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
