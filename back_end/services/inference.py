# services/inference.py
import onnxruntime as ort
import numpy as np
from PIL import Image

MODEL_PATH = "services/model.onnx"

# 실제 모델 학습 순서 그대로 (인덱스 = 모델 출력 순서)
# 0: can, 1: glass, 2: unknown (예전 paper 자리를 재활용), 3: plastic
LABELS = {0: "can", 1: "glass", 2: "unknown", 3: "plastic"}

# 확정으로 인정하는 최소 신뢰도
CONFIDENCE_THRESHOLD = 0.9

session = ort.InferenceSession(MODEL_PATH)

def preprocess(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = (img_array - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_array = np.transpose(img_array, (2, 0, 1))
    img_array = np.expand_dims(img_array, axis=0).astype(np.float32)
    return img_array

def run_inference(image_path: str) -> tuple[str, float]:
    input_data = preprocess(image_path)
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_data})
    logits = outputs[0][0]

    # softmax 적용
    exp_logits = np.exp(logits - np.max(logits))
    probabilities = exp_logits / exp_logits.sum()

    predicted_index = int(np.argmax(probabilities))
    confidence = float(probabilities[predicted_index])

    # 신뢰도 90% 미만이면 모델이 뭐라고 했든 전부 unknown으로 보수적으로 처리
    # 90% 이상이면 LABELS 매핑 그대로 사용 (2번 인덱스 자체가 이미 unknown이므로 별도 예외처리 불필요)
    if confidence >= CONFIDENCE_THRESHOLD:
        ai_result = LABELS.get(predicted_index, "unknown")
    else:
        ai_result = "unknown"

    return ai_result, confidence