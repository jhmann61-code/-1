import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
import os

# ==========================================
# 1. 하이퍼파라미터 및 환경 설정
# ==========================================
BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 0.001
NUM_CLASSES = 4 # 0: Can, 1: Glass, 2: Other(Paper), 3: Plastic
DATA_DIR = './dataset' # 학습 데이터셋 폴더 경로

# GPU 사용 가능 여부 확인
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"✅ 사용 기기: {device}")

# ==========================================
# 2. 데이터 전처리 및 증강 (Data Augmentation)
# ==========================================
# PPT 3단계: 환경 변동 학습(조명, 각도 대응)을 위한 Augmentation 적용
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),         # 좌우 반전
    transforms.ColorJitter(brightness=0.2, contrast=0.2), # 조명 노이즈 대응
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                         std=[0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                         std=[0.229, 0.224, 0.225])
])

# 데이터셋 로드 (폴더명 기준 자동 라벨링: 0_Can, 1_Glass, 2_Other, 3_Plastic)
train_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, 'train'), transform=train_transforms)
val_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, 'val'), transform=val_transforms)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

# ==========================================
# 3. MobileNetV3 모델 로드 및 커스텀 (Transfer Learning)
# ==========================================
# ImageNet 사전 학습된 가중치 불러오기 (PPT 핵심 장점 반영)
model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)

# 마지막 분류기(Classifier)의 출력 노드를 4개로 변경
in_features = model.classifier[3].in_features
model.classifier[3] = nn.Linear(in_features, NUM_CLASSES)
model = model.to(device)

# 손실 함수 및 최적화 기법 세팅
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

# ==========================================
# 4. 모델 학습 (Training Loop)
# ==========================================
print("🚀 학습 시작...")
best_acc = 0.0

for epoch in range(EPOCHS):
    model.train()
    running_loss = 0.0
    
    for inputs, labels in train_loader:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * inputs.size(0)
        
    # 검증 (Validation)
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
    epoch_acc = 100 * correct / total
    epoch_loss = running_loss / len(train_dataset)
    
    print(f"Epoch [{epoch+1}/{EPOCHS}] Loss: {epoch_loss:.4f} | Val Accuracy: {epoch_acc:.2f}%")
    
    # 최고 성능 모델 저장 (.pth)
    if epoch_acc > best_acc:
        best_acc = epoch_acc
        torch.save(model.state_dict(), "garbage_classification_model_best.pth")

print(f"🎯 학습 완료! 최고 검증 정확도: {best_acc:.2f}%")

# ==========================================
# 5. 라즈베리파이 배포용 ONNX 변환 (Export)
# ==========================================
print("📦 ONNX 모델 변환 시작...")

# 최고 성능을 낸 가중치 다시 불러오기
model.load_state_dict(torch.load("garbage_classification_model_best.pth"))
model.eval()

# 더미 입력값 생성 (배치 1, 채널 3, 가로 224, 세로 224)
dummy_input = torch.randn(1, 3, 224, 224, device=device)
onnx_file_name = "model_mobilenet.onnx"

torch.onnx.export(
    model, 
    dummy_input, 
    onnx_file_name, 
    export_params=True, 
    opset_version=11, 
    do_constant_folding=True, 
    input_names=['input'], 
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)

print(f"✅ ONNX 변환 완료! 파일명: {onnx_file_name}")
print("라즈베리파이 환경으로 이동하여 verify_onnx.py 스크립트로 테스트를 진행하세요.")