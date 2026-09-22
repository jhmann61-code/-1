import onnxruntime as ort
import numpy as np
import cv2
import sys

def preprocess_image(image_path):
    """
    이미지를 읽어서 MobileNetV3 모델 입력 규격(224x224, 정규화)에 맞게 변환합니다.
    """
    # 1. 이미지 읽기 및 RGB 변환
    img = cv2.imread(image_path)
    if img is None:
        print(f"오류: '{image_path}' 이미지를 불러올 수 없습니다.")
        sys.exit(1)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 2. 리사이즈 (가로세로 224x224)
    img = cv2.resize(img, (224, 224))
    
    # 3. 정규화 (ImageNet 데이터셋 기본 세팅)
    img = img.astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img = (img - mean) / std
    
    # 4. 차원 변경 (HWC -> CHW) 및 배치 차원 추가
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, axis=0).astype(np.float32)
    return img

def softmax(x):
    """ 추론된 결과값을 0~1 사이의 확률(신뢰도) 값으로 변환합니다. """
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=1, keepdims=True)

def verify_model(image_path, model_path="model_mobilenet.onnx"):
    # 💡 4대 클래스 라벨링 (2번은 Other로 변경됨)
    LABELS = {0: "Can (캔)", 1: "Glass (유리)", 2: "Other (기타/오분류)", 3: "Plastic (플라스틱)"}
    THRESHOLD = 0.80  # 신뢰도 임계값 80%

    try:
        # ONNX 모델 로드
        session = ort.InferenceSession(model_path)
        input_name = session.get_inputs()[0].name
    except Exception as e:
        print(f"오류: 모델 로드 실패. '{model_path}' 파일이 같은 폴더에 있는지 확인하세요.\n에러 내용: {e}")
        sys.exit(1)
        
    # 전처리 및 추론
    input_data = preprocess_image(image_path)
    outputs = session.run(None, {input_name: input_data})
    
    # 확률 계산 및 결과 도출
    probabilities = softmax(outputs[0])[0]
    predicted_idx = int(np.argmax(probabilities))
    confidence = float(probabilities[predicted_idx])
    
    # 🛡️ 백엔드/하드웨어 연동용 방어 로직 (80% 미만이거나 2번이면 기타 처리)
    if predicted_idx == 2 or confidence < THRESHOLD:
        final_decision = "Other (기타/오분류 칸 모터 작동)"
    else:
        final_decision = f"{LABELS[predicted_idx]} 칸 모터 작동"

    # 결과 출력
    print("\n=== 🤖 AI 모델(MobileNetV3) 추론 테스트 ===")
    print(f"테스트 이미지 : {image_path}")
    print(f"AI 원본 예측   : 인덱스 [{predicted_idx}] -> {LABELS[predicted_idx]}")
    print(f"신뢰도(확률)   : {confidence * 100:.2f}%")
    print(f"▶ 최종 시스템 판정: {final_decision}")
    print("=========================================\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python verify_onnx.py <테스트할_이미지_경로.jpg>")
        sys.exit(1)
    
    test_image_path = sys.argv[1]
    verify_model(test_image_path)