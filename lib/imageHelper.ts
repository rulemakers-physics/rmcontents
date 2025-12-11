// lib/imageHelper.ts

export const getProxyImageSrc = (originalUrl?: string | null) => {
  if (!originalUrl) return "/images/placeholder.png"; // 이미지가 없을 때 보여줄 기본 이미지 (선택 사항)

  // Firebase Storage URL인 경우에만 프록시로 변환
  if (originalUrl.includes("firebasestorage.googleapis.com")) {
    try {
      // URL에서 '/o/' 뒷부분(경로)을 추출
      const splitUrl = originalUrl.split("/o/");
      if (splitUrl.length < 2) return originalUrl;

      // 물음표(?) 앞부분까지가 파일 경로 (URL 인코딩된 상태 유지)
      const pathWithParams = splitUrl[1];
      const pathIndex = pathWithParams.indexOf("?");
      const encodedPath = pathIndex !== -1 ? pathWithParams.substring(0, pathIndex) : pathWithParams;

      // 프록시 API 주소 반환
      return `/api/image?path=${encodedPath}`;
    } catch (e) {
      console.error("Image Proxy conversion failed:", e);
      return originalUrl; // 실패 시 원본 반환
    }
  }

  // Firebase URL이 아니면 그대로 반환 (예: /images/logo.png 등)
  return originalUrl;
};