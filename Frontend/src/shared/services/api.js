const baseUrl = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

const buildUrl = (path) => {
	if (!path) return baseUrl;
	if (/^https?:\/\//.test(path)) return path;
	// If path is relative (starts with /), use it as-is to leverage dev server proxy
	if (path.startsWith('/')) return path;
	return `${baseUrl}${path}`;
};

async function request(method, url, { params, data, headers } = {}) {
	const query = params ? `?${new URLSearchParams(params).toString()}` : "";
	// Automatically include Authorization header if token exists
	const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('token')) || localStorage.getItem('token');
	const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
	
	// Check if data is FormData early (before logging)
	const isFormData = data instanceof FormData;
	
	if (url.includes('/api/notifications') || url.includes('/api/dashboard') || url.includes('/upload-profile-photo') || url.includes('/api/grievances')) {
		console.log(`[API] ${method} ${url}`, { 
			hasToken: !!token, 
			authHeaderLength: authHeader.Authorization?.length,
			tokenPrefix: token ? token.substring(0, 20) + '...' : 'no token',
			isFormData: isFormData
		});
	}

	// Don't set Content-Type for FormData - let browser handle it
	const defaultHeaders = isFormData 
		? { Accept: "application/json" }
		: { Accept: "application/json", "Content-Type": "application/json" };

	const res = await fetch(buildUrl(url) + query, {
		method,
		headers: Object.assign(defaultHeaders, authHeader, headers || {}),
		body: data && !(data instanceof FormData) ? JSON.stringify(data) : data,
	});

	const contentType = res.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		const json = await res.json();
		if (url.includes('/upload-profile-photo') || url.includes('/api/grievances')) {
			console.log(`[API] ${method} ${url} - Status: ${res.status}`, { response: json });
		}
		if (!res.ok) throw { response: { status: res.status, data: json } };
		return { data: json };
	}
	const text = await res.text();
	if (url.includes('/upload-profile-photo')) {
		console.log(`[API] ${method} ${url} - Status: ${res.status}`, { response: text });
	}
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
