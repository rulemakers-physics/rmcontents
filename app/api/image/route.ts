// app/api/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminStorage, adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const problemId = searchParams.get("id");
  const path = searchParams.get("path");

  // [보안] 브라우저 주소창 직접 입력 차단 (이미지 태그 요청만 허용)
  const fetchDest = request.headers.get("sec-fetch-dest");
  // 주의: 리다이렉트 방식에서는 브라우저가 최종 URL로 이동할 때 이 헤더가 바뀔 수 있으므로,
  // 너무 엄격하게 막으면 이미지가 안 뜰 수 있습니다. 
  // 일단 기존 로직을 유지하되, 문제 발생 시 이 부분은 완화가 필요할 수 있습니다.
  if (fetchDest === "document") {
    return new NextResponse("Access Denied: Direct access not allowed.", { status: 403 });
  }

  try {
    let storagePath = "";

    // Case A: 문항 ID로 요청온 경우 (DB 조회)
    if (problemId) {
      // 1. DB에서 파일 경로 조회 (가볍고 빠름)
      const docRef = adminDb.collection("problems").doc(problemId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return new NextResponse("Problem not found", { status: 404 });
      }

      const data = docSnap.data();
      const originalUrl = data?.imgUrl || "";

      // URL에서 스토리지 경로 추출 로직 (기존 유지)
      if (originalUrl.includes("/o/")) {
        const split = originalUrl.split("/o/");
        if (split.length > 1) {
          storagePath = decodeURIComponent(split[1].split("?")[0]);
        }
      } else if (originalUrl.includes("storage.googleapis.com")) {
        const urlWithoutProtocol = originalUrl.replace(/^https?:\/\//, '');
        const parts = urlWithoutProtocol.split('/');
        if (parts.length >= 3) {
           storagePath = decodeURIComponent(parts.slice(2).join('/'));
        }
      }
    } 
    // Case B: 경로로 직접 요청온 경우
    else if (path) {
      storagePath = decodeURIComponent(path);
    } else {
      return new NextResponse("Missing id or path", { status: 400 });
    }

    if (!storagePath) {
      return new NextResponse("Invalid Image Path", { status: 404 });
    }

    // 2. Signed URL 생성 (핵심 변경 사항)
    // 파일을 다운로드하는 대신, 구글 서버에서 직접 받을 수 있는 임시 URL을 발급합니다.
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);

    // 유효기간 1시간짜리 URL 생성
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1시간 후 만료
    });

    // 3. 브라우저를 해당 URL로 리다이렉트 (307 Temporary Redirect)
    // 브라우저는 이 응답을 받자마자 즉시 구글 서버에서 이미지를 다운로드합니다.
    return NextResponse.redirect(signedUrl, 307);

  } catch (error) {
    console.error("Secure Image Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}