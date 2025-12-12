// lib/imageHelper.ts

/**
 * [수정] 이제는 ID 대신 이미지 URL을 직접 받아서 반환합니다.
 * 보안 프록시를 거치지 않고 원본 URL을 그대로 사용합니다.
 */
export const getSecureImageSrc = (imageUrl?: string | null) => {
  // 이미지가 없으면 플레이스홀더 반환
  if (!imageUrl) return "/images/placeholder.png";
  
  // DB에 저장된 원본 URL 그대로 반환
  return imageUrl;
};

/**
 * [수정] 프록시 로직을 제거하고 원본을 그대로 반환합니다.
 */
export const getProxyImageSrc = (originalUrl?: string | null) => {
  if (!originalUrl) return "/images/placeholder.png";
  return originalUrl;
};