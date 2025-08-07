import React, { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, useLayoutEffect, useImperativeHandle, useDebugValue } from "react";
import fetch from './fetch'
import { ReactNativeAsset, UploadClient } from '@uploadcare/upload-client'
const client = new UploadClient({ publicKey: process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY! });

export { fetch }

export function useHandleStreamResponse({
    onChunk,
    onFinish
}: {
    onChunk: (content: string) => void,
    onFinish: (content: string) => void
}) {
    const handleStreamResponse = React.useCallback(
        async (response: Response) => {
            if (response.body) {
                const reader = response.body.getReader();
                if (reader) {
                    const decoder = new TextDecoder();
                    let content = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            onFinish(content);
                            break;
                        }
                        const chunk = decoder.decode(value, { stream: true });
                        content += chunk;
                        onChunk(content);
                    }
                }
            }
        },
        [onChunk, onFinish]
    );
    return handleStreamResponse;
}

export function useUpload() {
    const [loading, setLoading] = React.useState(false);
    const upload = React.useCallback(async (input: { file?: File, reactNativeAsset?: ReactNativeAsset & { mimeType: string, file?: File }, url?: string, base64?: string, buffer?: ArrayBuffer }) => {
        try {
            setLoading(true);
            let response;
            if ('reactNativeAsset' in input && input.reactNativeAsset) {
                if (input.reactNativeAsset.file) {
                    const formData = new FormData();
                    formData.append("file", input.reactNativeAsset.file);
                    response = await fetch("/api/upload", {
                        method: "POST",
                        body: formData
                    });
                } else {
                    const response = await fetch("/api/upload/presign", {
                        method: 'POST',
                    })
                    const { secureSignature, secureExpire } = await response.json();
                    const result = await client.uploadFile(input.reactNativeAsset, {
                        fileName: input.reactNativeAsset.name ?? input.reactNativeAsset.uri.split("/").pop(),
                        contentType: input.reactNativeAsset.mimeType,
                        secureSignature,
                        secureExpire
                    });
                    return { url: `https://raw.createusercontent.com/${result.uuid}/`, mimeType: result.mimeType || null };
                }
            } else if ("file" in input && input.file) {
                const formData = new FormData();
                formData.append("file", input.file);
                response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });
            } else if ("url" in input) {
                response = await fetch("/api/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ url: input.url })
                });
            } else if ("base64" in input) {
                response = await fetch("/api/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ base64: input.base64 })
                });
            } else {
                response = await fetch("/api/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/octet-stream"
                    },
                    body: input.buffer
                });
            }
            if (!response.ok) {
                if (response.status === 413) {
                    throw new Error("Upload failed: File too large.");
                }
                throw new Error("Upload failed");
            }
            const data = await response.json();
            return { url: data.url, mimeType: data.mimeType || null };
        } catch (uploadError) {
            if (uploadError instanceof Error) {
                return { error: uploadError.message };
            }
            if (typeof uploadError === "string") {
                return { error: uploadError };
            }
            return { error: "Upload failed" };
        } finally {
            setLoading(false);
        }
    }, []);

    return [upload, { loading }];
}
