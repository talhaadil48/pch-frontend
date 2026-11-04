import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("pch_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Client-side in-memory response cache for instant snappy UI navigation
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 20000; // 20 seconds TTL

const originalGet = api.get.bind(api);
const originalPost = api.post.bind(api);
const originalPut = api.put.bind(api);
const originalDelete = api.delete.bind(api);
const originalPatch = api.patch.bind(api);

export const clearApiCache = (urlPrefix?: string) => {
  if (!urlPrefix) {
    memoryCache.clear();
  } else {
    for (const key of Array.from(memoryCache.keys())) {
      if (key.includes(urlPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
};

api.get = (async (url: string, config?: any): Promise<any> => {
  if (config?.skipCache || config?.headers?.["Cache-Control"] === "no-cache") {
    return originalGet(url, config);
  }

  const cacheKey = `${url}?${JSON.stringify(config?.params || {})}`;
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return Promise.resolve({
      ...cached.data,
      data: JSON.parse(JSON.stringify(cached.data.data)),
      fromCache: true,
    });
  }

  const response = await originalGet(url, config);
  memoryCache.set(cacheKey, { data: response, timestamp: now });
  return response;
}) as any;

const invalidateOnMutation = (originalFn: Function) => {
  return async (...args: any[]) => {
    const url = typeof args[0] === "string" ? args[0] : "";
    const res = await originalFn(...args);
    if (url.includes("/forms/")) {
      clearApiCache(url);
    } else if (url.includes("/documents/")) {
      clearApiCache("/documents");
    } else if (url.includes("/claims")) {
      clearApiCache("/claims");
    } else if (url.includes("/fleet")) {
      clearApiCache("/fleet");
    } else {
      memoryCache.clear();
    }
    return res;
  };
};

api.post = invalidateOnMutation(originalPost) as any;
api.put = invalidateOnMutation(originalPut) as any;
api.delete = invalidateOnMutation(originalDelete) as any;
api.patch = invalidateOnMutation(originalPatch) as any;

export default api;
