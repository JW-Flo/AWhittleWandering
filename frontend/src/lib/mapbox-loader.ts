// Shared dynamic loader for mapbox-gl to keep initial bundle slim
import type * as MapboxTypes from 'mapbox-gl';

let mapboxPromise: Promise<typeof MapboxTypes | (typeof MapboxTypes)['default']> | null = null;
export async function loadMapbox(): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!mapboxPromise) {
    mapboxPromise = import('mapbox-gl').then(m => {
      import('mapbox-gl/dist/mapbox-gl.css');
      return (m as any).default || m; // support both ESM/CJS shapes
    });
  }
  return mapboxPromise;
}
