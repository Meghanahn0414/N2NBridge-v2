const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

const buildUrl = (path) => {
	if (!path) return baseUrl;
	if (/^https?:\/\//.test(path)) return path;
	return `${baseUrl}${path}`;
};

async function request(method, url, { params, data, headers } = {}) {
	const query = params ? `?${new URLSearchParams(params).toString()}` : "";
	const res = await fetch(buildUrl(url) + query, {
		method,
		headers: Object.assign({ Accept: "application/json" }, headers || {}),
		body: data && !(data instanceof FormData) ? JSON.stringify(data) : data,
	});

	const contentType = res.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		const json = await res.json();
		if (!res.ok) throw { response: { status: res.status, data: json } };
		return { data: json };
	}
	const text = await res.text();
	if (!res.ok) throw { response: { status: res.status, data: text } };
	return { data: text };
}

const api = {
	get: (url, opts) => request("GET", url, opts),
	post: (url, data, opts = {}) => request("POST", url, Object.assign({ data }, opts)),
	put: (url, data, opts = {}) => request("PUT", url, Object.assign({ data }, opts)),
	patch: (url, data, opts = {}) => request("PATCH", url, Object.assign({ data }, opts)),
	delete: (url, opts) => request("DELETE", url, opts),
};

// Keep a simple flag for health probes; components may check this.
const backendProbeHealthy = true;

export default api;
export { backendProbeHealthy };
