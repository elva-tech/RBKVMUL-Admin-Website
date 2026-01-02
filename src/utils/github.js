const API = "https://api.github.com";

const headers = () => ({
  Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
});

// Helper to encode UTF-8 text to base64 (for Kannada, etc.)
function encodeBase64UTF8(text) {
  const bytes = new TextEncoder().encode(text);
  const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join("");
  return btoa(binString);
}

// Helper to decode base64 to UTF-8 text
function decodeBase64UTF8(base64) {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, char => char.codePointAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export async function getFile(path) {
  const url = `${API}/repos/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/contents/${path}?t=${Date.now()}`;
  
  const res = await fetch(url, { 
    headers: headers(), 
    cache: "no-store" 
  });

  if (!res.ok) {
    console.error(`GITHUB ERROR STATUS: ${res.status}`);
    const errorBody = await res.json();
    console.error("GITHUB ERROR MESSAGE:", errorBody.message);
    return null;
  }
  return res.json();
}

export async function commitFile({ path, content, message, sha, isBase64 = false }) {
  // If it's an image, it's already base64. 
  // If it's text (like JS files with Kannada), use UTF-8 safe encoding
  const encodedContent = isBase64
    ? content
    : encodeBase64UTF8(content);

  const body = {
    message,
    content: encodedContent,
    branch: import.meta.env.VITE_GITHUB_BRANCH,
  };
  
  if (sha) body.sha = sha;

  const res = await fetch(
    `${API}/repos/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to commit to GitHub");
  }
  return res.json();
}

// Export for use in components if needed
export { decodeBase64UTF8 };