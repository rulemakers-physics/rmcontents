import functions_framework
import numpy as np
import json

@functions_framework.http
def calculate_weakness(request):
    # CORS 설정 (프론트엔드에서 호출 허용)
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({"error": "No JSON data provided"}), 400, headers)
        
        # 1. 데이터 수신
        # matrix_X: [[1, 0, 0], [0, 1, 0]...] (문항별 단원 정보)
        # vector_Y: [1, 0, 1...] (정오답 여부)
        matrix_X = np.array(request_json['matrix_X'])
        vector_Y = np.array(request_json['vector_Y'])

        # 예외 처리: 데이터가 너무 적을 경우
        if len(matrix_X) == 0:
            return (json.dumps({"weights": []}), 200, headers)

        # 2. Moore-Penrose 유사 역행렬 계산 (핵심 알고리즘)
        # w = pinv(X) * y
        pseudo_inverse_X = np.linalg.pinv(matrix_X)
        weights = np.dot(pseudo_inverse_X, vector_Y)

        # 3. 결과 반환 (NumPy 배열 -> 리스트 변환)
        return (json.dumps({
            "weights": weights.tolist()
        }), 200, headers)

    except Exception as e:
        return (json.dumps({"error": str(e)}), 500, headers)