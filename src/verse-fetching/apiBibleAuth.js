let apiBibleKey = "";

export function setApiBibleKey(key) {
  apiBibleKey = typeof key === "string" ? key.trim() : "";
}

export function getApiBibleKey() {
  return apiBibleKey;
}
