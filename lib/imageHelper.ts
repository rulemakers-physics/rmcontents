// lib/imageHelper.ts

/**
 * [보안] 문항 ID를 기반으로 보안된 이미지 URL을 반환합니다.
 * 파일명(문항코드)이 URL에 노출되지 않습니다.
 */
export const getSecureImageSrc = (problemId?: string) => {
  if (!problemId) return "/images/placeholder.png";
  return `/api/image?id=${problemId}`;
};

/**
 * [기존] URL 경로 기반 프록시 (로고 등 보안이 덜 중요한 이미지용)
 */
export const getProxyImageSrc = (originalUrl?: string | null) => {
  if (!originalUrl) return "/images/placeholder.png";

  // 이미 프록시 처리된 주소라면 그대로 반환
  if (originalUrl.startsWith("/api/image")) return originalUrl;

  // Firebase URL 처리
  if (originalUrl.includes("firebasestorage.googleapis.com")) {
    try {
      const splitUrl = originalUrl.split("/o/");
      if (splitUrl.length < 2) return originalUrl;
      
      const pathWithParams = splitUrl[1];
      const pathIndex = pathWithParams.indexOf("?");
      const encodedPath = pathIndex !== -1 ? pathWithParams.substring(0, pathIndex) : pathWithParams;

      return `/api/image?path=${encodedPath}`;
    } catch (e) {
      return originalUrl;
    }
  }
  
  // GCS URL 처리 (storage.googleapis.com)
  if (originalUrl.includes("storage.googleapis.com")) {
     try {
        const urlWithoutProtocol = originalUrl.replace(/^https?:\/\//, '');
        const parts = urlWithoutProtocol.split('/');
        if (parts.length >= 3) {
           const rawPath = parts.slice(2).join('/');
           return `/api/image?path=${encodeURIComponent(rawPath)}`;
        }
     } catch (e) {
        return originalUrl;
     }
  }

  return originalUrl;
};