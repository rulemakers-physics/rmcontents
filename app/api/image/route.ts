// app/api/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  // 1. 경로 유효성 검사
  if (!path) {
    return new NextResponse("File path is required", { status: 400 });
  }

  try {
    const bucket = adminStorage.bucket();
    // URL 디코딩 (한글 경로 등 처리)
    const decodedPath = decodeURIComponent(path);
    const file = bucket.file(decodedPath);

    // 2. 파일 존재 여부 확인
    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse("File not found", { status: 404 });
    }

    // 3. 파일 스트림 다운로드
    const [fileBuffer] = await file.download();
    
    // 4. 메타데이터(ContentType) 가져오기
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || "image/png";

    // 5. 이미지 응답 반환
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    // 캐싱 설정 (1년)
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // [수정] 'as any'를 추가하여 TypeScript 타입 에러 회피
    return new NextResponse(new Blob([fileBuffer as any]), { headers });

  } catch (error) {
    console.error("Image Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}