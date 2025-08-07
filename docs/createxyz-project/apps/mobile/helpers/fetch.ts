import { fetch } from 'expo/fetch';
import { useAuthStore } from "./useAuth";

const originalFetch = fetch;
const headers = { 'x-createxyz-project-id': process.env.EXPO_PUBLIC_PROJECT_ID!, 'Host': process.env.EXPO_PUBLIC_HOST!, 'x-forwarded-host': process.env.EXPO_PUBLIC_HOST!, 'x-createxyz-host': process.env.EXPO_PUBLIC_HOST! };

const getURlFromArgs = (...args: Parameters<typeof fetch>) => {
    const [urlArg] = args;
    let url: string;
    if (typeof urlArg === 'string') {
        url = urlArg;
    } else if (urlArg instanceof Request) {
        url = urlArg.url;
    } else {
        url = `${urlArg.protocol}//${urlArg.host}${urlArg.pathname}`;
    }
    return url;
};

const isFirstPartyURL = (url: string) => {
    return (
        url.startsWith('/')
    );
};

export const fetchWithHeaders = async function fetchWithHeaders(...args: Parameters<typeof fetch>) {
    const [input, init] = args;
    const url = getURlFromArgs(input, init);

    const isExternalFetch = !isFirstPartyURL(url);
    // we should not add headers to requests that don't go to our own server
    if (isExternalFetch) {
        return originalFetch(input, init);
    }

    let finalInput = input;
    if (isFirstPartyURL(url)) {
        if (typeof input === 'string') {
            finalInput = `${process.env.EXPO_PUBLIC_BASE_URL}${input}`;
        } else if (input instanceof Request) {
            finalInput = new Request(`${process.env.EXPO_PUBLIC_BASE_URL}${input.url}`, input);
        }
    }

    // Fix: Parse headers object correctly and merge them
    const finalHeaders = new Headers(init?.headers ?? {});
    Object.entries(headers).forEach(([key, value]) => {
        finalHeaders.set(key, value);
    });

    if (finalInput instanceof Request) {
        Object.entries(headers).forEach(([key, value]) => {
            finalInput.headers.set(key, value);
        });
    }

    const auth = useAuthStore.getState().auth
    if (auth) {
        finalHeaders.set('authorization', `Bearer ${auth.jwt}`);
    }

    return originalFetch(finalInput, {
        ...init,
        headers: finalHeaders,
    });
};

export default fetchWithHeaders;