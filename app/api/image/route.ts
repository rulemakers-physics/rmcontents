// app/api/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminStorage, adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const problemId = searchParams.get("id");
  const path = searchParams.get("path");

  // [보안 1] 브라우저 주소창 직접 입력 차단 (이미지 태그 요청만 허용)
  const fetchDest = request.headers.get("sec-fetch-dest");
  if (fetchDest === "document") {
    return new NextResponse("Access Denied: Direct access not allowed.", { status: 403 });
  }

  try {
    let storagePath = "";

    // Case A: 문항 ID로 요청온 경우 (문항 코드 은폐를 위해 DB 조회)
    if (problemId) {
      const docRef = adminDb.collection("problems").doc(problemId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return new NextResponse("Problem not found", { status: 404 });
      }

      const data = docSnap.data();
      const originalUrl = data?.imgUrl || "";

      // ▼▼▼ [수정됨] URL 형식에 따른 스토리지 경로 추출 로직 ▼▼▼
      if (originalUrl.includes("/o/")) {
        // 1. Firebase Client SDK 형식 (firebasestorage.googleapis.com)
        const split = originalUrl.split("/o/");
        if (split.length > 1) {
          storagePath = decodeURIComponent(split[1].split("?")[0]);
        }
      } else if (originalUrl.includes("storage.googleapis.com")) {
        // 2. GCS Public URL 형식 (storage.googleapis.com)
        // 예: https://storage.googleapis.com/버킷명/폴더/파일명.png
        const urlWithoutProtocol = originalUrl.replace(/^https?:\/\//, '');
        const parts = urlWithoutProtocol.split('/');
        
        // parts[0]: 도메인, parts[1]: 버킷명, parts[2~]: 파일 경로
        if (parts.length >= 3) {
           // 버킷명 다음부터 끝까지 합쳐서 경로 생성
           storagePath = decodeURIComponent(parts.slice(2).join('/'));
        }
      }
      // ▲▲▲ [수정 끝] ▲▲▲
      
    } 
    // Case B: 경로로 직접 요청온 경우 (로고 등)
    else if (path) {
      storagePath = decodeURIComponent(path);
    } else {
      return new NextResponse("Missing id or path", { status: 400 });
    }

    if (!storagePath) {
      return new NextResponse("Invalid Image Path", { status: 404 });
    }

    // Storage 파일 스트리밍
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    
    if (!exists) {
        return new NextResponse("File not found in storage", { status: 404 });
    }

    const [fileBuffer] = await file.download();
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || "image/png";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    
    // [보안 2] 다운로드 방지 헤더
    headers.set("Content-Disposition", "inline"); 
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(new Blob([fileBuffer as any]), { headers });

  } catch (error) {
    console.error("Secure Image Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}