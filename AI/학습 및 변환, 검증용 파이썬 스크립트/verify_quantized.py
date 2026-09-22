import torch
import cv2
import numpy as np
import sys
from torchvision import transforms

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        print(f"오류: '{image_path}' 이미지를 불러올 수 없습니다.")
        sys.exit(1)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 파이토치 transforms를 활용한 전처리
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                             std=[0.229, 0.224, 0.225])
    ])
    
    img_tensor = transform(img).unsqueeze(0) # 배치 차원 추가
    return img_tensor

def verify_quantized_model(image_path, model_path="garbage_mobilenet_quantized.pth"):
    LABELS = {0: "Can (캔)", 1: "Glass (유리)", 2: "Other (기타/오분류)", 3: "Plastic (플라스틱)"}
    THRESHOLD = 0.80

    try:
        # 양자화된 전체 모델 로드
        quantized_model = torch.load(model_path, map_location=torch.device('cpu'))
        quantized_model.eval()
    except Exception as e:
        print(f"오류: 양자화 모델 로드 실패.\n{e}")
        sys.exit(1)

    # 전처리 및 추론
    input_tensor = preprocess_image(image_path)
    
    with torch.no_grad():
        outputs = quantized_model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        
    confidence, predicted_idx = torch.max(probabilities, 0)
    confidence = confidence.item()
    predicted_idx = predicted_idx.item()

    # 🛡️ 백엔드/하드웨어 연동용 방어 로직 (80% 미만이거나 2번이면 기타 처리)
    if predicted_idx == 2 or confidence < THRESHOLD:
        final_decision = "Other (기타/오분류 칸 모터 작동)"
    else:
        final_decision = f"{LABELS[predicted_idx]} 칸 모터 작동"

    # 결과 출력
    print("\n=== ⚡ 초경량 양자화 모델(PyTorch) 추론 테스트 ===")
    print(f"테스트 이미지 : {image_path}")
    print(f"AI 원본 예측   : 인덱스 [{predicted_idx}] -> {LABELS[predicted_idx]}")
    print(f"신뢰도(확률)   : {confidence * 100:.2f}%")
    print(f"▶ 최종 시스템 판정: {final_decision}")
    print("==================================================\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python verify_quantized.py <테스트할_이미지_경로.jpg>")
        sys.exit(1)
    
    test_image_path = sys.argv[1]
    verify_quantized_model(test_image_path)