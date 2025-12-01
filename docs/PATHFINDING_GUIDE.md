# Mirrored Walkable Path Cases Guide

> 모든 좌표는 바닥 평면 기준 (x, z)입니다. 3D Viewer에서는 각 포인트를 [x, 0.5, z]로 변환합니다.

## 개요

이 시스템은 15개의 사전 정의된 Mirrored 고객 동선 케이스를 사용합니다. 시간대에 따라 가중치를 적용하여 랜덤하게 케이스가 선택됩니다.

## 입구 좌표

- **Entry Point**: (2, 5) → 3D: [2, 0.5, 5]

## 시간대별 가중치

- **오전 (morning, ~12시)**: 짧은 경로 선호 (Case 9)
- **오후 (afternoon, 12~18시)**: 긴 경로 선호 (Case 6, 11)
- **저녁 (evening, 18시~)**: 중간 길이 선호

## API 사용법

```typescript
import { generateRandomCustomerPath, pathReachesCheckout, getPathByCase, getTotalCases } from "@/lib/pathfinding";

// 시간대 기반 랜덤 경로 생성
const path = generateRandomCustomerPath("14:00-15:00");

// 특정 케이스 경로 가져오기 (1-15)
const case5Path = getPathByCase(5);

// 경로가 계산대에 도달하는지 확인
const reachedCheckout = pathReachesCheckout(path);

// 총 케이스 개수
const total = getTotalCases(); // 15
```
